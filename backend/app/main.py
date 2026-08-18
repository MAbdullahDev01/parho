from fastapi import FastAPI

from app.api.webhooks.router import router as webhooks_router

app = FastAPI(title="Parho API")

app.include_router(webhooks_router)

@app.get("/health")
def health_check():
    return {"status": "ok"}