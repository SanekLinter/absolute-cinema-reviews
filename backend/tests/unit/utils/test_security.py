import pytest
from datetime import datetime, timedelta
from unittest.mock import patch
from app.utils.security import (
    hash_password, verify_password, create_access_token, verify_token
)
from app.core.config import Settings


class TestSecurityUtils:
    def test_create_and_verify_token(self):
        mock_settings = Settings(
            DATABASE_URL="sqlite:///test.db",
            SECRET_KEY="test_secret_key",
            ALGORITHM="HS256",
            ACCESS_TOKEN_EXPIRE_MINUTES=30
        )
        
        with patch('app.utils.security.settings', mock_settings):
            data = {"sub": "123"}
            
            token = create_access_token(data)
            payload = verify_token(token)
            
            assert payload is not None
            assert payload["sub"] == "123"
            assert "exp" in payload
    
    def test_verify_invalid_token(self):

        result = verify_token("invalid_token")
        
        assert result is None
