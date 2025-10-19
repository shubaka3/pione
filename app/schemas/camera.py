from pydantic import BaseModel, HttpUrl, Field
from datetime import datetime
from typing import Optional, Dict, Any

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
        from_attributes = True

class CameraStreamResponse(BaseModel):
    """Model cho phản hồi thông tin stream camera"""
    camera_id: int
    camera_name: str
    stream_url: str
    status: str
    is_primary: bool
    
    class Config:
        from_attributes = True