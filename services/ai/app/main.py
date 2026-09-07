from fastapi import FastAPI

from . import __version__
from .config import get_settings
from .routes import router

app = FastAPI(
    title="ItemForge AI Engine",
    version=__version__,
    description="Chunking, item generation, and embeddings for the ItemForge API.",
)
app.include_router(router)


@app.get("/health")
async def health() -> dict[str, str]:
    settings = get_settings()
    return {
        "status": "ok",
        "version": __version__,
        "provider": settings.ai_provider,
    }
