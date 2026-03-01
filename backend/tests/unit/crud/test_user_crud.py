from unittest.mock import Mock, patch
from sqlalchemy.orm import Session
from app.crud.user import CRUDUser
from app.db.models import User, Role


class TestCRUDUser:
    
    def test_get_user_by_id_found(self):
        """Тест получения пользователя по ID (найден)"""
        # Arrange
        mock_db = Mock(spec=Session)
        mock_user = User(id=1, username="testuser", role=Role.USER)
        
        # Настраиваем mock для query
        mock_query = Mock()
        mock_filter = Mock()
        mock_first = Mock(return_value=mock_user)
        
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.first.return_value = mock_user
        
        # Act
        result = CRUDUser.get(mock_db, 1)
        
        # Assert
        assert result == mock_user
        mock_db.query.assert_called_once_with(User)
        mock_query.filter.assert_called_once()
        
        # Проверяем аргументы фильтра
        filter_call = mock_query.filter.call_args[0][0]
        assert str(filter_call) == "users.id = :id_1"
    
    def test_get_user_by_id_not_found(self):
        """Тест получения пользователя по ID (не найден)"""
        # Arrange
        mock_db = Mock(spec=Session)
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        # Act
        result = CRUDUser.get(mock_db, 999)
        
        # Assert
        assert result is None
    
    def test_get_by_username_found(self):
        """Тест получения пользователя по username (найден)"""
        # Arrange
        mock_db = Mock(spec=Session)
        mock_user = User(id=1, username="testuser", role=Role.USER)
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        
        # Act
        result = CRUDUser.get_by_username(mock_db, "testuser")
        
        # Assert
        assert result == mock_user
        mock_db.query.assert_called_once_with(User)
        
        # Проверяем фильтр по username
        filter_call = mock_db.query.return_value.filter.call_args[0][0]
        assert "users.username" in str(filter_call)
    
    def test_get_by_username_not_found(self):
        """Тест получения пользователя по username (не найден)"""
        # Arrange
        mock_db = Mock(spec=Session)
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        # Act
        result = CRUDUser.get_by_username(mock_db, "nonexistent")
        
        # Assert
        assert result is None
    
    def test_create_user_success(self):
        """Тест успешного создания пользователя"""
        # Arrange
        mock_db = Mock(spec=Session)
        username = "newuser"
        password_hash = "hashed_password"
        role = Role.USER
        
        # Настраиваем поведение моков
        added_user = None
        
        def mock_add(user):
            nonlocal added_user
            added_user = user
            user.id = 1  # Симулируем присвоение ID
        
        def mock_refresh(user):
            pass
        
        mock_db.add.side_effect = mock_add
        mock_db.commit = Mock()
        mock_db.refresh = Mock(side_effect=mock_refresh)
        
        # Act
        result = CRUDUser.create(
            db=mock_db,
            username=username,
            password_hash=password_hash,
            role=role
        )
        
        # Assert
        assert isinstance(result, User)
        assert result.username == username
        assert result.password_hash == password_hash
        assert result.role == role
        
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once_with(added_user)
        
        # Проверяем, что был создан правильный объект User
        added_arg = mock_db.add.call_args[0][0]
        assert added_arg.username == username
        assert added_arg.password_hash == password_hash
        assert added_arg.role == role
    
    def test_create_user_with_default_role(self):
        """Тест создания пользователя с ролью по умолчанию"""
        # Arrange
        mock_db = Mock(spec=Session)
        mock_db.add = Mock()
        mock_db.commit = Mock()
        mock_db.refresh = Mock()
        
        # Act
        result = CRUDUser.create(
            db=mock_db,
            username="testuser",
            password_hash="hashed_password"
            # role не передаём, должен быть USER по умолчанию
        )
        
        # Assert
        assert result.role == Role.USER
    
    def test_create_user_with_admin_role(self):
        """Тест создания пользователя с ролью ADMIN"""
        # Arrange
        mock_db = Mock(spec=Session)
        mock_db.add = Mock()
        mock_db.commit = Mock()
        mock_db.refresh = Mock()
        
        # Act
        result = CRUDUser.create(
            db=mock_db,
            username="adminuser",
            password_hash="hashed_password",
            role=Role.ADMIN
        )
        
        # Assert
        assert result.role == Role.ADMIN
    
    def test_update_user_success(self):
        """Тест успешного обновления пользователя"""
        # Arrange
        mock_db = Mock(spec=Session)
        user = User(id=1, username="olduser", password_hash="old_hash", role=Role.USER)
        
        mock_db.commit = Mock()
        mock_db.refresh = Mock()
        
        update_data = {
            "username": "newuser",
            "password_hash": "new_hash",
            "role": Role.ADMIN
        }
        
        # Act
        result = CRUDUser.update(
            db=mock_db,
            user=user,
            **update_data
        )
        
        # Assert
        assert result.username == "newuser"
        assert result.password_hash == "new_hash"
        assert result.role == Role.ADMIN
        
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once_with(user)
    
    def test_update_user_partial_data(self):
        """Тест обновления только некоторых полей пользователя"""
        # Arrange
        mock_db = Mock(spec=Session)
        user = User(id=1, username="olduser", password_hash="old_hash", role=Role.USER)
        
        mock_db.commit = Mock()
        mock_db.refresh = Mock()
        
        # Act - обновляем только username
        result = CRUDUser.update(
            db=mock_db,
            user=user,
            username="newuser"
        )
        
        # Assert
        assert result.username == "newuser"
        assert result.password_hash == "old_hash"  # Не изменилось
        assert result.role == Role.USER  # Не изменилось
    
    def test_delete_user_success(self):
        """Тест успешного удаления пользователя"""
        # Arrange
        mock_db = Mock(spec=Session)
        user_id = 1
        
        mock_user = User(id=user_id, username="testuser")
        
        # Mock статического метода get
        with patch.object(CRUDUser, 'get', return_value=mock_user) as mock_get:
            mock_db.delete = Mock()
            mock_db.commit = Mock()
            
            # Act
            result = CRUDUser.delete(mock_db, user_id)
            
            # Assert
            assert result is True
            mock_get.assert_called_once_with(mock_db, user_id)
            mock_db.delete.assert_called_once_with(mock_user)
            mock_db.commit.assert_called_once()
    
    def test_delete_user_not_found(self):
        """Тест удаления несуществующего пользователя"""
        # Arrange
        mock_db = Mock(spec=Session)
        
        # Mock статического метода get
        with patch.object(CRUDUser, 'get', return_value=None) as mock_get:
            mock_db.delete = Mock()
            mock_db.commit = Mock()
            
            # Act
            result = CRUDUser.delete(mock_db, 999)
            
            # Assert
            assert result is False
            mock_get.assert_called_once_with(mock_db, 999)
            mock_db.delete.assert_not_called()
            mock_db.commit.assert_not_called()
