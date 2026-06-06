"""
order_api_server.py — 주문 파싱 AI FastAPI 서버

실행:
  pip install fastapi uvicorn
  python order_api_server.py
"""

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from test_local import OrderParser

app = FastAPI(title="주문 파싱 AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 서버 시작 시 1번만 로드
parser = OrderParser('./final_model')


# ── 요청/응답 스키마 ───────────────────────────────────────
class ParseRequest(BaseModel):
    text: str

class ParseResponse(BaseModel):
    order_id:      str
    created_at:    str
    parse_success: bool
    customer:      dict
    product:       dict
    delivery:      dict
    raw_input:     str


# ── 엔드포인트 ─────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "message": "주문 파싱 AI 서버 실행 중"}

@app.post("/parse", response_model=ParseResponse)
def parse_order(req: ParseRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="주문 내용을 입력해 주세요.")
    try:
        order, _ = parser.parse_and_save(req.text)
        return order
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "ok"}


# ── 서버 실행 ──────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
