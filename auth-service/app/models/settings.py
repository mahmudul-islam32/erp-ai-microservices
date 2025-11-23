from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class SettingsCategory(str, Enum):
    COMPANY = "company"
    FINANCIAL = "financial"
    SALES = "sales"
    INVENTORY = "inventory"
    HR = "hr"
    EMAIL = "email"
    NOTIFICATIONS = "notifications"
    INTEGRATIONS = "integrations"
    GENERAL = "general"
    SECURITY = "security"
    APPEARANCE = "appearance"


# Company Information Settings
class CompanyInfo(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=200)
    legal_name: Optional[str] = None
    registration_number: Optional[str] = None
    tax_id: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[Dict[str, str]] = None  # {street, city, state, zip_code, country}


# Financial Settings
class FinancialSettings(BaseModel):
    default_currency: str = Field(default="USD", max_length=3)
    fiscal_year_start_month: int = Field(default=1, ge=1, le=12)
    tax_rate: float = Field(default=0.0, ge=0, le=1)
    decimal_places: int = Field(default=2, ge=0, le=4)
    invoice_prefix: Optional[str] = Field(None, max_length=10)
    invoice_number_format: Optional[str] = None  # e.g., "INV-{year}-{number}"


# Sales Settings
class SalesSettings(BaseModel):
    default_payment_terms: str = Field(default="net_30", max_length=50)
    default_shipping_method: Optional[str] = None
    default_tax_rate: float = Field(default=0.0, ge=0, le=1)
    quote_validity_days: int = Field(default=30, ge=1, le=365)
    auto_generate_invoice: bool = Field(default=False)
    invoice_due_days: int = Field(default=30, ge=1, le=365)


# Inventory Settings
class InventorySettings(BaseModel):
    low_stock_threshold: float = Field(default=10.0, ge=0)
    auto_reorder: bool = Field(default=False)
    default_warehouse: Optional[str] = None
    track_serial_numbers: bool = Field(default=False)
    track_batch_numbers: bool = Field(default=False)


# Email/SMTP Settings
class EmailSettings(BaseModel):
    smtp_server: Optional[str] = None
    smtp_port: int = Field(default=587, ge=1, le=65535)
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_use_tls: bool = Field(default=True)
    from_email: Optional[EmailStr] = None
    from_name: Optional[str] = None


# Notification Settings
class NotificationSettings(BaseModel):
    email_notifications: bool = Field(default=True)
    push_notifications: bool = Field(default=True)
    notify_on_order_created: bool = Field(default=True)
    notify_on_invoice_created: bool = Field(default=True)
    notify_on_payment_received: bool = Field(default=True)
    notify_on_low_stock: bool = Field(default=True)


# Integration Settings
class IntegrationSettings(BaseModel):
    stripe_enabled: bool = Field(default=False)
    stripe_secret_key: Optional[str] = None
    stripe_publishable_key: Optional[str] = None
    stripe_webhook_secret: Optional[str] = None


# General Settings
class GeneralSettings(BaseModel):
    timezone: str = Field(default="UTC", max_length=50)
    date_format: str = Field(default="YYYY-MM-DD", max_length=20)
    time_format: str = Field(default="24h", max_length=10)  # 12h or 24h
    language: str = Field(default="en", max_length=10)
    items_per_page: int = Field(default=25, ge=10, le=100)


# Appearance Settings
class AppearanceSettings(BaseModel):
    # Font Settings
    font_family: str = Field(default="Inter", max_length=100)  # Inter, Roboto, Open Sans, etc.
    font_size_base: str = Field(default="14px", max_length=10)  # Base font size
    font_size_small: str = Field(default="12px", max_length=10)
    font_size_large: str = Field(default="16px", max_length=10)
    font_weight_normal: int = Field(default=400, ge=100, le=900)
    font_weight_medium: int = Field(default=500, ge=100, le=900)
    font_weight_bold: int = Field(default=700, ge=100, le=900)
    
    # Color Settings
    primary_color: str = Field(default="#3b82f6", max_length=7)  # Hex color
    primary_color_dark: str = Field(default="#2563eb", max_length=7)
    secondary_color: str = Field(default="#64748b", max_length=7)
    accent_color: str = Field(default="#8b5cf6", max_length=7)
    success_color: str = Field(default="#22c55e", max_length=7)
    warning_color: str = Field(default="#f59e0b", max_length=7)
    danger_color: str = Field(default="#ef4444", max_length=7)
    background_color: str = Field(default="#ffffff", max_length=7)
    background_color_dark: str = Field(default="#0f172a", max_length=7)
    text_color: str = Field(default="#1e293b", max_length=7)
    text_color_dark: str = Field(default="#f1f5f9", max_length=7)
    
    # UI Settings
    border_radius: str = Field(default="0.375rem", max_length=20)  # Tailwind default
    border_radius_large: str = Field(default="0.5rem", max_length=20)
    spacing_unit: str = Field(default="0.25rem", max_length=20)  # Base spacing unit
    
    # Additional CSS
    custom_css: Optional[str] = None  # Custom CSS rules


