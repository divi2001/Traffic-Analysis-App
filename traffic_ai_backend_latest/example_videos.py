# example_videos.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy.sql import select, update
from database import database
from models import example_videos
from typing import List
import datetime

router = APIRouter()

class ExampleVideo(BaseModel):
    id: int
    title: str
    description: str
    video_path: str
    thumbnail_path: str
    category: str
    views_count: int
    uploaded_at: datetime.datetime

@router.get("/", response_model=List[ExampleVideo])
async def get_example_videos():
    """Get all active example videos"""
    query = select(example_videos).where(example_videos.c.is_active == True)
    videos = await database.fetch_all(query)
    return videos

@router.post("/{video_id}/view/")
async def increment_video_views(video_id: int):
    """Increment the view count for a video"""
    # First check if video exists
    video_query = select(example_videos).where(example_videos.c.id == video_id)
    video = await database.fetch_one(video_query)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Update view count
    update_query = update(example_videos).where(example_videos.c.id == video_id).values(
        views_count=example_videos.c.views_count + 1
    )
    await database.execute(update_query)
    
    return {"message": "View count updated"}