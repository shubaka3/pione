from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..dependencies import get_db, get_current_user
from ..schemas.camera import Camera, CameraCreate, CameraUpdate
from ..models import Camera as CameraModel, User
from datetime import datetime

router = APIRouter(
    prefix="/api/cameras",
    tags=["cameras"],
    dependencies=[Depends(get_current_user)],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=Camera, status_code=status.HTTP_201_CREATED)
def create_camera(camera: CameraCreate, db: Session = Depends(get_db)):
    db_camera = CameraModel(
        name=camera.name,
        rtsp_url=camera.rtsp_url,
        status="active"  # Giá trị mặc định khi tạo mới camera
    )
    db.add(db_camera)
    db.commit()
    db.refresh(db_camera)
    return db_camera

@router.get("/available", response_model=List[Camera])
def get_available_cameras(
    skip: int = 0, 
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách các camera có sẵn để gán cho cây.
    Trong thực tế, bạn có thể muốn lọc thêm theo người dùng hoặc các điều kiện khác.
    """
    cameras = db.query(CameraModel).filter(
        ~db.query(models.CameraAssignment.camera_id).filter(
            models.CameraAssignment.camera_id == CameraModel.camera_id,
            models.CameraAssignment.is_primary == True
        ).exists()
    ).offset(skip).limit(limit).all()
    
    return cameras

@router.get("/", response_model=List[Camera])
def list_cameras(
    skip: int = 0, 
    limit: int = 100, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách tất cả camera (bao gồm cả đã gán và chưa gán).
    """
    cameras = db.query(CameraModel).offset(skip).limit(limit).all()
    return cameras

@router.get("/{camera_id}", response_model=Camera)
def get_camera(camera_id: int, db: Session = Depends(get_db)):
    camera = db.query(CameraModel).filter(CameraModel.camera_id == camera_id).first()
    if camera is None:
        raise HTTPException(status_code=404, detail="Camera not found")
    return camera

@router.patch("/{camera_id}", response_model=Camera)
def update_camera(camera_id: int, camera: CameraUpdate, db: Session = Depends(get_db)):
    db_camera = db.query(CameraModel).filter(CameraModel.camera_id == camera_id).first()
    if db_camera is None:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    update_data = camera.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_camera, key, value)
    
    db_camera.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_camera)
    return db_camera

@router.delete("/{camera_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_camera(camera_id: int, db: Session = Depends(get_db)):
    camera = db.query(CameraModel).filter(CameraModel.camera_id == camera_id).first()
    if camera is None:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    db.delete(camera)
    db.commit()
    return None