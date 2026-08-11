from pydantic import BaseModel

class AdminAnalyticsResponse(BaseModel):
    total_users: int
    verified_users: int
    total_vehicles: int
    pending_vehicles: int
    total_bookings: int
    active_bookings: int
    completed_bookings: int
    total_reports: int
    pending_reports: int
    average_honor_score: float
