from __future__ import annotations

from types import SimpleNamespace
import uuid

import pytest
from websockets.datastructures import Headers
from websockets.http11 import Request

from app.server import (
    AUTH_SESSION_COOKIE_CLIENT_HEADER,
    AUTH_SESSION_COOKIE_CHECK_PATH,
    AUTH_SESSION_COOKIE_CLEAR_PATH,
    AUTH_SESSION_COOKIE_NAME,
    AUTH_SESSION_COOKIE_SET_PATH,
    SignalingServer,
)


def _request(path: str, headers: dict[str, str] | None = None) -> Request:
    values = Headers()
    for key, value in (headers or {}).items():
        values[key] = value
    return Request(path=path, headers=values)


@pytest.mark.asyncio
async def test_session_cookie_set_endpoint_sets_httponly_cookie() -> None:
    server = SignalingServer("127.0.0.1", 8765, None, None)
    username = f"user_{uuid.uuid4().hex[:8]}"
    session = server.auth_service.register(username, "password99")
    request = _request(
        AUTH_SESSION_COOKIE_SET_PATH,
        headers={
            AUTH_SESSION_COOKIE_CLIENT_HEADER: "1",
            "Authorization": f"Bearer {session.token}",
        },
    )

    response = await server._process_http_request(SimpleNamespace(), request)

    assert response is not None
    assert response.status_code == 200
    set_cookie = response.headers.get("Set-Cookie", "")
    assert f"{AUTH_SESSION_COOKIE_NAME}=" in set_cookie
    assert "HttpOnly" in set_cookie
    assert "SameSite=Lax" in set_cookie


@pytest.mark.asyncio
async def test_session_cookie_clear_endpoint_expires_cookie() -> None:
    server = SignalingServer("127.0.0.1", 8765, None, None)
    request = _request(AUTH_SESSION_COOKIE_CLEAR_PATH, headers={AUTH_SESSION_COOKIE_CLIENT_HEADER: "1"})

    response = await server._process_http_request(SimpleNamespace(), request)

    assert response is not None
    assert response.status_code == 200
    set_cookie = response.headers.get("Set-Cookie", "")
    assert f"{AUTH_SESSION_COOKIE_NAME}=" in set_cookie
    assert "Max-Age=0" in set_cookie
    assert "HttpOnly" in set_cookie


@pytest.mark.asyncio
async def test_session_cookie_check_endpoint_accepts_valid_cookie() -> None:
    server = SignalingServer("127.0.0.1", 8765, None, None)
    username = f"user_{uuid.uuid4().hex[:8]}"
    session = server.auth_service.register(username, "password99")
    request = _request(
        AUTH_SESSION_COOKIE_CHECK_PATH,
        headers={
            AUTH_SESSION_COOKIE_CLIENT_HEADER: "1",
            "Cookie": f"{AUTH_SESSION_COOKIE_NAME}={session.token}",
        },
    )

    response = await server._process_http_request(SimpleNamespace(), request)

    assert response is not None
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_session_cookie_check_endpoint_rejects_missing_cookie() -> None:
    server = SignalingServer("127.0.0.1", 8765, None, None)
    request = _request(AUTH_SESSION_COOKIE_CHECK_PATH, headers={AUTH_SESSION_COOKIE_CLIENT_HEADER: "1"})

    response = await server._process_http_request(SimpleNamespace(), request)

    assert response is not None
    assert response.status_code == 401


def test_session_token_from_websocket_cookie_reads_named_cookie() -> None:
    server = SignalingServer("127.0.0.1", 8765, None, None)
    websocket = SimpleNamespace(
        request=SimpleNamespace(
            headers=Headers({"Cookie": f"foo=bar; {AUTH_SESSION_COOKIE_NAME}=abc123; hello=world"})
        )
    )

    token = server._session_token_from_websocket_cookie(websocket)

    assert token == "abc123"
