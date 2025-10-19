from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime, date

class CameraAssignmentBase(BaseModel):
    camera_id: int
    is_primary: bool = True

class TreeBase(BaseModel):
    name: str
    species: str
    location: Optional[str] = None
    planting_date: Optional[date] = None

class TreeCreate(TreeBase):
    camera_id: Optional[int] = Field(
        None, 
        description="ID của camera được gán cho cây (tùy chọn)"
    )

class TreeUpdate(BaseModel):
    name: Optional[str] = None
    species: Optional[str] = None
    location: Optional[str] = None
    planting_date: Optional[date] = None
    is_active: Optional[bool] = None

class Tree(TreeBase):
    tree_id: int
    user_id: int
    is_active: bool

    class Config:
        from_attributes = True