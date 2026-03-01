import pytest
from unittest.mock import Mock, patch
from jose import JWTError

from app.dependencies import (
    get_current_user,
    get_current_admin,
    get_current_user_optional
)
from app.db import models
from app.exceptions import AuthenticationError, UserNotFoundError, PermissionDeniedError


class TestGetCurrentUser:
    
    @patch('app.dependencies.verify_token')
    def test_valid_user(self, mock_verify_token):

        mock_credentials = Mock()
        mock_credentials.credentials = "valid_token"
        mock_db = Mock()
        mock_user = Mock()
        mock_user.id = 123
        mock_verify_token.return_value = {"sub": "123"}
        query_mock = Mock()
        filter_mock = Mock()
        mock_db.query.return_value = query_mock
        query_mock.filter.return_value = filter_mock
        filter_mock.first.return_value = mock_user

        result = get_current_user(mock_credentials, mock_db)
        
        assert result == mock_user
        mock_db.query.assert_called_with(models.User)
        mock_verify_token.assert_called_with("valid_token")
    
    @patch('app.dependencies.verify_token')
    def test_invalid_token_none_payload(self, mock_verify_token):

        mock_credentials = Mock()
        mock_credentials.credentials = "invalid_token"
        mock_db = Mock()
        mock_verify_token.return_value = None
        
        with pytest.raises(AuthenticationError) as exc_info:
            get_current_user(mock_credentials, mock_db)
    
    @patch('app.dependencies.verify_token')
    def test_token_with_non_numeric_sub(self, mock_verify_token):

        mock_credentials = Mock()
        mock_credentials.credentials = "token_with_string_sub"
        mock_db = Mock()
        mock_verify_token.return_value = {"sub": "not_a_number"}
        
        with pytest.raises(AuthenticationError):
            get_current_user(mock_credentials, mock_db)

    @patch('app.dependencies.verify_token')
    def test_invalid_token_jwt_error(self, mock_verify_token):

        mock_credentials = Mock()
        mock_credentials.credentials = "invalid_token"
        mock_db = Mock()
        mock_verify_token.side_effect = JWTError("Invalid token")
        
        with pytest.raises(AuthenticationError) as exc_info:
            get_current_user(mock_credentials, mock_db)
    
    @patch('app.dependencies.verify_token')
    def test_token_without_sub(self, mock_verify_token):

        mock_credentials = Mock()
        mock_credentials.credentials = "token_without_sub"
        mock_db = Mock()
        mock_verify_token.return_value = {"other_field": "value"}
        
        with pytest.raises(AuthenticationError):
            get_current_user(mock_credentials, mock_db)
    
    @patch('app.dependencies.verify_token')
    def test_user_not_found(self, mock_verify_token):

        mock_credentials = Mock()
        mock_credentials.credentials = "valid_token"
        mock_db = Mock()
        mock_verify_token.return_value = {"sub": "123"}
        query_mock = Mock()
        filter_mock = Mock()
        mock_db.query.return_value = query_mock
        query_mock.filter.return_value = filter_mock
        filter_mock.first.return_value = None
        
        with pytest.raises(UserNotFoundError):
            get_current_user(mock_credentials, mock_db)


class TestGetCurrentAdmin:
    
    def test_admin_user(self):

        mock_user = Mock()
        mock_user.role = models.Role.ADMIN
        
        result = get_current_admin(mock_user)
        assert result == mock_user
    
    def test_non_admin_user(self):

        mock_user = Mock()
        mock_user.role = models.Role.USER
        
        with pytest.raises(PermissionDeniedError):
            get_current_admin(mock_user)


class TestGetCurrentUserOptional:
    
    def test_no_authorization_header(self):

        mock_db = Mock()
        
        result = get_current_user_optional(None, mock_db)
        
        assert result is None
    
    def test_empty_authorization_header(self):

        mock_db = Mock()
        
        result = get_current_user_optional("", mock_db)
        
        assert result is None
    
    def test_invalid_authorization_format_no_bearer(self):

        mock_db = Mock()
        
        result = get_current_user_optional("Token abc123", mock_db)
        
        assert result is None
    
    def test_invalid_authorization_format_empty_token(self):

        mock_db = Mock()
        
        result = get_current_user_optional("Bearer ", mock_db)
        
        assert result is None
    
    @patch('app.dependencies.verify_token')
    @patch('app.dependencies.get_current_user')
    def test_valid_token_user_exists(self, mock_get_current_user, mock_verify_token):
        
        mock_db = Mock()
        mock_user = Mock()
        mock_verify_token.return_value = {"sub": "123"}
        mock_get_current_user.return_value = mock_user
        
        with patch('app.db.session') as mock_db_internal:
            query_mock = Mock()
            filter_mock = Mock()
            
            mock_db_internal.query.return_value = query_mock
            query_mock.filter.return_value = filter_mock
            filter_mock.first.return_value = mock_user
        
        result = get_current_user_optional("Bearer valid_token", mock_db)
        assert result == mock_user
