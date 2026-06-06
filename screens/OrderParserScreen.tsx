// screens/OrderParserScreen.tsx
// 크라우드펀딩 주문 자동 파싱 AI 화면
// FastAPI 서버 (order_api_server.py) 와 연동

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';

// ── API 서버 주소 ───────────────────────────────────────────
// 로컬 테스트: 'http://localhost:8000'
// 실제 기기:   'http://본인Mac_IP:8000'
const API_URL = 'http://localhost:8000';

// ── 타입 정의 ──────────────────────────────────────────────
interface Customer {
  name:    string | null;
  phone:   string | null;
  address: string | null;
}

interface Product {
  product_name: string | null;
  option:       string | null;
  quantity:     number;
  price:        number | null;
}

interface Delivery {
  shipping_memo: string | null;
}

interface OrderResult {
  order_id:      string;
  created_at:    string;
  parse_success: boolean;
  customer:      Customer;
  product:       Product;
  delivery:      Delivery;
  raw_input:     string;
}

// ── 메인 화면 ──────────────────────────────────────────────
export default function OrderParserScreen() {
  const [input, setInput]     = useState('');
  const [result, setResult]   = useState<OrderResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleParse = async () => {
    if (!input.trim()) {
      Alert.alert('입력 오류', '주문 내용을 입력해 주세요.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/parse`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text: input }),
      });

      if (!response.ok) throw new Error(`서버 오류: ${response.status}`);

      const data: OrderResult = await response.json();
      setResult(data);

    } catch (error) {
      Alert.alert('오류', `주문 파싱 실패\n${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setInput('');
    setResult(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🛒 주문 자동 파싱 AI</Text>
          <Text style={styles.headerSub}>주문 내용을 자유롭게 입력하면 자동으로 정리해 드려요</Text>
        </View>

        {/* 입력 영역 */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📝 주문 내용 입력</Text>
          <TextInput
            style={styles.textArea}
            placeholder={
              '예시:\n스마트 텀블러 블랙 500ml 2개 주문이요.\n홍길동 010-1234-5678\n서울시 강남구 테헤란로 123.\n문 앞에 놔주세요.'
            }
            placeholderTextColor="#aaa"
            value={input}
            onChangeText={setInput}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {/* 파싱 버튼 */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleParse}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>주문 자동 파싱하기</Text>
          }
        </TouchableOpacity>

        {/* 결과 */}
        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.sectionTitle}>
                {result.parse_success ? '✅ 파싱 성공' : '⚠️ 파싱 실패'}
              </Text>
              <Text style={styles.orderId}>#{result.order_id.slice(0, 8)}</Text>
            </View>

            {/* 고객 정보 */}
            <SectionBox title="👤 고객 정보">
              <InfoRow label="이름"   value={result.customer.name} />
              <InfoRow label="연락처" value={result.customer.phone} />
              <InfoRow label="주소"   value={result.customer.address} />
            </SectionBox>

            {/* 상품 정보 */}
            <SectionBox title="📦 상품 정보">
              <InfoRow label="상품명" value={result.product.product_name} />
              <InfoRow label="옵션"   value={result.product.option} />
              <InfoRow label="수량"   value={String(result.product.quantity)} />
              <InfoRow
                label="가격"
                value={result.product.price
                  ? `${result.product.price.toLocaleString()}원`
                  : null}
              />
            </SectionBox>

            {/* 배송 정보 */}
            <SectionBox title="🚚 배송 정보">
              <InfoRow label="배송 메모" value={result.delivery.shipping_memo} />
            </SectionBox>

            {/* 원본 입력 */}
            <View style={styles.rawBox}>
              <Text style={styles.rawLabel}>📝 원본 입력</Text>
              <Text style={styles.rawText}>{result.raw_input}</Text>
            </View>

            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>다시 파싱하기</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── 섹션 박스 컴포넌트 ─────────────────────────────────────
function SectionBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionBox}>
      <Text style={styles.sectionBoxTitle}>{title}</Text>
      {children}
    </View>
  );
}

// ── 정보 행 컴포넌트 ───────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, !value && styles.infoValueNull]}>
        {value ?? '—'}
      </Text>
    </View>
  );
}

// ── 스타일 ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },

  // 헤더
  header: {
    marginBottom: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 14,
    color: '#666',
  },

  // 카드
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 12,
  },

  // 텍스트 입력
  textArea: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#222',
    backgroundColor: '#fafafa',
    minHeight: 130,
  },

  // 버튼
  button: {
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // 결과 카드
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderId: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },

  // 섹션 박스
  sectionBox: {
    backgroundColor: '#f8f8ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  sectionBoxTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4f46e5',
    marginBottom: 10,
  },

  // 정보 행
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
    width: 70,
  },
  infoValue: {
    fontSize: 13,
    color: '#222',
    flex: 1,
    textAlign: 'right',
  },
  infoValueNull: {
    color: '#bbb',
  },

  // 원본 입력
  rawBox: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  rawLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  rawText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },

  // 다시 파싱 버튼
  resetButton: {
    borderWidth: 1,
    borderColor: '#4f46e5',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '600',
  },
});
