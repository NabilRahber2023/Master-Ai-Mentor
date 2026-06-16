from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()

class NineBoxPredictionLog(Base):
    __tablename__ = "nine_box_prediction_logs"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, index=True, nullable=True) # Optional if we are logging predictions for specific students
    predicted_performance_level = Column(Integer)
    predicted_potential_level = Column(Integer)
    grid_position = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Can extend with all input features if auditing is required
