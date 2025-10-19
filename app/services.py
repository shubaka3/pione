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
    # Tạo cây mới
    db_tree = models.Tree(
        user_id=user_id,
        name=tree.name,
        species=tree.species,
        location=tree.location,
        planting_date=tree.planting_date,
        is_active=True
    )
    db.add(db_tree)
    db.commit()
    db.refresh(db_tree)

    # Nếu có chọn camera, tạo bản ghi trong camera_assignments
    if tree.camera_id is not None:
        # Kiểm tra camera có tồn tại không
        camera = db.query(models.Camera).filter(
            models.Camera.camera_id == tree.camera_id
        ).first()
        
        if not camera:
            # Nếu camera không tồn tại, rollback và báo lỗi
            db.rollback()
            raise ValueError(f"Camera with ID {tree.camera_id} not found")
        
        # Tạo bản ghi gán camera
        assignment = models.CameraAssignment(
            camera_id=tree.camera_id,
            tree_id=db_tree.tree_id,
            is_primary=True
        )
        db.add(assignment)
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
def create_camera_capture(db: Session, capture: schemas.CameraCaptureCreate, tree_id: int) -> models.CameraCapture:
    db_capture = models.CameraCapture(**capture.model_dump(), tree_id=tree_id)
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