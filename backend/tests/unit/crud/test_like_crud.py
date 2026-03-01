from unittest.mock import Mock, patch
from sqlalchemy.orm import Session

from app.crud.like import CRUDLike
from app.db.models import Like, Review


class TestCRUDLike:
    
    def test_get_like_found(self):
        """Тест получения лайка (найден)"""
        # Arrange
        mock_db = Mock(spec=Session)
        mock_like = Like(
            id=1,
            user_id=1,
            review_id=1
        )
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_like
        
        # Act
        result = CRUDLike.get_like(mock_db, 1, 1)
        
        # Assert
        assert result == mock_like
        mock_db.query.assert_called_once_with(Like)
    
    def test_get_like_not_found(self):
        """Тест получения лайка (не найден)"""
        # Arrange
        mock_db = Mock(spec=Session)
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        # Act
        result = CRUDLike.get_like(mock_db, 1, 999)
        
        # Assert
        assert result is None
    
    def test_create_like_success(self):
        """Тест успешного создания лайка"""
        # Arrange
        mock_db = Mock(spec=Session)
        user_id = 1
        review_id = 1
        
        # Мокаем add
        added_like = None
        
        def mock_add(like):
            nonlocal added_like
            added_like = like
            like.id = 1
        
        mock_db.add.side_effect = mock_add
        
        # Act
        result = CRUDLike.create_like(mock_db, user_id, review_id)
        
        # Assert
        assert isinstance(result, Like)
        assert result.user_id == user_id
        assert result.review_id == review_id
        mock_db.add.assert_called_once()
        
        # Проверяем что передан правильный объект Like
        like_arg = mock_db.add.call_args[0][0]
        assert isinstance(like_arg, Like)
        assert like_arg.user_id == user_id
        assert like_arg.review_id == review_id
    
    def test_delete_like_success(self):
        """Тест успешного удаления лайка"""
        # Arrange
        mock_db = Mock(spec=Session)
        mock_like = Like(id=1, user_id=1, review_id=1)
        
        mock_db.delete = Mock()
        
        # Act
        CRUDLike.delete_like(mock_db, mock_like)
        
        # Assert
        mock_db.delete.assert_called_once_with(mock_like)
    
    def test_toggle_like_add_like(self):
        """Тест добавления лайка (лайка нет)"""
        # Arrange
        mock_db = Mock(spec=Session)
        user_id = 1
        review_id = 1
        
        review = Mock(spec=Review)
        review.likes = 0
        review.id = review_id
        
        # Mock что лайка нет
        with patch.object(CRUDLike, 'get_like', return_value=None) as mock_get_like:
            mock_db.add = Mock()
            mock_db.commit = Mock()
            
            # Act
            is_liked, likes_count = CRUDLike.toggle_like(
                db=mock_db,
                user_id=user_id,
                review_id=review_id,
                review=review
            )
            
            # Assert
            assert is_liked is True
            assert likes_count == 1
            assert review.likes == 1
            
            mock_get_like.assert_called_once_with(mock_db, user_id, review_id)
            mock_db.add.assert_called_once()
            mock_db.commit.assert_called_once()
            
            # Проверяем что был создан новый лайк
            like_arg = mock_db.add.call_args[0][0]
            assert like_arg.user_id == user_id
            assert like_arg.review_id == review_id
    
    def test_toggle_like_remove_like(self):
        """Тест удаления лайка (лайк есть)"""
        # Arrange
        mock_db = Mock(spec=Session)
        user_id = 1
        review_id = 1
        
        review = Mock(spec=Review)
        review.likes = 1
        review.id = review_id
        
        # Mock существующий лайк
        mock_existing_like = Mock(spec=Like)
        
        with patch.object(CRUDLike, 'get_like', return_value=mock_existing_like) as mock_get_like:
            mock_db.delete = Mock()
            mock_db.commit = Mock()
            
            # Act
            is_liked, likes_count = CRUDLike.toggle_like(
                db=mock_db,
                user_id=user_id,
                review_id=review_id,
                review=review
            )
            
            # Assert
            assert is_liked is False
            assert likes_count == 0
            assert review.likes == 0
            
            mock_get_like.assert_called_once_with(mock_db, user_id, review_id)
            mock_db.delete.assert_called_once_with(mock_existing_like)
            mock_db.commit.assert_called_once()
    
    def test_toggle_like_return_values(self):
        """Тест возвращаемых значений toggle_like"""
        # Arrange
        mock_db = Mock(spec=Session)
        user_id = 1
        review_id = 1
        
        # Сценарий 1: Добавление лайка
        review1 = Mock(spec=Review)
        review1.likes = 0
        
        with patch.object(CRUDLike, 'get_like', return_value=None):
            mock_db.add = Mock()
            mock_db.commit = Mock()
            
            is_liked1, likes_count1 = CRUDLike.toggle_like(
                db=mock_db,
                user_id=user_id,
                review_id=review_id,
                review=review1
            )
            
            assert is_liked1 is True
            assert likes_count1 == 1
        
        # Сценарий 2: Удаление лайка
        review2 = Mock(spec=Review)
        review2.likes = 5
        
        mock_existing_like = Mock(spec=Like)
        
        with patch.object(CRUDLike, 'get_like', return_value=mock_existing_like):
            mock_db.delete = Mock()
            mock_db.commit = Mock()
            
            is_liked2, likes_count2 = CRUDLike.toggle_like(
                db=mock_db,
                user_id=user_id,
                review_id=review_id,
                review=review2
            )
            
            assert is_liked2 is False
            assert likes_count2 == 4
    
    def test_toggle_like_immutable_review_likes(self):
        """Тест что likes у review изменяется корректно"""
        # Arrange
        mock_db = Mock(spec=Session)
        user_id = 1
        review_id = 1
        
        # Создаем реальный mock с атрибутом likes
        review = Mock()
        review.likes = 3
        review.id = review_id
        
        # Mock: лайк уже существует
        mock_existing_like = Mock()
        
        with patch.object(CRUDLike, 'get_like', return_value=mock_existing_like):
            mock_db.delete = Mock()
            mock_db.commit = Mock()
            
            # Act - удаляем лайк
            is_liked, likes_count = CRUDLike.toggle_like(
                db=mock_db,
                user_id=user_id,
                review_id=review_id,
                review=review
            )
            
            # Assert
            assert is_liked is False
            assert likes_count == 2
            assert review.likes == 2  # Проверяем что изменилось с 3 на 2
