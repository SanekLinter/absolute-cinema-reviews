from __future__ import annotations

import time
from typing import Callable

from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as ec
from selenium.webdriver.support.ui import WebDriverWait


LONG_CONTENT = (
    "Это подробный текст рецензии для системного тестирования. "
    "Он соответствует ограничениям длины и отражает пользовательский сценарий. "
    "Повествование включает сюжет, актёрскую игру и визуальный стиль фильма."
)


def wait_visible(driver, by: By, selector: str, timeout: int = 15):
    return WebDriverWait(driver, timeout).until(ec.visibility_of_element_located((by, selector)))


def wait_clickable(driver, by: By, selector: str, timeout: int = 15):
    return WebDriverWait(driver, timeout).until(ec.element_to_be_clickable((by, selector)))


def wait_url_to_be(driver, fragment: str, timeout: int = 15):
    WebDriverWait(driver, timeout).until(ec.url_to_be(fragment))


def wait_url_contains(driver, fragment: str, timeout: int = 15):
    WebDriverWait(driver, timeout).until(ec.url_contains(fragment))


def wait_review_link(driver, review_id: int, timeout: int = 20):
    return WebDriverWait(driver, timeout).until(
        ec.presence_of_element_located((By.XPATH, f"//a[contains(@href, '/reviews/{review_id}')]"))
    )


def open_sign_up(driver, base_url: str):
    driver.get(f"{base_url}/sign-up")
    wait_visible(driver, By.CSS_SELECTOR, "input[name='username']")


def open_sign_in(driver, base_url: str):
    driver.get(f"{base_url}/sign-in")
    wait_visible(driver, By.CSS_SELECTOR, "input[name='username']")


def ui_register(driver, base_url: str, username: str, password: str):
    open_sign_up(driver, base_url)
    driver.find_element(By.CSS_SELECTOR, "input[name='username']").send_keys(username)
    driver.find_element(By.CSS_SELECTOR, "input[name='password']").send_keys(password)
    wait_clickable(driver, By.XPATH, "//button[contains(., 'Зарегистрироваться')]").click()


def ui_login(driver, base_url: str, username: str, password: str):
    open_sign_in(driver, base_url)
    driver.find_element(By.CSS_SELECTOR, "input[name='username']").send_keys(username)
    driver.find_element(By.CSS_SELECTOR, "input[name='password']").send_keys(password)
    wait_clickable(driver, By.XPATH, "//button[contains(., 'Войти')]").click()


def fill_review_form(driver, title: str, movie_title: str, content: str):
    wait_visible(driver, By.CSS_SELECTOR, "input[name='title']")
    title_input = driver.find_element(By.CSS_SELECTOR, "input[name='title']")
    title_input.clear()
    title_input.send_keys(title)

    movie_input = driver.find_element(By.CSS_SELECTOR, "input[name='movie_title']")
    movie_input.clear()
    movie_input.send_keys(movie_title)

    content_input = driver.find_element(By.CSS_SELECTOR, "textarea[name='content']")
    content_input.clear()
    content_input.send_keys(content)


def submit_search(driver, query: str):
    search_input = wait_visible(driver, By.CSS_SELECTOR, "input[placeholder='Искать рецензии...']")
    search_input.clear()
    search_input.send_keys(query)
    search_input.send_keys(Keys.ENTER)


def create_user_and_login(api_client, browser, base_url: str, unique_username: Callable[[str], str], password: str):
    username = unique_username("usr")
    api_client.register(username, password)
    ui_login(browser, base_url, username, password)
    wait_visible(browser, By.XPATH, "//button[contains(., 'Выйти')]")
    return username


def create_pending_review(api_client, unique_username, password: str):
    username = unique_username("author")
    token = api_client.register(username, password)
    review_id = api_client.create_review(
        token,
        title=f"Pending {username}",
        movie_title="Inception",
        content=LONG_CONTENT,
    )
    return username, token, review_id


def create_approved_review(api_client, admin_token: str, unique_username, password: str):
    username, token, review_id = create_pending_review(api_client, unique_username, password)
    api_client.approve_review(admin_token, review_id)
    return username, token, review_id


def test_anonymous_sees_only_approved_reviews(browser, frontend_base_url, api_client, admin_token, unique_username, default_password):
    _, _, approved_id = create_approved_review(api_client, admin_token, unique_username, default_password)
    _, _, pending_id = create_pending_review(api_client, unique_username, default_password)

    browser.get(f"{frontend_base_url}/")
    wait_visible(browser, By.CSS_SELECTOR, "body")
    assert f"/reviews/{approved_id}" in browser.page_source
    assert f"/reviews/{pending_id}" not in browser.page_source
    assert "Вход" in browser.page_source
    like_btn = browser.find_element(By.XPATH, "//img[contains(@alt,'Не лайкнут')]/parent::button")
    assert like_btn.get_attribute("disabled") is not None

