import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { appName, tagline, typography } from '../constants/theme';

export function SplashScreen({ onFinished }: { onFinished: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.delay(600),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(onFinished);
  }, [onFinished, opacity]);

  return (
    <View style={styles.screen}>
      <Animated.View style={[styles.content, { opacity }]}>
        <View style={styles.logo}><Ionicons name="heart" color="#FFFFFF" size={42} /></View>
        <Text style={styles.name}>{appName}</Text>
        <Text style={styles.tagline}>{tagline}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#1769AA', justifyContent: 'center', alignItems: 'center', padding: 32 },
  content: { alignItems: 'center', gap: 14 },
  logo: { width: 90, height: 90, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: '#087F8C' },
  name: { color: '#FFFFFF', fontSize: typography.display, fontWeight: '900' },
  tagline: { color: '#EAF5FF', fontSize: typography.subheading, fontWeight: '600', textAlign: 'center', lineHeight: 25 },
});
