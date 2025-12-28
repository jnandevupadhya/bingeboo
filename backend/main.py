from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.ws.relay import router as ws_router
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles



app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ws_router)

BASE_DIR = Path(__file__).resolve().parent
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static") 

@app.get("/")
def home():
    return FileResponse(BASE_DIR / "backend-status.html")
