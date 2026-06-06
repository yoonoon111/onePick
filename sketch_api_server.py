"""
sketch_api_server.py — 스케치 → 제품 이미지 생성 AI FastAPI 서버
"""

import base64
import io
import time
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from PIL import Image
from test_inference import Sketch2ProductModel

app = FastAPI(title="스케치 → 제품 이미지 생성 AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = Sketch2ProductModel('.')


class GenerateRequest(BaseModel):
    prompt:           str
    sketch_base64:    Optional[str] = None   # 프론트에서 그린 스케치 base64
    seed:             int   = 42
    steps:            int   = 30
    guidance:         float = 7.5
    controlnet_scale: float = 0.8


@app.get("/")
def root():
    return {"status": "ok", "message": "스케치 → 제품 이미지 생성 AI 서버 실행 중"}

@app.post("/generate")
def generate(req: GenerateRequest):
    try:
        start = time.time()

        # ✅ 프론트에서 그린 스케치가 있으면 사용, 없으면 빈 흰 이미지
        if req.sketch_base64:
            sketch_bytes = base64.b64decode(req.sketch_base64)
            sketch = Image.open(io.BytesIO(sketch_bytes)).convert("RGB")
            sketch = sketch.resize((512, 512))
        else:
            sketch = Image.new("RGB", (512, 512), (255, 255, 255))

        result_img = model.generate(
            prompt=req.prompt,
            sketch_image=sketch,
            seed=req.seed,
            num_inference_steps=req.steps,
            guidance_scale=req.guidance,
            controlnet_conditioning_scale=req.controlnet_scale,
        )

        buffer = io.BytesIO()
        result_img.save(buffer, format="PNG")
        img_base64 = base64.b64encode(buffer.getvalue()).decode()

        return {
            "image_base64": img_base64,
            "seed":         req.seed,
            "prompt":       req.prompt,
            "time":         round(time.time() - start, 1),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
