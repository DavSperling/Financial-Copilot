import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from fastapi.testclient import TestClient
from app.main import app
from app.services.auth_service import AuthService

client = TestClient(app)

# Mock Supabase
@pytest.fixture
def mock_supabase():
    with patch("app.services.auth_service.supabase_admin") as mock_admin, \
         patch("app.services.auth_service.supabase_anon") as mock_anon:
        yield mock_admin, mock_anon

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

@patch("app.services.auth_service.supabase_admin")
@patch("app.services.auth_service.supabase_anon")
def test_forgot_password_success(mock_anon, mock_admin):
    # Mock rate limit check returns 0 records
    mock_admin.table.return_value.select.return_value.eq.return_value.eq.return_value.gte.return_value.execute.return_value.count = 0
    mock_admin.table.return_value.select.return_value.eq.return_value.eq.return_value.gte.return_value.execute.return_value.data = []

    response = client.post("/api/v1/auth/forgot-password", json={"email": "test@example.com"})
    
    assert response.status_code == 200
    assert "If the email exists" in response.json()["message"]
    mock_anon.auth.reset_password_for_email.assert_called_once()
    mock_admin.table.return_value.insert.assert_called_once()

@patch("app.services.auth_service.supabase_admin")
@patch("app.services.auth_service.supabase_anon")
def test_forgot_password_rate_limit(mock_anon, mock_admin):
    # Mock rate limit check returns 3 records
    mock_admin.table.return_value.select.return_value.eq.return_value.eq.return_value.gte.return_value.execute.return_value.count = 3
    # Also support data property if code checks that
    mock_admin.table.return_value.select.return_value.eq.return_value.eq.return_value.gte.return_value.execute.return_value.data = [1, 2, 3]

    response = client.post("/api/v1/auth/forgot-password", json={"email": "spammer@example.com"})
    
    assert response.status_code == 429
    assert "Rate limit exceeded" in response.json()["detail"]
    mock_anon.auth.reset_password_for_email.assert_not_called()

def test_reset_password_weak_password():
    response = client.post("/api/v1/auth/reset-password", json={
        "token": "valid_token",
        "new_password": "weakpassword"  # > 8 chars but no digits/caps
    })
    assert response.status_code == 400
    assert "Password must contain at least one" in response.json()["detail"]

@patch("app.services.auth_service.supabase_admin")
@patch("app.services.auth_service.supabase_anon")
def test_reset_password_success(mock_anon, mock_admin):
    # Mock get_user success
    mock_user = MagicMock()
    mock_user.user.id = "user_123"
    mock_anon.auth.get_user.return_value = mock_user

    response = client.post("/api/v1/auth/reset-password", json={
        "token": "valid_active_token",
        "new_password": "StrongPassword1!"
    })

    assert response.status_code == 200
    assert "Password updated successfully" in response.json()["message"]
    mock_admin.auth.admin.update_user_by_id.assert_called_with("user_123", {"password": "StrongPassword1!"})  
