import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';

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
      <StatusBar style="light" />
      
      {/* Top decorative ambient glows */}
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
            onPress={onGetStarted}
            activeOpacity={0.85}
            style={s.btnWrapper}
          >
            <LinearGradient
              colors={['#00C896', '#7B61FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.getStartedBtn}
            >
              <Text style={s.getStartedText}>Get Started</Text>
              <ArrowRight size={20} color="#fff" />
            </LinearGradient>
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
    backgroundColor: '#0A0A0F',
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
    backgroundColor: 'rgba(0, 200, 150, 0.06)',
    top: -width * 0.35,
    right: -width * 0.25,
  },
  circle2: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    backgroundColor: 'rgba(123, 97, 255, 0.06)',
    bottom: -width * 0.2,
    left: -width * 0.2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 16,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  logoSection: { alignItems: 'center', paddingTop: 20 },
  logoContainer: { marginBottom: 12 },
  appName: { marginBottom: 4 },
  appNameDark: {
    fontSize: 28, fontWeight: '800', color: '#F0F0F5', letterSpacing: -0.5
  },
  appNameGreen: {
    fontSize: 28, fontWeight: '800', color: '#00C896', letterSpacing: -0.5
  },
  appTagline: {
    fontSize: 14, color: '#8888AA', fontWeight: '500'
  },
  heroSection: { alignItems: 'center' },
  heroTitle: {
    fontSize: 30, fontWeight: '800',
    color: '#F0F0F5', textAlign: 'center',
    lineHeight: 40, marginBottom: 12,
    letterSpacing: -0.5
  },
  heroTitleGreen: { color: '#00C896' },
  heroSub: {
    fontSize: 15, color: '#8888AA',
    textAlign: 'center', lineHeight: 24,
  },
  featuresSection: { gap: 14 },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 12,
  },
  featureIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  featureIcon: { fontSize: 20 },
  featureText: {
    fontSize: 15, color: '#F0F0F5',
    fontWeight: '600', flex: 1,
  },
  btnSection: { gap: 12 },
  btnWrapper: {
    borderRadius: 50,
    shadowColor: '#00C896',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 8,
  },
  getStartedBtn: {
    borderRadius: 50,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  getStartedText: {
    color: '#FFFFFF', fontSize: 18,
    fontWeight: '700', letterSpacing: 0.3,
  },
  termsText: {
    fontSize: 11, color: '#8888AA',
    textAlign: 'center', lineHeight: 16,
  },
});
