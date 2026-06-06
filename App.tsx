/**
 * App.tsx — onePick 주문 파싱 AI
 */

import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import OrderParserScreen from './screens/OrderParserScreen';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <OrderParserScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
});
