DROP TABLE IF EXISTS fruit_details CASCADE;
DROP TABLE IF EXISTS camera_captures CASCADE;
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
    capture_id BIGSERIAL PRIMARY KEY,
    tree_id INTEGER NOT NULL,
    capture_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    image_url TEXT NOT NULL,
    total_fruit_count INTEGER DEFAULT 0,
    FOREIGN KEY (tree_id) REFERENCES trees (tree_id) ON DELETE CASCADE
);

CREATE INDEX idx_captures_tree_time ON camera_captures (tree_id, capture_time DESC);

CREATE TABLE fruit_details (
    detail_id BIGSERIAL PRIMARY KEY,
    capture_id BIGINT NOT NULL,
    fruit_index INTEGER NOT NULL,
    size_cm NUMERIC(5, 2),
    color_code VARCHAR(50),
    health_status VARCHAR(50),
    bounding_box_json JSONB,
    FOREIGN KEY (capture_id) REFERENCES camera_captures (capture_id) ON DELETE CASCADE
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
