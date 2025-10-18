from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime, date

class TreeBase(BaseModel):
    name: str
    species: str
    location: Optional[str] = None
    planting_date: Optional[date] = None

class TreeCreate(TreeBase):
    pass

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