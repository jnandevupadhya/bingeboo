from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.ws.relay import router as ws_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ws_router)

@app.get("/")
def health():
    return {"status": "ok"}
