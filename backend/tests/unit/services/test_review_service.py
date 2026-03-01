import pytest
from unittest.mock import Mock
from datetime import datetime
from sqlalchemy.orm import Session
import app.db.models as models
import app.schemas.review as review_schemas
from app.services.review_service import ReviewService
from app.exceptions import (
    ReviewNotFoundError,
    PermissionDeniedError,
    InvalidReviewStateError
)
from math import ceil

@pytest.fixture
def mock_db():
    return Mock(spec=Session)

@pytest.fixture
def review_service(mock_db):
    return ReviewService(mock_db)

@pytest.fixture
def mock_review_crud(review_service):
    review_service.review_crud = Mock()
    return review_service.review_crud

@pytest.fixture
def mock_like_crud(review_service):
    review_service.like_crud = Mock()
    return review_service.like_crud

@pytest.fixture
def sample_user():
    return models.User(
        id=1,
        username="testuser",
        role=models.Role.USER
    )

@pytest.fixture
def sample_admin():
    return models.User(
        id=2,
        username="admin",
        role=models.Role.ADMIN
    )

@pytest.fixture
def sample_review(sample_user):
    review = models.Review(
        id=1,
        title="Test Review",
        movie_title="Test Movie",
        content="Test content " * 10,
        status=models.ReviewStatus.APPROVED,
        likes=5,
        user_id=1,
        created_at=datetime.now(),
        author=sample_user
    )
    return review

@pytest.fixture
def sample_pending_review(sample_user):
    review = models.Review(
        id=2,
        title="Pending Review",
        movie_title="Test Movie",
        content="Pending content " * 10,
        status=models.ReviewStatus.PENDING,
        likes=0,
        user_id=1,
        created_at=datetime.now(),
        author=sample_user
    )
    return review


class TestGetPublicReviews:
    
    def test_get_public_reviews_without_user(
        self, review_service, mock_review_crud, sample_review
    ):
        pagination = review_schemas.PublicPaginationParams(
            page=1,
            limit=10,
            sort="created_at",
            order="desc",
            search=None,
            author_id=None
        )
        
        mock_review_crud.get_public_reviews.return_value = ([sample_review], 1)
        
        result = review_service.get_public_reviews(pagination, None)
        
        assert result.reviews[0].is_liked is None
    

class TestGetMyReviews:
    
    def test_get_my_reviews_success(
        self, review_service, mock_review_crud, sample_user, sample_review
    ):
        pagination = review_schemas.PaginationParams(
            page=1,
            limit=10,
            sort="created_at",
            order="desc",
            search=None
        )
        mock_review_crud.get_user_reviews.return_value = ([sample_review] * 5, 5)
        review_service._is_review_liked_by_user = Mock(return_value=True)
        
        result = review_service.get_my_reviews(pagination, sample_user)
        
        assert len(result.reviews) == 5
        assert result.pagination.total_items == 5


class TestGetModerationReviews:
    
    def test_get_moderation_reviews_success(
        self, review_service, mock_review_crud, sample_pending_review
    ):
        pagination = review_schemas.PublicPaginationParams(
            page=1,
            limit=10, 
            sort="created_at",
            order="desc",
            search=None,
            author_id=None
        )
        
        mock_review_crud.get_pending_reviews.return_value = ([sample_pending_review], 3)
        
        result = review_service.get_moderation_reviews(pagination)
        
        assert len(result.reviews) == 1
        assert result.pagination.total_items == 3
        assert result.reviews[0].status == models.ReviewStatus.PENDING
        
        mock_review_crud.get_pending_reviews.assert_called_once_with(
            db=review_service.db,
            skip=0,
            limit=10
        )
    
    def test_get_moderation_reviews_empty(
        self, review_service, mock_review_crud
    ):
        pagination = review_schemas.PublicPaginationParams(
            page=1, limit=10, sort="created_at", order="desc", search=None, author_id=None
        )
        
        mock_review_crud.get_pending_reviews.return_value = ([], 0)
        
        result = review_service.get_moderation_reviews(pagination)
        
        assert len(result.reviews) == 0
        assert result.pagination.total_items == 0


