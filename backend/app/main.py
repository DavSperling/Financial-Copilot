import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth
from app.config import get_settings

# Setup logging
logging.basicConfig(level=logging.INFO)

settings = get_settings()

app = FastAPI(
    title="Personal Portfolio Copilot API",
    description="Backend API for Personal Portfolio Copilot",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev to fix CORS issues with different IPs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "ok"}
