# File: alerts.py (Đã sửa lỗi Duplicated param name)

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import schemas, services, auth, models
from ..database import get_db

# Router này có prefix="/alerts"
router = APIRouter(
    prefix="/alerts",
    tags=["alerts"],
    dependencies=[Depends(auth.get_current_active_user)],
    responses={404: {"description": "Not found"}},
)

# Hàm kiểm tra quyền sở hữu Tree (Giữ nguyên)
def get_user_tree_or_404(db: Session, tree_id: int, current_user: models.User) -> models.Tree:
    db_tree = services.get_tree(db, tree_id=tree_id)
    if db_tree is None:
        raise HTTPException(status_code=404, detail="Tree not found")
    if db_tree.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this tree's alerts")
    return db_tree

# --- Alert Endpoints ---

# Path cuối cùng: /api/trees/{tree_id}/alerts/
@router.post("/", response_model=schemas.Alert, status_code=status.HTTP_201_CREATED) # Đã sửa từ "/{tree_id}/" sang "/"
def create_alert_for_tree(
    tree_id: int, # tree_id được truyền từ router cha
    alert: schemas.AlertCreate,
    current_user: models.User = Depends(auth.get_current_active_user), 
    db: Session = Depends(get_db)
):
    get_user_tree_or_404(db, tree_id, current_user)
    return services.create_alert_for_tree(db=db, alert=alert, tree_id=tree_id)

# Path cuối cùng: /api/trees/{tree_id}/alerts/
@router.get("/", response_model=List[schemas.Alert]) # Đã sửa từ "/{tree_id}/" sang "/"
def read_alerts_for_tree(
    tree_id: int, # tree_id được truyền từ router cha
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    get_user_tree_or_404(db, tree_id, current_user)
    return services.get_alerts_for_tree(db, tree_id=tree_id, skip=skip, limit=limit)


@router.get("/detail/{alert_id}", response_model=schemas.Alert)
def read_alert(
    alert_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    db_alert = services.get_alert(db, alert_id)
    if db_alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    if db_alert.tree_id: # Cảnh báo có thể không liên quan đến Tree (tree_id=NULL)
        db_tree = services.get_tree(db, db_alert.tree_id)
        if db_tree and db_tree.user_id != current_user.user_id:
            raise HTTPException(status_code=403, detail="Not authorized to access this alert")
    
    return db_alert

@router.patch("/detail/{alert_id}", response_model=schemas.Alert)
def update_alert(
    alert_id: int,
    alert_update: schemas.AlertUpdate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    db_alert = services.get_alert(db, alert_id)
    if db_alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    if db_alert.tree_id:
        db_tree = services.get_tree(db, db_alert.tree_id)
        if db_tree and db_tree.user_id != current_user.user_id:
            raise HTTPException(status_code=403, detail="Not authorized to update this alert")

    return services.update_alert(db, alert_id, alert_update)

@router.delete("/detail/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alert(
    alert_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    db_alert = services.get_alert(db, alert_id)
    if db_alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    if db_alert.tree_id:
        db_tree = services.get_tree(db, db_alert.tree_id)
        if db_tree and db_tree.user_id != current_user.user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this alert")
            
    services.delete_alert(db, alert_id)
    return {"ok": True}