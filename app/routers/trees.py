from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
from pathlib import Path # <--- Thêm import này
from uuid import uuid4 # <--- Thêm import này để tạo tên file duy nhất

from .. import schemas, services, auth, models
from ..database import get_db
from ..routers import iot_devices # Thêm import
from ..routers import alerts # Thêm import
import requests
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

BLOCKCHAIN_API_URL = "http://localhost:3000/api/product"
router = APIRouter(
    prefix="/api/trees",
    tags=["trees"],
    dependencies=[Depends(auth.get_current_active_user)],
    responses={404: {"description": "Not found"}},
)

# @router.post("/", response_model=schemas.Tree, status_code=status.HTTP_201_CREATED)
# def create_tree_for_current_user(
#     tree: schemas.TreeCreate,
#     current_user: models.User = Depends(auth.get_current_active_user),
#     db: Session = Depends(get_db)
# ):
#     return services.create_user_tree(db=db, tree=tree, user_id=current_user.user_id)

@router.post("/", response_model=schemas.Tree, status_code=status.HTTP_201_CREATED)
def create_tree_for_current_user(
    tree: schemas.TreeCreate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    # 1. Tạo cây trong CSDL của bạn
    new_tree = services.create_user_tree(db=db, tree=tree, user_id=current_user.user_id)

    # 2. Chuẩn bị dữ liệu và gọi API Blockchain
    # [PHẦN MỚI THÊM]
    try:
        # Lấy dữ liệu từ 'new_tree' vừa được tạo
        payload = {
            "productID": str(new_tree.tree_id), # Đảm bảo là string nếu API kia yêu cầu
            "name": new_tree.name,
            "description": new_tree.species
        }
        
        # Gửi request POST đến API blockchain
        response = requests.post(f"{BLOCKCHAIN_API_URL}/add", json=payload, timeout=5)
        response.raise_for_status() # Báo lỗi nếu status code là 4xx hoặc 5xx
        
        logging.info(f"Successfully added tree {new_tree.tree_id} to blockchain.")

    except requests.exceptions.RequestException as e:
        # Ghi lại lỗi nếu không gọi được API blockchain
        # Request chính vẫn thành công vì đã lưu vào CSDL
        logging.error(f"Failed to add tree {new_tree.tree_id} to blockchain: {e}")
    
    # 3. Trả về kết quả cho người dùng
    return new_tree


@router.get("/", response_model=List[schemas.Tree])
def read_user_trees(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    trees = services.get_trees_by_user(db, user_id=current_user.user_id, skip=skip, limit=limit)
    return trees

@router.get("/{tree_id}", response_model=schemas.Tree)
def read_tree(
    tree_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    db_tree = services.get_tree(db, tree_id=tree_id)
    if db_tree is None:
        raise HTTPException(status_code=404, detail="Tree not found")
    if db_tree.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this tree")
    return db_tree

# @router.put("/{tree_id}", response_model=schemas.Tree)
# def update_tree(
#     tree_id: int,
#     tree_update: schemas.TreeUpdate,
#     current_user: models.User = Depends(auth.get_current_active_user),
#     db: Session = Depends(get_db)
# ):
#     db_tree = services.get_tree(db, tree_id=tree_id)
#     if db_tree is None:
#         raise HTTPException(status_code=404, detail="Tree not found")
#     if db_tree.user_id != current_user.user_id:
#         raise HTTPException(status_code=403, detail="Not authorized to update this tree")
#     return services.update_tree(db, tree_id, tree_update)

@router.put("/{tree_id}", response_model=schemas.Tree)
def update_tree(
    tree_id: int,
    tree_update: schemas.TreeUpdate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    # 1. Kiểm tra quyền sở hữu (như cũ)
    db_tree = services.get_tree(db, tree_id=tree_id)
    if db_tree is None:
        raise HTTPException(status_code=404, detail="Tree not found")
    if db_tree.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this tree")

    # 2. Cập nhật cây trong CSDL
    updated_tree = services.update_tree(db, tree_id, tree_update)

    # 3. Gọi API Blockchain nếu trạng thái active thay đổi
    # [PHẦN MỚI THÊM]
    
    # Lấy các trường đã được gửi lên trong body của request PUT
    update_data = tree_update.model_dump(exclude_unset=True) 
    
    blockchain_url_to_call = None
    
    # Giả sử bạn dùng trường 'is_active' để bật/tắt
    if "is_active" in update_data:
        if update_data["is_active"] is False:
            # Nếu người dùng gửi "is_active": false
            blockchain_url_to_call = f"{BLOCKCHAIN_API_URL}/deactivate"
        elif update_data["is_active"] is True:
            # Nếu người dùng gửi "is_active": true
            blockchain_url_to_call = f"{BLOCKCHAIN_API_URL}/reactivate"

    if blockchain_url_to_call:
        try:
            payload = {"productID": str(tree_id)}
            # Dùng POST như bạn mô tả
            response = requests.post(blockchain_url_to_call, json=payload, timeout=5)
            response.raise_for_status()
            
            logging.info(f"Successfully updated tree {tree_id} status on blockchain.")

        except requests.exceptions.RequestException as e:
            logging.error(f"Failed to update tree {tree_id} status on blockchain: {e}")

    # 4. Trả về kết quả
    return updated_tree

@router.delete("/{tree_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tree(
    tree_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    db_tree = services.get_tree(db, tree_id=tree_id)
    if db_tree is None:
        raise HTTPException(status_code=404, detail="Tree not found")
    if db_tree.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this tree")
    services.delete_tree(db, tree_id=tree_id)
    return {"ok": True}

# --- Nested Resources for a Tree ---

@router.post("/{tree_id}/readings/", response_model=schemas.SensorReading, status_code=status.HTTP_201_CREATED, tags=["sensor_readings"])
def create_reading_for_tree(tree_id: int, reading: schemas.SensorReadingCreate, db: Session = Depends(get_db)):
    # Note: In a real-world scenario, this endpoint might be protected by an API key instead of a user token.
    db_tree = services.get_tree(db, tree_id=tree_id)
    if not db_tree:
        raise HTTPException(status_code=404, detail="Tree not found")
    return services.create_sensor_reading(db, reading=reading, tree_id=tree_id)

@router.get("/{tree_id}/readings/", response_model=List[schemas.SensorReading], tags=["sensor_readings"])
def read_readings_for_tree(tree_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    db_tree = services.get_tree(db, tree_id=tree_id)
    if not db_tree:
        raise HTTPException(status_code=404, detail="Tree not found")
    return services.get_sensor_readings_for_tree(db, tree_id=tree_id, skip=skip, limit=limit)

# --- Include Nested Routers (Sử dụng include_router với router con) ---
# Thêm router IoT Devices
router.include_router(
    iot_devices.router,
    prefix="/{tree_id}",
    dependencies=[Depends(auth.get_current_active_user)],
)

# Thêm router Alerts
router.include_router(
    alerts.router,
    prefix="/{tree_id}",
    dependencies=[Depends(auth.get_current_active_user)],
)

# --- Nested Resources for a Tree (Tiếp tục với các endpoint đã có) ---

# Endpoint này đã có sẵn:
@router.post("/{tree_id}/readings/", response_model=schemas.SensorReading, status_code=status.HTTP_201_CREATED, tags=["sensor_readings"])
def create_reading_for_tree(tree_id: int, reading: schemas.SensorReadingCreate, db: Session = Depends(get_db)):
    # Note: In a real-world scenario, this endpoint might be protected by an API key instead of a user token.
    db_tree = services.get_tree(db, tree_id=tree_id)
    if not db_tree:
        raise HTTPException(status_code=404, detail="Tree not found")
    return services.create_sensor_reading(db, reading=reading, tree_id=tree_id)

# Endpoint này đã có sẵn:
@router.get("/{tree_id}/readings/", response_model=List[schemas.SensorReading], tags=["sensor_readings"])
def read_readings_for_tree(tree_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    db_tree = services.get_tree(db, tree_id=tree_id)
    if not db_tree:
        raise HTTPException(status_code=404, detail="Tree not found")
    return services.get_sensor_readings_for_tree(db, tree_id=tree_id, skip=skip, limit=limit)

# --- Camera Capture Endpoints (MỚI) ---

def check_tree_access_and_get(tree_id: int, current_user: models.User, db: Session) -> models.Tree:
    db_tree = services.get_tree(db, tree_id=tree_id)
    if db_tree is None:
        raise HTTPException(status_code=404, detail="Tree not found")
    if db_tree.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this tree's captures")
    return db_tree

# --- Camera Capture Endpoints (Đã sửa lỗi lưu file) ---
@router.post("/{tree_id}/captures/", response_model=schemas.CameraCapture, status_code=status.HTTP_201_CREATED, tags=["camera_captures"])
def create_capture_for_tree(
    tree_id: int,
    file: UploadFile = File(...),
    total_fruit_count: int = Form(0),
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    # 1. Kiểm tra quyền
    check_tree_access_and_get(tree_id, current_user, db)
    
    # 2. Xử lý lưu file
    # Đường dẫn sẽ là: {thư mục gốc}/uploads/{tree_id}/{tên_file}
    upload_dir = Path("uploads") / str(tree_id)
    # Đảm bảo thư mục tồn tại (parents=True để tạo các thư mục cha nếu cần)
    try:
        upload_dir.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        print(f"LỖI TẠO THƯ MỤC {upload_dir}: {e}")
        raise HTTPException(status_code=500, detail="Could not create upload directory.")
        
    # Tạo tên file duy nhất
    # Thêm check file.filename để tránh lỗi nếu file.filename là None (hiếm)
    file_extension = Path(file.filename).suffix if file.filename else ".bin" 
    unique_filename = f"{uuid4()}{file_extension}"
    file_path = upload_dir / unique_filename
    
    # ⭐️ LOGIC LƯU FILE ĐƯỢC CẢI TIẾN VÀ DEBUG LỖI THỰC TẾ
    try:
        # Đọc toàn bộ nội dung file từ stream (File.file là SpooledTemporaryFile)
        file_content = file.file.read()
        
        # Ghi nội dung vào file mới (wb: write binary)
        with open(file_path, "wb") as f:
            f.write(file_content)
            
    except Exception as e:
        # ⭐️ IN LỖI RA CONSOLE: Lỗi thực tế (ví dụ: PermissionError) sẽ xuất hiện ở đây.
        print(f"LỖI LƯU FILE TẠI {file_path}: {e}")
        # Chuyển đổi lỗi thành HTTPException 500
        raise HTTPException(status_code=500, detail="Could not save file. Check server logs for the actual error.")
    finally:
        # Đóng stream của file đã upload
        file.file.close()

    # 3. Tạo URL công khai và lưu vào database
    relative_path = Path("uploads") / str(tree_id) / unique_filename
    
    db_capture = services.create_camera_capture(
        db, 
        image_url=str(relative_path.as_posix()), # Dùng .as_posix() để đảm bảo path separators là / (cho URL) ngay cả trên Windows
        total_fruit_count=total_fruit_count, 
        tree_id=tree_id
    )
    
    return db_capture


# Endpoint GET /captures/
@router.get("/{tree_id}/captures/", response_model=List[schemas.CameraCapture], tags=["camera_captures"])
def read_captures_for_tree(
    tree_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    check_tree_access_and_get(tree_id, current_user, db)
    db_captures = services.get_camera_captures_for_tree(db, tree_id=tree_id, skip=skip, limit=limit)
    
    # ⭐️ Xử lý trả về Full URL
    # Trong môi trường production, bạn sẽ cần Request object để lấy host.
    # Trong môi trường dev (localhost:8000), kết quả image_url sẽ là:
    # /uploads/{tree_id}/{file_name}
    
    # Vì `image_url` trong schema là string, nó sẽ trả về đường dẫn đã lưu.
    # Nếu bạn muốn trả về Full URL, bạn cần tạo một Schema mới hoặc dùng Request
    
    # Cách đơn giản: Chỉ cần đảm bảo client biết rằng /uploads/ là URL gốc
    return db_captures

    
@router.get("/captures/{capture_id}", response_model=schemas.CameraCapture, tags=["camera_captures"])
def read_capture(
    capture_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    db_capture = services.get_camera_capture(db, capture_id)
    if db_capture is None:
        raise HTTPException(status_code=404, detail="Camera Capture not found")
    check_tree_access_and_get(db_capture.tree_id, current_user, db) # Kiểm tra quyền sở hữu Tree

    return db_capture

# --- Control History Endpoints (MỚI) ---

# @router.post("/{tree_id}/control_history/", response_model=schemas.ControlHistory, status_code=status.HTTP_201_CREATED, tags=["control_history"])
# def create_control_history_for_tree(
#     tree_id: int,
#     history: schemas.ControlHistoryCreate,
#     current_user: models.User = Depends(auth.get_current_active_user),
#     db: Session = Depends(get_db)
# ):
#     check_tree_access_and_get(tree_id, current_user, db)
#     return services.create_control_history(db, history=history, tree_id=tree_id, user_id=current_user.user_id)

@router.post("/{tree_id}/control_history/", response_model=schemas.ControlHistory, status_code=status.HTTP_201_CREATED, tags=["control_history"])
def create_control_history_for_tree(
    tree_id: int,
    history: schemas.ControlHistoryCreate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    # 1. Kiểm tra (như cũ)
    check_tree_access_and_get(tree_id, current_user, db)
    
    # 2. Tạo lịch sử trong CSDL
    # Giả định: service của bạn trả về đối tượng lịch sử vừa tạo
    new_history_log = services.create_control_history(db, history=history, tree_id=tree_id, user_id=current_user.user_id)

    # 3. Chuẩn bị và gọi API Blockchain
    # [PHẦN MỚI THÊM]
    try:
        # Định dạng chuỗi 'newProcesses' như bạn yêu cầu
        # Lấy thời gian từ đối tượng vừa tạo (hoặc dùng datetime.now())
        timestamp = new_history_log.created_at.isoformat() if hasattr(new_history_log, 'created_at') else datetime.now().isoformat()
        
        # Giả định 'history' (input) có các trường 'action' và 'details'
        # Bạn hãy thay 'history.action' và 'history.details' bằng các trường đúng
        process_string = f"[{timestamp}] {history.command_type}: {history.command_value}: {history.status}"

        payload = {
            "productID": str(tree_id),
            "batch": "S_01", # Mặc định như bạn yêu cầu
            "newProcesses": process_string
        }
        
        response = requests.post(f"{BLOCKCHAIN_API_URL}/update/processes", json=payload, timeout=5)
        response.raise_for_status()
        
        logging.info(f"Successfully added history for tree {tree_id} to blockchain.")

    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to add history for tree {tree_id} to blockchain: {e}")
        
    # 4. Trả về kết quả
    return new_history_log


@router.get("/{tree_id}/control_history/", response_model=List[schemas.ControlHistory], tags=["control_history"])
def read_control_history_for_tree(
    tree_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    check_tree_access_and_get(tree_id, current_user, db)
    return services.get_control_history_for_tree(db, tree_id=tree_id, skip=skip, limit=limit)

# --- Fruit Detail Endpoints (NESTED DƯỚI CAPTURE - MỚI) ---

@router.post("/captures/{capture_id}/fruit_details/", response_model=schemas.FruitDetail, status_code=status.HTTP_201_CREATED, tags=["fruit_details"])
def create_fruit_detail_for_capture(
    capture_id: int,
    detail: schemas.FruitDetailCreate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    db_capture = services.get_camera_capture(db, capture_id)
    if db_capture is None:
        raise HTTPException(status_code=404, detail="Camera Capture not found")
    check_tree_access_and_get(db_capture.tree_id, current_user, db) # Kiểm tra quyền sở hữu Tree

    return services.create_fruit_detail(db, detail=detail, capture_id=capture_id)

@router.get("/captures/{capture_id}/fruit_details/", response_model=List[schemas.FruitDetail], tags=["fruit_details"])
def read_fruit_details_for_capture(
    capture_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    db_capture = services.get_camera_capture(db, capture_id)
    if db_capture is None:
        raise HTTPException(status_code=404, detail="Camera Capture not found")
    check_tree_access_and_get(db_capture.tree_id, current_user, db) # Kiểm tra quyền sở hữu Tree
    
    return services.get_fruit_details_for_capture(db, capture_id=capture_id)