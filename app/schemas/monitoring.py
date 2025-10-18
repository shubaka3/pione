from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

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