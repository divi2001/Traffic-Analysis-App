import os
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.dialects.postgresql import insert
from database import database, engine
from models import videos
from auth import oauth2_scheme, get_current_user

router = APIRouter()

# Directory where videos will be saved
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload/")
async def upload_video(file: UploadFile = File(...), token: str = Depends(oauth2_scheme)):
    """Handles video file upload and saves metadata to DB"""

    # Get user details from token
    user = await get_current_user(token)
    user_id = int(user["id"])  # ✅ Ensure user_id is an integer
   
    if not user or "id" not in user:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    # Validate file type
    if file.content_type not in ["video/mp4", "video/avi", "video/mkv"]:
        raise HTTPException(status_code=400, detail="Invalid file format")

    # Save file locally
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error saving file")
   
    # Save video details to database
    query = insert(videos).values(
        user_id=user_id,
        filename=file.filename,
        file_path=file_path
    )
    await database.execute(query)
    return {"message": "Video uploaded successfully", "filename": file.filename}