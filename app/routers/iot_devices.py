# File: iot_devices.py (Đã sửa lỗi Duplicated param name)

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import schemas, services, auth, models
from ..database import get_db

# Router này có prefix="/devices"
router = APIRouter(
    prefix="/devices",
    tags=["iot_devices"],
    dependencies=[Depends(auth.get_current_active_user)],
    responses={404: {"description": "Not found"}},
)

# Hàm kiểm tra quyền sở hữu Tree (Giữ nguyên)
def get_user_tree_or_404(db: Session, tree_id: int, current_user: models.User) -> models.Tree:
    db_tree = services.get_tree(db, tree_id=tree_id)
    if db_tree is None:
        raise HTTPException(status_code=404, detail="Tree not found")
    if db_tree.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this tree's device")
    return db_tree

# --- IotDevice Endpoints ---
# Path cuối cùng: /api/trees/{tree_id}/devices
@router.post("/", response_model=schemas.IotDevice, status_code=status.HTTP_201_CREATED) # Đã sửa từ "/{tree_id}" sang "/"
def create_iot_device_for_tree(
    tree_id: int, # tree_id được truyền từ router cha
    device: schemas.IotDeviceCreate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    get_user_tree_or_404(db, tree_id, current_user)
    db_device = services.get_iot_device_by_tree(db, tree_id)
    if db_device:
        raise HTTPException(status_code=400, detail="Tree already has an IoT device")
    return services.create_iot_device(db=db, device=device, tree_id=tree_id)

# Path cuối cùng: /api/trees/{tree_id}/devices
@router.get("/", response_model=schemas.IotDevice) # Đã sửa từ "/{tree_id}" sang "/"
def read_iot_device_for_tree(
    tree_id: int, # tree_id được truyền từ router cha
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    get_user_tree_or_404(db, tree_id, current_user)
    db_device = services.get_iot_device_by_tree(db, tree_id)
    if db_device is None:
        raise HTTPException(status_code=404, detail="IoT Device not found for this tree")
    return db_device

# Path cuối cùng: /api/trees/{tree_id}/devices
@router.put("/", response_model=schemas.IotDevice) # Đã sửa từ "/{tree_id}" sang "/"
def update_iot_device_for_tree(
    tree_id: int, # tree_id được truyền từ router cha
    device_update: schemas.IotDeviceUpdate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    get_user_tree_or_404(db, tree_id, current_user)
    db_device = services.get_iot_device_by_tree(db, tree_id)
    if db_device is None:
        raise HTTPException(status_code=404, detail="IoT Device not found for this tree")
    return services.update_iot_device(db, db_device.device_id, device_update)

# Path cuối cùng: /api/trees/{tree_id}/devices
@router.delete("/", status_code=status.HTTP_204_NO_CONTENT) # Đã sửa từ "/{tree_id}" sang "/"
def delete_iot_device_for_tree(
    tree_id: int, # tree_id được truyền từ router cha
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    get_user_tree_or_404(db, tree_id, current_user)
    db_device = services.get_iot_device_by_tree(db, tree_id)
    if db_device is None:
        raise HTTPException(status_code=404, detail="IoT Device not found for this tree")
    services.delete_iot_device(db, db_device.device_id)
    return {"ok": True}