class TestGetReviewDetail:
    
    def test_get_review_detail_approved_for_any_user(
        self, review_service, mock_review_crud, sample_review, sample_user
    ):
        mock_review_crud.get_with_author.return_value = sample_review
        review_service._is_review_liked_by_user = Mock(return_value=False)
        
        result = review_service.get_review_detail(1, sample_user)
        
        assert result.id == 1
        assert result.status == models.ReviewStatus.APPROVED
        assert result.author.id == 1
    
    def test_get_review_detail_approved_without_user(
        self, review_service, mock_review_crud, sample_review
    ):
        mock_review_crud.get_with_author.return_value = sample_review
        review_service._is_review_liked_by_user = Mock(return_value=None)
        
        result = review_service.get_review_detail(1, None)
        
        assert result.id == 1
        assert result.status == models.ReviewStatus.APPROVED
        assert result.is_liked is None
    
    def test_get_review_detail_pending_for_author(
        self, review_service, mock_review_crud, sample_pending_review, sample_user
    ):
        mock_review_crud.get_with_author.return_value = sample_pending_review
        review_service._is_review_liked_by_user = Mock(return_value=False)
        
        result = review_service.get_review_detail(2, sample_user)
        
        assert result.id == 2
        assert result.status == models.ReviewStatus.PENDING
        assert result.is_liked == False
    
    def test_get_review_detail_pending_for_admin(
        self, review_service, mock_review_crud, sample_pending_review, sample_admin
    ):
        mock_review_crud.get_with_author.return_value = sample_pending_review
        review_service._is_review_liked_by_user = Mock(return_value=False)
        
        result = review_service.get_review_detail(2, sample_admin)
        
        assert result.id == 2
        assert result.status == models.ReviewStatus.PENDING
        assert result.is_liked == False
    
    def test_get_review_detail_pending_for_other_user_raises_not_found(
        self, review_service, mock_review_crud, sample_pending_review
    ):
        other_user = models.User(id=3, username="other", role=models.Role.USER)
        mock_review_crud.get_with_author.return_value = sample_pending_review
        
        with pytest.raises(ReviewNotFoundError):
            review_service.get_review_detail(2, other_user)
    
    def test_get_review_detail_rejected_for_author(
        self, review_service, mock_review_crud, sample_user
    ):
        rejected_review = models.Review(
            id=3,
            title="Rejected",
            movie_title="Test",
            content="Content " * 20,
            status=models.ReviewStatus.REJECTED,
            likes=0,
            user_id=1,
            created_at=datetime.now(),
            author=sample_user
        )
        mock_review_crud.get_with_author.return_value = rejected_review
        review_service._is_review_liked_by_user = Mock(return_value=False)
        
        result = review_service.get_review_detail(3, sample_user)
        
        assert result.status == models.ReviewStatus.REJECTED
    
    def test_get_review_detail_not_found(
        self, review_service, mock_review_crud, sample_user
    ):
        mock_review_crud.get_with_author.return_value = None
        
        with pytest.raises(ReviewNotFoundError):
            review_service.get_review_detail(999, sample_user)
    
    @pytest.mark.parametrize("review_status,user_role,expected_accessible", [
        (models.ReviewStatus.APPROVED, models.Role.USER, True),
        (models.ReviewStatus.APPROVED, models.Role.ADMIN, True),
        (models.ReviewStatus.PENDING, models.Role.USER, False),
        (models.ReviewStatus.PENDING, models.Role.ADMIN, True),
        (models.ReviewStatus.REJECTED, models.Role.USER, False),
        (models.ReviewStatus.REJECTED, models.Role.ADMIN, True),
    ])
    def test_get_review_detail_decision_table(
        self, review_service, mock_review_crud,
        review_status, user_role, expected_accessible
    ):
        user = models.User(id=999, username="other", role=user_role)
        
        review = models.Review(
            id=1,
            title="Test",
            movie_title="Test",
            content="Test",
            status=review_status,
            likes=0,
            user_id=1,
            created_at=datetime.now(),
            author=models.User(id=1, username="author", role=models.Role.USER)
        )
        
        mock_review_crud.get_with_author.return_value = review
        
        if expected_accessible:
            result = review_service.get_review_detail(1, user)
            assert result.status == review_status
        else:
            with pytest.raises(ReviewNotFoundError):
                review_service.get_review_detail(1, user)


