# Hướng dẫn sử dụng MDDC Plant Management System

## Bắt đầu

### 1. Cài đặt Dependencies

```bash
npm install
```

### 2. Cấu hình Environment Variables (Tùy chọn)

Tạo file `.env` từ `.env.example`:

```bash
copy .env.example .env
```

Chỉnh sửa file `.env` nếu API URL khác:

```env
VITE_API_BASE_URL=http://your-api-url/api
```

### 3. Chạy Development Server

```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:5173`

### 4. Build Production

```bash
npm run build
```

Build output sẽ ở trong thư mục `dist/`

### 5. Preview Production Build

```bash
npm run preview
```

---

## Cấu trúc Project

```
src/
├── app/                    # Redux store configuration
│   ├── store.ts           # Store setup với middleware
│   └── hooks.ts           # Typed Redux hooks
│
├── features/              # Feature modules
│   ├── api/              # RTK Query API definitions
│   │   └── apiSlice.ts   # API endpoints với middleware
│   ├── auth/             # Authentication
│   │   └── authSlice.ts  # Auth state management
│   └── chat/             # Chat functionality
│       └── chatSlice.ts  # Chat state management
│
├── components/           # React components
│   ├── common/          # Reusable components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   └── Loader.tsx
│   ├── layout/          # Layout components
│   │   ├── Navbar.tsx
│   │   └── ProtectedRoute.tsx
│   └── features/        # Feature-specific components
│       └── ChatPanel.tsx
│
├── pages/               # Page components
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   └── DetailPage.tsx
│
├── types/               # TypeScript type definitions
│   └── index.ts
│
├── App.tsx             # Main app với routing
├── main.tsx            # App entry point
└── index.css           # Global styles
```

---

## Tính năng chính

### 1. Authentication

- Đăng nhập với username/password
- JWT token được lưu trong localStorage
- Auto-redirect khi chưa đăng nhập
- Protected routes

**Default credentials:**
- Username: `admin`
- Password: `password`

### 2. Dashboard

- Xem danh sách tất cả cây
- Tạo cây mới
- Xóa cây
- Click vào card để xem chi tiết

### 3. Detail View

- Xem ảnh cây
- Xem thông tin chi tiết
- Xem dữ liệu sensor readings
- Cập nhật trạng thái cây
- Tạo sensor reading mới
- Chat với AI (mock)

### 4. AI Chat

- Chat về thông tin cây
- Hỏi về sensor readings
- Hỏi về trạng thái cây

**Note:** Hiện tại AI chat là mock, sẽ được tích hợp thật trong tương lai.

---

## Redux State Management

### Auth State

```typescript
{
  token: string | null,        // JWT token
  user: User | null,           // User info
  isAuthenticated: boolean     // Auth status
}
```

**Actions:**
- `setCredentials`: Lưu token và user
- `setUser`: Cập nhật user info
- `logout`: Clear auth state

### Chat State

```typescript
{
  messages: ChatMessage[]      // Array of chat messages
}
```

**Actions:**
- `addMessage`: Thêm message mới
- `clearMessages`: Clear tất cả messages

### API Cache (RTK Query)

RTK Query tự động quản lý cache với tags:
- **Trees**: Cache cho trees data
- **User**: Cache cho user data
- **SensorReadings**: Cache cho sensor data

---

## API Middleware với RTK Query

### Automatic Features

1. **Caching**: API responses được cache tự động
2. **Deduplication**: Không gọi lại API nếu request đang pending
3. **Invalidation**: Tự động refetch khi data thay đổi
4. **Loading States**: Tự động quản lý loading/error states

### Sử dụng RTK Query Hooks

#### Query (GET data)

```typescript
const { data, isLoading, error } = useGetTreesQuery();
```

#### Mutation (POST/PUT/DELETE)

```typescript
const [createTree, { isLoading }] = useCreateTreeMutation();

await createTree({
  name: 'New Tree',
  species: 'Apple'
}).unwrap();
```

### Cache Invalidation

Khi mutation thành công, cache tự động invalidate:

```typescript
// Khi createTree được gọi
createTree: builder.mutation({
  invalidatesTags: ['Trees'],  // ← Tự động refetch useGetTreesQuery()
})
```

---

## Styling với Tailwind CSS

### Custom Classes

Đã có các utility classes được define trong `index.css`:

- `.custom-scrollbar`: Custom scrollbar style
- `.animate-fadeIn`: Fade in animation
- `.animate-spin`: Spin animation

