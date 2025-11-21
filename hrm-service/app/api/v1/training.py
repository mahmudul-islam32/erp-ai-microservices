from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional, Any, Dict
from datetime import datetime

from app.database.connection import get_database

router = APIRouter(prefix="/training", tags=["Training"])


async def get_db():
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not connected")
    return db


@router.get("/programs")
async def list_training_programs(
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
    cursor = db.training_programs.find(query).skip(skip).limit(limit)
    items = await cursor.to_list(length=None)
    # Normalize ids
    for item in items:
        item["id"] = str(item["_id"])
        if "_id" in item:
            del item["_id"]
    return items


@router.get("/enrollments")
async def list_training_enrollments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    employee_id: Optional[str] = Query(None),
    training_program_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db=Depends(get_db),
):
    query: Dict[str, Any] = {}
    if employee_id:
        query["employee_id"] = employee_id
    if training_program_id:
        query["training_program_id"] = training_program_id
    if status:
        query["status"] = status
    cursor = db.employee_training.find(query).skip(skip).limit(limit)
    items = await cursor.to_list(length=None)
    for item in items:
        item["id"] = str(item["_id"])
        if "_id" in item:
            del item["_id"]
    return items


@router.get("/summary")
async def get_training_summary(db=Depends(get_db)):
    total_programs = await db.training_programs.count_documents({})
    total_enrollments = await db.employee_training.count_documents({})
    completed_enrollments = await db.employee_training.count_documents({"status": {"$in": ["completed", "certified"]}})
    in_progress = await db.employee_training.count_documents({"status": {"$in": ["in_progress", "enrolled"]}})
    return {
        "total_programs": total_programs,
        "total_enrollments": total_enrollments,
        "completed_enrollments": completed_enrollments,
        "in_progress_enrollments": in_progress,
        "generated_at": datetime.utcnow(),
    }


