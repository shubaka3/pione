from sqlalchemy import (
    Boolean, Column, Integer, String, DateTime, Numeric, ForeignKey, Date, Text,
    Index
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    is_first_time = Column(Boolean, default=False)
    refresh_token = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login_at = Column(DateTime(timezone=True))

    trees = relationship("Tree", back_populates="owner", cascade="all, delete-orphan")
    control_history = relationship("ControlHistory", back_populates="user")

class Tree(Base):
    __tablename__ = "trees"

    tree_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    species = Column(String(100), nullable=False)
    location = Column(String(255))
    planting_date = Column(Date)
    is_active = Column(Boolean, default=True)

    owner = relationship("User", back_populates="trees")
    iot_device = relationship("IotDevice", back_populates="tree", uselist=False, cascade="all, delete-orphan")
    sensor_readings = relationship("SensorReading", back_populates="tree", cascade="all, delete-orphan")
    camera_captures = relationship("CameraCapture", back_populates="tree", cascade="all, delete-orphan")
    control_history = relationship("ControlHistory", back_populates="tree", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="tree")

    __table_args__ = (Index('idx_trees_user_id', "user_id"),)

class IotDevice(Base):
    __tablename__ = "iot_devices"

    device_id = Column(Integer, primary_key=True, index=True)
    tree_id = Column(Integer, ForeignKey("trees.tree_id", ondelete="CASCADE"), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    device_type = Column(String(50))
    api_endpoint = Column(Text, nullable=False)
    api_key_secret = Column(String(255))
    last_seen_at = Column(DateTime(timezone=True))

    tree = relationship("Tree", back_populates="iot_device")

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    reading_id = Column(Integer, primary_key=True, index=True) # BIGSERIAL in practice
    tree_id = Column(Integer, ForeignKey("trees.tree_id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    temperature_c = Column(Numeric(5, 2))
    humidity_pct = Column(Numeric(5, 2))
    soil_moisture_pct = Column(Numeric(5, 2))
    light_lux = Column(Integer)
    water_level_pct = Column(Numeric(5, 2))
    weather_info = Column(String(100))

    tree = relationship("Tree", back_populates="sensor_readings")

    __table_args__ = (Index('idx_readings_tree_time', "tree_id", "timestamp"),)

class CameraCapture(Base):
    __tablename__ = "camera_captures"

    capture_id = Column(Integer, primary_key=True, index=True) # BIGSERIAL in practice
    tree_id = Column(Integer, ForeignKey("trees.tree_id", ondelete="CASCADE"), nullable=False)
    capture_time = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    image_url = Column(Text, nullable=False)
    total_fruit_count = Column(Integer, default=0)

    tree = relationship("Tree", back_populates="camera_captures")
    fruit_details = relationship("FruitDetail", back_populates="capture", cascade="all, delete-orphan")

    __table_args__ = (Index('idx_captures_tree_time', "tree_id", "capture_time"),)


class FruitDetail(Base):
    __tablename__ = "fruit_details"

    detail_id = Column(Integer, primary_key=True, index=True) # BIGSERIAL in practice
    capture_id = Column(Integer, ForeignKey("camera_captures.capture_id", ondelete="CASCADE"), nullable=False)
    fruit_index = Column(Integer, nullable=False)
    size_cm = Column(Numeric(5, 2))
    color_code = Column(String(50))
    health_status = Column(String(50))
    bounding_box_json = Column(JSONB)

    capture = relationship("CameraCapture", back_populates="fruit_details")
    
    __table_args__ = (Index('idx_details_capture_id', "capture_id"),)

class ControlHistory(Base):
    __tablename__ = "control_history"

    history_id = Column(Integer, primary_key=True, index=True) # BIGSERIAL in practice
    tree_id = Column(Integer, ForeignKey("trees.tree_id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"))
    command_type = Column(String(50), nullable=False)
    command_value = Column(String(100))
    command_time = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(50))
    
    tree = relationship("Tree", back_populates="control_history")
    user = relationship("User", back_populates="control_history")

class Alert(Base):
    __tablename__ = "alerts"

    alert_id = Column(Integer, primary_key=True, index=True) # BIGSERIAL in practice
    tree_id = Column(Integer, ForeignKey("trees.tree_id", ondelete="SET NULL"))
    alert_time = Column(DateTime(timezone=True), server_default=func.now())
    alert_type = Column(String(50), nullable=False)
    severity = Column(String(20))
    description = Column(Text, nullable=False)
    is_resolved = Column(Boolean, default=False)
    
    tree = relationship("Tree", back_populates="alerts")
    
    __table_args__ = (Index('idx_alerts_time', "alert_time"),)