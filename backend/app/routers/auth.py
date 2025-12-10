from fastapi import APIRouter
from app.schemas import ForgotPasswordRequest, ResetPasswordRequest
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/forgot-password", status_code=200)
async def forgot_password(request: ForgotPasswordRequest):
    return await AuthService.forgot_password(request)

@router.post("/reset-password", status_code=200)
async def reset_password(request: ResetPasswordRequest):
    return await AuthService.reset_password(request)
