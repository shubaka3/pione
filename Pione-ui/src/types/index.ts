// User Types
export interface User {
  user_id: string;
  username: string;
  email: string;
  created_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

// Tree Types
export interface Tree {
  tree_id: string;
  name: string;
  species: string;
  description?: string;
  location?: string;
  planting_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CreateTreeRequest {
  name: string;
  species: string;
  location?: string | null;
  planting_date?: string | null;
  description?: string;
}

export interface UpdateTreeRequest {
  name?: string;
  species?: string;
  location?: string;
  planting_date?: string;
  description?: string;
  is_active?: boolean;
}

// Sensor Reading Types
export interface SensorReading {
  reading_id: string;
  tree_id: string;
  temperature_c?: number;
  humidity_pct?: number;
  soil_moisture_pct?: number;
  light_lux?: number;
  timestamp: string;
}

export interface CreateSensorReadingRequest {
  temperature_c?: number;
  humidity_pct?: number;
  soil_moisture_pct?: number;
  light_lux?: number;
}

// Chat Types
export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

// API Error Types
// Camera Types
export interface Camera {
  camera_id: number;
  name: string;
  url: string;
  status: boolean;
  fps: number;
}

export interface CreateCameraRequest {
  name: string;
  url: string;
  status?: boolean;
  fps?: number;
}

export interface ApiError {
  detail: string;
  status?: number;
}
