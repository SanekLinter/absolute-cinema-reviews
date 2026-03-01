from unittest.mock import Mock
from sqlalchemy.orm import Session

from app.crud.review import CRUDReview
from app.db.models import Review, User, ReviewStatus
import app.schemas.review as review_schemas


class TestCRUDReview:
    
    def test_get_review_found(self):
        """Тест получения рецензии по ID (найден)"""
        # Arrange
        mock_db = Mock(spec=Session)
        mock_review = Review(
            id=1, 
            title="Test Review",
            movie_title="Test Movie",
            content="Test content",
            status=ReviewStatus.APPROVED
        )
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_review
        
        # Act
        result = CRUDReview.get(mock_db, 1)
        
        # Assert
        assert result == mock_review
        mock_db.query.assert_called_once_with(Review)
    
    def test_get_review_not_found(self):
        """Тест получения рецензии по ID (не найден)"""
        # Arrange
        mock_db = Mock(spec=Session)
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        # Act
        result = CRUDReview.get(mock_db, 999)
        
        # Assert
        assert result is None
    
    def test_get_with_author_found(self):
        """Тест получения рецензии с автором (найден)"""
        # Arrange
        mock_db = Mock(spec=Session)
        
        # Создаем мок рецензии с автором
        mock_user = User(id=1, username="author")
        mock_review = Review(
            id=1,
            title="Test Review",
            movie_title="Test Movie",
            content="Test content",
            author=mock_user
        )
        
        # Мокаем joinedload и query
        mock_query = Mock()
        mock_options = Mock()
        mock_filter = Mock()
        
        mock_db.query.return_value = mock_query
        mock_query.options.return_value = mock_options
        mock_options.filter.return_value = mock_filter
        mock_filter.first.return_value = mock_review
        
        # Act
        result = CRUDReview.get_with_author(mock_db, 1)
        
        # Assert
        assert result == mock_review
        mock_db.query.assert_called_once_with(Review)
        # Проверяем что был вызван options с joinedload
        assert mock_query.options.called
    
    def test_create_review_success(self):
        """Тест успешного создания рецензии"""
        # Arrange
        mock_db = Mock(spec=Session)
        user_id = 1
        
        review_data = {
            "title": "New Review",
            "movie_title": "New Movie",
            "content": "This is a new review content"
        }
        
        added_review = None
        
        def mock_add(review):
            nonlocal added_review
            added_review = review
            review.id = 1  # Симулируем присвоение ID
            review.likes = 0  # Проверяем дефолтное значение
        
        mock_db.add.side_effect = mock_add
        mock_db.commit = Mock()
        mock_db.refresh = Mock()
        
        # Act
        result = CRUDReview.create(
            db=mock_db,
            user_id=user_id,
            **review_data
        )
        
        # Assert
        assert isinstance(result, Review)
        assert result.title == "New Review"
        assert result.movie_title == "New Movie"
        assert result.content == "This is a new review content"
        assert result.user_id == user_id
        assert result.status == ReviewStatus.PENDING  # Должен быть PENDING по умолчанию
        assert result.likes == 0  # Должен быть 0 по умолчанию
        
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once_with(added_review)
    
    def test_update_review_success(self):
        """Тест успешного обновления рецензии"""
        # Arrange
        mock_db = Mock(spec=Session)
        review = Review(
            id=1,
            title="Old Title",
            movie_title="Old Movie",
            content="Old content",
            status=ReviewStatus.APPROVED
        )
        
        mock_db.commit = Mock()
        mock_db.refresh = Mock()
        
        update_data = {
            "title": "New Title",
            "movie_title": "New Movie",
            "content": "New content",
            "status": ReviewStatus.PENDING  # При редактировании возвращается в PENDING
        }
        
        # Act
        result = CRUDReview.update(
            db=mock_db,
            review=review,
            **update_data
        )
        
        # Assert
        assert result.title == "New Title"
        assert result.movie_title == "New Movie"
        assert result.content == "New content"
        assert result.status == ReviewStatus.PENDING
        
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once_with(review)
    
    def test_delete_review_success(self):
        """Тест успешного удаления рецензии"""
        # Arrange
        mock_db = Mock(spec=Session)
        review = Review(id=1, title="Test Review")
        
        mock_db.delete = Mock()
        mock_db.commit = Mock()
        
        # Act
        CRUDReview.delete(mock_db, review)
        
        # Assert
        mock_db.delete.assert_called_once_with(review)
        mock_db.commit.assert_called_once()
    
    def test_change_status_success(self):
        """Тест успешного изменения статуса рецензии"""
        # Arrange
        mock_db = Mock(spec=Session)
        review = Review(id=1, status=ReviewStatus.PENDING)
        
        mock_db.commit = Mock()
        mock_db.refresh = Mock()
        
        # Act
        result = CRUDReview.change_status(
            db=mock_db,
            review=review,
            status=ReviewStatus.APPROVED
        )
        
        # Assert
        assert result.status == ReviewStatus.APPROVED
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once_with(review)
    
    def test_get_public_reviews_no_filters(self):
        """Тест получения публичных рецензий без фильтров"""
        # Arrange
        mock_db = Mock(spec=Session)
        
        mock_user = User(id=1, username="author")
        mock_review = Review(
            id=1,
            title="Public Review",
            movie_title="Movie",
            content="Content",
            status=ReviewStatus.APPROVED,
            likes=5,
            author=mock_user
        )
        
        # Мокаем цепочку вызовов
        mock_query = Mock()
        mock_filter = Mock()
        mock_order_by = Mock()
        mock_offset = Mock()
        mock_limit = Mock()
        
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.order_by.return_value = mock_order_by
        mock_order_by.offset.return_value = mock_offset
        mock_offset.limit.return_value = mock_limit
        mock_limit.all.return_value = [mock_review]
        
        # Мокаем count
        mock_filter.count.return_value = 1
        
        # Act
        reviews, total = CRUDReview.get_public_reviews(
            db=mock_db,
            skip=0,
            limit=20
        )
        
        # Assert
        assert len(reviews) == 1
        assert total == 1
        assert reviews[0].title == "Public Review"
        
        # Проверяем фильтр по статусу APPROVED
        filter_call = mock_query.filter.call_args[0][0]
        assert "reviews.status" in str(filter_call)
    
    def test_get_public_reviews_with_search(self):
        """Тест получения публичных рецензий с поиском"""
        # Arrange
        mock_db = Mock(spec=Session)
        
        # Мокаем цепочку вызовов
        mock_query = Mock()
        mock_filter1 = Mock()
        mock_filter2 = Mock()
        
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter1
        
        # Настраиваем цепочку для поиска
        mock_filter1.filter.return_value = mock_filter2
        
        # Act
        CRUDReview.get_public_reviews(
            db=mock_db,
            search="test"
        )
        
        # Assert
        # Должно быть два фильтра: по статусу и по поиску
        assert mock_query.filter.called
        assert mock_filter1.filter.called
    
    def test_get_public_reviews_with_author_id(self):
        """Тест получения публичных рецензий по author_id"""
        # Arrange
        mock_db = Mock(spec=Session)
        
        mock_query = Mock()
        mock_filter1 = Mock()
        mock_filter2 = Mock()
        
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter1
        mock_filter1.filter.return_value = mock_filter2
        
        # Act
        CRUDReview.get_public_reviews(
            db=mock_db,
            author_id=1
        )
        
        # Assert
        # Должно быть два фильтра: по статусу и по author_id
        assert mock_filter1.filter.called
    
    def test_get_public_reviews_sorting(self):
        """Тест получения публичных рецензий с сортировкой"""
        # Arrange
        mock_db = Mock(spec=Session)
        
        # Мокаем order_by
        mock_query = Mock()
        mock_filter = Mock()
        
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        
        # Act - сортировка по лайкам по убыванию
        CRUDReview.get_public_reviews(
            db=mock_db,
            sort_by=review_schemas.SortBy.LIKES,
            sort_order=review_schemas.SortOrder.DESC
        )
        
        # Assert
        # Проверяем что order_by был вызван
        assert mock_filter.order_by.called
    
    def test_get_user_reviews_success(self):
        """Тест получения рецензий пользователя"""
        # Arrange
        mock_db = Mock(spec=Session)
        user_id = 1
        
        mock_review = Review(
            id=1,
            title="User Review",
            movie_title="Movie",
            content="Content",
            user_id=user_id
        )
        
        # Мокаем цепочку
        mock_query = Mock()
        mock_filter1 = Mock()
        
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter1
        mock_filter1.count.return_value = 1
        mock_filter1.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [mock_review]
        
        # Act
        reviews, total = CRUDReview.get_user_reviews(
            db=mock_db,
            user_id=user_id
        )
        
        # Assert
        assert len(reviews) == 1
        assert total == 1
        assert reviews[0].user_id == user_id
        
        # Проверяем фильтр по user_id
        filter_call = mock_query.filter.call_args[0][0]
        assert "reviews.user_id" in str(filter_call)
    
    def test_get_pending_reviews_success(self):
        """Тест получения рецензий на модерации"""
        # Arrange
        mock_db = Mock(spec=Session)
        
        mock_review = Review(
            id=1,
            title="Pending Review",
            movie_title="Movie",
            content="Content",
            status=ReviewStatus.PENDING
        )
        
        mock_db.query.return_value.filter.return_value.count.return_value = 1
        mock_db.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [mock_review]
        
        # Act
        reviews, total = CRUDReview.get_pending_reviews(
            db=mock_db
        )
        
        # Assert
        assert len(reviews) == 1
        assert total == 1
        assert reviews[0].status == ReviewStatus.PENDING
        
        # Проверяем фильтр по статусу PENDING
        filter_call = mock_db.query.return_value.filter.call_args[0][0]
        assert "reviews.status" in str(filter_call).lower()
