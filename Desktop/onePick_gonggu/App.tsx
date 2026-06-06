import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import GongguAIScreen from './screens/GongguAIScreen';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <GongguAIScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
});