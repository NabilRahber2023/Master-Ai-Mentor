"""
CSV Ingestion Pipeline for AI Mentor Chatbot.
Loads master dataset, generates embeddings, and inserts into PostgreSQL.
"""
import os
import asyncio
from typing import List, Dict, Any, Optional
import pandas as pd
from sentence_transformers import SentenceTransformer
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.chatbot.database import async_session_maker, engine, init_db
from app.chatbot.models import Student


# Embedding model - MiniLM for 384-dimensional vectors
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

# Global model instance (loaded once)
_embedding_model: Optional[SentenceTransformer] = None


def get_embedding_model() -> SentenceTransformer:
    """Get or load the embedding model (singleton)."""
    global _embedding_model
    if _embedding_model is None:
        print("Loading embedding model...")
        _embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME)
        print(f"Embedding model loaded: {EMBEDDING_MODEL_NAME}")
    return _embedding_model


def generate_embedding_text(row: Dict[str, Any]) -> str:
    """
    Generate text for embedding from student data.
    Combines: name + district + preferred_department + preferred_career_path
    """
    parts = []
    
    if row.get("name"):
        parts.append(str(row["name"]))
    if row.get("district"):
        parts.append(str(row["district"]))
    if row.get("preferred_department"):
        parts.append(str(row["preferred_department"]))
    if row.get("preferred_career_path"):
        parts.append(str(row["preferred_career_path"]))
    
    return " ".join(parts) if parts else "unknown"


def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """Generate embeddings for a list of texts."""
    model = get_embedding_model()
    embeddings = model.encode(texts, show_progress_bar=True, convert_to_numpy=True)
    return embeddings.tolist()


# Column mapping from CSV to database (handles potential variations)
COLUMN_MAPPING = {
    # Direct mappings (lowercase CSV -> snake_case DB)
    "student_id": "student_id",
    "name": "name",
    "age": "age",
    "gender": "gender",
    "district": "district",
    "family_income": "family_income",
    "budget_per_semester": "budget_per_semester",
    "study_style": "study_style",
    "attendance_rate": "attendance_rate",
    "hsc_gpa": "hsc_gpa",
    "english_proficiency": "english_proficiency",
    "math_skill": "math_skill",
    "memory_strength": "memory_strength",
    "stress_management": "stress_management",
    "study_hours_weekly": "study_hours_weekly",
    "assignment_completion_rate": "assignment_completion_rate",
    "class_participation": "class_participation",
    "project_skill_score": "project_skill_score",
    "research_interest_score": "research_interest_score",
    "extracurricular_involvement": "extracurricular_involvement",
    "current_sgpa": "current_sgpa",
    "past_semester_sgpa_1": "past_semester_sgpa_1",
    "past_semester_sgpa_2": "past_semester_sgpa_2",
    "next_semester_sgpa": "next_semester_sgpa",
    "leadership_indicator": "leadership_indicator",
    "productivity_score": "productivity_score",
    "initiative_score": "initiative_score",
    "programming_interest": "programming_interest",
    "business_interest": "business_interest",
    "creative_interest": "creative_interest",
    "hardware_interest": "hardware_interest",
    "math_interest": "math_interest",
    "communication_skill": "communication_skill",
    "analytical_skill": "analytical_skill",
    "problem_solving_score": "problem_solving_score",
    "preferred_department": "preferred_department",
    "personality_type": "personality_type",
    "tech_score": "tech_score",
    "business_score": "business_score",
    "creative_score": "creative_score",
    "research_score": "research_score",
    "work_style": "work_style",
    "soft_skill_score": "soft_skill_score",
    "career_orientation": "career_orientation",
    "preferred_career_path": "preferred_career_path",
    "performance_score": "performance_score",
    "potential_score": "potential_score",
    "nine_box_position": "nine_box_position",
}


def normalize_column_name(col: str) -> str:
    """Normalize column name to snake_case."""
    return col.lower().strip().replace(" ", "_").replace("-", "_")


def map_csv_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Map CSV columns to database column names.
    Handles variations in column naming.
    """
    # Normalize all column names
    df.columns = [normalize_column_name(col) for col in df.columns]
    
    # Rename columns based on mapping
    rename_map = {}
    for csv_col in df.columns:
        if csv_col in COLUMN_MAPPING:
            rename_map[csv_col] = COLUMN_MAPPING[csv_col]
    
    df = df.rename(columns=rename_map)
    
    # Only keep columns that exist in our model
    valid_columns = set(COLUMN_MAPPING.values())
    existing_columns = [col for col in df.columns if col in valid_columns]
    
    return df[existing_columns]


async def clear_students_table():
    """Clear existing data from students table."""
    async with async_session_maker() as session:
        await session.execute(text("TRUNCATE TABLE students CASCADE"))
        await session.commit()
        print("Cleared students table")


async def insert_students_batch(students_data: List[Dict[str, Any]], batch_size: int = 100):
    """Insert students in batches for efficiency."""
    async with async_session_maker() as session:
        for i in range(0, len(students_data), batch_size):
            batch = students_data[i:i + batch_size]
            
            for data in batch:
                student = Student(**data)
                session.add(student)
            
            await session.commit()
            print(f"Inserted batch {i // batch_size + 1} ({len(batch)} records)")


async def ingest_csv(csv_path: str, clear_existing: bool = True) -> int:
    """
    Main ingestion function.
    Loads CSV, generates embeddings, and inserts into PostgreSQL.
    
    Args:
        csv_path: Path to the master CSV file
        clear_existing: Whether to clear existing data before insert
    
    Returns:
        int: Number of rows inserted
    """
    print(f"Starting CSV ingestion from: {csv_path}")
    
    # Check file exists
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"CSV file not found: {csv_path}")
    
    # Initialize database
    await init_db()
    
    # Load CSV
    print("Loading CSV...")
    df = pd.read_csv(csv_path)
    print(f"Loaded {len(df)} rows")
    
    # Map columns
    print("Mapping columns...")
    df = map_csv_columns(df)
    print(f"Mapped columns: {list(df.columns)}")
    
    # Handle NaN values
    df = df.where(pd.notnull(df), None)
    
    # Generate embedding texts
    print("Generating embedding texts...")
    records = df.to_dict(orient="records")
    embedding_texts = [generate_embedding_text(row) for row in records]
    
    # Generate embeddings
    print("Generating embeddings...")
    embeddings = generate_embeddings(embedding_texts)
    
    # Add embeddings to records
    for i, record in enumerate(records):
        record["embedding"] = embeddings[i]
    
    # Clear existing data if requested
    if clear_existing:
        try:
            await clear_students_table()
        except Exception as e:
            print(f"Could not clear table (may not exist yet): {e}")
    
    # Insert data
    print("Inserting data...")
    await insert_students_batch(records)
    
    rows_inserted = len(records)
    print(f"Ingestion complete! Inserted {rows_inserted} students.")
    
    return rows_inserted


async def run_ingestion():
    """CLI entry point for ingestion."""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python -m app.chatbot.ingest_csv <csv_path>")
        sys.exit(1)
    
    csv_path = sys.argv[1]
    await ingest_csv(csv_path)


if __name__ == "__main__":
    asyncio.run(run_ingestion())
