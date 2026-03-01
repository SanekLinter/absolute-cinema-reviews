import pytest
import unittest
from unittest.mock import Mock, patch
from app.services.user_service import UserService
from app.exceptions import UserNotFoundError, UserAlreadyExistsError, AuthenticationError
from app.schemas.user import UserCreate, Token
from app.db.models import User, Role


class TestUserService:
    def setup_method(self):
        self.mock_db = Mock()
        self.service = UserService(self.mock_db)
    
    def test_get_user_by_id_success(self):

        mock_user = User(id=1, username="testuser", role=Role.USER)
        self.service.user_crud.get = Mock(return_value=mock_user)

        result = self.service.get_user_by_id(1)
        
        assert result.id == 1
        assert result.username == "testuser"
    
    def test_get_user_by_id_not_found(self):

        self.service.user_crud.get = Mock(return_value=None)
        
        with pytest.raises(UserNotFoundError):
            self.service.get_user_by_id(999)
    
    def test_register_user_success(self):
        
        user_data = UserCreate(username="newuser", password="password123")
        mock_user = User(id=1, username="newuser")
        
        self.service.user_crud.get_by_username = Mock(return_value=None)
        self.service.user_crud.create = Mock(return_value=mock_user)
        
        with patch('app.services.user_service.hash_password') as mock_hash:
            mock_hash.return_value = "hashed_password"
            with patch('app.services.user_service.create_access_token') as mock_token:
                mock_token.return_value = "test_token"
                
                result = self.service.register_user(user_data)
                
                assert isinstance(result, Token)
                assert result.access_token == "test_token"
                assert result.token_type == "bearer"
                
                self.service.user_crud.create.assert_called_once_with(
                    db=self.mock_db,
                    username="newuser",
                    password_hash="hashed_password",
                    role=Role.USER
                )
    
    def test_register_user_already_exists(self):

        user_data = UserCreate(username="existinguser", password="password123")
        mock_user = User(id=1, username="existinguser")
        self.service.user_crud.get_by_username = Mock(return_value=mock_user)
        
        with pytest.raises(UserAlreadyExistsError):
            self.service.register_user(user_data)
    
    def test_login_user_success(self):
        
        credentials = UserCreate(username="testuser", password="password123")
        mock_user = User(id=1, username="testuser", password_hash="hashed_password")
        self.service.user_crud.get_by_username = Mock(return_value=mock_user)
        with patch('app.services.user_service.verify_password') as mock_verify:
            mock_verify.return_value = True
            with patch('app.services.user_service.create_access_token') as mock_token:
                mock_token.return_value = "test_token"
                
                result = self.service.login_user(credentials)
                
                assert result.access_token == "test_token"
    
    def test_login_user_not_found(self):
        
        credentials = UserCreate(username="nonexistent", password="password123")
        self.service.user_crud.get_by_username = Mock(return_value=None)
        
        with pytest.raises(AuthenticationError):
            self.service.login_user(credentials)

    def test_login_user_invalid_credentials(self):
        
        credentials = UserCreate(username="testuser", password="wrongpassword")
        mock_user = User(id=1, username="testuser", password_hash="hashed_password")
        self.service.user_crud.get_by_username = Mock(return_value=mock_user)
        with patch('app.services.user_service.verify_password') as mock_verify:
            mock_verify.return_value = False
            
            with pytest.raises(AuthenticationError):
                self.service.login_user(credentials)
    
    def test_get_current_user_info(self):
        
        mock_user = User(id=1, username="testuser", role=Role.USER)
        
        result = self.service.get_current_user_info(mock_user)
        
        assert result.id == 1
        assert result.username == "testuser"
        assert result.role == Role.USER
