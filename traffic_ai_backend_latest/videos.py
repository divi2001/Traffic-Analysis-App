from fastapi import APIRouter
from sqlalchemy import select
from database import database
from models import videos  # ✅ Import videos table from models.py

router = APIRouter()

@router.get("/list/")
async def get_videos():
    query = select(videos)
    results = await database.fetch_all(query)
    return [{"id": row.id, "filename": row.filename} for row in results]