def test_user_can_register_via_ui(browser, frontend_base_url, unique_username, default_password):
    username = unique_username("reg")

    ui_register(browser, frontend_base_url, username, default_password)

    wait_url_to_be(browser, f"{frontend_base_url}/")
    assert "Выйти" in browser.page_source
    assert username in browser.page_source

def test_user_can_login_via_ui(browser, frontend_base_url, api_client, unique_username, default_password):
    username = unique_username("login")
    api_client.register(username, default_password)

    ui_login(browser, frontend_base_url, username, default_password)

    wait_url_to_be(browser, f"{frontend_base_url}/")
    assert "Выйти" in browser.page_source
    assert username in browser.page_source


def test_login_with_wrong_password_shows_error(browser, frontend_base_url, api_client, unique_username, default_password):
    username = unique_username("badpw")
    api_client.register(username, default_password)

    ui_login(browser, frontend_base_url, username, "wrongpass1")

    wait_visible(browser, By.XPATH, "//*[contains(text(), 'Invalid credentials')]")


def test_duplicate_username_registration_shows_error(browser, frontend_base_url, api_client, unique_username, default_password):
    username = unique_username("dupe")
    api_client.register(username, default_password)

    ui_register(browser, frontend_base_url, username, default_password)

    wait_visible(browser, By.XPATH, "//*[contains(text(), 'Username already exists')]")


def test_authorized_user_can_create_review(browser, frontend_base_url, api_client, unique_username, default_password):
    create_user_and_login(api_client, browser, frontend_base_url, unique_username, default_password)

    browser.get(f"{frontend_base_url}/reviews/new")
    fill_review_form(browser, "Новый отзыв E2E", "Interstellar", LONG_CONTENT)
    wait_clickable(browser, By.XPATH, "//button[contains(., 'Отправить на модерацию')]").click()

    wait_url_contains(browser, "reviews/")
    wait_visible(browser, By.XPATH, "//*[contains(text(), 'pending')]")


def test_create_review_with_short_content_shows_validation_error(browser, frontend_base_url, api_client, unique_username, default_password):
    create_user_and_login(api_client, browser, frontend_base_url, unique_username, default_password)

    browser.get(f"{frontend_base_url}/reviews/new")
    fill_review_form(browser, "Короткий отзыв", "Tenet", "Слишком коротко")
    wait_clickable(browser, By.XPATH, "//button[contains(., 'Отправить на модерацию')]").click()

    wait_visible(browser, By.XPATH, "//*[contains(text(), 'Минимум 100 символов')]")


def test_admin_can_approve_review(browser, frontend_base_url, api_client, admin_username, admin_password, unique_username, default_password):
    author_username, _, review_id = create_pending_review(api_client, unique_username, default_password)

    ui_login(browser, frontend_base_url, admin_username, admin_password)
    wait_visible(browser, By.XPATH, "//button[contains(., 'Выйти')]")
    browser.get(f"{frontend_base_url}/reviews/{review_id}?mode=moderation")
    wait_clickable(browser, By.XPATH, "//button[contains(., 'Одобрить')]").click()

    wait_url_to_be(browser, f"{frontend_base_url}/moderation")

    browser.get(f"{frontend_base_url}/")
    wait_review_link(browser, review_id)
    assert f"/reviews/{review_id}" in browser.page_source


def test_admin_can_reject_review(browser, frontend_base_url, api_client, admin_username, admin_password, unique_username, default_password):
    _, _, review_id = create_pending_review(api_client, unique_username, default_password)

    ui_login(browser, frontend_base_url, admin_username, admin_password)
    wait_visible(browser, By.XPATH, "//button[contains(., 'Выйти')]")
    browser.get(f"{frontend_base_url}/reviews/{review_id}?mode=moderation")
    wait_clickable(browser, By.XPATH, "//button[contains(., 'Отклонить')]").click()

    wait_url_to_be(browser, f"{frontend_base_url}/moderation")

    browser.get(f"{frontend_base_url}/")
    wait_visible(browser, By.XPATH, "/html/body/div/div/main/div/div[2]")
    assert f"/reviews/{review_id}" not in browser.page_source


def test_non_admin_cannot_access_moderation(browser, frontend_base_url, api_client, unique_username, default_password):
    create_user_and_login(api_client, browser, frontend_base_url, unique_username, default_password)

    browser.get(f"{frontend_base_url}/moderation")

    wait_url_contains(browser, "/")
    assert "Рецензии на модерации" not in browser.page_source
