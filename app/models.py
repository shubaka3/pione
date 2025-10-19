from sqlalchemy import (
    Boolean, Column, Integer, String, DateTime, Numeric, ForeignKey, Date, Text,
    Index, BigInteger
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

# Bảng users
class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_first_time = Column(Boolean, default=False)
    refresh_token = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login_at = Column(DateTime(timezone=True))

    trees = relationship("Tree", back_populates="owner", cascade="all, delete-orphan")
    control_history = relationship("ControlHistory", back_populates="user")
    camera_sessions = relationship("CameraSession", back_populates="user", cascade="all, delete-orphan")

# Bảng trees
class Tree(Base):
    __tablename__ = "trees"

    tree_id = Column(Integer, primary_key=True)
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
    camera_assignments = relationship("CameraAssignment", back_populates="tree", cascade="all, delete-orphan")
    __table_args__ = (Index('idx_trees_user_id', "user_id"),)

# Bảng iot_devices
class IotDevice(Base):
    __tablename__ = "iot_devices"

    device_id = Column(Integer, primary_key=True)
    tree_id = Column(Integer, ForeignKey("trees.tree_id", ondelete="CASCADE"), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    device_type = Column(String(50))
    api_endpoint = Column(Text, nullable=False)
    api_key_secret = Column(String(255))
    last_seen_at = Column(DateTime(timezone=True))

    tree = relationship("Tree", back_populates="iot_device")

# Bảng sensor_readings
class SensorReading(Base):
    __tablename__ = "sensor_readings"

    reading_id = Column(BigInteger, primary_key=True)
    tree_id = Column(Integer, ForeignKey("trees.tree_id", ondelete="CASCADE"), nullable=False)
    timestamp = Column("timestamp", DateTime(timezone=True), nullable=False, server_default=func.now())
    temperature_c = Column(Numeric(5, 2))
    humidity_pct = Column(Numeric(5, 2))
    soil_moisture_pct = Column(Numeric(5, 2))
    light_lux = Column(Integer)
    water_level_pct = Column(Numeric(5, 2))
    weather_info = Column(String(100))

    tree = relationship("Tree", back_populates="sensor_readings")
    __table_args__ = (Index('idx_readings_tree_time', "tree_id", "timestamp"),)

# Bảng cameras
class Camera(Base):
    __tablename__ = "cameras"
    
    camera_id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    rtsp_url = Column(Text, nullable=False)
    status = Column(String(50), default='inactive')
    last_connected = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    assignments = relationship("CameraAssignment", back_populates="camera", cascade="all, delete-orphan")
    sessions = relationship("CameraSession", back_populates="camera", cascade="all, delete-orphan")
    captures = relationship("CameraCapture", back_populates="camera")

# Bảng camera_captures
class CameraCapture(Base):
    __tablename__ = "camera_captures"

    capture_id = Column(BigInteger, primary_key=True)
    tree_id = Column(Integer, ForeignKey("trees.tree_id", ondelete="CASCADE"), nullable=False)
    camera_id = Column(Integer, ForeignKey("cameras.camera_id"), nullable=True)
    capture_time = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    image_url = Column(Text, nullable=False)
    total_fruit_count = Column(Integer, default=0)

    tree = relationship("Tree", back_populates="camera_captures")
    camera = relationship("Camera", back_populates="captures")
    fruit_details = relationship("FruitDetail", back_populates="capture", cascade="all, delete-orphan")
    __table_args__ = (
        Index('idx_captures_tree_time', "tree_id", "capture_time"),
        Index('idx_captures_camera_time', "camera_id", "capture_time"),
    )

# Bảng fruit_details
class FruitDetail(Base):
    __tablename__ = "fruit_details"
    
    detail_id = Column(BigInteger, primary_key=True)
    capture_id = Column(BigInteger, ForeignKey("camera_captures.capture_id", ondelete="CASCADE"), nullable=False)
    fruit_index = Column(Integer, nullable=False)
    size_cm = Column(Numeric(5, 2))
    color_code = Column(String(50))
    health_status = Column(String(50))
    bounding_box_json = Column(JSONB)

    capture = relationship("CameraCapture", back_populates="fruit_details")
    __table_args__ = (Index('idx_details_capture_id', "capture_id"),)

# Bảng control_history
class ControlHistory(Base):
    __tablename__ = "control_history"

    history_id = Column(BigInteger, primary_key=True)
    tree_id = Column(Integer, ForeignKey("trees.tree_id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    command_type = Column(String(50), nullable=False)
    command_value = Column(String(100))
    command_time = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(50))
    
    tree = relationship("Tree", back_populates="control_history")
    user = relationship("User", back_populates="control_history")

# Bảng alerts
class Alert(Base):
    __tablename__ = "alerts"

    alert_id = Column(BigInteger, primary_key=True)
    tree_id = Column(Integer, ForeignKey("trees.tree_id", ondelete="SET NULL"), nullable=True)
    alert_time = Column(DateTime(timezone=True), server_default=func.now())
    alert_type = Column(String(50), nullable=False)
    severity = Column(String(20))
    description = Column(Text, nullable=False)
    is_resolved = Column(Boolean, default=False)
    
    tree = relationship("Tree", back_populates="alerts")
    __table_args__ = (Index('idx_alerts_time', "alert_time"),)

# Bảng camera_assignments
class CameraAssignment(Base):
    __tablename__ = "camera_assignments"

    assignment_id = Column(Integer, primary_key=True)
    camera_id = Column(Integer, ForeignKey("cameras.camera_id", ondelete="CASCADE"), nullable=False)
    tree_id = Column(Integer, ForeignKey("trees.tree_id", ondelete="CASCADE"), nullable=False)
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    camera = relationship("Camera", back_populates="assignments")
    tree = relationship("Tree", back_populates="camera_assignments")
    __table_args__ = (
        Index('idx_camera_assignments_tree', "tree_id"),
        Index('idx_camera_assignments_camera', "camera_id"),
    )

# Bảng camera_sessions
class CameraSession(Base):
    __tablename__ = "camera_sessions"

    session_id = Column(Integer, primary_key=True)
    camera_id = Column(Integer, ForeignKey("cameras.camera_id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True))
    session_token = Column(Text, unique=True, nullable=False)
    status = Column(String(50), default="active")

    camera = relationship("Camera", back_populates="sessions")
    user = relationship("User", back_populates="camera_sessions")
    __table_args__ = (
        Index('idx_camera_sessions_camera', "camera_id"),
        Index('idx_camera_sessions_token', "session_token"),
        Index('idx_camera_sessions_status', "status"),
    )
