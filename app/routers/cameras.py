from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..dependencies import get_db, get_current_user
from ..schemas.camera import Camera, CameraCreate, CameraUpdate
from ..models import Camera as CameraModel
from datetime import datetime

router = APIRouter()

@router.post("/", response_model=Camera, status_code=status.HTTP_201_CREATED)
def create_camera(camera: CameraCreate, db: Session = Depends(get_db)):
    db_camera = CameraModel(
        name=camera.name,
        url=camera.url,
        status=camera.status,
        fps=camera.fps
    )
    db.add(db_camera)
    db.commit()
    db.refresh(db_camera)
    return db_camera

@router.get("/", response_model=List[Camera])
def list_cameras(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
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