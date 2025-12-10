from pydantic import BaseModel, EmailStr, Field

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str = Field(..., description="The access_token from the recovery URL")
    new_password: str = Field(..., min_length=8)
