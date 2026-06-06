/**
 * App.tsx — onePick 스케치 → 제품 이미지 AI
 */

import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import Sketch2ProductScreen from './screens/Sketch2ProductScreen';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <Sketch2ProductScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
});
