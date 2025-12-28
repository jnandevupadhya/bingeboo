from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from backend.core.rooms import get_available_room_id, get_controller, register_host, try_register_controller, unregister_controller, unregister_host, get_host

router = APIRouter()


@router.websocket("/ws/host")
async def host_ws(
    websocket: WebSocket,
    room_id: str | None = Query(None),
    pass_: str = Query(..., alias="pass"),
):
    await websocket.accept()

    final_room_id = get_available_room_id(room_id)
    print("HOST WS HIT", final_room_id)

    await register_host(final_room_id, websocket, pass_)

    await websocket.send_json({
        "type": "hosted",
        "room_id": final_room_id
    })

    try:
        while True:
            data = await websocket.receive_text()

            # 🔁 Forward host → controller (if any)
            controller = await get_controller(final_room_id)
            if controller:
                try:
                    await controller.send_text(data)
                except Exception:
                    pass

    except WebSocketDisconnect:
        print("HOST DISCONNECTED", final_room_id)

    finally:
        await unregister_host(final_room_id)



@router.websocket("/ws/remote/{room_id}")
async def remote_ws(
    websocket: WebSocket,
    room_id: str,
    pass_: str = Query(..., alias="pass")
):
    await websocket.accept()

    print("REMOTE WS HIT", room_id)

    # 🔒 Enforce:
    # - room exists
    # - pass matches
    # - only one controller
    allowed = await try_register_controller(room_id, websocket, pass_)
    if not allowed:
        await websocket.close(code=1008)  # policy violation
        print("REMOTE REJECTED", room_id)
        return

    print("REMOTE ACCEPTED", room_id)

    try:
        while True:
            data = await websocket.receive_text()

            host = await get_host(room_id)
            if host:
                try:
                    await host.send_text(data)
                except Exception:
                    pass

    except WebSocketDisconnect:
        print("REMOTE DISCONNECTED", room_id)
    finally:
        await unregister_controller(room_id, websocket)
