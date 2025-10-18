DROP TABLE IF EXISTS fruit_details CASCADE;
DROP TABLE IF EXISTS camera_captures CASCADE;
DROP TABLE IF EXISTS camera_sessions CASCADE;
DROP TABLE IF EXISTS camera_assignments CASCADE;
DROP TABLE IF EXISTS cameras CASCADE;
DROP TABLE IF EXISTS sensor_readings CASCADE;
DROP TABLE IF EXISTS control_history CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS iot_devices CASCADE;
DROP TABLE IF EXISTS trees CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_first_time BOOLEAN DEFAULT FALSE,
    refresh_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE trees (
    tree_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    species VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    planting_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE INDEX idx_trees_user_id ON trees (user_id);

CREATE TABLE iot_devices (
    device_id SERIAL PRIMARY KEY,
    tree_id INTEGER UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    device_type VARCHAR(50),
    api_endpoint TEXT NOT NULL,
    api_key_secret VARCHAR(255),
    last_seen_at TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY (tree_id) REFERENCES trees (tree_id) ON DELETE CASCADE
);

CREATE TABLE sensor_readings (
    reading_id BIGSERIAL PRIMARY KEY,
    tree_id INTEGER NOT NULL,
    "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    temperature_c NUMERIC(5, 2),
    humidity_pct NUMERIC(5, 2),
    soil_moisture_pct NUMERIC(5, 2),
    light_lux INTEGER,
    water_level_pct NUMERIC(5, 2),
    weather_info VARCHAR(100),
    FOREIGN KEY (tree_id) REFERENCES trees (tree_id) ON DELETE CASCADE
);

CREATE INDEX idx_readings_tree_time ON sensor_readings (tree_id, "timestamp" DESC);

CREATE TABLE camera_captures (
    id BIGSERIAL PRIMARY KEY,
    tree_id INTEGER NOT NULL,
    capture_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    image_url TEXT NOT NULL,
    total_fruit_count INTEGER DEFAULT 0,
    FOREIGN KEY (tree_id) REFERENCES trees (tree_id) ON DELETE CASCADE
);

CREATE INDEX idx_captures_tree_time ON camera_captures (tree_id, capture_time DESC);

CREATE TABLE fruit_details (
    id BIGSERIAL PRIMARY KEY,
    capture_id BIGINT NOT NULL,
    fruit_index INTEGER NOT NULL,
    size_cm NUMERIC(5, 2),
    color_code VARCHAR(50),
    health_status VARCHAR(50),
    bounding_box_json JSONB,
    FOREIGN KEY (capture_id) REFERENCES camera_captures (id) ON DELETE CASCADE
);

CREATE INDEX idx_details_capture_id ON fruit_details (capture_id);

CREATE TABLE control_history (
    history_id BIGSERIAL PRIMARY KEY,
    tree_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    command_type VARCHAR(50) NOT NULL,
    command_value VARCHAR(100),
    command_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50),
    FOREIGN KEY (tree_id) REFERENCES trees (tree_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE SET NULL
);

CREATE TABLE alerts (
    alert_id BIGSERIAL PRIMARY KEY,
    tree_id INTEGER,
    alert_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20),
    description TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (tree_id) REFERENCES trees (tree_id) ON DELETE SET NULL
);

CREATE INDEX idx_alerts_time ON alerts (alert_time DESC);

-- Camera related tables
CREATE TABLE cameras (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    rtsp_url TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'inactive',
    last_connected TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE camera_assignments (
    id SERIAL PRIMARY KEY,
    camera_id INTEGER NOT NULL,
    tree_id INTEGER NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (camera_id) REFERENCES cameras (id) ON DELETE CASCADE,
    FOREIGN KEY (tree_id) REFERENCES trees (tree_id) ON DELETE CASCADE,
    UNIQUE (camera_id, tree_id)
);

CREATE TABLE camera_sessions (
    id SERIAL PRIMARY KEY,
    camera_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    session_token TEXT UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    FOREIGN KEY (camera_id) REFERENCES cameras (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

-- Add camera relation to camera_captures
ALTER TABLE camera_captures
ADD COLUMN camera_id INTEGER REFERENCES cameras(id);

-- Create indexes for better query performance
CREATE INDEX idx_camera_assignments_tree ON camera_assignments (tree_id);
CREATE INDEX idx_camera_assignments_camera ON camera_assignments (camera_id);
CREATE INDEX idx_camera_sessions_camera ON camera_sessions (camera_id);
CREATE INDEX idx_camera_sessions_token ON camera_sessions (session_token);
CREATE INDEX idx_camera_sessions_status ON camera_sessions (status);
CREATE INDEX idx_captures_camera_time ON camera_captures (camera_id, capture_time DESC);

-- Create trigger function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for cameras table
CREATE TRIGGER update_cameras_updated_at
    BEFORE UPDATE ON cameras
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