### Theme Colors

```css
--primary-color: #3b82f6;      /* Blue 500 */
--bg-color: #111827;           /* Gray 900 */
--card-color: #1f2937;         /* Gray 800 */
--border-color: #374151;       /* Gray 700 */
--text-primary: #f9fafb;       /* Gray 50 */
--text-secondary: #d1d5db;     /* Gray 300 */
--danger-color: #ef4444;       /* Red 500 */
--success-color: #22c55e;      /* Green 500 */
```

---

## TypeScript Best Practices

### 1. Type-safe Redux Hooks

Luôn sử dụng typed hooks:

```typescript
import { useAppDispatch, useAppSelector } from '@/app/hooks';

// ✅ Good
const user = useAppSelector((state) => state.auth.user);

// ❌ Bad
const user = useSelector((state: any) => state.auth.user);
```

### 2. Component Props

Luôn define types cho props:

```typescript
interface MyComponentProps {
  title: string;
  count?: number;
}

const MyComponent: React.FC<MyComponentProps> = ({ title, count = 0 }) => {
  // ...
}
```

### 3. API Types

Sử dụng types từ `@/types`:

```typescript
import type { Tree, CreateTreeRequest } from '@/types';
```

---

## Troubleshooting

### 1. API Connection Error

**Problem:** Cannot connect to API

**Solution:**
- Kiểm tra API server đang chạy tại `http://localhost:8000`
- Kiểm tra CORS settings trên backend
- Kiểm tra API_BASE_URL trong `src/features/api/apiSlice.ts`

### 2. Authentication Error

**Problem:** "Unauthorized" error

**Solution:**
- Clear localStorage và login lại
- Kiểm tra token còn valid không
- Kiểm tra API endpoint `/users/me`

### 3. Build Error

**Problem:** TypeScript compilation errors

**Solution:**
```bash
# Clear node_modules và reinstall
rm -rf node_modules
npm install

# Check TypeScript config
npx tsc --noEmit
```

### 4. Hot Reload không hoạt động

**Solution:**
```bash
# Restart dev server
npm run dev
```

---

## Development Workflow

### 1. Tạo Feature mới

```bash
# 1. Tạo types
# src/types/index.ts - thêm interfaces

# 2. Tạo API endpoint
# src/features/api/apiSlice.ts - thêm endpoint

# 3. Tạo Redux slice (nếu cần)
# src/features/newFeature/newFeatureSlice.ts

# 4. Tạo components
# src/components/features/NewFeature.tsx

# 5. Tạo page (nếu cần)
# src/pages/NewFeaturePage.tsx

# 6. Thêm route
# src/App.tsx - thêm Route
```

### 2. Testing Flow (Khuyến nghị)

```bash
# 1. Test component rendering
# 2. Test Redux actions
# 3. Test API integration
# 4. Test user flows
```

### 3. Code Quality

```bash
# Lint code
npm run lint

# Format code (nếu có prettier)
npm run format
```

---

## Deploy Production

### 1. Build

```bash
npm run build
```

### 2. Test Production Build

```bash
npm run preview
```

### 3. Deploy to Server

Upload thư mục `dist/` lên static hosting:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

### 4. Environment Variables

Nhớ set environment variables trên hosting platform:

```
VITE_API_BASE_URL=https://your-production-api.com/api
```

---

## Mở rộng ứng dụng

### 1. Thêm API Endpoint mới

Xem file `ARCHITECTURE.md` phần "Mở rộng ứng dụng"

### 2. Thêm Middleware mới

Xem file `ARCHITECTURE.md` phần "Middleware Architecture"

### 3. Tích hợp AI thật

```typescript
// src/features/ai/aiSlice.ts
export const aiSlice = createApi({
  // Configure AI API endpoint
});
```

---

## Resources

- **React**: https://react.dev
- **Redux Toolkit**: https://redux-toolkit.js.org
- **RTK Query**: https://redux-toolkit.js.org/rtk-query/overview
- **TypeScript**: https://www.typescriptlang.org
- **Tailwind CSS**: https://tailwindcss.com
- **Vite**: https://vitejs.dev

---

## Support

Nếu gặp vấn đề, kiểm tra:
1. `README.md` - Overview
2. `ARCHITECTURE.md` - Kiến trúc chi tiết
3. `API.md` - API documentation
4. Console logs trong browser DevTools
