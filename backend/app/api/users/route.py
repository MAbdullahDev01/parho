from fastapi import APIRouter, status
from app.schemas.user import SetRoleRequest
from app.services.user_service import set_user_role

router = APIRouter(prefix="/api/backend/users", tags=["users"])

# Updates user role in Clerk
@router.patch("/role", status_code=status.HTTP_200_OK)
def update_role(payload: SetRoleRequest):
    set_user_role(payload.clerk_id, payload.role)
    return {"status": "updated"}