# Security Settings
class SecuritySettings(BaseModel):
    password_min_length: int = Field(default=8, ge=6, le=128)
    password_require_uppercase: bool = Field(default=True)
    password_require_lowercase: bool = Field(default=True)
    password_require_numbers: bool = Field(default=True)
    password_require_special_chars: bool = Field(default=False)
    password_expiration_days: Optional[int] = Field(None, ge=0, le=365)  # None = never expire
    require_password_change_on_first_login: bool = Field(default=False)
    max_login_attempts: int = Field(default=5, ge=3, le=10)
    account_lockout_duration_minutes: int = Field(default=30, ge=5, le=1440)  # 5 min to 24 hours
    session_timeout_minutes: int = Field(default=30, ge=5, le=1440)  # 5 min to 24 hours
    enable_two_factor_auth: bool = Field(default=False)
    require_two_factor_auth: bool = Field(default=False)
    token_refresh_enabled: bool = Field(default=True)
    refresh_token_expire_days: int = Field(default=7, ge=1, le=90)
    
    def model_dump(self, **kwargs):
        """Override model_dump to ensure all fields are included with actual values"""
        # Get the default dump
        try:
            result = super().model_dump(**kwargs)
        except AttributeError:
            # Pydantic v1 fallback
            result = self.dict(**kwargs)
        # Ensure all boolean fields use actual model values, not defaults
        # The model's __dict__ contains the actual field values
        for field_name in ['password_require_uppercase', 'password_require_lowercase', 
                          'password_require_numbers', 'password_require_special_chars',
                          'enable_two_factor_auth', 'require_two_factor_auth', 'token_refresh_enabled']:
            if hasattr(self, field_name):
                result[field_name] = getattr(self, field_name)
        return result
    
    def dict(self, **kwargs):
        """Override dict for Pydantic v1 compatibility"""
        result = super().dict(**kwargs) if hasattr(super(), 'dict') else {}
        # Ensure all boolean fields use actual model values
        for field_name in ['password_require_uppercase', 'password_require_lowercase', 
                          'password_require_numbers', 'password_require_special_chars',
                          'enable_two_factor_auth', 'require_two_factor_auth', 'token_refresh_enabled']:
            if hasattr(self, field_name):
                result[field_name] = getattr(self, field_name)
        return result


# Complete Settings Model
class SettingsCreate(BaseModel):
    category: SettingsCategory
    company_info: Optional[CompanyInfo] = None
    financial: Optional[FinancialSettings] = None
    sales: Optional[SalesSettings] = None
    inventory: Optional[InventorySettings] = None
    email: Optional[EmailSettings] = None
    notifications: Optional[NotificationSettings] = None
    integrations: Optional[IntegrationSettings] = None
    general: Optional[GeneralSettings] = None
    security: Optional[SecuritySettings] = None
    appearance: Optional[AppearanceSettings] = None


class SettingsUpdate(BaseModel):
    company_info: Optional[CompanyInfo] = None
    financial: Optional[FinancialSettings] = None
    sales: Optional[SalesSettings] = None
    inventory: Optional[InventorySettings] = None
    email: Optional[EmailSettings] = None
    notifications: Optional[NotificationSettings] = None
    integrations: Optional[IntegrationSettings] = None
    general: Optional[GeneralSettings] = None
    security: Optional[SecuritySettings] = None
    appearance: Optional[AppearanceSettings] = None


class SettingsResponse(BaseModel):
    id: str = Field(alias="_id")
    category: SettingsCategory
    company_info: Optional[CompanyInfo] = None
    financial: Optional[FinancialSettings] = None
    sales: Optional[SalesSettings] = None
    inventory: Optional[InventorySettings] = None
    email: Optional[EmailSettings] = None
    notifications: Optional[NotificationSettings] = None
    integrations: Optional[IntegrationSettings] = None
    general: Optional[GeneralSettings] = None
    security: Optional[Dict[str, Any]] = None  # Changed to Dict to bypass Pydantic defaults
    appearance: Optional[AppearanceSettings] = None
    created_at: datetime
    updated_at: datetime
    created_by: str
    updated_by: Optional[str] = None

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "SettingsResponse":
        """Convert MongoDB document to SettingsResponse"""
        if "_id" in data:
            data["id"] = str(data["_id"])
        return cls(**data)

    class Config:
        populate_by_name = True


class SettingsInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    category: SettingsCategory
    company_info: Optional[Dict[str, Any]] = None
    financial: Optional[Dict[str, Any]] = None
    sales: Optional[Dict[str, Any]] = None
    inventory: Optional[Dict[str, Any]] = None
    email: Optional[Dict[str, Any]] = None
    notifications: Optional[Dict[str, Any]] = None
    integrations: Optional[Dict[str, Any]] = None
    general: Optional[Dict[str, Any]] = None
    security: Optional[Dict[str, Any]] = None
    appearance: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str
    updated_by: Optional[str] = None

    class Config:
        populate_by_name = True

