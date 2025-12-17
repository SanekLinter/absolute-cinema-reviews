from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, reviews, users

app = FastAPI(
    title="Absolute Cinema Reviews API",
    description="API для публикации и модерации рецензий на фильмы",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS (для React на localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(reviews.router, prefix="/api/reviews", tags=["reviews"])
app.include_router(users.router, prefix="/api/users", tags=["users"])


@app.get("/")
def read_root():
    return {"message": "Welcome to Absolute Cinema Reviews API"}
