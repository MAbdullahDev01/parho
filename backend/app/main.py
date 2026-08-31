from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError

from app.api.admin.route import router as admin_router
from app.api.bookings.route import router as bookings_router
from app.api.messages.route import router as messages_router
from app.api.wallet.route import router as wallet_router
from app.api.webhooks.router import router as webhooks_router
from app.api.users.route import router as user_router
from app.api.tutors.route import router as tutor_router
from app.api.tutor_discovery.route import router as tutor_discovery_router
from app.core.error_handling import http_exception_handler, validation_exception_handler

app = FastAPI(title="Parho API")
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)

app.include_router(webhooks_router)
app.include_router(user_router)
app.include_router(tutor_router)
app.include_router(tutor_discovery_router)
app.include_router(bookings_router)
app.include_router(messages_router)
app.include_router(wallet_router)
app.include_router(admin_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
