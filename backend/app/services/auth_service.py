import logging
import re
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from supabase import create_client, Client
from app.config import get_settings
from app.schemas import ForgotPasswordRequest, ResetPasswordRequest

settings = get_settings()
logger = logging.getLogger(__name__)

# Admin client for checking rate limits (via direct DB access or rpc)
# We use service_role key to bypass RLS for the rate_limit_tracking check if needed, 
# or if RLS allows anon insert but not read. 
# For safety, we'll use service_role for the rate limit check/insert.
supabase_admin: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
supabase_anon: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

RATE_LIMIT_HOURLY = 3

class AuthService:
    
    @staticmethod
    def _validate_password_strength(password: str):
        """
        Validates that password has at least:
        - 8 characters
        - 1 uppercase
        - 1 lowercase
        - 1 digit
        """
        if len(password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", password):
            raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", password):
            raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter")
        if not re.search(r"[0-9]", password):
            raise HTTPException(status_code=400, detail="Password must contain at least one digit")

    @staticmethod
    async def forgot_password(request: ForgotPasswordRequest):
        email = request.email.lower()
        
        # 1. Check Rate Limit
        one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
        
        try:
            # Query rate_limit_tracking table directly
            response = supabase_admin.table("rate_limit_tracking") \
                .select("id", count="exact") \
                .eq("email", email) \
                .eq("request_type", "password_reset") \
                .gte("created_at", one_hour_ago.isoformat()) \
                .execute()
            
            count = response.count if response.count is not None else len(response.data)
            
            if count >= RATE_LIMIT_HOURLY:
                logger.warning(f"Rate limit exceeded for {email}")
                # Return generic success to avoid enumeration, or specific error if requested.
                # User requested "3 requêtes max par email/heure" and "Retourne un message générique".
                # However, usually rate limits are explicit 429s.
                # But to strict "not reveal existence", maybe we fake it?  
                # User request: "Retourne un message générique (ne révèle pas si l'email existe)".
                # Rate limit is strictly per email. If we return 429, we reveal the email has been spammed.
                # But checking rate limit *before* checking if user exists doesn't reveal user existence, 
                # it reveals that *someone* (could be attacker) is spamming that email.
                # Let's return 429 for safety/feedback, but in Hebrew.
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded. Please try again later."
                )

            # 2. Record Attempt
            supabase_admin.table("rate_limit_tracking").insert({
                "email": email,
                "request_type": "password_reset"
            }).execute()
            
            # 3. Call Supabase Auth
            # We use redirectTo to point to the frontend reset page
            redirect_to = f"{settings.FRONTEND_URL}/reset-password"
            
            # reset_password_for_email returns {} on success or throws error
            supabase_anon.auth.reset_password_for_email(email, {
                "redirect_to": redirect_to
            })
            
            logger.info(f"Password reset email requested for {email}")
            return {"message": "If the email exists, a reset link has been sent."}

        except HTTPException as he:
            raise he
        except Exception as e:
            logger.error(f"Error in forgot_password: {str(e)}")
            # Fallback generic error
            raise HTTPException(status_code=500, detail="An error occurred while processing your request")

    @staticmethod
    async def reset_password(request: ResetPasswordRequest):
        # Validate password strength first
        AuthService._validate_password_strength(request.new_password)
        
        try:
            # Verify the token and get the user
            logger.info(f"Verifying token: {request.token[:10]}...")
            user_response = supabase_anon.auth.get_user(request.token)
            
            # Debug log
            logger.info(f"User response: {user_response}")
            
            if not user_response or not user_response.user:
                 raise HTTPException(status_code=401, detail="Link expired or invalid or user not found")

            user_id = user_response.user.id
            
            # Now we can update using service_role because we verified the token is valid and got the user_id.
            supabase_admin.auth.admin.update_user_by_id(user_id, {"password": request.new_password})
            
            # Invalidate sessions (Logout)
            # Admin sign out is the surest way
            supabase_admin.auth.admin.sign_out(user_id)
            
            logger.info(f"Password reset successful for user {user_id}")
            return {"message": "Password updated successfully. You can now login."}

        except HTTPException as he:
            raise he
        except Exception as e:
            logger.error(f"Error in reset_password: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Error resetting password: {str(e)}")
