from app.database import get_database
from app.models.settings import (
    SettingsCreate, SettingsUpdate, SettingsResponse, SettingsInDB, SettingsCategory
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

            if existing:
                # Update existing settings
                settings_doc["created_at"] = existing.get("created_at", datetime.utcnow())
                settings_doc["created_by"] = existing.get("created_by", user_id)
                
                # Merge with existing data
                for key in ["company_info", "financial", "sales", "inventory", 
                           "email", "notifications", "integrations", "general"]:
                    if key not in settings_doc and key in existing:
                        settings_doc[key] = existing[key]

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
                        parsed_setting = self._parse_settings_dict(updated_dict)
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
        from app.models.settings import (
            CompanyInfo, FinancialSettings, SalesSettings, InventorySettings,
            EmailSettings, NotificationSettings, IntegrationSettings, GeneralSettings
        )

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

