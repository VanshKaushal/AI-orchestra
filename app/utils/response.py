def wrap_response(data=None, error=None, success=True):
    return {
        "success": success,
        "data": data,
        "error": error
    }
