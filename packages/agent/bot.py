"""
Brea Voice Bot

Pipecat pipeline that connects to a Daily room and provides
real-time voice conversation with Gemini Multimodal Live.

Uses native Gemini function calling for real-time intelligence extraction.
"""

import os
import sys
import asyncio
import uuid
import httpx
from dotenv import load_dotenv

from pipecat.frames.frames import (
    Frame,
    TextFrame,
    TranscriptionFrame,
    LLMFullResponseStartFrame,
    LLMFullResponseEndFrame,
    LLMMessagesUpdateFrame,
)
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineTask, PipelineParams
from pipecat.processors.frame_processor import FrameProcessor, FrameDirection
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import LLMContextAggregatorPair
from pipecat.processors.frameworks.rtvi import RTVIProcessor
from pipecat.transports.daily.transport import DailyTransport, DailyParams
from pipecat.services.google.gemini_live.llm import GeminiLiveLLMService

load_dotenv()

# Brea's personality and behavior - includes tool usage instructions
BREA_SYSTEM_INSTRUCTION = """You are Brea, a professional dating liaison having a real-time voice conversation.

PERSONALITY:
- Warm and supportive, but with a slightly cynical/dry sense of humor
- Protective of your users - you want to help them find genuine connections
- Direct and concise - you don't waste words
- Example tone: "I've seen worse ideas..." or "Mmhmm, I hear you."

BEHAVIOR:
- Your goal is to learn about the user through natural conversation
- Extract: values, dealbreakers, personality traits, energy level, humor style
- Present observations as hypotheses: "Sounds like you value X. Am I reading that right?"
- Use active listening cues: "Mmhmm", "I hear you", "Got it", "Okay"
- Keep responses brief (1-2 sentences max) - this is a voice conversation
- Ask ONE follow-up question at a time
- Wait for the user to finish speaking before responding

INTELLIGENCE CHIPS (IMPORTANT):
- You have a tool called "show_intelligence_chip" - USE IT FREQUENTLY
- Whenever you detect something interesting about the user, call this tool
- Categories: "Dealbreaker", "Value", "Hobby", "Energy", "Style", "Preference"
- Examples of when to call it:
  - User says "I can't stand smokers" → call tool with category="Dealbreaker", text="No Smoking", emoji="🚭"
  - User says "I love hiking" → call tool with category="Hobby", text="Hiking", emoji="🥾"
  - User says "family is important to me" → call tool with category="Value", text="Family First", emoji="👨‍👩‍👧‍👦"
  - User seems laid-back → call tool with category="Energy", text="Chill Vibe", emoji="😌"
- Call the tool AS SOON as you detect something - don't wait
- The tool runs silently in the background, so keep talking naturally
- Aim to extract 4-8 chips per conversation

CONVERSATION FLOW:
1. Start by asking about dealbreakers (what they won't tolerate)
2. Then explore what they're looking for (values, lifestyle)
3. Ask about their energy and social style
4. Probe their communication preferences
5. When you have enough info (after 4-6 exchanges), wrap up the conversation

ENDING THE CONVERSATION:
- After gathering enough information, say goodbye naturally
- Your FINAL message MUST end with exactly: "Talk soon."
- Example: "Alright, I've got a good picture of what you're looking for. I'll start working on some matches. Talk soon."

NEVER:
- Lecture or give unsolicited advice
- Be preachy or judgmental
- Give long responses - keep it conversational
- Sound robotic or scripted
- Repeat yourself or ask the same question twice
- Interrupt or talk over the user

Remember: You're a friend who happens to be really good at matchmaking, not a therapist or life coach. Keep it natural and flowing."""


# Tool definition for intelligence chip extraction using Pipecat schemas
from pipecat.adapters.schemas.tools_schema import ToolsSchema
from pipecat.adapters.schemas.function_schema import FunctionSchema

