from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class CommandRequest(BaseModel):
    command: str

@router.post("/command")
async def run_command(req: CommandRequest):
    cmd = req.command.lower()

    if cmd == "test":
        return {
            "status": "success",
            "output": "All tests passed ✅"
        }

    elif cmd == "deploy":
        return {
            "status": "success",
            "output": "Deployment simulated 🚀"
        }

    elif cmd == "lint":
        return {
            "status": "success",
            "output": "No lint issues found ✅"
        }

    return {
        "status": "error",
        "output": "Unknown command"
    }
