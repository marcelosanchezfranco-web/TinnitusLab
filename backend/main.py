from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field
from audio_generator import generate_audio

app = FastAPI(title="TinnitusLab API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    frequency: float = Field(..., ge=20, le=20000, description="Tinnitus frequency in Hz")
    type: str = Field(..., description="Audio type")
    duration_minutes: int = Field(default=30, ge=1, le=120)
    notch_bandwidth: int = Field(default=500, ge=100, le=2000)
    modulation_freq: float = Field(default=10.0, ge=1, le=40)


VALID_TYPES = {
    "pink_noise",
    "am_tones",
    "brown_noise",
    "binaural_40hz",
    "chirp_sweep",
    "binaural_10hz",
}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/generate")
async def generate(req: GenerateRequest):
    if req.type not in VALID_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid audio type: {req.type}")

    try:
        wav_bytes = generate_audio(
            frequency=req.frequency,
            audio_type=req.type,
            duration_minutes=req.duration_minutes,
            notch_bandwidth=req.notch_bandwidth,
            modulation_freq=req.modulation_freq,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio generation failed: {str(e)}")

    filename = f"TinnitusLab_{req.type}_{int(req.frequency)}Hz_{req.duration_minutes}min.wav"

    return Response(
        content=wav_bytes,
        media_type="audio/wav",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )
