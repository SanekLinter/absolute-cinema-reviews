import pytest
from pydantic import ValidationError
from app.schemas.review import (
    ReviewCreate, PublicPaginationParams, PaginationParams,
    SortBy, SortOrder
)


@pytest.fixture
def sample_review_data():
    return {
        "title": "Some title",
        "movie_title": "Movie",
        "content": "Content" * 20
    }

class TestReviewCreate:
    @pytest.mark.parametrize("symbols, correct", [
        (0, False),
        (4, False),
        (5, True),
        (50, True),
        (100, True),
        (101, False),
    ])
    def test_review_create_title(self, sample_review_data, symbols, correct):

        data = sample_review_data
        data["title"] = "A" * symbols

        if not correct:
            with pytest.raises(ValidationError):
                ReviewCreate(**data)
        else:
            ReviewCreate(**data)

    @pytest.mark.parametrize("symbols, correct", [
        (0, False),
        (1, True),
        (50, True),
        (100, True),
        (101, False),
    ])
    def test_review_create_movie_title(self, sample_review_data,symbols, correct):
        
        data = sample_review_data
        data["movie_title"] = "A" * symbols

        if not correct:
            with pytest.raises(ValidationError):
                ReviewCreate(**data)
        else:
            ReviewCreate(**data)

    @pytest.mark.parametrize("symbols, correct", [
        (0, False),
        (99, False),
        (100, True),
        (2500, True),
        (5000, True),
        (5001, False),
    ])
    def test_review_create_content(self, sample_review_data, symbols, correct):
        
        data = sample_review_data
        data["content"] = "C" * symbols

        if not correct:
            with pytest.raises(ValidationError):
                ReviewCreate(**data)
        else:
            ReviewCreate(**data)


@pytest.fixture
def sample_pagination_params_data():
    return {
        "page": 2,
        "limit": 50,
        "sort": SortBy.CREATED_AT,
        "order": SortOrder.DESC,
        "search": "movie"
    }


class TestPaginationParams:
    def test_pagination_params_defaults(self):
        params = PaginationParams()
        assert params.page == 1
        assert params.limit == 20
        assert params.sort == SortBy.CREATED_AT
        assert params.order == SortOrder.DESC
        assert params.search is None
    
    @pytest.mark.parametrize("pages, correct", [
        (0, False),
        (1, True),
        (10, True),
    ])
    def test_pagination_params_page(self, sample_pagination_params_data, pages, correct):
        
        params = sample_pagination_params_data
        params["page"] = pages
        
        if not correct:
            with pytest.raises(ValidationError):
                PaginationParams(**params)
        else:
            PaginationParams(**params)
    
    @pytest.mark.parametrize("limit, correct", [
        (0, False),
        (1, True),
        (50, True),
        (100, True),
        (101, False)
    ])
    def test_pagination_params_limit(self, sample_pagination_params_data, limit, correct):
        
        params = sample_pagination_params_data
        params["limit"] = limit
        
        if not correct:
            with pytest.raises(ValidationError):
                PaginationParams(**params)
        else:
            PaginationParams(**params)
    
    @pytest.mark.parametrize("symbols, correct", [
        (0, False),
        (1, False),
        (2, True),
        (25, True),
        (50, True),
        (51, False)
    ])
    def test_pagination_params_search(self, sample_pagination_params_data, symbols, correct):
        
        params = sample_pagination_params_data
        params["search"] = "S" * symbols
        
        if not correct:
            with pytest.raises(ValidationError):
                PaginationParams(**params)
        else:
            PaginationParams(**params)

    @pytest.mark.parametrize("sort_by, correct", [
        (SortBy.CREATED_AT, True),
        (SortBy.LIKES, True),
        ("", False),
        ("rating", False)
    ])
    def test_pagination_params_sort(self, sample_pagination_params_data, sort_by, correct):
        
        params = sample_pagination_params_data
        params["sort"] = sort_by
        
        if not correct:
            with pytest.raises(ValidationError):
                PaginationParams(**params)
        else:
            PaginationParams(**params)

    @pytest.mark.parametrize("sort_order, correct", [
        (SortOrder.DESC, True),
        (SortOrder.ASC, True),
        ("", False),
        ("sc", False)
    ])
    def test_pagination_params_order(self, sample_pagination_params_data, sort_order, correct):
        
        params = sample_pagination_params_data
        params["order"] = sort_order
        
        if not correct:
            with pytest.raises(ValidationError):
                PaginationParams(**params)
        else:
            PaginationParams(**params)


@pytest.fixture
def sample_public_pagination_params_data(sample_pagination_params_data):
    return {
        **sample_pagination_params_data,
        "author_id": 10
    }


class TestPublicPaginationParams:
    def test_public_pagination_params_defaults(self):
        params = PublicPaginationParams()
        assert params.author_id is None
    
    @pytest.mark.parametrize("author_id, correct", [
        (0, False),
        (1, True),
        (5, True),
    ])
    def test_pagination_params_page(self, sample_public_pagination_params_data, author_id, correct):
        
        params = sample_public_pagination_params_data
        params["author_id"] = author_id
        
        if not correct:
            with pytest.raises(ValidationError):
                PublicPaginationParams(**params)
        else:
            PublicPaginationParams(**params)
