
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.api.api import api_router

app = FastAPI(
    title="Absolute Cinema Reviews API",
    description="API для публикации и модерации рецензий на фильмы",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to Absolute Cinema Reviews API"}


@app.exception_handler(StarletteHTTPException)
def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=getattr(exc, 'headers', None)
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": str(exc)}
    )
