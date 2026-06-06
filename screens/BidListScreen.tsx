// screens/BidList/BidListScreen.tsx
// 입찰 목록 화면 — 진행중 / 완료 / 취소 탭 구성

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Animated,
} from 'react-native';

// ── 타입 정의 ──────────────────────────────────────────────
type BidStatus = 'active' | 'completed' | 'cancelled';

interface Bid {
  id:          number;
  productName: string;
  bidAmount:   number;
  status:      BidStatus;
  date:        string;
  endDate:     string;  // 마감 시간
  imageEmoji:  string;  // 이미지 대신 이모지 사용
}

// ── 더미 데이터 ────────────────────────────────────────────
const DUMMY_BIDS: Bid[] = [
  {
    id: 1,
    productName: '스마트 텀블러 블랙 500ml',
    bidAmount: 28000,
    status: 'active',
    date: '2026-05-28',
    endDate: '2026-06-10T18:00:00',
    imageEmoji: '🫖',
  },
  {
    id: 2,
    productName: '캠핑 의자 카키 기본형',
    bidAmount: 48000,
    status: 'active',
    date: '2026-05-27',
    endDate: '2026-06-08T12:00:00',
    imageEmoji: '🪑',
  },
  {
    id: 3,
    productName: 'LED 무드등 화이트 소형',
    bidAmount: 20000,
    status: 'active',
    date: '2026-05-26',
    endDate: '2026-06-07T09:00:00',
    imageEmoji: '💡',
  },
  {
    id: 4,
    productName: '친환경 노트북 파우치 15인치',
    bidAmount: 35000,
    status: 'completed',
    date: '2026-05-20',
    endDate: '2026-05-25T18:00:00',
    imageEmoji: '💼',
  },
  {
    id: 5,
    productName: '핸드드립 커피 세트 2인용',
    bidAmount: 42000,
    status: 'completed',
    date: '2026-05-15',
    endDate: '2026-05-22T18:00:00',
    imageEmoji: '☕',
  },
  {
    id: 6,
    productName: '무선 충전 패드 2구',
    bidAmount: 30000,
    status: 'cancelled',
    date: '2026-05-10',
    endDate: '2026-05-18T18:00:00',
    imageEmoji: '🔋',
  },
  {
    id: 7,
    productName: '휴대용 선풍기 목걸이형',
    bidAmount: 16000,
    status: 'cancelled',
    date: '2026-05-08',
    endDate: '2026-05-15T18:00:00',
    imageEmoji: '🌀',
  },
];

// ── 탭 설정 ────────────────────────────────────────────────
const TABS: { key: BidStatus; label: string; color: string }[] = [
  { key: 'active',    label: '진행중',  color: '#4f46e5' },
  { key: 'completed', label: '완료',    color: '#10b981' },
  { key: 'cancelled', label: '취소',    color: '#ef4444' },
];

// ── 남은 시간 계산 ─────────────────────────────────────────
function getRemainingTime(endDate: string): string {
  const now  = new Date();
  const end  = new Date(endDate);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return '마감';

  const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0)  return `${days}일 ${hours}시간 남음`;
  if (hours > 0) return `${hours}시간 ${minutes}분 남음`;
  return `${minutes}분 남음`;
}

// ── 상태 뱃지 ──────────────────────────────────────────────
function StatusBadge({ status }: { status: BidStatus }) {
  const config = {
    active:    { label: '진행중', bg: '#eef2ff', color: '#4f46e5' },
    completed: { label: '완료',   bg: '#d1fae5', color: '#065f46' },
    cancelled: { label: '취소',   bg: '#fee2e2', color: '#991b1b' },
  }[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

// ── 입찰 카드 ──────────────────────────────────────────────
function BidCard({ bid }: { bid: Bid }) {
  const remaining = getRemainingTime(bid.endDate);
  const isActive  = bid.status === 'active';
  const isUrgent  = isActive && remaining.includes('시간') && !remaining.includes('일');

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      {/* 왼쪽 이모지 */}
      <View style={styles.cardEmoji}>
        <Text style={styles.emojiText}>{bid.imageEmoji}</Text>
      </View>

      {/* 중앙 정보 */}
      <View style={styles.cardContent}>
        <View style={styles.cardTopRow}>
          <Text style={styles.productName} numberOfLines={1}>{bid.productName}</Text>
          <StatusBadge status={bid.status} />
        </View>

        <Text style={styles.bidAmount}>{bid.bidAmount.toLocaleString()}원</Text>

        <View style={styles.cardBottomRow}>
          <Text style={styles.dateText}>📅 {bid.date}</Text>
          {isActive && (
            <Text style={[styles.remainText, isUrgent && styles.remainUrgent]}>
              ⏱ {remaining}
            </Text>
          )}
          {!isActive && (
            <Text style={styles.endDateText}>
              마감 {bid.endDate.slice(0, 10)}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── 메인 화면 ──────────────────────────────────────────────
export default function BidListScreen() {
  const [activeTab, setActiveTab]   = useState<BidStatus>('active');
  const [refreshing, setRefreshing] = useState(false);
  const [bids, setBids]             = useState<Bid[]>(DUMMY_BIDS);

  const filtered = bids.filter(b => b.status === activeTab);

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: 실제 API 호출로 교체
    setTimeout(() => setRefreshing(false), 1000);
  };

  const counts = {
    active:    bids.filter(b => b.status === 'active').length,
    completed: bids.filter(b => b.status === 'completed').length,
    cancelled: bids.filter(b => b.status === 'cancelled').length,
  };

  return (
    <View style={styles.container}>

      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>입찰 내역</Text>
        <Text style={styles.headerSub}>총 {bids.length}건의 입찰</Text>
      </View>

      {/* 탭 */}
      <View style={styles.tabRow}>
        {TABS.map(tab => {
          const isSelected = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isSelected && { borderBottomColor: tab.color, borderBottomWidth: 2.5 }]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, isSelected && { color: tab.color, fontWeight: '700' }]}>
                {tab.label}
              </Text>
              <View style={[styles.tabCount, isSelected && { backgroundColor: tab.color }]}>
                <Text style={[styles.tabCountText, isSelected && { color: '#fff' }]}>
                  {counts[tab.key]}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 리스트 */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>
              {activeTab === 'active' ? '🔍' : activeTab === 'completed' ? '✅' : '❌'}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'active'    ? '진행 중인 입찰이 없어요'  :
               activeTab === 'completed' ? '완료된 입찰이 없어요'     :
                                          '취소된 입찰이 없어요'}
            </Text>
          </View>
        ) : (
          filtered.map(bid => <BidCard key={bid.id} bid={bid} />)
        )}
      </ScrollView>

    </View>
  );
}

// ── 스타일 ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },

  // 헤더
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  headerSub: {
    fontSize: 13,
    color: '#888',
  },

  // 탭
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    color: '#aaa',
    fontWeight: '500',
  },
  tabCount: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  tabCountText: {
    fontSize: 11,
    color: '#888',
    fontWeight: '700',
  },

  // 리스트
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },

  // 카드
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 14,
  },
  cardEmoji: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#f5f6fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 26,
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a2e',
    flex: 1,
    marginRight: 8,
  },
  bidAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#aaa',
  },
  remainText: {
    fontSize: 12,
    color: '#4f46e5',
    fontWeight: '600',
  },
  remainUrgent: {
    color: '#ef4444',
  },
  endDateText: {
    fontSize: 12,
    color: '#aaa',
  },

  // 뱃지
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // 빈 화면
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyText: {
    fontSize: 15,
    color: '#aaa',
  },
});
