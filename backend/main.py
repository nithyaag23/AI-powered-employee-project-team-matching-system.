"""
SkillSync AI - Backend Application Entrypoint.
Provides the FastAPI application instance, CORS middleware, error handling,
and router registration.
"""

from __future__ import annotations

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.api.routes import router
from backend.schemas.models import ErrorResponse

app = FastAPI(
    title="SkillSync AI — Staffing & Optimization Backend",
    version="1.0.0",
    description="Deterministic matching, combinatorial team optimization, and AI extraction adapter.",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Cross-Origin Resource Sharing (CORS) for Person 1's frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(router)


@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    """Enforces standard ErrorResponse schema on all HTTP exceptions."""
    error_payload = ErrorResponse(
        error=exc.__class__.__name__,
        detail=str(exc.detail),
        error_code=f"ERR_{exc.status_code}",
        status_code=exc.status_code,
    )
    return JSONResponse(status_code=exc.status_code, content=error_payload.model_dump())


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Fallback handler for uncaught server errors."""
    error_payload = ErrorResponse(
        error="InternalServerError",
        detail=str(exc),
        error_code="ERR_500",
        status_code=500,
    )
    return JSONResponse(status_code=500, content=error_payload.model_dump())


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)

