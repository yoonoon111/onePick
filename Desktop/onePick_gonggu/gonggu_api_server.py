"""
gonggu_api_server.py — 공구 가격 책정 AI FastAPI 서버

실행:
  pip install fastapi uvicorn
  python gonggu_api_server.py
"""

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from inference import GongguProductAI

app = FastAPI(title="공구 가격 책정 AI API")

# React Native에서 호출 가능하도록 CORS 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 서버 시작 시 1번만 로드
ai = GongguProductAI()


# ── 요청/응답 스키마 ───────────────────────────────────────
class AnalyzeRequest(BaseModel):
    name:      str
    cost:      int
    design:    str
    materials: str
    usage:     str

class AnalyzeResponse(BaseModel):
    price:       int
    description: str
    time:        float


# ── 엔드포인트 ─────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "message": "공구 가격 책정 AI 서버 실행 중"}

@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest):
    try:
        result = ai.generate(
            name=req.name,
            cost=req.cost,
            design=req.design,
            materials=req.materials,
            usage=req.usage,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "ok"}


# ── 서버 실행 ──────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
