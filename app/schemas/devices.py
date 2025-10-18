from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

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