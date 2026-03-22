import os

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_bootstrap.db")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "60")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.base import Base
import app.db.models as models
from app.db.session import get_db
from app.utils.security import hash_password


@pytest.fixture(scope="session")
def engine():
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=test_engine)
    yield test_engine
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture()
def db_connection(engine):
    connection = engine.connect()
    transaction = connection.begin()
    try:
        yield connection
    finally:
        transaction.rollback()
        connection.close()


@pytest.fixture()
def db_session(db_connection):
    session = Session(bind=db_connection)
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db_connection):
    def override_get_db():
        db = Session(bind=db_connection)
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def make_user(db_session):
    def _make_user(
        username: str,
        password: str = "password123",
        role: models.Role = models.Role.USER,
    ) -> models.User:
        user = models.User(
            username=username,
            password_hash=hash_password(password),
            role=role,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    return _make_user


@pytest.fixture()
def make_review(db_session):
    def _make_review(
        user_id: int,
        title: str = "Great film",
        movie_title: str = "Inception",
        content: str = "A" * 120,
        status: models.ReviewStatus = models.ReviewStatus.PENDING,
        likes: int = 0,
    ) -> models.Review:
        review = models.Review(
            user_id=user_id,
            title=title,
            movie_title=movie_title,
            content=content,
            status=status,
            likes=likes,
        )
        db_session.add(review)
        db_session.commit()
        db_session.refresh(review)
        return review

    return _make_review
