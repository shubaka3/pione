# MDDC Plant Management System - React TypeScript

Ứng dụng quản lý cây trồng với React, TypeScript, Redux Toolkit và RTK Query.

## Tính năng

- ✅ **Xác thực người dùng**: Login/Logout với JWT token
- ✅ **Quản lý cây**: Thêm, xóa, cập nhật thông tin cây
- ✅ **Dashboard**: Hiển thị danh sách cây với giao diện card
- ✅ **Chi tiết cây**: Xem thông tin chi tiết, sensor readings
- ✅ **AI Chat**: Chat với AI về thông tin cây (mock)
- ✅ **State Management**: Redux Toolkit với typed hooks
- ✅ **API Middleware**: RTK Query với caching và auto-refetch
- ✅ **Responsive**: Thiết kế responsive với Tailwind CSS

## Công nghệ sử dụng

- **React 18** - UI Framework
- **TypeScript** - Type safety
- **Redux Toolkit** - State management
- **RTK Query** - API middleware với caching
- **React Router v6** - Routing
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Lucide React** - Icons

## Cấu trúc thư mục

```
src/
├── app/                  # Redux store và hooks
│   ├── store.ts
│   └── hooks.ts
├── features/            # Feature slices
│   ├── api/            # RTK Query API slice
│   ├── auth/           # Auth slice
│   └── chat/           # Chat slice
├── components/         # React components
│   ├── common/         # Reusable components
│   ├── layout/         # Layout components
│   └── features/       # Feature-specific components
├── pages/              # Page components
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   └── DetailPage.tsx
├── types/              # TypeScript types
│   └── index.ts
├── App.tsx
├── main.tsx
└── index.css
```

## Cài đặt

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Build production
npm run build

# Preview production build
npm run preview
```

## API Configuration

API base URL được cấu hình trong `src/features/api/apiSlice.ts`:

```typescript
const API_BASE_URL = 'http://localhost:8000/api';
```

## Redux Store

Store được cấu hình với:
- **API Slice**: RTK Query middleware cho API calls
- **Auth Slice**: Quản lý authentication state
- **Chat Slice**: Quản lý chat messages

## RTK Query Endpoints

- `login` - Đăng nhập
- `getCurrentUser` - Lấy thông tin user
- `getTrees` - Lấy danh sách cây
- `getTree` - Lấy chi tiết cây
- `createTree` - Tạo cây mới
- `updateTree` - Cập nhật thông tin cây
- `deleteTree` - Xóa cây
- `getSensorReadings` - Lấy dữ liệu cảm biến
- `createSensorReading` - Tạo dữ liệu cảm biến mới

## Features chính

### 1. Authentication
- JWT token được lưu trong localStorage
- Protected routes với ProtectedRoute component
- Auto-redirect khi chưa đăng nhập

### 2. State Management
- Redux Toolkit với typed hooks (useAppDispatch, useAppSelector)
- RTK Query tự động cache và invalidate data
- Optimistic updates

### 3. API Middleware
- RTK Query xử lý API calls
- Tự động thêm Authorization header
- Error handling thống nhất
- Tag-based cache invalidation

### 4. UI/UX
- Dark theme với Tailwind CSS
- Responsive design
- Loading states
- Modal dialogs
- Smooth animations

## Scripts

- `npm run dev` - Chạy development server
- `npm run build` - Build production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code

## License

MIT
