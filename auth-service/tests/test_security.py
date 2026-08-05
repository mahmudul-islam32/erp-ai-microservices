"""Tests for SecurityService: password hashing, JWT issuance/verification, and RBAC."""

from datetime import timedelta

import pytest
from jose import jwt

from app.config import settings
from app.models import Permission, UserRole
from app.services.security import SecurityService


@pytest.fixture
def token_payload():
    return {
        "sub": "user-123",
        "email": "alice@example.com",
        "role": UserRole.MANAGER.value,
        "permissions": [Permission.SALES_READ.value, Permission.INVENTORY_READ.value],
    }


class TestPasswordHashing:
    def test_hash_is_not_the_plaintext(self):
        hashed = SecurityService.get_password_hash("CorrectHorse1")
        assert hashed != "CorrectHorse1"
        assert hashed.startswith("$2b$")

    def test_correct_password_verifies(self):
        hashed = SecurityService.get_password_hash("CorrectHorse1")
        assert SecurityService.verify_password("CorrectHorse1", hashed) is True

    def test_wrong_password_rejected(self):
        hashed = SecurityService.get_password_hash("CorrectHorse1")
        assert SecurityService.verify_password("WrongHorse1", hashed) is False

    def test_same_password_gets_unique_salt(self):
        assert SecurityService.get_password_hash("CorrectHorse1") != SecurityService.get_password_hash(
            "CorrectHorse1"
        )

    def test_malformed_hash_returns_false_instead_of_raising(self):
        assert SecurityService.verify_password("anything", "not-a-bcrypt-hash") is False

    def test_password_beyond_bcrypt_72_byte_limit_still_verifies(self):
        # bcrypt silently truncates at 72 bytes; hashing and verification must agree.
        long_password = "a" * 100
        hashed = SecurityService.get_password_hash(long_password)
        assert SecurityService.verify_password(long_password, hashed) is True

    def test_multibyte_password_is_truncated_on_a_character_boundary(self):
        # 3-byte characters: 30 of them = 90 bytes, so truncation lands mid-character
        # unless the boundary is respected.
        truncated = SecurityService._truncate_password("あ" * 30)
        assert len(truncated.encode("utf-8")) <= 72
        assert truncated == "あ" * 24  # 24 * 3 bytes = 72


class TestAccessTokens:
    def test_access_token_round_trips(self, token_payload):
        token = SecurityService.create_access_token(token_payload)
        decoded = SecurityService.verify_token(token, token_type="access")

        assert decoded is not None
        assert decoded.user_id == "user-123"
        assert decoded.email == "alice@example.com"
        assert decoded.role == UserRole.MANAGER
        assert Permission.SALES_READ in decoded.permissions

    def test_refresh_token_rejected_when_access_expected(self, token_payload):
        refresh = SecurityService.create_refresh_token(token_payload)
        assert SecurityService.verify_token(refresh, token_type="access") is None

    def test_access_token_rejected_when_refresh_expected(self, token_payload):
        access = SecurityService.create_access_token(token_payload)
        assert SecurityService.verify_token(access, token_type="refresh") is None

    def test_expired_token_is_rejected(self, token_payload):
        expired = SecurityService.create_access_token(token_payload, expires_delta=timedelta(seconds=-10))
        assert SecurityService.verify_token(expired) is None

    def test_token_signed_with_another_key_is_rejected(self, token_payload):
        forged = jwt.encode(
            {**token_payload, "type": "access"},
            "an-attacker-supplied-key",
            algorithm=settings.algorithm,
        )
        assert SecurityService.verify_token(forged) is None

    def test_tampered_token_is_rejected(self, token_payload):
        token = SecurityService.create_access_token(token_payload)
        head, payload, sig = token.split(".")
        tampered = f"{head}.{payload}.{sig[:-4]}AAAA"
        assert SecurityService.verify_token(tampered) is None

    def test_garbage_token_is_rejected(self):
        assert SecurityService.verify_token("not.a.token") is None

    def test_token_without_subject_is_rejected(self):
        token = SecurityService.create_access_token({"email": "alice@example.com"})
        assert SecurityService.verify_token(token) is None

    def test_unknown_permissions_are_dropped(self):
        token = SecurityService.create_access_token(
            {
                "sub": "user-123",
                "email": "alice@example.com",
                "role": UserRole.EMPLOYEE.value,
                "permissions": [Permission.SALES_READ.value, "sales:forge_invoices"],
            }
        )
        decoded = SecurityService.verify_token(token)
        assert decoded.permissions == [Permission.SALES_READ]


class TestResetTokens:
    def test_reset_tokens_are_unique_and_long_enough(self):
        tokens = {SecurityService.generate_reset_token() for _ in range(100)}
        assert len(tokens) == 100
        assert all(len(t) >= 32 for t in tokens)