class TestCreateReview:
    
    def test_create_review_success(
        self, review_service, mock_review_crud, sample_user
    ):
        review_data = review_schemas.ReviewCreate(
            title="New Review",
            movie_title="New Movie",
            content="New content " * 20
        )
        
        mock_review_crud.create.return_value = models.Review(id=1)
        
        result = review_service.create_review(review_data, sample_user)
        
        assert result.id == 1
    

class TestModerateReview:
    
    def test_approve_review_success(
        self, review_service, mock_review_crud, sample_pending_review
    ):
        mock_review_crud.get.return_value = sample_pending_review
        
        review_service.approve_review(2)
        
        mock_review_crud.change_status.assert_called_once_with(
            review_service.db,
            sample_pending_review,
            models.ReviewStatus.APPROVED
        )
    
    def test_reject_review_success(
        self, review_service, mock_review_crud, sample_pending_review
    ):
        mock_review_crud.get.return_value = sample_pending_review
        
        review_service.reject_review(2)
        
        mock_review_crud.change_status.assert_called_once_with(
            review_service.db,
            sample_pending_review,
            models.ReviewStatus.REJECTED
        )
    
    def test_approve_review_not_found(self, review_service, mock_review_crud):
        mock_review_crud.get.return_value = None
        
        with pytest.raises(ReviewNotFoundError):
            review_service.approve_review(999)
    
    def test_reject_review_not_found(self, review_service, mock_review_crud):
        mock_review_crud.get.return_value = None
        
        with pytest.raises(ReviewNotFoundError):
            review_service.reject_review(999)
    
    @pytest.mark.parametrize("initial_status,should_succeed", [
        (models.ReviewStatus.PENDING, True),
        (models.ReviewStatus.APPROVED, False),
        (models.ReviewStatus.REJECTED, False),
    ])
    def test_approve_review_state_transitions(
        self, review_service, mock_review_crud, sample_user,
        initial_status, should_succeed
    ):
        review = models.Review(
            id=1,
            title="Test",
            movie_title="Test",
            content="Test",
            status=initial_status,
            likes=0,
            user_id=1,
            created_at=datetime.now(),
            author=sample_user
        )
        mock_review_crud.get.return_value = review
        
        if should_succeed:
            review_service.approve_review(1)
            mock_review_crud.change_status.assert_called_once()
        else:
            with pytest.raises(InvalidReviewStateError):
                review_service.approve_review(1)
            mock_review_crud.change_status.assert_not_called()

    @pytest.mark.parametrize("initial_status,should_succeed", [
        (models.ReviewStatus.PENDING, True),
        (models.ReviewStatus.APPROVED, False),
        (models.ReviewStatus.REJECTED, False),
    ])
    def test_reject_review_state_transitions(
        self, review_service, mock_review_crud, sample_user,
        initial_status, should_succeed
    ):
        review = models.Review(
            id=1,
            title="Test",
            movie_title="Test",
            content="Test",
            status=initial_status,
            likes=0,
            user_id=1,
            created_at=datetime.now(),
            author=sample_user
        )
        mock_review_crud.get.return_value = review
        
        if should_succeed:
            review_service.reject_review(1)
            mock_review_crud.change_status.assert_called_once()
        else:
            with pytest.raises(InvalidReviewStateError):
                review_service.reject_review(1)
            mock_review_crud.change_status.assert_not_called()

class TestDeleteReview:
    
    def test_delete_own_review_success(
        self, review_service, mock_review_crud, sample_review, sample_user
    ):
        mock_review_crud.get.return_value = sample_review
        
        review_service.delete_review(1, sample_user)
        
        mock_review_crud.delete.assert_called_once_with(
            review_service.db,
            sample_review
        )
    
    def test_delete_others_review_raises_permission_denied(
        self, review_service, mock_review_crud, sample_review
    ):
        other_user = models.User(id=2, username="other", role=models.Role.USER)
        mock_review_crud.get.return_value = sample_review
        
        with pytest.raises(PermissionDeniedError) as exc_info:
            review_service.delete_review(1, other_user)
        
        assert "delete your own reviews" in str(exc_info.value)
        mock_review_crud.delete.assert_not_called()
    
    def test_delete_nonexistent_review(
        self, review_service, mock_review_crud, sample_user
    ):
        mock_review_crud.get.return_value = None
        
        with pytest.raises(ReviewNotFoundError):
            review_service.delete_review(999, sample_user)


