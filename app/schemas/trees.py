from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class TreeBase(BaseModel):
    latitude: float
    longitude: float
    height: Optional[float] = None
    diameter: Optional[float] = None
    species: Optional[str] = None
    health_status: Optional[str] = None
    notes: Optional[str] = None

class TreeCreate(TreeBase):
    pass

class TreeUpdate(TreeBase):
    pass

class Tree(TreeBase):
    tree_id: int
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True