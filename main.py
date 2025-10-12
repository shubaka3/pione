from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app import models, schemas, services, auth
from app.database import engine, get_db
from app.routers import users, trees

# Tạo các bảng trong database nếu chúng chưa tồn tại
# Trong môi trường production, bạn có thể muốn dùng Alembic để quản lý migrations
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# --- Authentication Endpoint ---
@app.post("/api/auth/token", response_model=schemas.Token, tags=["authentication"])
def login_for_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = services.get_user_by_username(db, username=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.password_hash):
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