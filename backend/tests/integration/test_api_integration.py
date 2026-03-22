from datetime import timedelta
import pytest
import app.db.models as models


REVIEW_PAYLOAD = {
    "title": "Solid review",
    "movie_title": "Interstellar",
    "content": "This is a detailed review text long enough to pass schema validation. "
    "It explains acting, visuals, pacing, and soundtrack quality in depth.",
}


def register_and_get_token(client, username: str, password: str = "password123") -> str:
    reg_res = client.post(
        "/api/auth/register",
        json={"username": username, "password": password},
    )
    assert reg_res.status_code == 201
    return reg_res.json()["access_token"]


def login_and_get_token(client, username: str, password: str = "password123") -> str:
    login_res = client.post(
        "/api/auth/login",
        json={"username": username, "password": password},
    )
    assert login_res.status_code == 200
    return login_res.json()["access_token"]


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_register_user_and_get_me(client, monkeypatch):
    def mocked_token_generator(data, expires_delta=None):
        from app.utils.security import create_access_token as real_create_access_token

        return real_create_access_token(data, expires_delta=timedelta(minutes=5))

    monkeypatch.setattr(
        "app.services.user_service.create_access_token",
        mocked_token_generator,
    )

    token = register_and_get_token(client, "user1001")

    me_res = client.get("/api/auth/me", headers=auth_headers(token))

    assert me_res.status_code == 200
    assert me_res.json()["username"] == "user1001"
    assert me_res.json()["role"] == "user"


def test_register_duplicate_username_returns_400(client):
    first = client.post(
        "/api/auth/register",
        json={"username": "user1002", "password": "password123"},
    )
    second = client.post(
        "/api/auth/register",
        json={"username": "user1002", "password": "password123"},
    )

    assert first.status_code == 201
    assert second.status_code == 400
    assert second.json()["detail"] == "Username already exists"


def test_login_success_and_get_me(client):
    register_and_get_token(client, "user1003", "password123")

    token = login_and_get_token(client, "user1003", "password123")
    me_res = client.get("/api/auth/me", headers=auth_headers(token))

    assert me_res.status_code == 200
    assert me_res.json()["username"] == "user1003"


def test_login_with_wrong_password_returns_401(client):
    register_and_get_token(client, "user1004", "password123")

    login_res = client.post(
        "/api/auth/login",
        json={"username": "user1004", "password": "wrongpass"},
    )

    assert login_res.status_code == 401
    assert login_res.json()["detail"] == "Invalid credentials"


def test_public_reviews_for_anonymous_only_shows_approved_with_is_liked_none(
    client, make_user, make_review
):
    user = make_user("user1005")
    approved = make_review(user_id=user.id, status=models.ReviewStatus.APPROVED)
    make_review(user_id=user.id, status=models.ReviewStatus.PENDING)

    res = client.get("/api/reviews/public")

    assert res.status_code == 200
    reviews = res.json()["reviews"]
    assert len(reviews) == 1
    assert reviews[0]["id"] == approved.id
    assert reviews[0]["status"] == "approved"
    assert reviews[0]["is_liked"] is None


def test_create_review_authorized_sets_pending_status(client, db_session):
    token = register_and_get_token(client, "user1006")

    create_res = client.post(
        "/api/reviews/",
        json=REVIEW_PAYLOAD,
        headers=auth_headers(token),
    )

    assert create_res.status_code == 201
    review_id = create_res.json()["id"]
    created = db_session.query(models.Review).filter(models.Review.id == review_id).first()
    assert created is not None
    assert created.status == models.ReviewStatus.PENDING


def test_create_review_without_token_is_denied(client):
    res = client.post("/api/reviews/", json=REVIEW_PAYLOAD)

    assert res.status_code == 403


def test_my_reviews_contains_user_pending_review(client):
    token = register_and_get_token(client, "user1007")

    create_res = client.post(
        "/api/reviews/",
        json=REVIEW_PAYLOAD,
        headers=auth_headers(token),
    )
    assert create_res.status_code == 201

    my_res = client.get("/api/reviews/my", headers=auth_headers(token))

    assert my_res.status_code == 200
    reviews = my_res.json()["reviews"]
    assert len(reviews) == 1
    assert reviews[0]["status"] == "pending"


def test_other_user_cannot_get_pending_review_detail(client, make_user, make_review):
    author = make_user("user1008")
    stranger_token = register_and_get_token(client, "user1009")
    pending_review = make_review(user_id=author.id, status=models.ReviewStatus.PENDING)

    res = client.get(
        f"/api/reviews/{pending_review.id}",
        headers=auth_headers(stranger_token),
    )

    assert res.status_code == 404


def test_admin_can_get_moderation_reviews(client, make_user, make_review):
    author = make_user("user1010")
    admin = make_user("admin1010", role=models.Role.ADMIN)
    pending_review = make_review(user_id=author.id, status=models.ReviewStatus.PENDING)

    admin_token = login_and_get_token(client, admin.username)
    res = client.get("/api/reviews/moderation", headers=auth_headers(admin_token))

    assert res.status_code == 200
    ids = [item["id"] for item in res.json()["reviews"]]
    assert pending_review.id in ids


def test_non_admin_cannot_access_moderation_reviews(client):
    user_token = register_and_get_token(client, "user1011")

    res = client.get("/api/reviews/moderation", headers=auth_headers(user_token))

    assert res.status_code == 403
    assert res.json()["detail"] == "Not enough permissions"


