from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any
from datetime import datetime, date

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# --- User Schemas ---
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None

class User(UserBase):
    user_id: int
    is_first_time: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Tree Schemas ---
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

# --- IoT Device Schemas ---
class IotDeviceBase(BaseModel):
    name: str
    device_type: Optional[str] = None
    api_endpoint: str
    api_key_secret: Optional[str] = None

class IotDeviceCreate(IotDeviceBase):
    pass

class IotDeviceUpdate(BaseModel):
    name: Optional[str] = None
    device_type: Optional[str] = None
    api_endpoint: Optional[str] = None
    api_key_secret: Optional[str] = None

class IotDevice(IotDeviceBase):
    device_id: int
    tree_id: int
    last_seen_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Sensor Reading Schemas ---
class SensorReadingBase(BaseModel):
    temperature_c: Optional[float] = None
    humidity_pct: Optional[float] = None
    soil_moisture_pct: Optional[float] = None
    light_lux: Optional[int] = None
    water_level_pct: Optional[float] = None
    weather_info: Optional[str] = None

class SensorReadingCreate(SensorReadingBase):
    pass

class SensorReading(SensorReadingBase):
    reading_id: int
    tree_id: int
    timestamp: datetime

    class Config:
        from_attributes = True

# --- Camera Capture Schemas ---
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
        
# --- Fruit Detail Schemas ---
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
        
# --- Control History Schemas ---
class ControlHistoryBase(BaseModel):
    command_type: str
    command_value: Optional[str] = None
    status: Optional[str] = None

class ControlHistoryCreate(ControlHistoryBase):
    pass
    
class ControlHistory(ControlHistoryBase):
    history_id: int
    tree_id: int
    user_id: int
    command_time: datetime
    
    class Config:
        from_attributes = True
        
# --- Alert Schemas ---
class AlertBase(BaseModel):
    alert_type: str
    severity: Optional[str] = None
    description: str

class AlertCreate(AlertBase):
    pass
    
class AlertUpdate(BaseModel):
    is_resolved: bool
    
class Alert(AlertBase):
    alert_id: int
    tree_id: Optional[int] = None
    alert_time: datetime
    is_resolved: bool
    
    class Config:
        from_attributes = True