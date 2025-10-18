# 🐛 Debug Guide - Login và Routing

## Các lỗi đã sửa

### 1. ✅ Navbar.tsx - Wrong Hook
**Lỗi**: Dùng `useDispatch()` thay vì `useAppDispatch()`
**Đã sửa**: Dòng 10 từ `useDispatch()` → `useAppDispatch()`

### 2. ✅ LoginPage.tsx - Missing Redirect Logic
**Thêm**: Check `isAuthenticated` để auto-redirect nếu đã login

---

## Cách kiểm tra Login Flow

### Bước 1: Mở Browser DevTools (F12)

### Bước 2: Kiểm tra Console

Sau khi nhập username/password và nhấn Login, bạn nên thấy:

```
Login successful
Token: eyJ...
```

### Bước 3: Kiểm tra Redux State

1. Mở **Redux DevTools** extension
2. Sau khi login, check state:

```javascript
{
  auth: {
    token: "eyJ...",
    user: { username: "admin", email: "..." },
    isAuthenticated: true  // ← Phải là true
  }
}
```

### Bước 4: Kiểm tra localStorage

Trong Console, gõ:
```javascript
localStorage.getItem('token')
```

Phải trả về token string, không phải `null`

### Bước 5: Kiểm tra Routing

Sau khi login thành công:
- URL phải chuyển từ `/login` → `/dashboard`
- Nếu không chuyển, check console có error không

---

## Các vấn đề thường gặp

### ❌ Lỗi: "Cannot read property 'username' of null"

**Nguyên nhân**: User data chưa load xong
**Giải pháp**: Đã handle trong code với optional chaining `user?.username`

### ❌ Lỗi: "Unauthorized" hoặc 401

**Nguyên nhân**: 
1. API server không chạy
2. Sai username/password
3. Token expired

**Giải pháp**:
```bash
# Kiểm tra API server
curl http://localhost:8000/api/auth/token

# Nếu không response, start API server
```

### ❌ Redirect không hoạt động

**Check list**:
1. ✅ `isAuthenticated` trong Redux state là `true`
2. ✅ Token được lưu trong localStorage
3. ✅ Console không có error
4. ✅ React Router đang hoạt động

**Debug**:
Thêm console.log vào LoginPage.tsx:

```typescript
useEffect(() => {
  console.log('isAuthenticated:', isAuthenticated);
  if (isAuthenticated) {
    console.log('Redirecting to dashboard...');
    navigate('/dashboard', { replace: true });
  }
}, [isAuthenticated, navigate]);
```

### ❌ Dashboard hiển thị nhưng không có data

**Nguyên nhân**: API call failed
**Check**: Network tab trong DevTools

---

## Test Flow hoàn chỉnh

### 1. Clear tất cả data
```javascript
// Trong Console
localStorage.clear();
location.reload();
```

### 2. Login
- Username: `admin`
- Password: `password`

### 3. Verify
- URL: `http://localhost:5173/dashboard`
- Redux state: `isAuthenticated: true`
- localStorage: có token
- UI: Hiển thị navbar với "Welcome, admin"

---

## Common API Errors

### API không kết nối

**Error**: `Network Error` hoặc `Failed to fetch`

**Check**:
```bash
# Test API server
curl http://localhost:8000/api/auth/token \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

**Expected response**:
```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer"
}
```

### CORS Error

**Error**: `Access to fetch at 'http://localhost:8000' from origin 'http://localhost:5173' has been blocked by CORS policy`

**Fix**: Backend cần enable CORS cho `http://localhost:5173`

---

## Debug với Redux DevTools

### Install Extension
- Chrome: Redux DevTools
- Firefox: Redux DevTools

### Xem Actions
Sau khi login, bạn sẽ thấy các actions:
1. `api/login/pending`
2. `api/login/fulfilled`
3. `api/getCurrentUser/pending`
4. `api/getCurrentUser/fulfilled`
5. `auth/setCredentials`

### Xem State Changes
Mỗi action sẽ update state:
- `auth.token`: null → "eyJ..."
- `auth.isAuthenticated`: false → true
- `auth.user`: null → { username: "admin", ... }

---

## Network Debugging

### Xem API Calls trong Network Tab

1. Filter: XHR
2. Check các requests:
   - POST `/auth/token` - Status 200
   - GET `/users/me` - Status 200

### Request Headers
```
Authorization: Bearer eyJ...
Content-Type: application/json
```

### Response
```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer"
}
```

---

## Quick Fix Commands

### Rebuild project
```bash
rm -rf node_modules
npm install
npm run dev
```

### Clear browser cache
```javascript
// Console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Check TypeScript errors
```bash
npx tsc --noEmit
```

---

## Still Not Working?

### Check Console for Errors

Mở Console (F12) và tìm:
- ❌ Red errors
- ⚠️ Yellow warnings
- 🔵 Network errors

### Check File Changes

Đảm bảo các file đã được save:
- `src/components/layout/Navbar.tsx`
- `src/pages/LoginPage.tsx`

### Restart Dev Server

```bash
# Ctrl+C để stop
npm run dev
```

---

## Expected Login Flow

```
1. User nhập credentials
   ↓
2. Click "Login" button
   ↓
3. Call API POST /auth/token
   ↓
4. Nhận access_token
   ↓
5. Set token vào state
   ↓
6. Call API GET /users/me (với token)
   ↓
7. Nhận user data
   ↓
8. dispatch setCredentials({ token, user })
   ↓
9. isAuthenticated = true
   ↓
10. navigate('/dashboard')
    ↓
11. ProtectedRoute check isAuthenticated
    ↓
12. Render DashboardPage
```

---

## Contact & Support

Nếu vẫn gặp vấn đề:
1. Check console errors
2. Check Redux state
3. Check Network tab
4. Verify API server đang chạy
5. Check file có lỗi syntax không
