# job_management.py
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import FileResponse
from typing import List
from datetime import datetime
import os
import uuid
from fastapi import Request
import json

from sqlalchemy import select, insert, update, and_
from auth import get_current_user, oauth2_scheme  # Adjust path accordingly
from database import database  # Adjust path accordingly
from models import jobs, videos, job_videos, reports, JobStatus  # Adjust path accordingly
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Add to your imports
UPLOAD_DIR = "uploads"
REPORTS_DIR = "reports"

# Ensure directories exist
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)

@router.get("/dashboard/")
async def get_analyzing_jobs(token: str = Depends(oauth2_scheme)):
    """Get all jobs with status 'Analyzing' for Dashboard"""
    user = await get_current_user(token)
    
    query = select(jobs).where(
        and_(
            jobs.c.user_id == user["id"],
            jobs.c.status == JobStatus.ANALYZING.value
        )
    )
    job_list = await database.fetch_all(query)
    
    result = []
    for job in job_list:
        video_query = select(videos).join(job_videos).where(job_videos.c.job_id == job["id"])
        assigned_videos = await database.fetch_all(video_query)
        
        result.append({
            "id": job["id"],
            "job_number": job["job_number"],
            "name": job["name"],
            "status": job["status"],
            "latitude": job["latitude"],
            "longitude": job["longitude"],
            "additional_notes": job["additional_notes"],
            "survey_hours": job["survey_hours"],
            "created_at": job["created_at"],
            "completed_at": job["completed_at"],
            "videos": [{"id": v["id"], "filename": v["filename"]} for v in assigned_videos]
        })
    
    return result

# Add this to your job_management.py
@router.get("/historical/")
async def get_completed_jobs(token: str = Depends(oauth2_scheme)):
    """Get all completed jobs for Historical Surveys"""
    user = await get_current_user(token)
    
    query = select(jobs).where(
        jobs.c.status == JobStatus.COMPLETE.value
    ).order_by(jobs.c.completed_at.desc())
    
    job_list = await database.fetch_all(query)
    
    result = []
    for job in job_list:
        video_query = select(videos).join(job_videos).where(job_videos.c.job_id == job["id"])
        assigned_videos = await database.fetch_all(video_query)
        
        result.append({
            "id": job["id"],
            "job_number": job["job_number"],
            "name": job["name"],
            "status": job["status"],
            "latitude": job["latitude"],
            "longitude": job["longitude"],
            "additional_notes": job["additional_notes"],
            "survey_hours": job["survey_hours"],
            "created_at": job["created_at"],
            "completed_at": job["completed_at"],
            "videos": [{"id": v["id"], "filename": v["filename"]} for v in assigned_videos]
        })
    
    return result
    
@router.get("/{job_id}/")
async def get_job_details(
    job_id: int,
    token: str = Depends(oauth2_scheme)
):
    """Get detailed information for a specific job"""
    user = await get_current_user(token)
    
    job = await database.fetch_one(
        select(jobs).where(
            and_(
                jobs.c.id == job_id,
                jobs.c.user_id == user["id"]
            )
        )
    )
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    video_query = select(videos).join(job_videos).where(job_videos.c.job_id == job_id)
    assigned_videos = await database.fetch_all(video_query)
    
    # Parse survey_types from JSON string
    survey_types = json.loads(job["survey_types"]) if job["survey_types"] else []
    
    result = {
        "id": job["id"],
        "job_number": job["job_number"],
        "name": job["name"],
        "status": job["status"],
        "latitude": job["latitude"],
        "longitude": job["longitude"],
        "additional_notes": job["additional_notes"],
        "survey_hours": job["survey_hours"],
        "survey_types": survey_types,  # Add this line
        "created_at": job["created_at"],
        "completed_at": job["completed_at"],
        "videos": [{"id": v["id"], "filename": v["filename"]} for v in assigned_videos]
    }
    
    return result

from pydantic import BaseModel, field_validator
from typing import Optional

class JobCreateRequest(BaseModel):
    name: str
    job_number: str
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    additional_notes: Optional[str] = None
    survey_hours: Optional[str] = None
    survey_types: Optional[List[str]] = None  # Add this line

