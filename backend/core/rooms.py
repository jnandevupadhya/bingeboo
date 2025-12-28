from fastapi import WebSocket
from typing import Dict, Optional
import asyncio
import random
import string


class Room:
    def __init__(self, host: WebSocket, room_pass: str):
        self.host = host
        self.room_pass = room_pass
        self.controller: Optional[WebSocket] = None


_rooms: Dict[str, Room] = {}
_lock = asyncio.Lock()


# ---------- Host ----------

async def register_host(room_id: str, ws: WebSocket, room_pass: str):
    async with _lock:
        _rooms[room_id] = Room(ws, room_pass)


async def unregister_host(room_id: str):
    async with _lock:
        room = _rooms.get(room_id)
        await room.controller.close() if room.controller else None
        _rooms.pop(room_id, None)


async def get_host(room_id: str) -> Optional[WebSocket]:
    async with _lock:
        room = _rooms.get(room_id)
        return room.host if room else None
    
async def get_controller(room_id: str) -> Optional[WebSocket]:
    async with _lock:
        room = _rooms.get(room_id)
        return room.controller if room else None


# ---------- Controller ----------

async def try_register_controller(room_id: str, ws: WebSocket, room_pass: str) -> bool:
    async with _lock:
        room = _rooms.get(room_id)

        if not room:
            await ws.send_json({
            "type": "error",
            "code": "ROOM_NOT_FOUND",
            "message": "Room does not exist"
        })
            return False

        if room.room_pass != room_pass:
            await ws.send_json({
            "type": "error",
            "code": "INVALID_PASSWORD",
            "message": "Wrong password"
        })
            return False

        if room.controller is not None:
            return False

    
        room.controller = ws
        
        host = room.host
        await host.send_json({
            "type": "controller_connected"
        })
        await ws.send_json({
        "type": "joined",
        "room": room_id
    })
        return True


async def unregister_controller(room_id: str, ws: WebSocket):
    async with _lock:
        room = _rooms.get(room_id)
        if room and room.controller is ws:
            room.controller = None
        await room.host.send_json({
            "type": "controller_disconnected"
        })
        print("Controller removed", room_id)


def get_available_room_id(preferred_id: str | None) -> str:
    if preferred_id and preferred_id not in _rooms:
        return preferred_id

    while True:
        new_id = generate_room_id()
        if new_id not in _rooms:
            return new_id
        
        
def generate_room_id(length: int = 5) -> str:
    if not _rooms:
        return "0".zfill(length)

    current_max = max(int(rid) for rid in _rooms.keys())
    return str(current_max + 1).zfill(length)