CHIP_FUNCTION = FunctionSchema(
    name="show_intelligence_chip",
    description="Display an intelligence chip in the user's UI. Call this whenever you detect a user's hobby, value, dealbreaker, or personality trait. The tool runs silently - keep talking naturally.",
    properties={
        "category": {
            "type": "string",
            "description": "The category: Dealbreaker, Value, Hobby, Energy, Style, or Preference"
        },
        "text": {
            "type": "string",
            "description": "Short label (2-4 words). Examples: 'No Smoking', 'Hiking', 'Family First'"
        },
        "emoji": {
            "type": "string",
            "description": "A single relevant emoji"
        }
    },
    required=["category", "text", "emoji"]
)

INTELLIGENCE_CHIP_TOOLS = ToolsSchema(standard_tools=[CHIP_FUNCTION])


class TranscriptionLogger(FrameProcessor):
    """Logs transcriptions for debugging"""

    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)

        if isinstance(frame, TranscriptionFrame):
            print(f"[USER] {frame.text}")

        await self.push_frame(frame, direction)


class ResponseLogger(FrameProcessor):
    """Logs Brea's responses and detects conversation end"""

    def __init__(self, on_conversation_end=None):
        super().__init__()
        self._current_response = []
        self._on_conversation_end = on_conversation_end

    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)

        if isinstance(frame, LLMFullResponseStartFrame):
            self._current_response = []
        elif isinstance(frame, TextFrame):
            self._current_response.append(frame.text)
        elif isinstance(frame, LLMFullResponseEndFrame):
            full_response = "".join(self._current_response)
            if full_response.strip():
                print(f"[BREA] {full_response}")
                if "talk soon" in full_response.lower():
                    print("[SESSION] Brea signed off - ending conversation")
                    if self._on_conversation_end:
                        asyncio.create_task(self._on_conversation_end())
            self._current_response = []

        await self.push_frame(frame, direction)


