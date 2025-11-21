from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional, Any, Dict
from datetime import datetime

from app.database.connection import get_database

router = APIRouter(prefix="/benefits", tags=["Benefits"])


async def get_db():
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not connected")
    return db


@router.get("/plans")
async def list_benefit_plans(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db=Depends(get_db),
):
    query: Dict[str, Any] = {}
    if category:
        query["category"] = category
    if status:
        query["status"] = status
    cursor = db.benefit_plans.find(query).skip(skip).limit(limit)
    items = await cursor.to_list(length=None)
    for item in items:
        item["id"] = str(item["_id"])
        if "_id" in item:
            del item["_id"]
    return items


@router.get("/enrollments")
async def list_benefit_enrollments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    employee_id: Optional[str] = Query(None),
    plan_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db=Depends(get_db),
):
    query: Dict[str, Any] = {}
    if employee_id:
        query["employee_id"] = employee_id
    if plan_id:
        query["benefit_plan_id"] = plan_id
    if status:
        query["status"] = status
    cursor = db.employee_benefits.find(query).skip(skip).limit(limit)
    items = await cursor.to_list(length=None)
    for item in items:
        item["id"] = str(item["_id"])
        if "_id" in item:
            del item["_id"]
    return items


@router.get("/summary")
async def get_benefits_summary(db=Depends(get_db)):
    total_plans = await db.benefit_plans.count_documents({})
    active_plans = await db.benefit_plans.count_documents({"status": "Active"})
    total_enrollments = await db.employee_benefits.count_documents({})
    active_enrollments = await db.employee_benefits.count_documents({"status": "active"})
    return {
        "total_plans": total_plans,
        "active_plans": active_plans,
        "total_enrollments": total_enrollments,
        "active_enrollments": active_enrollments,
        "generated_at": datetime.utcnow(),
    }


