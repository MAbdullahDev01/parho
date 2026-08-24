from fastapi import FastAPI

from app.api.webhooks.router import router as webhooks_router
from app.api.users.route import router as user_router
from app.api.tutors.route import router as tutor_router

app = FastAPI(title="Parho API")

app.include_router(webhooks_router)
app.include_router(user_router)
app.include_router(tutor_router)

@app.get("/health")
def health_check():
    return {"status": "ok"}