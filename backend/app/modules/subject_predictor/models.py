from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

# Assuming a Base is provided by the main application, but creating one here for modularity/self-containment if needed.
# In a real integrated app, this would likely import from app.core.database
Base = declarative_base()

class SubjectPredictionLog(Base):
    __tablename__ = "subject_prediction_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Input summary
    hsc_gpa = Column(Float)
    career_goal = Column(String)
    
    # Output
    recommended_department = Column(String)
    confidence_score = Column(Float)
    all_options = Column(JSON) # Store the alternatives as JSON
