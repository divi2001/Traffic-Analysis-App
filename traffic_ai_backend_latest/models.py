# models.py
from sqlalchemy import Table, Column, Integer, String, ForeignKey, DateTime, Enum, Boolean
from sqlalchemy.orm import registry
from database import metadata
import datetime
from enum import Enum as PyEnum

class JobStatus(PyEnum):
    ANALYZING = "ANALYZING"
    COMPLETE = "COMPLETE"
    PENDING = "PENDING"

mapper_registry = registry()

users = Table(
    "users",
    metadata,
    Column("id", Integer, primary_key=True, index=True),
    Column("name", String, nullable=False),
    Column("email", String, unique=True, index=True),
    Column("password", String, nullable=False),
)

videos = Table(
    "videos",
    metadata,
    Column("id", Integer, primary_key=True, index=True),
    Column("user_id", Integer, ForeignKey("users.id")),
    Column("filename", String, nullable=False),
    Column("file_path", String, nullable=False),
    Column("uploaded_at", DateTime, default=datetime.datetime.utcnow),
    Column("processed", Integer, default=0),
)

jobs = Table(
    "jobs",
    metadata,
    Column("id", Integer, primary_key=True, index=True),
    Column("user_id", Integer, ForeignKey("users.id")),
    Column("job_number", String, unique=True, index=True),  # Added job_number field
    Column("name", String, nullable=False),
    Column("status", Enum(JobStatus), default=JobStatus.PENDING.value),
    Column("latitude", String),  # Added for location data
    Column("longitude", String),  # Added for location data
    Column("additional_notes", String),  # Added for notes
    Column("survey_hours", String),  # Added for survey hours
    Column("created_at", DateTime, default=datetime.datetime.utcnow),
    Column("completed_at", DateTime),  # Added completion date
)

job_videos = Table(
    "job_videos",
    metadata,
    Column("id", Integer, primary_key=True, index=True),
    Column("job_id", Integer, ForeignKey("jobs.id")),
    Column("video_id", Integer, ForeignKey("videos.id")),
)

reports = Table(
    "reports",
    metadata,
    Column("id", Integer, primary_key=True, index=True),
    Column("job_id", Integer, ForeignKey("jobs.id"), nullable=False),
    Column("file_path", String, nullable=False),
    Column("report_type", String, nullable=False),  # e.g., "Excel", "PDF"
    Column("generated_at", DateTime, default=datetime.datetime.utcnow),
)

example_videos = Table(
    "example_videos",
    metadata,
    Column("id", Integer, primary_key=True, index=True),
    Column("title", String, nullable=False),
    Column("description", String),
    Column("video_path", String, nullable=False),  # Path to stored video file
    Column("thumbnail_path", String, nullable=False),  # Path to thumbnail image
    Column("uploaded_at", DateTime, default=datetime.datetime.utcnow),
    Column("is_active", Boolean, default=True),  # To toggle visibility
    Column("category", String),  # e.g., "Pedestrian Tracking", "Turn Counts", etc.
    Column("views_count", Integer, default=0),  # Track popularity
)