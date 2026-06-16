from fastapi import Depends
from app.modules.nine_box_predictor.services import NineBoxService

def get_nine_box_service() -> NineBoxService:
    return NineBoxService()
