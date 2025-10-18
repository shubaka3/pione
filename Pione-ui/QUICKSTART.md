# 🚀 Quick Start Guide

## Bắt đầu trong 3 bước

### 1️⃣ Cài đặt Dependencies

```bash
cd d:\src\Pione-ui
npm install
```

### 2️⃣ Chạy Development Server

```bash
npm run dev
```

Mở trình duyệt tại: **http://localhost:5173**

### 3️⃣ Đăng nhập

- **Username**: `admin`
- **Password**: `password`

---

## 📋 Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Chạy development server |
| `npm run build` | Build production |
| `npm run preview` | Preview production build |
| `npm run lint` | Lint code |

---

## 📁 Project Structure

```
src/
├── app/           # Redux store
├── features/      # Redux slices (auth, chat, api)
├── components/    # React components
├── pages/         # Page components
└── types/         # TypeScript types
```

---

## 🔑 Key Features

✅ **Redux Toolkit** - State management  
✅ **RTK Query** - API middleware với auto-caching  
✅ **TypeScript** - Type safety  
✅ **Tailwind CSS** - Styling  
✅ **React Router** - Routing  

---

## 📚 Documentation

- **README.md** - Overview
- **GUIDE.md** - Hướng dẫn chi tiết
- **ARCHITECTURE.md** - Kiến trúc
- **API.md** - API endpoints
- **SUMMARY.md** - Tổng kết migration

---

## 🆘 Troubleshooting

### API không kết nối được?

1. Kiểm tra API server đang chạy tại `http://localhost:8000`
2. Kiểm tra API URL trong `src/features/api/apiSlice.ts`

### Build error?

```bash
rm -rf node_modules
npm install
```

### TypeScript error?

```bash
npx tsc --noEmit
```

---

## 🎯 Next Steps

1. Explore code trong `src/`
2. Đọc `ARCHITECTURE.md` để hiểu structure
3. Customize components trong `src/components/`
4. Thêm features mới theo hướng dẫn trong `GUIDE.md`

---

**Happy Coding! 🎉**
