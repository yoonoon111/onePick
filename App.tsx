import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import BidListScreen from './screens/BidListScreen';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <BidListScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
});