def test_admin_approves_pending_review_and_it_becomes_public(
    client, make_user, make_review
):
    author = make_user("user1012")
    admin = make_user("admin1012", role=models.Role.ADMIN)
    pending_review = make_review(user_id=author.id, status=models.ReviewStatus.PENDING)

    admin_token = login_and_get_token(client, admin.username)
    approve_res = client.post(
        f"/api/reviews/{pending_review.id}/approve",
        headers=auth_headers(admin_token),
    )
    public_res = client.get("/api/reviews/public")

    assert approve_res.status_code == 200
    ids = [item["id"] for item in public_res.json()["reviews"]]
    assert pending_review.id in ids


def test_admin_cannot_approve_already_processed_review(client, make_user, make_review):
    author = make_user("user1013")
    admin = make_user("admin1013", role=models.Role.ADMIN)
    approved_review = make_review(user_id=author.id, status=models.ReviewStatus.APPROVED)

    admin_token = login_and_get_token(client, admin.username)
    res = client.post(
        f"/api/reviews/{approved_review.id}/approve",
        headers=auth_headers(admin_token),
    )

    assert res.status_code == 400
    assert res.json()["detail"] == "Review has already been processed"


def test_admin_rejects_pending_review_and_it_is_not_public(client, make_user, make_review):
    author = make_user("user1014")
    admin = make_user("admin1014", role=models.Role.ADMIN)
    pending_review = make_review(user_id=author.id, status=models.ReviewStatus.PENDING)

    admin_token = login_and_get_token(client, admin.username)
    reject_res = client.post(
        f"/api/reviews/{pending_review.id}/reject",
        headers=auth_headers(admin_token),
    )
    public_res = client.get("/api/reviews/public")

    assert reject_res.status_code == 200
    ids = [item["id"] for item in public_res.json()["reviews"]]
    assert pending_review.id not in ids


def test_toggle_like_on_approved_review(client, make_user, make_review):
    author = make_user("user1015")
    user_token = register_and_get_token(client, "user1016")
    approved_review = make_review(user_id=author.id, status=models.ReviewStatus.APPROVED)

    first = client.post(
        f"/api/reviews/{approved_review.id}/like",
        headers=auth_headers(user_token),
    )
    second = client.post(
        f"/api/reviews/{approved_review.id}/like",
        headers=auth_headers(user_token),
    )

    assert first.status_code == 200
    assert first.json() == {"likes": 1, "is_liked": True}
    assert second.status_code == 200
    assert second.json() == {"likes": 0, "is_liked": False}


@pytest.mark.parametrize("status", [models.ReviewStatus.PENDING, models.ReviewStatus.REJECTED])
def test_like_disallowed_for_non_approved_review(client, make_user, make_review, status):
    author = make_user(f"userlike{status.value}")
    user_token = register_and_get_token(client, f"liker{status.value}")
    review = make_review(user_id=author.id, status=status)

    res = client.post(f"/api/reviews/{review.id}/like", headers=auth_headers(user_token))

    assert res.status_code == 400
    assert res.json()["detail"] == "You can only like approved reviews"


def test_author_can_edit_own_review_and_status_resets_to_pending(client, make_user, make_review):
    author_token = register_and_get_token(client, "user1017")
    me = client.get("/api/auth/me", headers=auth_headers(author_token)).json()
    review = make_review(user_id=me["id"], status=models.ReviewStatus.APPROVED)

    payload = {
        "title": "Edited title",
        "movie_title": "Edited movie",
        "content": "B" * 120,
    }
    res = client.put(
        f"/api/reviews/{review.id}",
        json=payload,
        headers=auth_headers(author_token),
    )

    assert res.status_code == 200
    assert res.json()["title"] == "Edited title"
    assert res.json()["status"] == "pending"


def test_user_cannot_edit_other_users_review(client, make_user, make_review):
    author = make_user("user1018")
    editor_token = register_and_get_token(client, "user1019")
    review = make_review(user_id=author.id)

    res = client.put(
        f"/api/reviews/{review.id}",
        json={"title": "Nope1", "movie_title": "Nope", "content": "C" * 120},
        headers=auth_headers(editor_token),
    )

    assert res.status_code == 403
    assert res.json()["detail"] == "You can only edit your own reviews"


def test_author_can_delete_own_review(client, make_user, make_review, db_session):
    owner_token = register_and_get_token(client, "user1020")
    owner_id = client.get("/api/auth/me", headers=auth_headers(owner_token)).json()["id"]
    review = make_review(user_id=owner_id)

    delete_res = client.delete(
        f"/api/reviews/{review.id}",
        headers=auth_headers(owner_token),
    )
    deleted = db_session.query(models.Review).filter(models.Review.id == review.id).first()

    assert delete_res.status_code == 204
    assert deleted is None


def test_user_cannot_delete_other_users_review(client, make_user, make_review):
    author = make_user("user1021")
    stranger_token = register_and_get_token(client, "user1022")
    review = make_review(user_id=author.id)

    res = client.delete(
        f"/api/reviews/{review.id}",
        headers=auth_headers(stranger_token),
    )

    assert res.status_code == 403
    assert res.json()["detail"] == "You can only delete your own reviews"
