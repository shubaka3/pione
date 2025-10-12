from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import schemas, services, auth, models
from ..database import get_db
from ..routers import iot_devices # Thêm import
from ..routers import alerts # Thêm import

router = APIRouter(
    prefix="/api/trees",
    tags=["trees"],
    dependencies=[Depends(auth.get_current_active_user)],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=schemas.Tree, status_code=status.HTTP_201_CREATED)
def create_tree_for_current_user(
    tree: schemas.TreeCreate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    return services.create_user_tree(db=db, tree=tree, user_id=current_user.user_id)

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

@router.put("/{tree_id}", response_model=schemas.Tree)
def update_tree(
    tree_id: int,
    tree_update: schemas.TreeUpdate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    db_tree = services.get_tree(db, tree_id=tree_id)
    if db_tree is None:
        raise HTTPException(status_code=404, detail="Tree not found")
    if db_tree.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this tree")
    return services.update_tree(db, tree_id, tree_update)

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

@router.post("/{tree_id}/captures/", response_model=schemas.CameraCapture, status_code=status.HTTP_201_CREATED, tags=["camera_captures"])
def create_capture_for_tree(
    tree_id: int,
    capture: schemas.CameraCaptureCreate,
    current_user: models.User = Depends(auth.get_current_active_user), # Bảo vệ bằng auth
    db: Session = Depends(get_db)
):
    check_tree_access_and_get(tree_id, current_user, db)
    return services.create_camera_capture(db, capture=capture, tree_id=tree_id)

@router.get("/{tree_id}/captures/", response_model=List[schemas.CameraCapture], tags=["camera_captures"])
def read_captures_for_tree(
    tree_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    check_tree_access_and_get(tree_id, current_user, db)
    return services.get_camera_captures_for_tree(db, tree_id=tree_id, skip=skip, limit=limit)

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

@router.post("/{tree_id}/control_history/", response_model=schemas.ControlHistory, status_code=status.HTTP_201_CREATED, tags=["control_history"])
def create_control_history_for_tree(
    tree_id: int,
    history: schemas.ControlHistoryCreate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    check_tree_access_and_get(tree_id, current_user, db)
    return services.create_control_history(db, history=history, tree_id=tree_id, user_id=current_user.user_id)

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