"""
03_test_local.py  (VSCode 로컬에서 실행)
KoBART 파인튜닝 모델로 주문 파싱 CLI 테스트

실행:
  python 03_test_local.py --model_path ./finetuned_model          # 대화형
  python 03_test_local.py --model_path ./finetuned_model --sample # 샘플 4개
"""

import argparse, json, os, re, sys, uuid
from datetime import datetime

import torch
from transformers import AutoTokenizer, BartForConditionalGeneration

DEFAULT_MODEL_PATH = './final_model'
MAX_INPUT_LEN  = 128
MAX_TARGET_LEN = 512    # ✅ JSON 잘림 방지

# 고정 스키마 기본값
EMPTY_ORDER = {
    "customer": {"name": None, "phone": None, "address": None},
    "product":  {"product_name": None, "option": None, "quantity": 1, "price": None},
    "delivery": {"shipping_memo": None},
}


def enforce_schema(parsed: dict) -> dict:
    """모델 출력에서 고정 스키마만 추출. 누락 필드는 기본값으로 채움."""
    result = {}
    for section, defaults in EMPTY_ORDER.items():
        src = parsed.get(section, {}) or {}
        result[section] = {k: src.get(k, v) for k, v in defaults.items()}
    return result


def extract_json(raw: str) -> dict:
    """중괄호 깊이 추적으로 잘린 JSON도 복구해서 파싱."""
    try:
        depth, end_idx = 0, -1
        for i, ch in enumerate(raw):
            if ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    end_idx = i
                    break
        if end_idx != -1:
            return json.loads(raw[:end_idx + 1])
    except json.JSONDecodeError:
        pass
    return {}


# ── 모델 로더 ──────────────────────────────────────────────
class OrderParser:
    def __init__(self, model_path: str):
        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"모델 경로를 찾을 수 없습니다: {model_path}\n"
                "Colab 학습 후 finetuned_model/ 폴더를 복사해 주세요."
            )
        print(f"📥 모델 로드 중: {model_path}")
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"   디바이스: {self.device}")

        self.tokenizer = AutoTokenizer.from_pretrained(
            'gogamza/kobart-base-v2',   # 로컬 대신 원본 모델에서 토크나이저 로드
            use_fast=True,
)
        self.model = BartForConditionalGeneration.from_pretrained(
            model_path,
            torch_dtype=torch.float16 if self.device.type == 'cuda' else torch.float32,
        ).to(self.device)
        self.model.eval()
        print("   ✅ 로드 완료!\n")

    def _generate_raw(self, input_text: str) -> str:
        inputs = self.tokenizer(
            f"주문: {input_text}",
            return_tensors='pt',
            truncation=True,
            max_length=MAX_INPUT_LEN,
        )
        # ✅ BART가 지원하지 않는 token_type_ids 제거
        inputs.pop('token_type_ids', None)
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            output_ids = self.model.generate(
                **inputs,
                max_new_tokens=MAX_TARGET_LEN,
                num_beams=2,
                length_penalty=1.0,
                early_stopping=True,
            )
        return self.tokenizer.decode(output_ids[0], skip_special_tokens=True)

    def parse(self, input_text: str) -> dict:
        raw     = self._generate_raw(input_text)
        parsed  = extract_json(raw)
        success = bool(parsed)
        order_body = enforce_schema(parsed)

        return {
            "order_id":      str(uuid.uuid4()),
            "created_at":    datetime.now().isoformat(),
            "parse_success": success,
            **order_body,
            "raw_input": input_text,
        }

    def parse_and_save(self, input_text: str, output_dir: str = 'orders') -> tuple:
        order = self.parse(input_text)
        os.makedirs(output_dir, exist_ok=True)
        filename = f"order_{order['order_id'][:8]}.json"
        filepath = os.path.join(output_dir, filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(order, f, ensure_ascii=False, indent=2)
        return order, filepath


# ── 출력 포맷터 ────────────────────────────────────────────
def print_result(order: dict, filepath: str) -> None:
    ok = order.get('parse_success', False)
    print("\n" + "=" * 58)
    print(f"  {'✅ 파싱 성공' if ok else '⚠️  파싱 실패 (기본값 적용)'}")
    print("=" * 58)
    print(f"  📄 저장 경로 : {filepath}")
    print(f"  🆔 주문 ID   : {order['order_id']}")
    print(f"  🕐 생성 시각 : {order['created_at']}")
    print()
    sections = [
        ("👤 고객 정보", "customer",  ["name", "phone", "address"]),
        ("📦 상품 정보", "product",   ["product_name", "option", "quantity", "price"]),
        ("🚚 배송 정보", "delivery",  ["shipping_memo"]),
    ]
    for title, key, fields in sections:
        data = order.get(key, {})
        print(f"  {title}")
        for f in fields:
            v = data.get(f)
            print(f"     {f}: {v if v is not None else '—'}")
        print()
    print(f"  📝 원본 입력 : \"{order['raw_input']}\"")
    print("=" * 58 + "\n")


# ── 샘플 케이스 ────────────────────────────────────────────
SAMPLE_INPUTS = [
    "스마트 텀블러 블랙 500ml 2개 주문이요. 홍길동 010-1234-5678 서울시 강남구 테헤란로 123. 문 앞에 놔주세요.",
    "캠핑 의자 카키 기본형 1개요. 부산시 해운대구 우동 456. 경비실에 맡겨주세요.",
    "LED 무드등 화이트 소형 3개 주문합니다. 010-9876-5432 이민준.",
    "친환경 노트북 파우치 15인치 그레이 주문해요. 대구시 수성구 범어동 789.",
]


# ── 메인 ───────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description='크라우드펀딩 주문 파서')
    parser.add_argument('--model_path', default=DEFAULT_MODEL_PATH)
    parser.add_argument('--sample', action='store_true', help='샘플 4개 일괄 테스트')
    args = parser.parse_args()

    try:
        order_parser = OrderParser(args.model_path)
    except FileNotFoundError as e:
        print(f"❌ {e}")
        sys.exit(1)

    if args.sample:
        print("🧪 샘플 테스트 모드 — 4개 케이스\n")
        success_count = 0
        for i, sample in enumerate(SAMPLE_INPUTS, 1):
            print(f"[{i}/{len(SAMPLE_INPUTS)}] {sample[:55]}...")
            order, filepath = order_parser.parse_and_save(sample, output_dir='orders/test')
            print_result(order, filepath)
            if order.get('parse_success'):
                success_count += 1
        print(f"📊 결과: {success_count}/{len(SAMPLE_INPUTS)}건 성공\n")

    else:
        print("🛒 크라우드펀딩 주문 파서 (대화형 모드)")
        print("   주문 내용을 자유롭게 입력하세요. 종료: 'q'\n")
        while True:
            user_input = input("주문 입력 > ").strip()
            if user_input.lower() in ('q', 'quit', 'exit'):
                print("종료합니다.")
                break
            if not user_input:
                print("⚠️  입력이 비어 있습니다.\n")
                continue
            print("⏳ 추론 중...")
            order, filepath = order_parser.parse_and_save(user_input)
            print_result(order, filepath)


if __name__ == '__main__':
    main()
