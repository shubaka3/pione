from pydantic import BaseModel
from typing import Optional

class CameraBase(BaseModel):
    name: str
    url: str
    status: Optional[bool] = False
    fps: Optional[int] = 30

class CameraCreate(CameraBase):
    pass

class CameraUpdate(CameraBase):
    pass

class Camera(CameraBase):
    camera_id: int

    class Config:
        from_attributes = True