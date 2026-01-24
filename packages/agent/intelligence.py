"""
Intelligence Chip Extraction

Extracts personality traits, values, and dealbreakers from
conversation and sends them to the client via Daily data channel.
"""

import json
import re
from typing import Optional, List, Dict, Any

from pipecat.frames.frames import (
    Frame,
    TextFrame,
    TranscriptionFrame,
    LLMFullResponseEndFrame,
)
from pipecat.processors.frame_processor import FrameProcessor, FrameDirection


class IntelligenceChip:
    """Represents an intelligence chip to display in the UI"""

    def __init__(self, label: str, category: str, confidence: float = 1.0):
        self.label = label
        self.category = category
        self.confidence = confidence

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": "CHIP",
            "payload": {
                "label": self.label,
                "category": self.category,
                "confidence": self.confidence,
            },
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict())


class IntelligenceExtractor(FrameProcessor):
    """
    Extracts intelligence chips from conversation and sends to client.

    Monitors both user transcriptions and Brea's responses to identify:
    - Dealbreakers (things the user won't tolerate)
    - Values (things the user cares about)
    - Energy level (chill vs high energy)
    - Humor style (dry, playful, sarcastic)
    - Planning style (spontaneous vs planned)
    - Conflict style (direct vs avoidant)

    Uses RTVIProcessor to send chips to the client via RTVI protocol.
    """

    # Patterns for dealbreaker detection (from user speech)
    DEALBREAKER_PATTERNS = {
        "smoking": ["smoke", "smoking", "smoker", "cigarette", "vape", "vaping"],
        "cheating": ["cheat", "cheating", "cheater", "unfaithful", "infidelity"],
        "lying": ["lie", "lying", "liar", "dishonest", "dishonesty"],
        "drugs": ["drugs", "drug use", "substance"],
        "disrespect": ["disrespect", "rude", "mean", "unkind"],
        "laziness": ["lazy", "unmotivated", "no ambition"],
        "jealousy": ["jealous", "possessive", "controlling"],
        "poor communication": ["doesn't communicate", "won't talk", "silent treatment"],
    }

    # Patterns for value detection (from user speech)
    VALUE_PATTERNS = {
        "family": ["family", "kids", "children", "parents", "close to family"],
        "career": ["career", "job", "work", "ambitious", "driven", "professional"],
        "adventure": ["adventure", "travel", "explore", "spontaneous", "try new things"],
        "stability": ["stable", "stability", "secure", "security", "settled"],
        "growth": ["growth", "growing", "learning", "self-improvement", "better myself"],
        "fitness": ["fitness", "gym", "workout", "health", "active lifestyle"],
        "creativity": ["creative", "art", "music", "writing", "artistic"],
        "spirituality": ["spiritual", "faith", "religion", "meditation", "mindfulness"],
        "humor": ["funny", "humor", "laugh", "jokes", "sense of humor"],
        "loyalty": ["loyal", "loyalty", "faithful", "committed", "dependable"],
    }

    # Patterns for energy level detection
    ENERGY_PATTERNS = {
        "chill": ["chill", "relaxed", "laid back", "calm", "homebody", "quiet night"],
        "high": ["energetic", "active", "outgoing", "social", "party", "go out"],
    }

    # Patterns for humor style detection
    HUMOR_PATTERNS = {
        "dry": ["dry humor", "sarcastic", "deadpan", "witty"],
        "playful": ["playful", "goofy", "silly", "fun"],
        "dark": ["dark humor", "morbid", "edgy"],
    }

    def __init__(self, user_id: str, rtvi_processor):
        super().__init__()
        self.user_id = user_id
        self.rtvi = rtvi_processor
        self.detected_chips: List[IntelligenceChip] = []
        self._current_user_text = []
        self._current_bot_text = []

    async def process_frame(self, frame: Frame, direction: FrameDirection):
        """Process frames and extract intelligence"""
        # Let parent handle system frames (StartFrame, etc.)
        await super().process_frame(frame, direction)

        # Capture user transcriptions
        if isinstance(frame, TranscriptionFrame):
            text = frame.text.lower()
            self._current_user_text.append(text)
            await self._analyze_user_speech(text)

        # Capture bot responses (Brea's confirmations of what she learned)
        elif isinstance(frame, TextFrame) and direction == FrameDirection.DOWNSTREAM:
            self._current_bot_text.append(frame.text)

        # When bot finishes responding, analyze for confirmed insights
        elif isinstance(frame, LLMFullResponseEndFrame):
            full_response = " ".join(self._current_bot_text).lower()
            await self._analyze_bot_response(full_response)
            self._current_bot_text = []

        # CRITICAL: Push frame downstream (super() doesn't do this!)
        await self.push_frame(frame, direction)

    async def _analyze_user_speech(self, text: str):
        """Analyze user speech for patterns"""

        # Check for dealbreakers
        for dealbreaker, patterns in self.DEALBREAKER_PATTERNS.items():
            for pattern in patterns:
                if pattern in text:
                    # Check for negation context (user saying they DON'T want this)
                    negation_patterns = [
                        f"can't stand {pattern}",
                        f"hate {pattern}",
                        f"no {pattern}",
                        f"won't tolerate {pattern}",
                        f"dealbreaker is {pattern}",
                        f"can't do {pattern}",
                        f"don't like {pattern}",
                    ]
                    for neg_pattern in negation_patterns:
                        if neg_pattern in text or pattern in text:
                            await self._emit_chip(
                                IntelligenceChip(
                                    label=f"{dealbreaker.title()}",
                                    category="DEALBREAKER",
                                )
                            )
                            break
                    break

        # Check for values (what user wants/cares about)
        for value, patterns in self.VALUE_PATTERNS.items():
            for pattern in patterns:
                if pattern in text:
                    # Check for positive context
                    positive_patterns = [
                        f"value {pattern}",
                        f"important to me",
                        f"love {pattern}",
                        f"care about {pattern}",
                        f"want {pattern}",
                        f"looking for {pattern}",
                    ]
                    # Simple heuristic: if the pattern appears, it's likely a value
                    if any(pos in text for pos in positive_patterns) or pattern in text:
                        await self._emit_chip(
                            IntelligenceChip(
                                label=value.title(),
                                category="VALUE",
                            )
                        )
                        break
                    break

        # Check for energy level
        for energy, patterns in self.ENERGY_PATTERNS.items():
            for pattern in patterns:
                if pattern in text:
                    emoji = "😌" if energy == "chill" else "⚡"
                    await self._emit_chip(
                        IntelligenceChip(
                            label=f"{energy.title()} {emoji}",
                            category="ENERGY",
                        )
                    )
                    break

        # Check for humor style
        for humor, patterns in self.HUMOR_PATTERNS.items():
            for pattern in patterns:
                if pattern in text:
                    await self._emit_chip(
                        IntelligenceChip(
                            label=f"{humor.title()} Humor",
                            category="HUMOR",
                        )
                    )
                    break

    async def _analyze_bot_response(self, text: str):
        """
        Analyze Brea's response for confirmed insights.

        When Brea says things like "So you value family" or "Got it, no smokers",
        we can confirm the chip with higher confidence.
        """
        # Look for confirmation patterns
        confirmation_patterns = [
            (r"so you value (\w+)", "VALUE"),
            (r"you're looking for (\w+)", "VALUE"),
            (r"no (\w+)s? for you", "DEALBREAKER"),
            (r"got it.* no (\w+)", "DEALBREAKER"),
            (r"you seem (\w+)", "ENERGY"),
        ]

        for pattern, category in confirmation_patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                # Find the chip and increase confidence
                for chip in self.detected_chips:
                    if match.lower() in chip.label.lower():
                        chip.confidence = min(1.0, chip.confidence + 0.2)

    async def _emit_chip(self, chip: IntelligenceChip):
        """Send a chip to the client via RTVI protocol"""

        # Check if we already have this chip
        for existing in self.detected_chips:
            if (
                existing.label == chip.label
                and existing.category == chip.category
            ):
                return  # Already detected

        self.detected_chips.append(chip)
        print(f"[CHIP] {chip.category}: {chip.label}")

        # Send via RTVI server message
        try:
            await self.rtvi.send_server_message(chip.to_dict())
            print(f"[CHIP] Sent to client via RTVI")
        except Exception as e:
            print(f"Failed to send chip: {e}")
            import traceback
            traceback.print_exc()

    def get_profile_data(self) -> Dict[str, Any]:
        """Get all detected chips as profile data"""
        return {
            "dealbreakers": [
                c.label for c in self.detected_chips if c.category == "DEALBREAKER"
            ],
            "values": [
                c.label for c in self.detected_chips if c.category == "VALUE"
            ],
            "personalityTags": {
                "energy": next(
                    (c.label for c in self.detected_chips if c.category == "ENERGY"),
                    None,
                ),
                "humor": next(
                    (c.label for c in self.detected_chips if c.category == "HUMOR"),
                    None,
                ),
            },
        }