class JobResponse(BaseModel):
    id: int
    job_number: str
    name: str
    status: str
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    additional_notes: Optional[str] = None
    survey_hours: Optional[str] = None
    survey_types: Optional[List[str]] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    videos: List[dict]

    @field_validator('survey_types', mode='before')
    def parse_survey_types(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return []
        return v or []

# Update the create_job endpoint in job_management.py
@router.post("/create/", response_model=JobResponse)
async def create_job(
    data: JobCreateRequest,
    token: str = Depends(oauth2_scheme),
    request: Request = None
):
    logger.info("Received job creation request: %s", data.dict())

    try:
        user = await get_current_user(token)
        logger.info("Authenticated user ID: %s", user["id"])
    except Exception as auth_error:
        logger.error("Authentication failed: %s", str(auth_error))
        raise HTTPException(status_code=401, detail="Authentication error")

    # Check if job_number already exists
    try:
        existing_job = await database.fetch_one(
            select(jobs).where(jobs.c.job_number == data.job_number)
        )
        if existing_job:
            raise HTTPException(
                status_code=400,
                detail=f"Job number '{data.job_number}' already exists"
            )
    except Exception as db_check_error:
        logger.error("Database check for job_number failed: %s", str(db_check_error))
        raise HTTPException(status_code=500, detail="Database error checking job number")

    initial_status = JobStatus.ANALYZING.value

    try:
        # Convert survey_types list to JSON string
        survey_types_str = json.dumps(data.survey_types) if data.survey_types else None

        job_query = insert(jobs).values(
            user_id=user["id"],
            job_number=data.job_number,
            name=data.name,
            status=initial_status,
            latitude=data.latitude,
            longitude=data.longitude,
            additional_notes=data.additional_notes,
            survey_hours=data.survey_hours,
            survey_types=survey_types_str,
            created_at=datetime.utcnow()
        ).returning(jobs)
        
        job = await database.fetch_one(job_query)
        
        # Ensure proper response format
        return {
            **job,
            "survey_types": data.survey_types or [],
            "videos": []
        }

    except Exception as e:
        logger.error("Error creating job: %s", str(e))
        raise HTTPException(
            status_code=400,
            detail=f"Error creating job: {str(e)}"
        )
    
# Add these endpoints to your router
@router.post("/{job_id}/upload-videos/")
async def upload_job_videos(
    job_id: int,
    files: List[UploadFile] = File(...),
    token: str = Depends(oauth2_scheme)
):
    user = await get_current_user(token)
    
    # Verify job exists and belongs to user
    job = await database.fetch_one(
        select(jobs).where(
            and_(
                jobs.c.id == job_id,
                jobs.c.user_id == user["id"]
            )
        )
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    uploaded_files = []
    for file in files:
        # Generate unique filename
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
        
        # Create video record
        video_query = insert(videos).values(
            user_id=user["id"],
            filename=file.filename,
            file_path=file_path,
            uploaded_at=datetime.utcnow()
        ).returning(videos)
        video = await database.fetch_one(video_query)
        
        # Link video to job
        await database.execute(
            insert(job_videos).values(
                job_id=job_id,
                video_id=video["id"]
            )
        )
        
        uploaded_files.append({
            "original_name": file.filename,
            "saved_path": file_path
        })
    
    # Update job status to ANALYZING
    if job["status"] != JobStatus.ANALYZING.value:
        await database.execute(
            update(jobs).where(jobs.c.id == job_id).values(
                status=JobStatus.ANALYZING.value
            )
        )
    
    return {"message": "Videos uploaded successfully", "files": uploaded_files}

@router.get("/{job_id}/", response_model=JobResponse)
async def get_job_details(job_id: int, token: str = Depends(oauth2_scheme)):
    user = await get_current_user(token)
    
    job = await database.fetch_one(
        select(jobs).where(
            and_(
                jobs.c.id == job_id,
                jobs.c.user_id == user["id"]
            )
        )
    )
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # More robust survey_types handling
    try:
        survey_types = json.loads(job["survey_types"]) if job["survey_types"] else []
    except (json.JSONDecodeError, TypeError):
        survey_types = []
        # Optionally log the error
        logger.warning(f"Invalid survey_types format for job {job_id}: {job['survey_types']}")
    
    video_query = select(videos).join(job_videos).where(job_videos.c.job_id == job_id)
    assigned_videos = await database.fetch_all(video_query)
    
    return {
        "id": job["id"],
        "job_number": job["job_number"],
        "name": job["name"],
        "status": job["status"],
        "latitude": job["latitude"],
        "longitude": job["longitude"],
        "additional_notes": job["additional_notes"],
        "survey_hours": job["survey_hours"],
        "survey_types": survey_types,
        "created_at": job["created_at"],
        "completed_at": job["completed_at"],
        "videos": [{"id": v["id"], "filename": v["filename"]} for v in assigned_videos]
    }

@router.get("/{job_id}/reports/")
async def get_job_reports(
    job_id: int,
    token: str = Depends(oauth2_scheme)
):
    """Get all reports for a specific job"""
    user = await get_current_user(token)
    
    # Verify job exists and belongs to user
    job = await database.fetch_one(
        select(jobs).where(
            and_(
                jobs.c.id == job_id,
                jobs.c.user_id == user["id"]
            )
        )
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Get all reports for this job
    query = select(reports).where(reports.c.job_id == job_id)
    job_reports = await database.fetch_all(query)
    
    if not job_reports:
        raise HTTPException(status_code=404, detail="No reports found for this job")
    
    return [
        {
            "id": report["id"],
            "file_path": report["file_path"],
            "report_type": report["report_type"],
            "generated_at": report["generated_at"]
        }
        for report in job_reports
    ]

@router.get("/{job_id}/reports/{report_id}/download")
async def download_report(
    job_id: int,
    report_id: int,
    token: str = Depends(oauth2_scheme)
):
    """Download a specific report"""
    user = await get_current_user(token)
    
    # Verify job exists and belongs to user
    job = await database.fetch_one(
        select(jobs).where(
            and_(
                jobs.c.id == job_id,
                jobs.c.user_id == user["id"]
            )
        )
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Get the specific report
    report = await database.fetch_one(
        select(reports).where(
            and_(
                reports.c.id == report_id,
                reports.c.job_id == job_id
            )
        )
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    file_path = report["file_path"]
    logger.info(f"Attempting to download report from path: {file_path}")
    
    # Check if file exists and is within the reports directory
    abs_file_path = os.path.abspath(file_path)
    abs_reports_dir = os.path.abspath(REPORTS_DIR)
    
    if not os.path.exists(abs_file_path):
        logger.error(f"Report file not found at path: {abs_file_path}")
        raise HTTPException(status_code=404, detail="Report file not found")
    
    if not abs_file_path.startswith(abs_reports_dir):
        logger.error(f"Invalid file path: {abs_file_path} is not within {abs_reports_dir}")
        raise HTTPException(status_code=400, detail="Invalid file path")
    
    try:
        return FileResponse(
            path=abs_file_path,
            filename=os.path.basename(file_path),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except Exception as e:
        logger.error(f"Error serving file: {str(e)}")
        raise HTTPException(status_code=500, detail="Error serving file")

@router.post("/{job_id}/generate-report/")
async def generate_report(
    job_id: int,
    token: str = Depends(oauth2_scheme)
):
    user = await get_current_user(token)
    
    # Verify job exists and belongs to user
    job = await database.fetch_one(
        select(jobs).where(
            and_(
                jobs.c.id == job_id,
                jobs.c.user_id == user["id"]
            )
        )
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Here you would generate your Excel report
    # This is a placeholder for your actual report generation logic
    report_filename = f"report_{job['job_number']}_{datetime.utcnow().strftime('%Y%m%d')}.xlsx"
    report_path = os.path.join(REPORTS_DIR, report_filename)
    
    # Example using pandas (you'll need to install pandas and openpyxl)
    import pandas as pd
    df = pd.DataFrame({
        "Job Number": [job["job_number"]],
        "Status": [job["status"]],
        "Created At": [job["created_at"]],
        # Add more data as needed
    })
    df.to_excel(report_path, index=False)
    
    # Save report record
    await database.execute(
        insert(reports).values(
            job_id=job_id,
            file_path=report_path,
            report_type="Excel",
            generated_at=datetime.utcnow()
        )
    )
    
    return {"message": "Report generated successfully", "path": report_path}