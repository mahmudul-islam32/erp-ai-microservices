"""
Clear all invoices from the database
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database.connection import connect_to_mongo, get_database


async def clear_invoices():
    """Clear all invoices from the database"""
    print("🗑️  Clearing all invoices from database...")
    
    await connect_to_mongo()
    db = get_database()
    
    result = await db.invoices.delete_many({})
    print(f"✅ Deleted {result.deleted_count} invoices")
    
    print("✅ Invoice cleanup complete!")


if __name__ == "__main__":
    try:
        asyncio.run(clear_invoices())
    except Exception as e:
        print(f"\n❌ Cleanup failed: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

