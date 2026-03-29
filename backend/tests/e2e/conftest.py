import os
import time
import uuid
from dataclasses import dataclass

import pytest
import requests
from selenium import webdriver
from selenium.webdriver.chrome.options import Options


@dataclass
class ApiClient:
    base_url: str

    def register(self, username: str, password: str) -> str:
        response = requests.post(
            f"{self.base_url}/auth/register",
            json={"username": username, "password": password},
            timeout=20,
        )
        response.raise_for_status()
        return response.json()["access_token"]

    def login(self, username: str, password: str) -> str:
        response = requests.post(
            f"{self.base_url}/auth/login",
            json={"username": username, "password": password},
            timeout=20,
        )
        response.raise_for_status()
        return response.json()["access_token"]

    def create_review(self, token: str, title: str, movie_title: str, content: str) -> int:
        response = requests.post(
            f"{self.base_url}/reviews",
            json={"title": title, "movie_title": movie_title, "content": content},
            headers={"Authorization": f"Bearer {token}"},
            timeout=20,
        )
        response.raise_for_status()
        return response.json()["id"]

    def approve_review(self, token: str, review_id: int) -> None:
        response = requests.post(
            f"{self.base_url}/reviews/{review_id}/approve",
            headers={"Authorization": f"Bearer {token}"},
            timeout=20,
        )
        response.raise_for_status()

    def reject_review(self, token: str, review_id: int) -> None:
        response = requests.post(
            f"{self.base_url}/reviews/{review_id}/reject",
            headers={"Authorization": f"Bearer {token}"},
            timeout=20,
        )
        response.raise_for_status()


@pytest.fixture(scope="session")
def frontend_base_url() -> str:
    return os.getenv("E2E_BASE_URL", "http://localhost:3000")


@pytest.fixture(scope="session")
def api_base_url() -> str:
    return os.getenv("E2E_API_URL", "http://localhost:8000/api")


@pytest.fixture(scope="session")
def admin_username() -> str:
    return os.getenv("E2E_ADMIN_USERNAME", "Admin")


@pytest.fixture(scope="session")
def admin_password() -> str:
    return os.getenv("E2E_ADMIN_PASSWORD", "password")


@pytest.fixture(scope="session", autouse=True)
def wait_for_services(frontend_base_url: str, api_base_url: str):
    checks = [
        f"{frontend_base_url}/",
        f"{api_base_url}/reviews/public",
    ]

    deadline = time.time() + 120
    last_error = None

    while time.time() < deadline:
        try:
            all_ok = True
            for url in checks:
                response = requests.get(url, timeout=5)
                if response.status_code >= 500:
                    all_ok = False
                    break
            if all_ok:
                return
        except Exception as err:
            last_error = err
        time.sleep(2)

    raise RuntimeError(f"E2E services are not ready: {last_error}")


@pytest.fixture(scope="session")
def api_client(api_base_url: str) -> ApiClient:
    return ApiClient(base_url=api_base_url)


@pytest.fixture(scope="session")
def admin_token(api_client: ApiClient, admin_username: str, admin_password: str) -> str:
    return api_client.login(admin_username, admin_password)


@pytest.fixture()
def browser():
    options = Options()
    # options.add_argument("--window-size=1920,1080")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--no-sandbox")

    headless = os.getenv("E2E_HEADLESS", "true").lower() in {"1", "true", "yes"}
    if headless:
        options.add_argument("--headless=new")

    chrome_bin = os.getenv("CHROME_BIN")
    if chrome_bin:
        options.binary_location = chrome_bin

    driver = webdriver.Chrome(options=options)
    driver.set_page_load_timeout(30)
    try:
        yield driver
    finally:
        driver.quit()


@pytest.fixture()
def unique_username():
    def _make(prefix: str = "e2e") -> str:
        suffix = uuid.uuid4().hex[:8]
        raw = f"{prefix}{suffix}"
        return raw[:20]

    return _make


@pytest.fixture()
def default_password() -> str:
    return "password123"
