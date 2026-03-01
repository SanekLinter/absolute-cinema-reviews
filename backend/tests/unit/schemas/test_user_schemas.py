import pytest
from pydantic import ValidationError
from app.schemas.user import UserCreate, UserBase, UserOut, Token
from app.db.models import Role


@pytest.fixture
def sample_user_data():
    return {
        "username": "username",
        "password": "password",
    }

class TestUserCreate:
    @pytest.mark.parametrize("symbols, correct", [
        (0, False),
        (3, False),
        (4, True),
        (10, True),
        (20, True),
        (21, False),
    ])
    def test_user_create_username_length(self, sample_user_data, symbols, correct):

        data = sample_user_data
        data["username"] = "A" * symbols

        if not correct:
            with pytest.raises(ValidationError):
                UserCreate(**data)
        else:
            UserCreate(**data)

    @pytest.mark.parametrize("username, correct", [
        ("NickName007", True),
        ("Wr&ngN!ck", False)
    ])
    def test_user_create_username_pattern(self, sample_user_data, username, correct):

        data = sample_user_data
        data["username"] = username

        if not correct:
            with pytest.raises(ValidationError):
                UserCreate(**data)
        else:
            UserCreate(**data)

    @pytest.mark.parametrize("symbols, correct", [
        (0, False),
        (7, False),
        (8, True),
        (12, True),
        (16, True),
        (17, False),
    ])
    def test_user_create_password(self, sample_user_data, symbols, correct):

        data = sample_user_data
        data["password"] = "A" * symbols

        if not correct:
            with pytest.raises(ValidationError):
                UserCreate(**data)
        else:
            UserCreate(**data)
