from fastapi import APIRouter

router = APIRouter()


@router.get("/test")
def test_reviews():
    return {"msg": "Reviews router works"}