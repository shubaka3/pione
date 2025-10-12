from sqlalchemy.orm import Session
from typing import List, Optional
from . import models, schemas
from .auth import get_password_hash

# --- User Services ---
def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.user_id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.username == username).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int) -> Optional[models.User]:
    db_user = get_user(db, user_id)
    if db_user:
        db.delete(db_user)
        db.commit()
    return db_user

# --- Tree Services ---
def get_tree(db: Session, tree_id: int) -> Optional[models.Tree]:
    return db.query(models.Tree).filter(models.Tree.tree_id == tree_id).first()

def get_trees_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[models.Tree]:
    return db.query(models.Tree).filter(models.Tree.user_id == user_id).offset(skip).limit(limit).all()

def create_user_tree(db: Session, tree: schemas.TreeCreate, user_id: int) -> models.Tree:
    db_tree = models.Tree(**tree.model_dump(), user_id=user_id)
    db.add(db_tree)
    db.commit()
    db.refresh(db_tree)
    return db_tree
    
def update_tree(db: Session, tree_id: int, tree_update: schemas.TreeUpdate) -> Optional[models.Tree]:
    db_tree = get_tree(db, tree_id)
    if db_tree:
        update_data = tree_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_tree, key, value)
        db.commit()
        db.refresh(db_tree)
    return db_tree

def delete_tree(db: Session, tree_id: int) -> Optional[models.Tree]:
    db_tree = get_tree(db, tree_id)
    if db_tree:
        db.delete(db_tree)
        db.commit()
    return db_tree

# --- Sensor Reading Services ---
def create_sensor_reading(db: Session, reading: schemas.SensorReadingCreate, tree_id: int) -> models.SensorReading:
    db_reading = models.SensorReading(**reading.model_dump(), tree_id=tree_id)
    db.add(db_reading)
    db.commit()
    db.refresh(db_reading)
    return db_reading

def get_sensor_readings_for_tree(db: Session, tree_id: int, skip: int = 0, limit: int = 100) -> List[models.SensorReading]:
    return db.query(models.SensorReading).filter(models.SensorReading.tree_id == tree_id).order_by(models.SensorReading.timestamp.desc()).offset(skip).limit(limit).all()

# --- Camera Capture Services ---
def create_camera_capture(db: Session, image_url: str, total_fruit_count: int, tree_id: int) -> models.CameraCapture:
    db_capture = models.CameraCapture(
        image_url=image_url, 
        total_fruit_count=total_fruit_count, 
        tree_id=tree_id
    )
    db.add(db_capture)
    db.commit()
    db.refresh(db_capture)
    return db_capture

def get_camera_captures_for_tree(db: Session, tree_id: int, skip: int = 0, limit: int = 100) -> List[models.CameraCapture]:
    return db.query(models.CameraCapture).filter(models.CameraCapture.tree_id == tree_id).order_by(models.CameraCapture.capture_time.desc()).offset(skip).limit(limit).all()

# --- IotDevice Services ---
def create_iot_device(db: Session, device: schemas.IotDeviceCreate, tree_id: int) -> models.IotDevice:
    db_device = models.IotDevice(**device.model_dump(), tree_id=tree_id)
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device

def get_iot_device_by_tree(db: Session, tree_id: int) -> Optional[models.IotDevice]:
    return db.query(models.IotDevice).filter(models.IotDevice.tree_id == tree_id).first()
    
# You can add more services for FruitDetail, ControlHistory, and Alert following the same pattern.
# For example:
def create_alert_for_tree(db: Session, alert: schemas.AlertCreate, tree_id: int) -> models.Alert:
    db_alert = models.Alert(**alert.model_dump(), tree_id=tree_id)
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert

# 5:49 - 10/12/2025 thêm 1 số hàm còn thiếu
def get_iot_device_by_tree(db: Session, tree_id: int) -> Optional[models.IotDevice]:
    return db.query(models.IotDevice).filter(models.IotDevice.tree_id == tree_id).first()
    
def get_iot_device(db: Session, device_id: int) -> Optional[models.IotDevice]:
    return db.query(models.IotDevice).filter(models.IotDevice.device_id == device_id).first()

def update_iot_device(db: Session, device_id: int, device_update: schemas.IotDeviceUpdate) -> Optional[models.IotDevice]:
    db_device = get_iot_device(db, device_id)
    if db_device:
        update_data = device_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_device, key, value)
        db.commit()
        db.refresh(db_device)
    return db_device

