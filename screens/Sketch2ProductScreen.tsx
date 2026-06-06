// screens/Sketch2ProductScreen.tsx
// 그림판 + 스케치 → 제품 이미지 생성 AI 화면

import React, { useRef, useState } from 'react';
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
  Image,
  Dimensions,
} from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';

const API_URL = 'http://localhost:8000';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PROMPT_EXAMPLES = [
  'product photo of a white ceramic mug',
  'product photo of a modern desk lamp, white background',
  'product photo of a minimalist wallet, leather texture',
  'product photo of a blue water bottle',
];

interface GenerateResult {
  image_base64: string;
  seed:         number;
  prompt:       string;
  time:         number;
}

export default function Sketch2ProductScreen() {
  const signatureRef              = useRef<any>(null);
  const [prompt, setPrompt]       = useState('');
  const [sketchB64, setSketchB64] = useState<string | null>(null);
  const [result, setResult]       = useState<GenerateResult | null>(null);
  const [loading, setLoading]     = useState(false);
  const [hasDrawn, setHasDrawn]   = useState(false);

  // 그림 완료 시 base64 저장
  const handleSignature = (signature: string) => {
    // "data:image/png;base64,..." 형태에서 base64만 추출
    const base64 = signature.replace('data:image/png;base64,', '');
    setSketchB64(base64);
    setHasDrawn(true);
  };

  // 캔버스 초기화
  const handleClear = () => {
    signatureRef.current?.clearSignature();
    setSketchB64(null);
    setHasDrawn(false);
    setResult(null);
  };

  // 이미지 생성 요청
  const handleGenerate = async () => {
    if (!hasDrawn) {
      Alert.alert('스케치 필요', '먼저 그림판에 스케치를 그려주세요.');
      return;
    }
    if (!prompt.trim()) {
      Alert.alert('입력 오류', '제품 설명 프롬프트를 입력해 주세요.');
      return;
    }

    // base64 추출 (아직 안 됐으면 강제 읽기)
    if (!sketchB64) {
      signatureRef.current?.readSignature();
      Alert.alert('잠시 후 다시 시도해 주세요.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/generate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          prompt,
          sketch_base64: sketchB64,
        }),
      });

      if (!response.ok) throw new Error(`서버 오류: ${response.status}`);

      const data: GenerateResult = await response.json();
      setResult(data);

    } catch (error) {
      Alert.alert('오류', `이미지 생성 실패\n${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 그림판 스타일 (WebView 내부)
  const canvasStyle = `
    .m-signature-pad {
      border: none;
      box-shadow: none;
    }
    .m-signature-pad--body {
      border: none;
    }
    body {
      background: #ffffff;
    }
  `;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={true}
      >

        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>✏️ 스케치 → 제품 이미지 AI</Text>
          <Text style={styles.headerSub}>직접 스케치를 그리면 AI가 제품 이미지를 생성해 드려요</Text>
        </View>

        {/* 그림판 */}
        <View style={styles.card}>
          <View style={styles.canvasTitleRow}>
            <Text style={styles.sectionTitle}>🖊️ 스케치 그리기</Text>
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
              <Text style={styles.clearBtnText}>지우기</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.canvasWrapper}>
            <SignatureCanvas
              ref={signatureRef}
              onOK={handleSignature}
              onBegin={() => setHasDrawn(true)}
              descriptionText=""
              clearText="지우기"
              confirmText="완료"
              webStyle={canvasStyle}
              backgroundColor="white"
              penColor="black"
              dotSize={3}
              minWidth={2}
              maxWidth={4}
              style={styles.canvas}
              autoClear={false}
              imageType="image/png"
            />
          </View>

          {hasDrawn && (
            <TouchableOpacity
              style={styles.readBtn}
              onPress={() => signatureRef.current?.readSignature()}
            >
              <Text style={styles.readBtnText}>✅ 스케치 저장</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 프롬프트 입력 */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📝 제품 설명 입력</Text>
          <TextInput
            style={styles.textArea}
            placeholder="예: professional product photo of a ceramic mug, studio lighting"
            placeholderTextColor="#aaa"
            value={prompt}
            onChangeText={setPrompt}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Text style={styles.exampleTitle}>💡 예시 프롬프트</Text>
          {PROMPT_EXAMPLES.map((example, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.exampleChip}
              onPress={() => setPrompt(example)}
            >
              <Text style={styles.exampleText}>{example}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 생성 버튼 */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleGenerate}
          disabled={loading}
        >
          {loading
            ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.loadingText}>이미지 생성 중... (30초~1분 소요)</Text>
              </View>
            )
            : <Text style={styles.buttonText}>🎨 제품 이미지 생성하기</Text>
          }
        </TouchableOpacity>

        {/* 결과 */}
        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.sectionTitle}>✅ 생성 결과</Text>

            <Image
              source={{ uri: `data:image/png;base64,${result.image_base64}` }}
              style={styles.resultImage}
              resizeMode="contain"
            />

            <TouchableOpacity style={styles.resetButton} onPress={handleClear}>
              <Text style={styles.resetButtonText}>다시 그리기</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  scroll: {
    padding: 20,
    paddingBottom: 100,
  },
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
  canvasTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  clearBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
  canvasWrapper: {
    height: 280,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  canvas: {
    flex: 1,
  },
  readBtn: {
    marginTop: 10,
    backgroundColor: '#eef2ff',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  readBtnText: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '600',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#222',
    backgroundColor: '#fafafa',
    minHeight: 80,
    marginBottom: 16,
  },
  exampleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
  },
  exampleChip: {
    backgroundColor: '#f0f0ff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  exampleText: {
    fontSize: 12,
    color: '#4f46e5',
    lineHeight: 18,
  },
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
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resultImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    marginBottom: 16,
  },
  metaBox: {
    backgroundColor: '#f8f8ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  metaLabel: {
    fontSize: 13,
    color: '#666',
    width: 80,
  },
  metaValue: {
    fontSize: 13,
    color: '#222',
    flex: 1,
  },
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
