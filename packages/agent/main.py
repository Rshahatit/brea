"""
Brea Agent Server

FastAPI server that creates Daily rooms and spawns Pipecat bots
for real-time voice conversations with Gemini.
"""

import os
import time
import asyncio
import subprocess
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Brea Agent Server")

# CORS - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DAILY_API_KEY = os.getenv("DAILY_API_KEY")
DAILY_API_URL = "https://api.daily.co/v1"


class ConnectResponse(BaseModel):
    room_url: str
    token: str
    room_name: str


class HealthResponse(BaseModel):
    status: str
    daily_configured: bool
    google_configured: bool


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint"""
    return HealthResponse(
        status="ok",
        daily_configured=bool(DAILY_API_KEY),
        google_configured=bool(os.getenv("GOOGLE_AI_API_KEY")),
    )


@app.post("/connect", response_model=ConnectResponse)
async def connect(user_id: str = Query(..., description="User ID from Firebase")):
    """
    Create a Daily room and spawn a Brea bot.

    This endpoint:
    1. Creates a temporary Daily room (expires in 1 hour)
    2. Generates a participant token for the user
    3. Spawns a Pipecat bot process that joins the room
    4. Returns the room URL and token for the client to join
    """
    if not DAILY_API_KEY:
        raise HTTPException(status_code=500, detail="Daily API key not configured")

    async with httpx.AsyncClient() as client:
        # Create a Daily room with short expiry for dev (10 seconds)
        # TODO: Change to 3600 (1 hour) for production
        room_response = await client.post(
            f"{DAILY_API_URL}/rooms",
            headers={"Authorization": f"Bearer {DAILY_API_KEY}"},
            json={
                "properties": {
                    "exp": int(time.time()) + 10,  # 10 seconds for dev
                    "enable_chat": False,
                    "enable_screenshare": False,
                    "start_video_off": True,
                    "start_audio_off": False,
                }
            },
        )

        if room_response.status_code != 200:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create Daily room: {room_response.text}",
            )

        room_data = room_response.json()
        room_name = room_data["name"]
        room_url = room_data["url"]

        # Generate a participant token for the user
        token_response = await client.post(
            f"{DAILY_API_URL}/meeting-tokens",
            headers={"Authorization": f"Bearer {DAILY_API_KEY}"},
            json={
                "properties": {
                    "room_name": room_name,
                    "user_id": user_id,
                    "user_name": "User",
                    "is_owner": False,
                }
            },
        )

        if token_response.status_code != 200:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create meeting token: {token_response.text}",
            )

        token_data = token_response.json()

        # Spawn the bot process
        # In production, you'd use a task queue like Celery or a process manager
        spawn_bot(room_url, user_id)

        return ConnectResponse(
            room_url=room_url,
            token=token_data["token"],
            room_name=room_name,
        )


def spawn_bot(room_url: str, user_id: str):
    """
    Spawn a Pipecat bot process to join the room.

    In production, consider:
    - Using a process pool or task queue
    - Running bots in separate containers
    - Using a proper process manager
    """
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    bot_script = os.path.join(script_dir, "bot.py")

    # Spawn the bot as a subprocess
    # Using subprocess.Popen to not block the API response
    subprocess.Popen(
        ["python", bot_script, room_url, user_id],
        cwd=script_dir,
        # Redirect output to files for debugging
        stdout=open(os.path.join(script_dir, f"bot_{user_id}.log"), "w"),
        stderr=subprocess.STDOUT,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
