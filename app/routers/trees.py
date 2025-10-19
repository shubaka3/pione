from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import schemas, services, auth, models
from ..schemas.camera import CameraStreamResponse
from ..database import get_db

router = APIRouter(
    prefix="/api/trees",
    tags=["trees"],
    dependencies=[Depends(auth.get_current_active_user)],
    responses={404: {"description": "Not found"}},
)

@router.post("", response_model=schemas.Tree, status_code=status.HTTP_201_CREATED)
def create_tree_for_current_user(
    tree: schemas.TreeCreate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    return services.create_user_tree(db=db, tree=tree, user_id=current_user.user_id)

@router.get("", response_model=List[schemas.Tree])
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

@router.get("/{tree_id}/stream", response_model=CameraStreamResponse)
def get_tree_camera_stream(
    tree_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Lấy thông tin stream từ camera được gán cho cây.
    """
    # Kiểm tra cây có tồn tại và thuộc về người dùng hiện tại không
    db_tree = services.get_tree(db, tree_id=tree_id)
    if db_tree is None:
        raise HTTPException(status_code=404, detail="Cây không tồn tại")
    if db_tree.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Không có quyền truy cập camera của cây này")
    
    # Lấy thông tin gán camera chính (primary) cho cây
    assignment = db.query(models.CameraAssignment).filter(
        models.CameraAssignment.tree_id == tree_id,
        models.CameraAssignment.is_primary == True
    ).first()
    
    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Chưa có camera nào được gán cho cây này"
        )
    
    # Lấy thông tin camera
    camera = db.query(models.Camera).filter(
        models.Camera.camera_id == assignment.camera_id
    ).first()
    
    if not camera:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy thông tin camera"
        )
    
    # Trả về thông tin stream
    return {
        "camera_id": camera.camera_id,
        "camera_name": camera.name,
        "stream_url": f"/api/stream/{camera.camera_id}",
        "status": camera.status,
        "is_primary": assignment.is_primary
    }