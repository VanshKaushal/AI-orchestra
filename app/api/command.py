from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class CommandRequest(BaseModel):
    command: str

from app.utils.response import wrap_response

@router.post("/command")
async def run_command(req: CommandRequest):
    cmd = req.command.lower()

    if cmd == "test":
        return wrap_response(data={
            "status": "success",
            "output": "All tests passed ✅"
        })

    elif cmd == "deploy":
        return wrap_response(data={
            "status": "success",
            "output": "Deployment simulated 🚀"
        })

    elif cmd == "lint":
        return wrap_response(data={
            "status": "success",
            "output": "No lint issues found ✅"
        })

    return wrap_response(success=False, error="Unknown command", data={
        "status": "error",
        "output": "Unknown command"
    })
