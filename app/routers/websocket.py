from fastapi import APIRouter
from fastapi.websockets import WebSocket
import json
import base64
import time
from pathlib import Path

router = APIRouter(prefix="/ws", tags=["websocket"])

@router.websocket("")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("📸 Client connected")
    
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("image"):
                    # Remove the data URL prefix
                    base64_data = msg["image"].replace("data:image/jpeg;base64,", "")
                    # Decode base64 data
                    image_data = base64.b64decode(base64_data)
                    
                    # Create filename with timestamp
                    filename = f"capture_{int(time.time() * 1000)}.jpg"
                    file_path = Path(__file__).parent.parent.parent / "uploads" / filename
                    
                    # Ensure uploads directory exists
                    file_path.parent.mkdir(exist_ok=True)
                    
                    # Save the image
                    with open(file_path, "wb") as f:
                        f.write(image_data)
                    print(f"✅ Saved {filename}")
                    
            except json.JSONDecodeError as err:
                print("❌ Error parsing message:", err)
                
    except Exception as e:
        print("Client disconnected")