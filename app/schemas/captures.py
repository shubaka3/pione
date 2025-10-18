from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

class CameraCaptureBase(BaseModel):
    image_url: str
    total_fruit_count: Optional[int] = 0

class CameraCaptureCreate(CameraCaptureBase):
    pass

class CameraCapture(CameraCaptureBase):
    capture_id: int
    tree_id: int
    capture_time: datetime

    class Config:
        from_attributes = True

class FruitDetailBase(BaseModel):
    fruit_index: int
    size_cm: Optional[float] = None
    color_code: Optional[str] = None
    health_status: Optional[str] = None
    bounding_box_json: Optional[Any] = None

class FruitDetailCreate(FruitDetailBase):
    pass
    
class FruitDetail(FruitDetailBase):
    detail_id: int
    capture_id: int

    class Config:
        from_attributes = True