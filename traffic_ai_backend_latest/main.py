# main.py
from fastapi import FastAPI
from database import database, engine, metadata
from auth import router as auth_router
from video_upload import router as video_router
from job_management import router as job_router
from fastapi.middleware.cors import CORSMiddleware
from videos import router as videolist_router
from example_videos import router as example_videos_router  # Add this import

app = FastAPI()

# Create tables
#metadata.drop_all(engine) +
metadata.create_all(engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (for development)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

# Include all routes
app.include_router(auth_router, prefix="/auth")
app.include_router(video_router, prefix="/videos")
app.include_router(job_router, prefix="/jobs")
app.include_router(videolist_router, prefix="/videolist")
app.include_router(example_videos_router, prefix="/example-videos")  # Add this line