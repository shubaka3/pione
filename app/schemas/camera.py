from pydantic import BaseModel, HttpUrl
from datetime import datetime
from typing import Optional

class CameraBase(BaseModel):
    name: str
    rtsp_url: str

class CameraCreate(CameraBase):
    pass

class CameraUpdate(BaseModel):
    name: Optional[str] = None
    rtsp_url: Optional[str] = None
    status: Optional[str] = None

class Camera(CameraBase):
    camera_id: int
    status: str
    last_connected: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True