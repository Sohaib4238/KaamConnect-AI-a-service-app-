import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function SplashScreen({ onComplete }) {
  const nameScale = useRef(new Animated.Value(0.3)).current;
  const nameOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation sequence
    Animated.sequence([
      // App name appears and scales up
      Animated.parallel([
        Animated.timing(nameOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.spring(nameScale, {
          toValue: 1,
          tension: 40,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
      // Short pause
      Animated.delay(150),
      // Tagline appears
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Hold for a moment
      Animated.delay(1000),
    ]).start(() => {
      // Call onComplete to move to next screen
      onComplete?.();
    });
  }, []);

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      
      {/* Background gradient effect using layered views */}
      <View style={s.bgTop} />
      <View style={s.bgBottom} />
      
      {/* App name (acting as the hero typography) */}
      <Animated.View style={[s.nameWrap, { 
        opacity: nameOpacity,
        transform: [{ scale: nameScale }]
      }]}>
        <Text style={s.nameKaam}>Kaam</Text>
        <Text style={s.nameConnect}>Connect</Text>
      </Animated.View>
      
      {/* Tagline */}
      <Animated.Text style={[s.tagline, { opacity: taglineOpacity }]}>
        Local People. Trusted Service.
      </Animated.Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgTop: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '40%',
    backgroundColor: 'rgba(0, 200, 150, 0.04)',
  },
  bgBottom: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '30%',
    backgroundColor: 'rgba(123, 97, 255, 0.04)',
  },
  nameWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  nameKaam: {
    fontSize: 48,
    fontWeight: '900',
    color: '#F0F0F5',
    letterSpacing: -1.5,
  },
  nameConnect: {
    fontSize: 48,
    fontWeight: '900',
    color: '#00C896',
    letterSpacing: -1.5,
  },
  tagline: {
    fontSize: 16,
    color: '#8888AA',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
