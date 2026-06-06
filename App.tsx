/**
 * App.tsx — onePick 제품 추천 AI
 */

import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import RecommendScreen from './screens/RecommendScreen';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <RecommendScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
});
