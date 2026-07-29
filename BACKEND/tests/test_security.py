import uuid

import pytest

from app.core.security import (
    InvalidTokenError,
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_password_hash_round_trip() -> None:
    encoded = hash_password("correct horse battery staple")

    assert "correct horse battery staple" not in encoded
    assert verify_password("correct horse battery staple", encoded)
    assert not verify_password("wrong password", encoded)


def test_access_token_round_trip_and_tamper_detection() -> None:
    user_id = uuid.uuid4()
    token = create_access_token(user_id, "test-secret", 60)

    assert decode_access_token(token, "test-secret") == user_id
    with pytest.raises(InvalidTokenError):
        decode_access_token(f"{token}tampered", "test-secret")


def test_expired_access_token_is_rejected() -> None:
    token = create_access_token(uuid.uuid4(), "test-secret", -1)

    with pytest.raises(InvalidTokenError):
        decode_access_token(token, "test-secret")
