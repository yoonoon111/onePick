"""
recommend_api_server.py — 제품 추천 AI FastAPI 서버

실행:
  pip install fastapi uvicorn
  python recommend_api_server.py
"""

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from recommend import RecommendEngine

app = FastAPI(title="제품 추천 AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 서버 시작 시 1번만 로드
engine = RecommendEngine('./recommend_ai_model')


# ── 요청/응답 스키마 ───────────────────────────────────────
class UserRequest(BaseModel):
    user_id: str
    top_n:   int = 5

class PreferenceRequest(BaseModel):
    preferred_cats:  list[str]
    preferred_price: str
    top_n:           int = 5


# ── 엔드포인트 ─────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "message": "제품 추천 AI 서버 실행 중"}

@app.post("/recommend")
def recommend_by_user(req: UserRequest):
    """user_id 기반 추천"""
    try:
        results = engine.recommend(user_id=req.user_id, top_n=req.top_n)
        user_info = engine.user_map.get(req.user_id, {})
        return {"user_id": req.user_id, "user_info": user_info, "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommend/by-preference")
def recommend_by_preference(req: PreferenceRequest):
    """취향 카테고리 + 가격대 기반 추천 (user_id 없이)"""
    try:
        # 임시 유저 프로필 생성
        temp_user = {
            'preferred_cats':  req.preferred_cats,
            'preferred_price': req.preferred_price,
            'activity_level':  'medium',
        }

        # 임시 user_id로 추천 (유사 유저 찾기)
        best_user_id = _find_similar_user(temp_user)
        results = engine.recommend(user_id=best_user_id, top_n=req.top_n)

        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def _find_similar_user(temp_user: dict) -> str:
    """취향이 가장 비슷한 유저 ID 찾기"""
    best_id    = list(engine.user_map.keys())[0]
    best_score = -1

    for uid, user in engine.user_map.items():
        # 카테고리 겹치는 수
        cat_overlap = len(
            set(user.get('preferred_cats', [])) &
            set(temp_user.get('preferred_cats', []))
        )
        # 가격대 일치 여부
        price_match = int(user.get('preferred_price') == temp_user.get('preferred_price'))
        score = cat_overlap * 2 + price_match

        if score > best_score:
            best_score = score
            best_id    = uid

    return best_id

@app.get("/health")
def health():
    return {"status": "ok"}


# ── 서버 실행 ──────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
