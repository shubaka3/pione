# Kiến trúc ứng dụng MDDC Plant Management

## Tổng quan

Ứng dụng được xây dựng theo kiến trúc **Redux + TypeScript** với các tính năng:

- **State Management**: Redux Toolkit
- **API Layer**: RTK Query (middleware tự động)
- **Type Safety**: TypeScript cho toàn bộ codebase
- **UI Framework**: React với functional components và hooks
- **Styling**: Tailwind CSS

## Luồng dữ liệu (Data Flow)

```
User Action → Component → Redux Action/RTK Query → API → Redux State → Component Re-render
```

### 1. Authentication Flow

```
LoginPage 
  → useLoginMutation() 
  → API call to /auth/token
  → Save token to Redux state & localStorage
  → useGetCurrentUserQuery() 
  → Save user to Redux state
  → Navigate to Dashboard
```

### 2. Data Fetching Flow

```
Component mount
  → RTK Query hook (e.g., useGetTreesQuery())
  → Check cache
  → If cache miss: API call
  → Update Redux cache
  → Component re-render with data
```

### 3. Data Mutation Flow

```
User action (e.g., Create Tree)
  → useCreateTreeMutation()
  → API call to POST /trees
  → Success response
  → Invalidate 'Trees' tag
  → RTK Query auto-refetch affected queries
  → UI updates automatically
```

## Cấu trúc State

### Auth State (`authSlice.ts`)

```typescript
{
  token: string | null,
  user: User | null,
  isAuthenticated: boolean
}
```

### Chat State (`chatSlice.ts`)

```typescript
{
  messages: ChatMessage[]
}
```

### API Cache State (RTK Query)

RTK Query tự động quản lý cache với tags:
- `Trees`: Cache cho danh sách và chi tiết cây
- `User`: Cache cho thông tin user
- `SensorReadings`: Cache cho dữ liệu cảm biến

## Middleware Architecture

### RTK Query Middleware

RTK Query là một middleware mạnh mẽ cung cấp:

1. **Automatic Caching**
   - Cache API responses tự động
   - Deduplicate requests (không gọi lại nếu đang pending)
   - Time-based invalidation

2. **Tag-based Invalidation**
   ```typescript
   // Khi tạo tree mới
   createTree: builder.mutation({
     invalidatesTags: ['Trees'], // Tự động refetch tất cả queries có tag 'Trees'
   })
   ```

3. **Optimistic Updates** (có thể mở rộng)
   - Update UI ngay lập tức trước khi API response
   - Rollback nếu API call fail

4. **Error Handling**
   - Centralized error handling
   - Retry logic
   - Error state management

### Custom Middleware (Có thể mở rộng)

Bạn có thể thêm custom middleware vào store:

```typescript
// Example: Logger middleware
const loggerMiddleware = (store) => (next) => (action) => {
  console.log('Action:', action);
  const result = next(action);
  console.log('New State:', store.getState());
  return result;
};

// Add to store
middleware: (getDefaultMiddleware) =>
  getDefaultMiddleware()
    .concat(apiSlice.middleware)
    .concat(loggerMiddleware)
```

## API Layer

### Base Configuration

```typescript
// apiSlice.ts
baseQuery: fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
})
```

### Endpoints Pattern

Mỗi endpoint được định nghĩa với:

```typescript
getTree: builder.query<Tree, string>({
  query: (id) => `/trees/${id}`,
  providesTags: (result, error, id) => [{ type: 'Trees', id }],
})
```

- **Type Safety**: `<ReturnType, ArgumentType>`
- **Cache Tags**: Định nghĩa dependencies
- **Query Function**: Cấu hình API call

## Component Patterns

### 1. Container/Presentational Pattern

**Container Components** (Smart):
- Kết nối với Redux
- Xử lý business logic
- Example: `DashboardPage`, `DetailPage`

**Presentational Components** (Dumb):
- Chỉ nhận props
- Không biết về Redux
- Example: `Button`, `Card`, `Input`

### 2. Custom Hooks Pattern

```typescript
// Type-safe Redux hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### 3. Protected Route Pattern

```typescript
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>
```

## Type System

### Type Hierarchy

```
types/index.ts (Central type definitions)
  ↓
Feature slices (Use types)
  ↓
Components (Type-safe props)
```

### Generic Types

```typescript
// API response wrapper (có thể mở rộng)
interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}
```

## Best Practices

### 1. State Management

✅ **DO**:
- Sử dụng RTK Query cho API calls
- Normalized state structure
- Immutable updates (Redux Toolkit tự động)

❌ **DON'T**:
- Không duplicate data giữa Redux và component state
- Không mutate state trực tiếp
- Không store derived data

### 2. API Calls

✅ **DO**:
- Sử dụng RTK Query hooks
- Định nghĩa proper cache tags
- Handle loading và error states

❌ **DON'T**:
- Không gọi API trực tiếp trong component
- Không quên handle error cases
- Không cache sensitive data

### 3. TypeScript

✅ **DO**:
- Define types cho tất cả props
- Use strict mode
- Leverage type inference

❌ **DON'T**:
- Không dùng `any`
- Không skip type checking với `@ts-ignore`
- Không define duplicate types

## Mở rộng ứng dụng

### 1. Thêm API Endpoint mới

```typescript
// 1. Thêm type trong types/index.ts
export interface NewEntity {
  id: string;
  name: string;
}

// 2. Thêm endpoint trong apiSlice.ts
getNewEntity: builder.query<NewEntity, string>({
  query: (id) => `/new-entity/${id}`,
  providesTags: ['NewEntity'],
})

// 3. Sử dụng trong component
const { data, isLoading } = useGetNewEntityQuery(id);
```

### 2. Thêm Middleware mới

```typescript
// middleware/analytics.ts
export const analyticsMiddleware = (store) => (next) => (action) => {
  // Track action
  analytics.track(action.type);
  return next(action);
};

// Add to store.ts
import { analyticsMiddleware } from './middleware/analytics';

middleware: (getDefaultMiddleware) =>
  getDefaultMiddleware()
    .concat(apiSlice.middleware)
    .concat(analyticsMiddleware)
```

### 3. Thêm Feature Slice mới

```typescript
// features/settings/settingsSlice.ts
const settingsSlice = createSlice({
  name: 'settings',
  initialState: { theme: 'dark' },
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
  },
});

// Add to store
import settingsReducer from '@/features/settings/settingsSlice';

reducer: {
  // ...existing reducers
  settings: settingsReducer,
}
```

## Performance Optimization

### 1. RTK Query Cache Configuration

```typescript
// Cấu hình cache timing
getTrees: builder.query<Tree[], void>({
  query: () => '/trees',
  providesTags: ['Trees'],
  keepUnusedDataFor: 60, // Keep cache for 60 seconds
})
```

### 2. Selective Re-rendering

```typescript
// Chỉ subscribe phần state cần thiết
const username = useAppSelector((state) => state.auth.user?.username);
```

### 3. Code Splitting

```typescript
// Lazy load pages
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
```

## Testing Strategy (Có thể implement)

### 1. Unit Tests
- Test Redux slices
- Test utility functions
- Test isolated components

### 2. Integration Tests
- Test RTK Query endpoints
- Test Redux store integration
- Test component + Redux interaction

### 3. E2E Tests
- Test user flows
- Test authentication
- Test CRUD operations
