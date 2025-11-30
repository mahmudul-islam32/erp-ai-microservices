from app.database import get_database
from app.models.settings import (
    SettingsCreate, SettingsUpdate, SettingsResponse, SettingsInDB, SettingsCategory,
    CompanyInfo, FinancialSettings, SalesSettings, InventorySettings,
    EmailSettings, NotificationSettings, IntegrationSettings, GeneralSettings, SecuritySettings,
    AppearanceSettings
)
from typing import Optional, List, Dict, Any
from bson import ObjectId
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class SettingsService:
    def __init__(self):
        pass

    async def get_settings(self, category: Optional[SettingsCategory] = None) -> List[SettingsResponse]:
        """Get all settings or settings by category"""
        try:
            db = get_database()
            settings_collection = db.settings

            query = {}
            if category:
                query["category"] = category.value

            cursor = settings_collection.find(query).sort("category", 1)
            settings = await cursor.to_list(length=100)

            result = []
            for setting in settings:
                setting_dict = dict(setting)
                # Convert _id to id and remove _id
                if "_id" in setting_dict:
                    setting_dict["id"] = str(setting_dict["_id"])
                    del setting_dict["_id"]
                
                # Parse nested objects
                parsed_setting = self._parse_settings_dict(setting_dict)
                result.append(SettingsResponse(**parsed_setting))

            return result

        except Exception as e:
            logger.error(f"Error getting settings: {e}")
            return []

    async def get_settings_by_category(self, category: SettingsCategory) -> Optional[SettingsResponse]:
        """Get settings for a specific category"""
        try:
            db = get_database()
            settings_collection = db.settings

            setting = await settings_collection.find_one({"category": category.value})
            if not setting:
                return None

            setting_dict = dict(setting)
            if "_id" in setting_dict:
                setting_dict["id"] = str(setting_dict["_id"])
                del setting_dict["_id"]
            
            parsed_setting = self._parse_settings_dict(setting_dict)
            return SettingsResponse(**parsed_setting)

        except Exception as e:
            logger.error(f"Error getting settings by category: {e}")
            return None

    async def create_or_update_settings(
        self, 
        category: SettingsCategory, 
        settings_data: SettingsUpdate, 
        user_id: str
    ) -> SettingsResponse:
        """Create or update settings for a category"""
        try:
            db = get_database()
            settings_collection = db.settings

            # Check if settings exist for this category
            existing = await settings_collection.find_one({"category": category.value})

            # Prepare settings document
            settings_doc: Dict[str, Any] = {
                "category": category.value,
                "updated_at": datetime.utcnow(),
                "updated_by": user_id
            }

            # Add category-specific settings
            if settings_data.company_info:
                settings_doc["company_info"] = settings_data.company_info.dict(exclude_none=True)
            if settings_data.financial:
                settings_doc["financial"] = settings_data.financial.dict(exclude_none=True)
            if settings_data.sales:
                settings_doc["sales"] = settings_data.sales.dict(exclude_none=True)
            if settings_data.inventory:
                settings_doc["inventory"] = settings_data.inventory.dict(exclude_none=True)
            if settings_data.email:
                settings_doc["email"] = settings_data.email.dict(exclude_none=True)
            if settings_data.notifications:
                settings_doc["notifications"] = settings_data.notifications.dict(exclude_none=True)
            if settings_data.integrations:
                settings_doc["integrations"] = settings_data.integrations.dict(exclude_none=True)
            if settings_data.general:
                settings_doc["general"] = settings_data.general.dict(exclude_none=True)
            if settings_data.appearance:
                # Convert appearance settings to dict
                # Use exclude_unset=False to include all fields, even if set to default values
                # exclude_none=True to skip None values (frontend should send all fields with values)
                try:
                    appearance_dict = settings_data.appearance.model_dump(exclude_unset=False, exclude_none=True)
                except AttributeError:
                    appearance_dict = settings_data.appearance.dict(exclude_unset=False, exclude_none=True)
                logger.info(f"Saving appearance settings - icon_button_padding_size: {appearance_dict.get('icon_button_padding_size')}, icon_button_icon_size: {appearance_dict.get('icon_button_icon_size')}")
                logger.info(f"All appearance dict keys: {sorted(list(appearance_dict.keys()))}")
                settings_doc["appearance"] = appearance_dict
            if settings_data.security:
                # Convert to dict and explicitly include all fields, especially False values
                # Use model_dump() for Pydantic v2 or dict() for v1
                try:
                    # Try Pydantic v2 method first
                    security_dict = settings_data.security.model_dump(exclude_none=True)
                except AttributeError:
                    # Fallback to Pydantic v1 method
                    security_dict = settings_data.security.dict(exclude_none=True)
                
                # CRITICAL: Get actual field values from the model
                # Use model_dump with exclude_unset=False to include all fields including False
                try:
                    # Pydantic v2 - exclude_unset=False includes all fields, even if set to default
                    security_dict = settings_data.security.model_dump(exclude_unset=False, exclude_none=True)
                except AttributeError:
                    # Pydantic v1 fallback
                    security_dict = settings_data.security.dict(exclude_unset=False, exclude_none=True)
                
                # CRITICAL: Directly access model attributes to get actual values (not defaults)
                # This ensures False values are preserved
                security_dict["password_require_uppercase"] = getattr(settings_data.security, "password_require_uppercase", False)
                security_dict["password_require_lowercase"] = getattr(settings_data.security, "password_require_lowercase", False)
                security_dict["password_require_numbers"] = getattr(settings_data.security, "password_require_numbers", False)
                security_dict["password_require_special_chars"] = getattr(settings_data.security, "password_require_special_chars", False)
                security_dict["enable_two_factor_auth"] = getattr(settings_data.security, "enable_two_factor_auth", False)
                security_dict["require_two_factor_auth"] = getattr(settings_data.security, "require_two_factor_auth", False)
                security_dict["token_refresh_enabled"] = getattr(settings_data.security, "token_refresh_enabled", False)
                
                logger.info(f"SECURITY DICT BEFORE SAVE: password_require_numbers={security_dict.get('password_require_numbers')}, password_require_special_chars={security_dict.get('password_require_special_chars')}")
                
                logger.info(f"Saving security settings with explicit values: {security_dict}")
                settings_doc["security"] = security_dict

            if existing:
                # Update existing settings
                settings_doc["created_at"] = existing.get("created_at", datetime.utcnow())
                settings_doc["created_by"] = existing.get("created_by", user_id)
                
                # For security and appearance settings, new values completely replace old (no merge)
                # This ensures all values are properly saved
                # The frontend sends all fields, so we use the new values entirely
                
                # Merge with existing data for other categories (but NOT appearance or security)
                for key in ["company_info", "financial", "sales", "inventory", 
                           "email", "notifications", "integrations", "general"]:
                    if key not in settings_doc and key in existing:
                        settings_doc[key] = existing[key]

                # CRITICAL: For security settings, ensure all boolean fields are explicitly set
                # MongoDB will store False values, but we need to make sure they're in the $set operation
                if category == SettingsCategory.SECURITY and "security" in settings_doc:
                    # Ensure all boolean fields are explicitly included in the update
                    security_update = settings_doc["security"]
                    # MongoDB will store False values correctly, but we log to verify
                    logger.info(f"Updating MongoDB with security settings: {security_update}")
                    logger.info(f"Boolean values: password_require_numbers={security_update.get('password_require_numbers')}, password_require_special_chars={security_update.get('password_require_special_chars')}")
                
                result = await settings_collection.update_one(
                    {"_id": existing["_id"]},
                    {"$set": settings_doc}
                )
                
                if result.modified_count > 0:
                    updated = await settings_collection.find_one({"_id": existing["_id"]})
                    if updated:
                        updated_dict = dict(updated)
                        if "_id" in updated_dict:
                            updated_dict["id"] = str(updated_dict["_id"])
                            del updated_dict["_id"]
                        # Log what's actually in the database
                        if category == SettingsCategory.SECURITY and "security" in updated_dict:
                            logger.info(f"SECURITY SETTINGS FROM DATABASE: {updated_dict['security']}")
                        parsed_setting = self._parse_settings_dict(updated_dict)
                        # Log what we're about to return
                        if category == SettingsCategory.SECURITY and "security" in parsed_setting:
                            security_obj = parsed_setting["security"]
                            if hasattr(security_obj, 'password_require_numbers'):
                                logger.info(f"SECURITY MODEL VALUES: password_require_numbers={security_obj.password_require_numbers}, password_require_special_chars={security_obj.password_require_special_chars}")
                        return SettingsResponse(**parsed_setting)
            else:
                # Create new settings
                settings_doc["created_at"] = datetime.utcnow()
                settings_doc["created_by"] = user_id

                result = await settings_collection.insert_one(settings_doc)
                if result.inserted_id:
                    created = await settings_collection.find_one({"_id": result.inserted_id})
                    if created:
                        created_dict = dict(created)
                        if "_id" in created_dict:
                            created_dict["id"] = str(created_dict["_id"])
                            del created_dict["_id"]
                        parsed_setting = self._parse_settings_dict(created_dict)
                        return SettingsResponse(**parsed_setting)

            raise ValueError("Failed to create or update settings")

        except Exception as e:
            logger.error(f"Error creating/updating settings: {e}")
            raise

    def _parse_settings_dict(self, setting_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Parse settings dictionary and convert nested dicts to Pydantic models"""
        parsed = setting_dict.copy()

        # Parse nested objects if they exist
        if "company_info" in parsed and parsed["company_info"]:
            parsed["company_info"] = CompanyInfo(**parsed["company_info"])
        if "financial" in parsed and parsed["financial"]:
            parsed["financial"] = FinancialSettings(**parsed["financial"])
        if "sales" in parsed and parsed["sales"]:
            parsed["sales"] = SalesSettings(**parsed["sales"])
        if "inventory" in parsed and parsed["inventory"]:
            parsed["inventory"] = InventorySettings(**parsed["inventory"])
        if "email" in parsed and parsed["email"]:
            parsed["email"] = EmailSettings(**parsed["email"])
        if "notifications" in parsed and parsed["notifications"]:
            parsed["notifications"] = NotificationSettings(**parsed["notifications"])
        if "integrations" in parsed and parsed["integrations"]:
            parsed["integrations"] = IntegrationSettings(**parsed["integrations"])
        if "general" in parsed and parsed["general"]:
            parsed["general"] = GeneralSettings(**parsed["general"])
        if "appearance" in parsed and parsed["appearance"]:
            parsed["appearance"] = AppearanceSettings(**parsed["appearance"])
        if "security" in parsed and parsed["security"]:
            # CRITICAL: Return the security dict directly, bypassing Pydantic entirely
            # This ensures False values are preserved exactly as stored in the database
            security_dict = parsed["security"]
            if isinstance(security_dict, dict):
                logger.info(f"Parsing security settings from DB: {security_dict}")
                # Create a clean dict with explicit values from DB
                explicit_security = {}
                
                # For each field, use the DB value if it exists, otherwise use a safe default
                explicit_security["password_min_length"] = security_dict.get("password_min_length", 8)
                
                # Boolean fields - use actual DB value if exists, otherwise False (not Pydantic default True)
                explicit_security["password_require_uppercase"] = security_dict.get("password_require_uppercase", False)
                explicit_security["password_require_lowercase"] = security_dict.get("password_require_lowercase", False)
                explicit_security["password_require_numbers"] = security_dict.get("password_require_numbers", False)
                explicit_security["password_require_special_chars"] = security_dict.get("password_require_special_chars", False)
                explicit_security["enable_two_factor_auth"] = security_dict.get("enable_two_factor_auth", False)
                explicit_security["require_two_factor_auth"] = security_dict.get("require_two_factor_auth", False)
                explicit_security["token_refresh_enabled"] = security_dict.get("token_refresh_enabled", False)
                
                # Other fields
                explicit_security["max_login_attempts"] = security_dict.get("max_login_attempts", 5)
                explicit_security["account_lockout_duration_minutes"] = security_dict.get("account_lockout_duration_minutes", 30)
                explicit_security["session_timeout_minutes"] = security_dict.get("session_timeout_minutes", 30)
                explicit_security["refresh_token_expire_days"] = security_dict.get("refresh_token_expire_days", 7)
                
                # Optional fields
                if "password_expiration_days" in security_dict:
                    explicit_security["password_expiration_days"] = security_dict["password_expiration_days"]
                if "require_password_change_on_first_login" in security_dict:
                    explicit_security["require_password_change_on_first_login"] = security_dict["require_password_change_on_first_login"]
                
                logger.info(f"Explicit security settings from DB (returning as dict): {explicit_security}")
                
                # Return as dict - bypasses Pydantic defaults completely
                parsed["security"] = explicit_security
            else:
                # If it's already a SecuritySettings model, convert to dict
                if hasattr(security_dict, 'dict'):
                    parsed["security"] = security_dict.dict()
                elif hasattr(security_dict, 'model_dump'):
                    parsed["security"] = security_dict.model_dump()
                else:
                    parsed["security"] = dict(security_dict)

        return parsed

    async def delete_settings(self, category: SettingsCategory) -> bool:
        """Delete settings for a category"""
        try:
            db = get_database()
            settings_collection = db.settings

            result = await settings_collection.delete_one({"category": category.value})
            return result.deleted_count > 0

        except Exception as e:
            logger.error(f"Error deleting settings: {e}")
            return False


# Global instance
settings_service = SettingsService()

