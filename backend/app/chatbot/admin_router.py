"""
Admin Router for AI Mentor.
Provides CSV upload endpoint with chunked file handling and background ingestion.
"""
import os
import logging
import traceback
from fastapi import APIRouter, File, UploadFile, HTTPException, status, BackgroundTasks
from pydantic import BaseModel

from app.chatbot.ingest_csv import ingest_csv

logger = logging.getLogger(__name__)

# Upload directory (writable inside container)
UPLOAD_DIR = "/tmp/uploads"

# Chunk size for streaming: 1 MB
CHUNK_SIZE = 1024 * 1024

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)


class UploadAcceptedResponse(BaseModel):
    """Response model for accepted CSV upload."""
    status: str
    file: str
    message: str


class ErrorResponse(BaseModel):
    """Error response model."""
    status: str
    error: str


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


async def run_ingestion_task(file_path: str, filename: str) -> None:
    """
    Background task to run CSV ingestion.
    Logs progress, completion, and failures.
    """
    logger.info(f"[INGESTION] Starting background ingestion: {filename}")
    
    try:
        rows_inserted = await ingest_csv(file_path)
        logger.info(f"[INGESTION] Completed: {filename} - {rows_inserted} rows inserted")
    except Exception as e:
        logger.error(f"[INGESTION] Failed: {filename} - {str(e)}\n{traceback.format_exc()}")


@router.post(
    "/upload-csv",
    response_model=UploadAcceptedResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Upload CSV file for background ingestion",
    description="Upload a CSV file to ingest student data. Uses chunked streaming for large files. Ingestion runs asynchronously.",
    responses={
        202: {"model": UploadAcceptedResponse, "description": "Ingestion started"},
        400: {"model": ErrorResponse, "description": "Invalid file format"},
        500: {"model": ErrorResponse, "description": "Upload error"}
    }
)
async def upload_csv(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(
        ...,
        description="CSV file containing student data",
        media_type="text/csv"
    )
) -> UploadAcceptedResponse:
    """
    Upload CSV file with chunked write and background ingestion.
    
    - Accepts only .csv files
    - Writes file in 1MB chunks (memory-safe)
    - Ingestion runs asynchronously in background
    - Returns HTTP 202 immediately
    """
    # Validate file presence
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"status": "error", "error": "No filename provided"}
        )
    
    # Validate file extension
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"status": "error", "error": "Only .csv files are allowed"}
        )
    
    # Build file path
    file_path = f"{UPLOAD_DIR}/{file.filename}"
    
    # Chunked write (memory-safe for large files)
    try:
        with open(file_path, "wb") as out_file:
            while True:
                chunk = await file.read(CHUNK_SIZE)
                if not chunk:
                    break
                out_file.write(chunk)
        logger.info(f"Saved uploaded file: {file_path}")
    except Exception as e:
        logger.error(f"Failed to save file: {e}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"status": "error", "error": "Failed to save uploaded file"}
        )
    
    # Schedule background ingestion
    background_tasks.add_task(run_ingestion_task, file_path, file.filename)
    
    logger.info(f"Scheduled background ingestion: {file.filename}")
    
    # Return immediately with 202 Accepted
    return UploadAcceptedResponse(
        status="accepted",
        file=file.filename,
        message="CSV upload completed, ingestion running in background"
    )