class TestRolePermissions:
    def test_super_admin_holds_every_permission(self):
        assert set(SecurityService.get_role_permissions(UserRole.SUPER_ADMIN)) == set(Permission)

    def test_admin_cannot_delete_users(self):
        # Deletion is reserved for super admins.
        assert Permission.USER_DELETE not in SecurityService.get_role_permissions(UserRole.ADMIN)

    def test_customer_is_limited_to_reading_sales(self):
        assert SecurityService.get_role_permissions(UserRole.CUSTOMER) == [Permission.SALES_READ]

    def test_employee_cannot_write_to_finance(self):
        employee = SecurityService.get_role_permissions(UserRole.EMPLOYEE)
        assert Permission.FINANCE_READ in employee
        assert Permission.FINANCE_CREATE not in employee
        assert Permission.FINANCE_UPDATE not in employee

    def test_custom_permissions_override_defaults(self):
        try:
            SecurityService.set_role_permissions(UserRole.VENDOR, [Permission.AI_ACCESS])
            assert SecurityService.get_role_permissions(UserRole.VENDOR) == [Permission.AI_ACCESS]
        finally:
            SecurityService._custom_role_permissions.clear()

    def test_defaults_restored_after_custom_permissions_cleared(self):
        SecurityService.set_role_permissions(UserRole.VENDOR, [Permission.AI_ACCESS])
        SecurityService._custom_role_permissions.clear()
        assert Permission.INVENTORY_READ in SecurityService.get_role_permissions(UserRole.VENDOR)


class TestPermissionChecks:
    def test_check_permission(self):
        held = [Permission.SALES_READ, Permission.INVENTORY_READ]
        assert SecurityService.check_permission(held, Permission.SALES_READ) is True
        assert SecurityService.check_permission(held, Permission.SALES_DELETE) is False

    def test_check_any_permission(self):
        held = [Permission.SALES_READ]
        assert SecurityService.check_any_permission(held, [Permission.SALES_READ, Permission.USER_DELETE]) is True
        assert SecurityService.check_any_permission(held, [Permission.USER_DELETE]) is False

    def test_check_all_permissions(self):
        held = [Permission.SALES_READ, Permission.INVENTORY_READ]
        assert SecurityService.check_all_permissions(held, [Permission.SALES_READ]) is True
        assert (
            SecurityService.check_all_permissions(held, [Permission.SALES_READ, Permission.USER_DELETE]) is False
        )

    def test_empty_permission_list_grants_nothing(self):
        assert SecurityService.check_permission([], Permission.SALES_READ) is False
        assert SecurityService.check_any_permission([], [Permission.SALES_READ]) is False


class TestPasswordPolicy:
    def test_compliant_password_accepted(self):
        valid, error = SecurityService.validate_password("Str0ngPass")
        assert valid is True
        assert error is None

    @pytest.mark.parametrize(
        "password,expected_error",
        [
            ("Sh0rt", "at least 8 characters"),
            ("nouppercase1", "uppercase letter"),
            ("NOLOWERCASE1", "lowercase letter"),
            ("NoNumbersHere", "one number"),
        ],
    )
    def test_default_policy_rejections(self, password, expected_error):
        valid, error = SecurityService.validate_password(password)
        assert valid is False
        assert expected_error in error

    def test_special_characters_not_required_by_default(self):
        valid, _ = SecurityService.validate_password("Str0ngPass")
        assert valid is True

    def test_special_characters_enforced_when_configured(self):
        policy = {
            "password_min_length": 8,
            "password_require_uppercase": True,
            "password_require_lowercase": True,
            "password_require_numbers": True,
            "password_require_special_chars": True,
        }
        invalid, error = SecurityService.validate_password("Str0ngPass", policy)
        assert invalid is False
        assert "special character" in error

        valid, _ = SecurityService.validate_password("Str0ngPass!", policy)
        assert valid is True

    def test_relaxed_policy_allows_simple_password(self):
        policy = {
            "password_min_length": 4,
            "password_require_uppercase": False,
            "password_require_lowercase": False,
            "password_require_numbers": False,
            "password_require_special_chars": False,
        }
        valid, _ = SecurityService.validate_password("abcd", policy)
        assert valid is True

    def test_falsy_but_non_false_flags_are_treated_as_disabled(self):
        # The service compares with `is True`, so a truthy-but-not-True value such as
        # the string "true" from a misconfigured env var disables the rule. This test
        # pins that documented behaviour so a future refactor has to decide deliberately.
        policy = {"password_min_length": 8, "password_require_uppercase": "true"}
        valid, _ = SecurityService.validate_password("alllowercase", policy)
        assert valid is True
