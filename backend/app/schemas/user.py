from pydantic import BaseModel
from typing import Literal

class SetRoleRequest(BaseModel):
    clerk_id: str
    role: Literal["student", "tutor"]