class TestEditReview:
    
    def test_edit_own_review_success(
        self, review_service, mock_review_crud, sample_review, sample_user
    ):
        review_data = review_schemas.ReviewUpdate(
            title="Updated Title",
            movie_title="Updated Movie",
            content="Updated content " * 10
        )
        
        mock_review_crud.get.return_value = sample_review
        updated_review = Mock(spec=models.Review)
        updated_review.id = 1
        updated_review.status = models.ReviewStatus.PENDING
        mock_review_crud.update.return_value = updated_review
        
        review_service.get_review_detail = Mock()
        expected_detail = review_schemas.DetailReviewResponse(
            id=1,
            title="Updated Title",
            movie_title="Updated Movie",
            content="Updated content " * 10,
            status=models.ReviewStatus.PENDING,
            likes=5,
            author=review_schemas.AuthorInfo(id=1, username="testuser"),
            created_at=datetime.now(),
            is_liked=True
        )
        review_service.get_review_detail.return_value = expected_detail
        
        result = review_service.edit_review(1, review_data, sample_user)
        
        assert result.id == 1
        assert result.status == models.ReviewStatus.PENDING
        
        mock_review_crud.update.assert_called_once_with(
            db=review_service.db,
            review=sample_review,
            title="Updated Title",
            movie_title="Updated Movie",
            content="Updated content " * 10,
            status=models.ReviewStatus.PENDING
        )
    
    def test_edit_others_review_raises_permission_denied(
        self, review_service, mock_review_crud, sample_review
    ):
        other_user = models.User(id=2, username="other", role=models.Role.USER)
        review_data = review_schemas.ReviewUpdate(
            title="Updated",
            movie_title="Updated",
            content="Updated " * 20
        )
        
        mock_review_crud.get.return_value = sample_review
        
        with pytest.raises(PermissionDeniedError) as exc_info:
            review_service.edit_review(1, review_data, other_user)
        
        assert "edit your own reviews" in str(exc_info.value)
        mock_review_crud.update.assert_not_called()
    
    def test_edit_nonexistent_review(
        self, review_service, mock_review_crud, sample_user
    ):
        review_data = review_schemas.ReviewUpdate(
            title="Updated",
            movie_title="Updated",
            content="Updated " * 20
        )
        
        mock_review_crud.get.return_value = None
        
        with pytest.raises(ReviewNotFoundError):
            review_service.edit_review(999, review_data, sample_user)


