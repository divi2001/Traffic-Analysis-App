# job_management.py
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import FileResponse
from typing import List
from datetime import datetime
import os
import uuid
from fastapi import Request

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
    
    # Fetch the job
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
    
    # Fetch associated videos
    video_query = select(videos).join(job_videos).where(job_videos.c.job_id == job_id)
    assigned_videos = await database.fetch_all(video_query)
    
    # Format the response
    result = {
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
    }
    
    return result

from pydantic import BaseModel
from typing import Optional

class JobCreateRequest(BaseModel):
    name: str
    job_number: str
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    additional_notes: Optional[str] = None
    survey_hours: Optional[str] = None

class JobResponse(BaseModel):
    id: int
    job_number: str
    name: str
    status: str
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    additional_notes: Optional[str] = None
    survey_hours: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    videos: List[dict]


# Update the create_job endpoint in job_management.py
@router.post("/create/", response_model=JobResponse)
async def create_job(
    data: JobCreateRequest,
    token: str = Depends(oauth2_scheme),
    request: Request = None  # Optional: to inspect incoming headers or IP if needed
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
        job_query = insert(jobs).values(
            user_id=user["id"],
            job_number=data.job_number,
            name=data.name,
            status=initial_status,  # Set to ANALYZING immediately
            latitude=data.latitude,
            longitude=data.longitude,
            additional_notes=data.additional_notes,
            survey_hours=data.survey_hours,
            created_at=datetime.utcnow()
        ).returning(jobs)
        
        job = await database.fetch_one(job_query)
        return {
            **job,
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

@router.get("/{job_id}/reports/")
async def get_job_reports(
    job_id: int,
    token: str = Depends(oauth2_scheme)
):
    logger.info(f"Attempting to fetch reports for job_id: {job_id}")
    
    try:
        # Verify job exists
        logger.info(f"Querying database for job_id: {job_id}")
        job = await database.fetch_one(
            select(jobs).where(jobs.c.id == job_id)
        )
        
        if not job:
            logger.error(f"Job not found for job_id: {job_id}")
            raise HTTPException(status_code=404, detail="Job not found")
        
        logger.info(f"Found job: {job}")
        
        logger.info(f"Job status type: {type(job['status'])}, value: {repr(job['status'])}")

        # Verify job is complete
        # Verify job is complete
        if job["status"] != JobStatus.COMPLETE:
            error_msg = f"Job status is {job['status']}, not COMPLETE"
            logger.error(error_msg)
            raise HTTPException(
                status_code=400,
                detail="Reports are only available for completed jobs"
            )
        
        # Get all reports for this job
        logger.info(f"Fetching reports for job_id: {job_id}")
        reports_list = await database.fetch_all(
            select(reports).where(reports.c.job_id == job_id)
        )
        
        logger.info(f"Found {len(reports_list)} reports for job_id: {job_id}")
        return reports_list
        
    except HTTPException as he:
        # Re-raise HTTP exceptions (404, 400, etc.)
        logger.error(f"HTTPException in get_job_reports: {he.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_job_reports: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while fetching reports"
        )

@router.get("/{job_id}/reports/{report_id}/download")
async def download_report(
    job_id: int,
    report_id: int,
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
    
    # Get the report
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
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Report file not found")
    
    # Determine filename
    filename = f"report_{job['job_number']}_{report['id']}.xlsx"
    
    # Return file for download
    from fastapi.responses import FileResponse
    return FileResponse(
        file_path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=filename
    )

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