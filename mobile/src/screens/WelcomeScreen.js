import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const FEATURES = [
  { icon: '🤖', text: 'AI-powered service matching' },
  { icon: '📍', text: 'Find nearest professionals' },
  { icon: '⚡', text: 'Book in seconds' },
  { icon: '⭐', text: 'Verified & trusted providers' },
];

export default function WelcomeScreen({ onGetStarted }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const btnScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(btnScale, {
        toValue: 1, delay: 500,
        tension: 60, friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      
      {/* Top decorative circles */}
      <View style={s.circle1} />
      <View style={s.circle2} />
      
      <Animated.View style={[s.content, {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }]}>
        {/* Logo */}
        <View style={s.logoSection}>
          <View style={s.logoContainer}>
            <Image
              source={require('../../assets/logo.png')}
              style={{ width: 90, height: 90 }}
              resizeMode="contain"
            />
          </View>
          <Text style={s.appName}>
            <Text style={s.appNameDark}>Kaam</Text>
            <Text style={s.appNameGreen}>Connect</Text>
          </Text>
          <Text style={s.appTagline}>Trusted Local Services.</Text>
        </View>

        {/* Hero text */}
        <View style={s.heroSection}>
          <Text style={s.heroTitle}>
            Ghar baithe mangwao{'\n'}
            <Text style={s.heroTitleGreen}>koi bhi service</Text>
          </Text>
          <Text style={s.heroSub}>
            Plumber, electrician, AC technician aur{'\n'}
            bahut kuch — bas ek message mein
          </Text>
        </View>

        {/* Features list */}
        <View style={s.featuresSection}>
          {FEATURES.map((f, i) => (
            <View key={i} style={s.featureRow}>
              <View style={s.featureIconWrap}>
                <Text style={s.featureIcon}>{f.icon}</Text>
              </View>
              <Text style={s.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* CTA Button */}
        <Animated.View style={[s.btnSection, {
          transform: [{ scale: btnScale }]
        }]}>
          <TouchableOpacity
            style={s.getStartedBtn}
            onPress={onGetStarted}
            activeOpacity={0.85}
          >
            <Text style={s.getStartedText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
          
          <Text style={s.termsText}>
            By continuing you agree to our Terms & Privacy Policy
          </Text>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: '#F0FFF8',
    top: -width * 0.3,
    right: -width * 0.2,
  },
  circle2: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: '#F8FFF4',
    bottom: -width * 0.15,
    left: -width * 0.15,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  logoSection: { alignItems: 'center', paddingTop: 20 },
  logoContainer: { marginBottom: 12 },
  appName: { marginBottom: 4 },
  appNameDark: {
    fontSize: 28, fontWeight: '900', color: '#1A2B4A'
  },
  appNameGreen: {
    fontSize: 28, fontWeight: '900', color: '#00C853'
  },
  appTagline: {
    fontSize: 14, color: '#9999AA', fontWeight: '500'
  },
  heroSection: { alignItems: 'center' },
  heroTitle: {
    fontSize: 30, fontWeight: '900',
    color: '#1A1A2E', textAlign: 'center',
    lineHeight: 40, marginBottom: 12,
  },
  heroTitleGreen: { color: '#00C853' },
  heroSub: {
    fontSize: 15, color: '#555570',
    textAlign: 'center', lineHeight: 24,
  },
  featuresSection: { gap: 12 },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  featureIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F0FFF8',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#C8E6C9',
  },
  featureIcon: { fontSize: 20 },
  featureText: {
    fontSize: 15, color: '#1A1A2E',
    fontWeight: '600', flex: 1,
  },
  btnSection: { gap: 12 },
  getStartedBtn: {
    backgroundColor: '#00C853',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  getStartedText: {
    color: '#FFFFFF', fontSize: 18,
    fontWeight: '900', letterSpacing: 0.3,
  },
  termsText: {
    fontSize: 11, color: '#BBBBCC',
    textAlign: 'center', lineHeight: 16,
  },
});
