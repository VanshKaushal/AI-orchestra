import asyncio
from typing import Dict, Any, Optional
from datetime import datetime
from app.utils.logger import logger


class CommandRunner:
    """Execute shell commands asynchronously without blocking AI sessions.
    
    Allows running arbitrary shell commands in the background while
    AI sessions continue processing.
    """

    def __init__(self):
        self._running_processes: Dict[str, asyncio.subprocess.Process] = {}
        self._command_history: list = []

    async def execute(
        self,
        command: str,
        timeout: Optional[int] = 30,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Execute a command asynchronously"""
        cmd_id = f"{datetime.now().timestamp()}"
        
        logger.info(f"Executing command: {command}")
        
        try:
            process = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            self._running_processes[cmd_id] = process
            
            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(),
                    timeout=timeout
                )
                
                result = {
                    "cmd_id": cmd_id,
                    "session_id": session_id,
                    "command": command,
                    "success": process.returncode == 0,
                    "returncode": process.returncode,
                    "stdout": stdout.decode() if stdout else "",
                    "stderr": stderr.decode() if stderr else "",
                    "timestamp": datetime.now().isoformat()
                }
                
                self._command_history.append(result)
                if len(self._command_history) > 100:
                    self._command_history = self._command_history[-100:]
                
                return result
                
            except asyncio.TimeoutError:
                process.kill()
                logger.warning(f"Command timed out after {timeout}s: {command}")
                return {
                    "cmd_id": cmd_id,
                    "session_id": session_id,
                    "command": command,
                    "success": False,
                    "error": f"Command timed out after {timeout}s",
                    "timestamp": datetime.now().isoformat()
                }
            finally:
                if cmd_id in self._running_processes:
                    del self._running_processes[cmd_id]
                    
        except Exception as e:
            logger.error(f"Command execution error: {e}")
            return {
                "cmd_id": cmd_id,
                "session_id": session_id,
                "command": command,
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    async def execute_background(
        self,
        command: str,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Execute command in background without waiting for result"""
        cmd_id = f"bg_{datetime.now().timestamp()}"
        
        logger.info(f"Starting background command: {command}")
        
        asyncio.create_task(self.execute(command, timeout=300, session_id=session_id))
        
        return {
            "cmd_id": cmd_id,
            "session_id": session_id,
            "command": command,
            "status": "started",
            "timestamp": datetime.now().isoformat()
        }

    def get_history(self, limit: int = 10) -> list:
        """Get command history"""
        return self._command_history[-limit:]

    def get_running_count(self) -> int:
        """Get number of running processes"""
        return len(self._running_processes)

    def kill_all(self) -> int:
        """Kill all running processes"""
        count = 0
        for proc in self._running_processes.values():
            try:
                proc.kill()
                count += 1
            except Exception:
                pass
        self._running_processes.clear()
        logger.info(f"Killed {count} running processes")
        return count


command_runner = CommandRunner()