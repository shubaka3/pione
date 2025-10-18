# API Documentation

## Base URL

```
http://localhost:8000/api
```

## Authentication

Tất cả endpoints (trừ `/auth/token`) yêu cầu JWT token trong header:

```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### POST /auth/token

Đăng nhập và nhận JWT token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "access_token": "string",
  "token_type": "Bearer"
}
```

**Status Codes:**
- `200`: Success
- `401`: Invalid credentials

---

### Users

#### GET /users/me

Lấy thông tin user hiện tại.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user_id": "string",
  "username": "string",
  "email": "string",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized

---

### Trees

#### GET /trees

Lấy danh sách tất cả cây.

**Response:**
```json
[
  {
    "tree_id": "string",
    "name": "string",
    "species": "string",
    "description": "string",
    "location": "string",
    "planting_date": "2024-01-01",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized

---

#### GET /trees/{tree_id}

Lấy chi tiết một cây.

**Parameters:**
- `tree_id` (path): ID của cây

**Response:**
```json
{
  "tree_id": "string",
  "name": "string",
  "species": "string",
  "description": "string",
  "location": "string",
  "planting_date": "2024-01-01",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized
- `404`: Tree not found

---

#### POST /trees

Tạo cây mới.

**Request Body:**
```json
{
  "name": "string (required)",
  "species": "string (required)",
  "description": "string (optional)",
  "location": "string (optional)",
  "planting_date": "2024-01-01 (optional)"
}
```

**Response:**
```json
{
  "tree_id": "string",
  "name": "string",
  "species": "string",
  "description": "string",
  "location": "string",
  "planting_date": "2024-01-01",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Status Codes:**
- `201`: Created
- `400`: Bad request
- `401`: Unauthorized

---

#### PUT /trees/{tree_id}

Cập nhật thông tin cây.

**Parameters:**
- `tree_id` (path): ID của cây

**Request Body:**
```json
{
  "name": "string (optional)",
  "species": "string (optional)",
  "description": "string (optional)",
  "location": "string (optional)",
  "planting_date": "2024-01-01 (optional)",
  "is_active": true (optional)
}
```

**Response:**
```json
{
  "tree_id": "string",
  "name": "string",
  "species": "string",
  "description": "string",
  "location": "string",
  "planting_date": "2024-01-01",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Status Codes:**
- `200`: Success
- `400`: Bad request
- `401`: Unauthorized
- `404`: Tree not found

---

#### DELETE /trees/{tree_id}

Xóa cây.

**Parameters:**
- `tree_id` (path): ID của cây

**Response:**
```
No content
```

**Status Codes:**
- `204`: No content (success)
- `401`: Unauthorized
- `404`: Tree not found

---

### Sensor Readings

#### GET /trees/{tree_id}/readings

Lấy danh sách sensor readings của một cây.

**Parameters:**
- `tree_id` (path): ID của cây

**Response:**
```json
[
  {
    "reading_id": "string",
    "tree_id": "string",
    "temperature_c": 25.5,
    "humidity_pct": 65.0,
    "soil_moisture_pct": 45.0,
    "light_lux": 15000,
    "timestamp": "2024-01-01T00:00:00Z"
  }
]
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized
- `404`: Tree not found

---

#### POST /trees/{tree_id}/readings

Tạo sensor reading mới.

**Parameters:**
- `tree_id` (path): ID của cây

**Request Body:**
```json
{
  "temperature_c": 25.5 (optional),
  "humidity_pct": 65.0 (optional),
  "soil_moisture_pct": 45.0 (optional),
  "light_lux": 15000 (optional)
}
```

**Response:**
```json
{
  "reading_id": "string",
  "tree_id": "string",
  "temperature_c": 25.5,
  "humidity_pct": 65.0,
  "soil_moisture_pct": 45.0,
  "light_lux": 15000,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Status Codes:**
- `201`: Created
- `400`: Bad request
- `401`: Unauthorized
- `404`: Tree not found

---

## Error Responses

Tất cả errors trả về format sau:

```json
{
  "detail": "Error message"
}
```

### Common Status Codes

- `200`: Success
- `201`: Created
- `204`: No content
- `400`: Bad request
- `401`: Unauthorized
- `404`: Not found
- `422`: Validation error
- `500`: Internal server error

---

## Rate Limiting

Hiện tại không có rate limiting. Có thể implement trong tương lai.

---

## Versioning

API version hiện tại: `v1`

Tất cả endpoints có prefix `/api`

---

## CORS

API hỗ trợ CORS cho development. Production cần cấu hình cụ thể.

---

## Pagination

Hiện tại chưa có pagination. Tất cả endpoints trả về toàn bộ data.

Trong tương lai có thể thêm query parameters:
- `page`: Page number
- `limit`: Items per page

---

## Filtering & Sorting

Chưa được implement. Có thể thêm trong tương lai:

```
GET /trees?species=Apple&sort=created_at:desc
```