def delete_iot_device(db: Session, device_id: int) -> Optional[models.IotDevice]:
    db_device = get_iot_device(db, device_id)
    if db_device:
        db.delete(db_device)
        db.commit()
    return db_device

# --- Camera Capture Services ---
# create_camera_capture đã có sẵn
def get_camera_capture(db: Session, capture_id: int) -> Optional[models.CameraCapture]:
    return db.query(models.CameraCapture).filter(models.CameraCapture.capture_id == capture_id).first()

# get_camera_captures_for_tree đã có sẵn

def update_camera_capture(db: Session, capture_id: int, capture_update: schemas.CameraCaptureBase) -> Optional[models.CameraCapture]:
    db_capture = get_camera_capture(db, capture_id)
    if db_capture:
        update_data = capture_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_capture, key, value)
        db.commit()
        db.refresh(db_capture)
    return db_capture

def delete_camera_capture(db: Session, capture_id: int) -> Optional[models.CameraCapture]:
    db_capture = get_camera_capture(db, capture_id)
    if db_capture:
        db.delete(db_capture)
        db.commit()
    return db_capture
    
# --- Fruit Detail Services (Nested under Camera Capture) ---
def create_fruit_detail(db: Session, detail: schemas.FruitDetailCreate, capture_id: int) -> models.FruitDetail:
    db_detail = models.FruitDetail(**detail.model_dump(), capture_id=capture_id)
    db.add(db_detail)
    db.commit()
    db.refresh(db_detail)
    return db_detail

def get_fruit_detail(db: Session, detail_id: int) -> Optional[models.FruitDetail]:
    return db.query(models.FruitDetail).filter(models.FruitDetail.detail_id == detail_id).first()

def get_fruit_details_for_capture(db: Session, capture_id: int) -> List[models.FruitDetail]:
    return db.query(models.FruitDetail).filter(models.FruitDetail.capture_id == capture_id).all()
    
# Thêm update và delete cho FruitDetail nếu cần, nhưng thường chi tiết quả sẽ được tạo/xóa cùng với CameraCapture.
# Tạm thời chỉ giữ lại create, get.

# --- Control History Services ---
def create_control_history(db: Session, history: schemas.ControlHistoryCreate, tree_id: int, user_id: int) -> models.ControlHistory:
    db_history = models.ControlHistory(**history.model_dump(), tree_id=tree_id, user_id=user_id)
    db.add(db_history)
    db.commit()
    db.refresh(db_history)
    return db_history

def get_control_history_for_tree(db: Session, tree_id: int, skip: int = 0, limit: int = 100) -> List[models.ControlHistory]:
    return db.query(models.ControlHistory).filter(models.ControlHistory.tree_id == tree_id).order_by(models.ControlHistory.command_time.desc()).offset(skip).limit(limit).all()

def get_control_history(db: Session, history_id: int) -> Optional[models.ControlHistory]:
    return db.query(models.ControlHistory).filter(models.ControlHistory.history_id == history_id).first()
# Lịch sử điều khiển (ControlHistory) thường không được update hay delete, chỉ tạo mới (CREATE) và đọc (READ).

# --- Alert Services ---
# create_alert_for_tree đã có sẵn
def get_alert(db: Session, alert_id: int) -> Optional[models.Alert]:
    return db.query(models.Alert).filter(models.Alert.alert_id == alert_id).first()

def get_alerts_for_tree(db: Session, tree_id: int, skip: int = 0, limit: int = 100) -> List[models.Alert]:
    return db.query(models.Alert).filter(models.Alert.tree_id == tree_id).order_by(models.Alert.alert_time.desc()).offset(skip).limit(limit).all()

def update_alert(db: Session, alert_id: int, alert_update: schemas.AlertUpdate) -> Optional[models.Alert]:
    db_alert = get_alert(db, alert_id)
    if db_alert:
        update_data = alert_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_alert, key, value)
        db.commit()
        db.refresh(db_alert)
    return db_alert

def delete_alert(db: Session, alert_id: int) -> Optional[models.Alert]:
    db_alert = get_alert(db, alert_id)
    if db_alert:
        db.delete(db_alert)
        db.commit()
    return db_alert