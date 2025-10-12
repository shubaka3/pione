from fastapi import FastAPI, Depends, HTTPException, status
# Loại bỏ OAuth2PasswordRequestForm vì không dùng nữa
from sqlalchemy.orm import Session
from datetime import timedelta

from app import models, schemas, services, auth
from app.database import engine, get_db
from app.routers import users, trees

# Tạo các bảng trong database nếu chúng chưa tồn tại
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Garden IoT API",
    description="API for monitoring and controlling smart garden systems.",
    version="1.0.0",
)

# --- Authentication Endpoint (ĐÃ SỬA ĐỔI) ---
@app.post("/api/auth/token", response_model=schemas.Token, tags=["authentication"])
def login_for_access_token(
    # Thay thế form_data bằng user_credentials với kiểu là UserLogin
    user_credentials: schemas.UserLogin, 
    db: Session = Depends(get_db)
):
    # Lấy username từ body JSON thay vì form
    user = services.get_user_by_username(db, username=user_credentials.username)
    
    # Kiểm tra user và mật khẩu (lấy từ body JSON)
    if not user or not auth.verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


# --- Include Routers ---
app.include_router(users.router)
app.include_router(trees.router)


@app.get("/api/health", tags=["health"])
def health_check():
    return {"status": "ok"}