async def main(room_url: str, user_id: str):
    """
    Main bot entry point.

    Args:
        room_url: Daily room URL to join
        user_id: User ID for this session
    """
    print(f"Starting Brea bot for user {user_id}")
    print(f"Joining room: {room_url}")

    # Initialize Daily transport
    transport = DailyTransport(
        room_url=room_url,
        token=None,
        bot_name="Brea",
        params=DailyParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            audio_out_sample_rate=24000,
            audio_in_sample_rate=16000,
        ),
    )

    # Store collected chips for this session
    collected_chips = []

    # Create RTVI processor for sending messages to client
    rtvi = RTVIProcessor()

    # Function call handler for intelligence chips
    async def handle_show_chip(function_name, tool_call_id, args, llm, context, result_callback):
        """Handle the show_intelligence_chip function call from Gemini"""
        chip_data = {
            "type": "CHIP",
            "payload": {
                "id": str(uuid.uuid4()),
                "category": args.get("category", "Unknown"),
                "label": args.get("text", ""),
                "emoji": args.get("emoji", ""),
                "confidence": 1.0,
            }
        }

        print(f"✨ [CHIP] {chip_data['payload']['emoji']} {chip_data['payload']['category']}: {chip_data['payload']['label']}")

        # Store for session summary
        collected_chips.append(chip_data["payload"])

        # Send to client via RTVI server message (this is what the iOS SDK listens to)
        try:
            await rtvi.send_server_message(chip_data)
            print(f"[CHIP] Sent to client via RTVI")
        except Exception as e:
            print(f"[CHIP] Failed to send: {e}")
            import traceback
            traceback.print_exc()

        # Tell Gemini the tool succeeded (so it keeps talking)
        await result_callback({"status": "displayed"})

    # Initialize Gemini Live LLM with tools
    llm = GeminiLiveLLMService(
        api_key=os.getenv("GOOGLE_AI_API_KEY"),
        system_instruction=BREA_SYSTEM_INSTRUCTION,
        voice_id="Aoede",
        tools=INTELLIGENCE_CHIP_TOOLS,
    )

    # Register the function handler
    llm.register_function("show_intelligence_chip", handle_show_chip)

    # Initialize context
    context = LLMContext()
    context_aggregator = LLMContextAggregatorPair(context)

    # Initialize processors
    transcription_logger = TranscriptionLogger()
    response_logger = ResponseLogger()

    # Build the pipeline (RTVI processor handles client messaging)
    pipeline = Pipeline(
        [
            transport.input(),
            rtvi,  # RTVI processor for sending messages to client
            context_aggregator.user(),
            llm,
            transcription_logger,
            response_logger,
            context_aggregator.assistant(),
            transport.output(),
        ]
    )

    task = PipelineTask(
        pipeline,
        params=PipelineParams(
            allow_interruptions=True,
            enable_metrics=True,
        ),
    )

    # Session end callback
    async def end_session():
        """End the session after Brea says goodbye"""
        print("[SESSION] Waiting 2 seconds for audio to finish...")
        await asyncio.sleep(2)

        # Log collected intelligence
        if collected_chips:
            print(f"\n[SESSION] Collected {len(collected_chips)} intelligence chips:")
            for chip in collected_chips:
                print(f"  {chip['emoji']} {chip['category']}: {chip['label']}")

        print("[SESSION] Ending session...")
        await task.cancel()

    response_logger._on_conversation_end = end_session

    # Track greeting state
    greeted = False

    @transport.event_handler("on_participant_joined")
    async def on_participant_joined(transport, participant, *args):
        """When a real user joins, trigger Brea's greeting"""
        nonlocal greeted
        participant_id = participant.get("id", "unknown")
        is_local = participant.get("info", {}).get("isLocal", False)

        print(f"Participant joined: {participant_id}, isLocal: {is_local}")

        if is_local or greeted:
            return

        greeted = True
        print("Triggering Brea's greeting...")

        await task.queue_frame(LLMMessagesUpdateFrame(
            messages=[{"role": "user", "content": "Start the conversation. Introduce yourself briefly as Brea and ask me one thing I absolutely won't tolerate in a partner."}],
            run_llm=True
        ))

    @transport.event_handler("on_participant_left")
    async def on_participant_left(transport, participant, reason):
        """When the user leaves, end the session"""
        print(f"Participant left: {participant.get('id', 'unknown')}, reason: {reason}")
        await task.cancel()

    @transport.event_handler("on_call_state_updated")
    async def on_call_state_updated(transport, state):
        """Monitor call state changes"""
        print(f"Call state: {state}")
        if state == "left":
            await task.cancel()

    # Run the pipeline
    runner = PipelineRunner()

    try:
        await runner.run(task)
    except asyncio.CancelledError:
        print("Bot task cancelled")
    except LookupError as e:
        if "punkt" in str(e).lower() or "nltk" in str(e).lower():
            print(f"NLTK resource error: {e}")
            print("Please run: python -c \"import nltk; nltk.download('punkt_tab')\"")
        else:
            raise
    except Exception as e:
        print(f"Bot error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        print(f"Bot session ended for user {user_id}")
        await delete_room(room_url)


async def delete_room(room_url: str):
    """Delete the Daily room after the session ends"""
    try:
        room_name = room_url.rstrip("/").split("/")[-1]
        api_key = os.getenv("DAILY_API_KEY")

        if not api_key:
            print("[CLEANUP] No Daily API key, skipping room deletion")
            return

        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"https://api.daily.co/v1/rooms/{room_name}",
                headers={"Authorization": f"Bearer {api_key}"},
            )
            if response.status_code == 200:
                print(f"[CLEANUP] Deleted room: {room_name}")
            else:
                print(f"[CLEANUP] Failed to delete room: {response.status_code}")
    except Exception as e:
        print(f"[CLEANUP] Error deleting room: {e}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python bot.py <room_url> <user_id>")
        sys.exit(1)

    room_url = sys.argv[1]
    user_id = sys.argv[2]

    asyncio.run(main(room_url, user_id))
