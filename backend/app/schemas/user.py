from pydantic import BaseModel
from typing import Literal

# Represents a request to set a user's role in Clerk.
class SetRoleRequest(BaseModel):
    clerk_id: str
    role: Literal["student", "tutor"]