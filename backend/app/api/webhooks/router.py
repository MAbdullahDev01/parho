from fastapi import APIRouter
from app.api.webhooks import clerk

router = APIRouter(prefix="/webhooks", tags=["webhooks"])
router.include_router(clerk.router)