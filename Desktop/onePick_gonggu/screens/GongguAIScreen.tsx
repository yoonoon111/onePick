// screens/GongguAIScreen.tsx
// 공구 상품 가격 책정 AI 화면
// FastAPI 서버 (api_server.py) 와 연동

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
// 실제 서버:   'http://서버IP:8000'
const API_URL = 'http://localhost:8000';

// ── 타입 정의 ──────────────────────────────────────────────
interface FormData {
  name:      string;
  cost:      string;
  design:    string;
  materials: string;
  usage:     string;
}

interface ResultData {
  price:       number;
  description: string;
  time:        number;
}

// ── 메인 화면 ──────────────────────────────────────────────
export default function GongguAIScreen() {
  const [form, setForm] = useState<FormData>({
    name:      '',
    cost:      '',
    design:    '',
    materials: '',
    usage:     '',
  });
  const [result, setResult]   = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (key: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    // 필수값 검증
    if (!form.name || !form.cost || !form.design || !form.materials || !form.usage) {
      Alert.alert('입력 오류', '모든 항목을 입력해 주세요.');
      return;
    }
    if (isNaN(Number(form.cost))) {
      Alert.alert('입력 오류', '원가는 숫자로 입력해 주세요.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:      form.name,
          cost:      Number(form.cost),
          design:    form.design,
          materials: form.materials,
          usage:     form.usage,
        }),
      });

      if (!response.ok) {
        throw new Error(`서버 오류: ${response.status}`);
      }

      const data: ResultData = await response.json();
      setResult(data);

    } catch (error) {
      Alert.alert('오류', `AI 분석 실패\n${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm({ name: '', cost: '', design: '', materials: '', usage: '' });
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
          <Text style={styles.headerTitle}>🏷️ 공구 가격 책정 AI</Text>
          <Text style={styles.headerSub}>상품 정보를 입력하면 적정 판매가를 분석해 드려요</Text>
        </View>

        {/* 입력 폼 */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📦 상품 정보 입력</Text>

          <InputField
            label="상품명"
            placeholder="예: 에코 대나무 칫솔 세트 4개입"
            value={form.name}
            onChangeText={v => handleChange('name', v)}
          />
          <InputField
            label="원가 (원)"
            placeholder="예: 3800"
            value={form.cost}
            onChangeText={v => handleChange('cost', v)}
            keyboardType="numeric"
          />
          <InputField
            label="디자인"
            placeholder="예: 내추럴 우드 톤, 둥근 헤드"
            value={form.design}
            onChangeText={v => handleChange('design', v)}
          />
          <InputField
            label="원재료"
            placeholder="예: 모소 대나무, 나일론-6모"
            value={form.materials}
            onChangeText={v => handleChange('materials', v)}
          />
          <InputField
            label="사용처"
            placeholder="예: 일상 칫솔, 친환경 생활용품"
            value={form.usage}
            onChangeText={v => handleChange('usage', v)}
          />
        </View>

        {/* 분석 버튼 */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>AI 가격 분석하기</Text>
          }
        </TouchableOpacity>

        {/* 결과 */}
        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.sectionTitle}>✅ 분석 결과</Text>

            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>적정 판매가</Text>
              <Text style={styles.priceValue}>
                {result.price.toLocaleString()}원
              </Text>
              <Text style={styles.priceMargin}>
                마진율: {Math.round(((result.price - Number(form.cost)) / result.price) * 100)}%
              </Text>
            </View>

            <Text style={styles.descTitle}>📝 상품 설명</Text>
            <Text style={styles.descText}>{result.description}</Text>

            <Text style={styles.timeText}>⏱️ 분석 시간: {result.time}초</Text>

            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>다시 분석하기</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── 입력 필드 컴포넌트 ─────────────────────────────────────
function InputField({
  label, placeholder, value, onChangeText, keyboardType,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#aaa"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? 'default'}
      />
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
    marginBottom: 16,
  },

  // 입력 필드
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#222',
    backgroundColor: '#fafafa',
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
  priceBox: {
    backgroundColor: '#f0f0ff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4f46e5',
    marginBottom: 4,
  },
  priceMargin: {
    fontSize: 13,
    color: '#888',
  },
  descTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  descText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginBottom: 12,
  },
  timeText: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 16,
  },

  // 다시 분석 버튼
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