class TestToggleLike:
    
    def test_toggle_like_on_approved_review(
        self, review_service, mock_review_crud, mock_like_crud, sample_review, sample_user
    ):
        mock_review_crud.get.return_value = sample_review
        mock_like_crud.toggle_like.return_value = (True, 6)  # is_liked, likes_count
        
        result = review_service.toggle_like(1, sample_user)
        
        assert result.is_liked is True
        assert result.likes == 6
        
        mock_like_crud.toggle_like.assert_called_once_with(
            db=review_service.db,
            user_id=1,
            review_id=1,
            review=sample_review
        )
    
    def test_toggle_like_off_approved_review(
        self, review_service, mock_review_crud, mock_like_crud, sample_review, sample_user
    ):
        mock_review_crud.get.return_value = sample_review
        mock_like_crud.toggle_like.return_value = (False, 4)
        
        result = review_service.toggle_like(1, sample_user)
        
        assert result.is_liked is False
        assert result.likes == 4
    
    def test_toggle_like_on_pending_review_raises_error(
        self, review_service, mock_review_crud, sample_pending_review, sample_user
    ):
        mock_review_crud.get.return_value = sample_pending_review
        
        with pytest.raises(InvalidReviewStateError) as exc_info:
            review_service.toggle_like(2, sample_user)
        
        assert "only like approved reviews" in str(exc_info.value)
    
    def test_toggle_like_on_rejected_review_raises_error(
        self, review_service, mock_review_crud, sample_user
    ):
        rejected_review = models.Review(
            id=3,
            title="Rejected",
            movie_title="Test",
            content="Test",
            status=models.ReviewStatus.REJECTED,
            likes=0,
            user_id=2,
            created_at=datetime.now(),
            author=models.User(id=2, username="author", role=models.Role.USER)
        )
        mock_review_crud.get.return_value = rejected_review
        
        with pytest.raises(InvalidReviewStateError):
            review_service.toggle_like(3, sample_user)
    
    def test_toggle_like_nonexistent_review(
        self, review_service, mock_review_crud, sample_user
    ):
        mock_review_crud.get.return_value = None
        
        with pytest.raises(ReviewNotFoundError):
            review_service.toggle_like(999, sample_user)
    
    @pytest.mark.parametrize("review_status", [
        models.ReviewStatus.APPROVED,
        models.ReviewStatus.PENDING,
        models.ReviewStatus.REJECTED,
    ])
    def test_toggle_like_state_transitions(
        self, review_service, mock_review_crud, mock_like_crud, sample_user,
        review_status
    ):
        review = models.Review(
            id=1,
            title="Test",
            movie_title="Test",
            content="Test",
            status=review_status,
            likes=5,
            user_id=2,
            created_at=datetime.now(),
            author=models.User(id=2, username="author", role=models.Role.USER)
        )
        mock_review_crud.get.return_value = review
        
        if review_status == models.ReviewStatus.APPROVED:
            mock_like_crud.toggle_like.return_value = (True, 6)
            result = review_service.toggle_like(1, sample_user)
            assert result.is_liked is True
        else:
            with pytest.raises(InvalidReviewStateError):
                review_service.toggle_like(1, sample_user)


class TestPrivateMethods:
    
    def test_build_review_response_with_user(
        self, review_service, sample_review, sample_user
    ):
        review_service._is_review_liked_by_user = Mock(return_value=True)
        
        result = review_service._build_review_response(sample_review, sample_user)
        
        assert result.id == 1
        assert result.title == "Test Review"
        assert result.author.id == 1
        assert result.author.username == "testuser"
        assert result.is_liked is True
    
    def test_build_review_response_without_user(
        self, review_service, sample_review
    ):
        review_service._is_review_liked_by_user = Mock(return_value=None)
        
        result = review_service._build_review_response(sample_review, None)
        
        assert result.is_liked is None
    
    def test_is_review_liked_by_user_with_user_id(
        self, review_service, mock_like_crud
    ):
        mock_like_crud.get_like.return_value = Mock()
        
        result = review_service._is_review_liked_by_user(1, 2)
        
        assert result is True
        mock_like_crud.get_like.assert_called_once_with(
            review_service.db, 2, 1
        )
    
    def test_is_review_liked_by_user_without_like(
        self, review_service, mock_like_crud
    ):
        mock_like_crud.get_like.return_value = None
        
        result = review_service._is_review_liked_by_user(1, 2)
        
        assert result is False
    
    def test_is_review_liked_by_user_without_user_id(
        self, review_service, mock_like_crud
    ):
        result = review_service._is_review_liked_by_user(1, None)
        
        assert result is None
        mock_like_crud.get_like.assert_not_called()
    
    @pytest.mark.parametrize("page,limit,total,expected_pages", [
        (1, 10, 0, 1),
        (1, 10, 5, 1),
        (1, 10, 10, 1),
        (1, 10, 11, 2),
        (1, 10, 20, 2),
        (1, 10, 21, 3),
        (1, 5, 25, 5),
    ])
    def test_build_pagination_info(
        self, review_service, page, limit, total, expected_pages
    ):
        result = review_service._build_pagination_info(page, limit, total)
        
        assert result.current_page == page
        assert result.items_per_page == limit
        assert result.total_items == total
        assert result.total_pages == expected_pages

