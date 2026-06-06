// screens/RecommendScreen.tsx
// 크라우드펀딩 제품 추천 AI 화면
// 취향 카테고리 선택 → 추천 결과 표시

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';

// ── API 서버 주소 ───────────────────────────────────────────
const API_URL = 'http://localhost:8000';

// ── 카테고리 목록 ──────────────────────────────────────────
const CATEGORIES = [
  { id: '캠핑',        emoji: '⛺' },
  { id: '주방',        emoji: '🍳' },
  { id: '라이프스타일', emoji: '🏠' },
  { id: '테크',        emoji: '💡' },
  { id: '패션',        emoji: '👗' },
  { id: '뷰티',        emoji: '💄' },
  { id: '반려동물',    emoji: '🐾' },
  { id: '운동',        emoji: '🏃' },
];

const PRICE_RANGES = ['1만원대', '2만원대', '3만원대', '4만원대', '5만원 이상'];

// ── 타입 정의 ──────────────────────────────────────────────
interface RecommendItem {
  product_id:   string;
  name:         string;
  category:     string;
  price_range:  string;
  tags:         string[];
  funding_rate: number;
  score:        number;
  abandon_prob: number;
  svd_score:    number;
  cat_match?:   boolean;
  price_match?: boolean;
}

// ── 메인 화면 ──────────────────────────────────────────────
export default function RecommendScreen() {
  const [selectedCats, setSelectedCats]     = useState<string[]>([]);
  const [selectedPrice, setSelectedPrice]   = useState<string>('');
  const [results, setResults]               = useState<RecommendItem[]>([]);
  const [loading, setLoading]               = useState(false);
  const [searched, setSearched]             = useState(false);

  const toggleCategory = (cat: string) => {
    setSelectedCats(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleRecommend = async () => {
    if (selectedCats.length === 0) {
      Alert.alert('선택 필요', '취향 카테고리를 1개 이상 선택해 주세요.');
      return;
    }
    if (!selectedPrice) {
      Alert.alert('선택 필요', '선호 가격대를 선택해 주세요.');
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      const response = await fetch(`${API_URL}/recommend/by-preference`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          preferred_cats:  selectedCats,
          preferred_price: selectedPrice,
          top_n:           5,
        }),
      });

      if (!response.ok) throw new Error(`서버 오류: ${response.status}`);

      const data = await response.json();
      setResults(data.results);
      setSearched(true);

    } catch (error) {
      Alert.alert('오류', `추천 실패\n${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedCats([]);
    setSelectedPrice('');
    setResults([]);
    setSearched(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>

      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎯 맞춤 제품 추천 AI</Text>
        <Text style={styles.headerSub}>취향을 선택하면 딱 맞는 펀딩 제품을 추천해 드려요</Text>
      </View>

      {/* 카테고리 선택 */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📂 취향 카테고리 선택</Text>
        <Text style={styles.sectionHint}>여러 개 선택 가능해요</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map(cat => {
            const selected = selectedCats.includes(cat.id);
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                onPress={() => toggleCategory(cat.id)}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>
                  {cat.id}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 가격대 선택 */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>💰 선호 가격대</Text>
        <View style={styles.priceRow}>
          {PRICE_RANGES.map(price => {
            const selected = selectedPrice === price;
            return (
              <TouchableOpacity
                key={price}
                style={[styles.priceChip, selected && styles.priceChipSelected]}
                onPress={() => setSelectedPrice(price)}
              >
                <Text style={[styles.priceText, selected && styles.priceTextSelected]}>
                  {price}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 추천 버튼 */}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleRecommend}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>맞춤 제품 추천받기</Text>
        }
      </TouchableOpacity>

      {/* 결과 */}
      {searched && results.length > 0 && (
        <View>
          <Text style={styles.resultTitle}>✨ 추천 결과 Top {results.length}</Text>
          {results.map((item, index) => (
            <View key={item.product_id} style={styles.resultCard}>
              <View style={styles.resultRank}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <View style={styles.resultContent}>
                <View style={styles.resultHeader}>
                  <Text style={styles.productName}>{item.name}</Text>
                  {item.cat_match && <Text style={styles.matchBadge}>취향 ✅</Text>}
                </View>
                <Text style={styles.productCategory}>
                  {item.category} · {item.price_range}
                </Text>
                {item.tags.length > 0 && (
                  <View style={styles.tagRow}>
                    {item.tags.map(tag => (
                      <View key={tag} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
                <View style={styles.scoreRow}>
                  <Text style={styles.fundingRate}>🔥 {item.funding_rate}% 달성</Text>
                  <Text style={styles.score}>점수 {item.score}</Text>
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>다시 선택하기</Text>
          </TouchableOpacity>
        </View>
      )}

      {searched && results.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>추천 결과가 없어요 😢</Text>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>다시 선택하기</Text>
          </TouchableOpacity>
        </View>
      )}

    </ScrollView>
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
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 12,
    color: '#999',
    marginBottom: 14,
  },

  // 카테고리 그리드
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
    gap: 4,
  },
  categoryChipSelected: {
    borderColor: '#4f46e5',
    backgroundColor: '#eef2ff',
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#4f46e5',
    fontWeight: '700',
  },

  // 가격대
  priceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  priceChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
  },
  priceChipSelected: {
    borderColor: '#4f46e5',
    backgroundColor: '#eef2ff',
  },
  priceText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  priceTextSelected: {
    color: '#4f46e5',
    fontWeight: '700',
  },

  // 버튼
  button: {
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // 결과
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 14,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resultRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  rankText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  resultContent: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
    flex: 1,
  },
  matchBadge: {
    fontSize: 11,
    color: '#4f46e5',
    fontWeight: '600',
  },
  productCategory: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#f0f0ff',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 11,
    color: '#4f46e5',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fundingRate: {
    fontSize: 12,
    color: '#e44f4f',
    fontWeight: '600',
  },
  score: {
    fontSize: 12,
    color: '#999',
  },

  // 빈 결과
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginBottom: 20,
  },

  // 다시 선택 버튼
  resetButton: {
    borderWidth: 1,
    borderColor: '#4f46e5',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  resetButtonText: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '600',
  },
});
