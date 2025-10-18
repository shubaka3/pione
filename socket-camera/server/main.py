from fastapi import FastAPI, File, UploadFile, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import httpx
import os
import base64
import json
import uuid
from connection_manager import ConnectionManager, ConnectionType

app = FastAPI()

# Cấu hình CORS cho phép các ứng dụng truy cập API này
origins = [
    "http://localhost:5173",  # Pione-React-app
    "http://127.0.0.1:5173",
    "http://localhost:3000",  # Pione-ui
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploaded_images"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/images", StaticFiles(directory=UPLOAD_DIR), name="images")

TARGET_API_URL = os.getenv("TARGET_API_URL", "http://localhost:8000/process-image")

# Tạo connection manager để quản lý các kết nối WebSocket
manager = ConnectionManager()

@app.websocket("/ws/camera")
async def camera_websocket(websocket: WebSocket):
    await manager.connect(websocket, ConnectionType.CAMERA)
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            if payload.get("type") == "image_upload":
                image_data_url = payload.get("image")
                if image_data_url:
                    # Tách phần header và dữ liệu base64
                    header, encoded = image_data_url.split(",", 1)
                    image_data = base64.b64decode(encoded)

                    # Broadcast hình ảnh tới tất cả viewers
                    await manager.broadcast_to_viewers(json.dumps({
                        "type": "live_frame",
                        "image": image_data_url
                    }))

                    # Lưu hình ảnh cục bộ
                    filename = f"{uuid.uuid4()}.jpeg"
                    file_path = os.path.join(UPLOAD_DIR, filename)
                    with open(file_path, "wb") as f:
                        f.write(image_data)
                    
                    print(f"Đã lưu hình ảnh từ camera: {file_path}")

                    # Chuyển tiếp hình ảnh đến Pione-server
                    try:
                        async with httpx.AsyncClient() as client:
                            response = await client.post(
                                TARGET_API_URL,
                                files={"file": ("image.jpeg", image_data, "image/jpeg")}
                            )
                            response.raise_for_status()
                            
                            # Gửi kết quả phân tích về cho camera
                            await websocket.send_text(json.dumps({
                                "status": "success",
                                "response": response.json()
                            }))
                            
                            # Broadcast kết quả phân tích tới viewers
                            await manager.broadcast_to_viewers(json.dumps({
                                "type": "analysis_result",
                                "result": response.json()
                            }))
                    except Exception as exc:
                        error_message = json.dumps({
                            "status": "error",
                            "detail": str(exc)
                        })
                        await websocket.send_text(error_message)
    except WebSocketDisconnect:
        manager.disconnect(websocket, ConnectionType.CAMERA)
        print("Camera disconnected")
    except Exception as e:
        print(f"Camera error: {e}")
        manager.disconnect(websocket, ConnectionType.CAMERA)
        await websocket.close(code=1011)

@app.websocket("/ws/viewer")
async def viewer_websocket(websocket: WebSocket):
    await manager.connect(websocket, ConnectionType.VIEWER)
    try:
        # Thông báo cho camera về số lượng viewers mới
        viewer_count = manager.get_viewers_count()
        await manager.broadcast_to_viewers(json.dumps({
            "type": "viewer_count",
            "count": viewer_count
        }))
        
        while True:
            # Chờ tin nhắn từ viewer (có thể là các lệnh điều khiển trong tương lai)
            data = await websocket.receive_text()
            # Xử lý tin nhắn từ viewer ở đây nếu cần
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, ConnectionType.VIEWER)
        viewer_count = manager.get_viewers_count()
        await manager.broadcast_to_viewers(json.dumps({
            "type": "viewer_count",
            "count": viewer_count
        }))
        print("Viewer disconnected")
    except Exception as e:
        print(f"Viewer error: {e}")
        manager.disconnect(websocket, ConnectionType.VIEWER)
        await websocket.close(code=1011)

@app.post("/upload-image/")
async def upload_image(file: UploadFile = File(...)):
    try:
        # Đọc nội dung hình ảnh
        image_data = await file.read()

        # Lưu hình ảnh cục bộ
        filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as f:
            f.write(image_data)
        
        print(f"Đã lưu hình ảnh từ HTTP POST: {file_path}")

        # Chuyển tiếp hình ảnh đến API khác
        async with httpx.AsyncClient() as client:
            response = await client.post(
                TARGET_API_URL,
                files={"file": (file.filename, image_data, file.content_type)}
            )
            response.raise_for_status()  # Ném lỗi cho các mã trạng thái HTTP xấu (4xx hoặc 5xx)
        return response.json()
    except httpx.RequestError as exc:
        raise HTTPException(status_code=500, detail=f"Lỗi khi gọi API đích: {exc}")
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=exc.response.status_code, detail=f"API đích trả về lỗi: {exc.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Đã xảy ra lỗi: {e}")

@app.get("/images")
async def list_images():
    images = []
    for filename in os.listdir(UPLOAD_DIR):
        if filename.endswith((".jpeg", ".jpg", ".png", ".gif")):
            images.append(filename)
    return {"images": images}

@app.get("/")
async def read_root():
    return {"message": "Chào mừng đến với máy chủ xử lý hình ảnh!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
