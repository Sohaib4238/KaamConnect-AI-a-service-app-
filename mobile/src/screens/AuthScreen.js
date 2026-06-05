import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Alert, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react-native';

const { width } = Dimensions.get('window');

WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID = '485744190620-rjnts7je19q3ilbpnmtqngjafh1rb4jb.apps.googleusercontent.com';

export default function AuthScreen() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: WEB_CLIENT_ID,
    iosClientId: WEB_CLIENT_ID,
    androidClientId: WEB_CLIENT_ID,
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      handleGoogleSignIn(authentication.idToken || authentication.accessToken);
    }
  }, [response]);

  const handleGoogleSignIn = async (token) => {
    if (!token) return;
    setGoogleLoading(true);
    try {
      await signInWithGoogle(token);
    } catch (error) {
      Alert.alert('Google Sign-In Failed', error.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Email and password are required');
      return;
    }
    if (mode === 'signup') {
      if (!name.trim()) {
        Alert.alert('Error', 'Full name is required');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        return;
      }
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUp(email.trim(), password, name.trim(), phone.trim());
      } else {
        await signIn(email.trim(), password);
      }
    } catch (error) {
      let message = error.message;
      if (error.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Please sign in.';
      } else if (error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential') {
        message = 'Incorrect email or password.';
      } else if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      }
      Alert.alert(mode === 'signup' ? 'Sign Up Failed' : 'Sign In Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Decorative ambient background glows */}
      <View style={s.circle1} />
      <View style={s.circle2} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, zIndex: 1 }}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={s.logoWrap}>
            <View style={s.logoCircle}>
              <Text style={s.logoEmoji}>🔧</Text>
            </View>
            <Text style={s.logoTitle}>
              <Text style={s.appNameDark}>Kaam</Text>
              <Text style={s.appNameGreen}>Connect</Text>
            </Text>
            <Text style={s.logoSub}>Professional services at your doorstep</Text>
          </View>

          {/* Toggle tabs */}
          <View style={s.toggleRow}>
            <TouchableOpacity
              style={[s.toggleBtn, mode === 'signin' && s.toggleBtnActive]}
              onPress={() => setMode('signin')}>
              <Text style={[
                s.toggleText,
                mode === 'signin' && s.toggleTextActive
              ]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.toggleBtn, mode === 'signup' && s.toggleBtnActive]}
              onPress={() => setMode('signup')}>
              <Text style={[
                s.toggleText,
                mode === 'signup' && s.toggleTextActive
              ]}>Create Account</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={s.form}>
            {mode === 'signup' && (
              <>
                <Text style={s.label}>Full Name</Text>
                <View style={s.inputWrap}>
                  <User size={18} color="#8888AA" style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    placeholder="Ahmed Khan"
                    placeholderTextColor="#555570"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              </>
            )}

            <Text style={s.label}>Email Address</Text>
            <View style={s.inputWrap}>
              <Mail size={18} color="#8888AA" style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="ahmed@example.com"
                placeholderTextColor="#555570"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {mode === 'signup' && (
              <>
                <Text style={s.label}>Phone Number</Text>
                <View style={s.inputWrap}>
                  <Phone size={18} color="#8888AA" style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    placeholder="03xx-xxxxxxx"
                    placeholderTextColor="#555570"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </>
            )}

            <Text style={s.label}>Password</Text>
            <View style={s.inputWrap}>
              <Lock size={18} color="#8888AA" style={s.inputIcon} />
              <TextInput
                style={[s.input, { flex: 1 }]}
                placeholder="Min 6 characters"
                placeholderTextColor="#555570"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={s.eyeBtn}>
                {showPassword ? (
                  <EyeOff size={18} color="#8888AA" />
                ) : (
                  <Eye size={18} color="#8888AA" />
                )}
              </TouchableOpacity>
            </View>

            {mode === 'signup' && (
              <>
                <Text style={s.label}>Confirm Password</Text>
                <View style={s.inputWrap}>
                  <Lock size={18} color="#8888AA" style={s.inputIcon} />
                  <TextInput
                    style={[s.input, { flex: 1 }]}
                    placeholder="Re-enter password"
                    placeholderTextColor="#555570"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                </View>
              </>
            )}

            {/* Main action button */}
            <TouchableOpacity
              onPress={handleAuth}
              disabled={loading}
              style={s.btnWrapper}
              activeOpacity={0.85}>
              <LinearGradient
                colors={['#00C896', '#7B61FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.authBtn}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.authBtnText}>
                    {mode === 'signup' ? 'Create Account' : 'Sign In'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>or continue with</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Google button */}
            <TouchableOpacity
              style={[s.googleBtn, googleLoading && s.authBtnDisabled]}
              onPress={() => promptAsync()}
              disabled={googleLoading || !request}
              activeOpacity={0.85}>
              {googleLoading ? (
                <ActivityIndicator color="#F0F0F5" />
              ) : (
                <>
                  <Text style={s.googleIcon}>G</Text>
                  <Text style={s.googleBtnText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Switch mode */}
            <TouchableOpacity
              style={s.switchBtn}
              onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
              <Text style={s.switchText}>
                {mode === 'signin'
                  ? "Don't have an account? "
                  : "Already have an account? "}
                <Text style={s.switchLink}>
                  {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', overflow: 'hidden' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  circle1: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
    backgroundColor: 'rgba(0, 200, 150, 0.05)',
    top: -width * 0.35,
    right: -width * 0.25,
  },
  circle2: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    backgroundColor: 'rgba(123, 97, 255, 0.05)',
    bottom: -width * 0.2,
    left: -width * 0.2,
  },
  logoWrap: { alignItems: 'center', paddingTop: 40, paddingBottom: 32 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(0, 200, 150, 0.08)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 150, 0.15)',
  },
  logoEmoji: { fontSize: 36 },
  logoTitle: {
    fontSize: 28, fontWeight: '800',
    color: '#F0F0F5', marginBottom: 6,
    letterSpacing: -0.5,
  },
  appNameDark: { color: '#F0F0F5', fontWeight: '800' },
  appNameGreen: { color: '#00C896', fontWeight: '800' },
  logoSub: { fontSize: 14, color: '#8888AA', textAlign: 'center' },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#111118',
    borderRadius: 14, padding: 4,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  toggleBtn: {
    flex: 1, paddingVertical: 12,
    borderRadius: 11, alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  toggleText: {
    fontSize: 14, fontWeight: '600', color: '#8888AA'
  },
  toggleTextActive: { color: '#F0F0F5', fontWeight: '700' },
  form: { width: '100%' },
  label: {
    fontSize: 13, fontWeight: '600',
    color: '#8888AA', marginBottom: 6, marginTop: 14,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#16161F',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14, paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1, fontSize: 15,
    color: '#F0F0F5',
  },
  eyeBtn: { padding: 4 },
  btnWrapper: {
    marginTop: 24,
    borderRadius: 50,
    shadowColor: '#00C896',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 8,
  },
  authBtn: {
    borderRadius: 50, paddingVertical: 16,
    alignItems: 'center',
  },
  authBtnDisabled: { opacity: 0.6 },
  authBtnText: {
    color: '#FFFFFF', fontSize: 16, fontWeight: '700'
  },
  dividerRow: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)'
  },
  dividerText: {
    marginHorizontal: 12, color: '#8888AA', fontSize: 13
  },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14, paddingVertical: 14,
  },
  googleIcon: {
    fontSize: 18, fontWeight: '900',
    color: '#F0F0F5', marginRight: 10,
  },
  googleBtnText: {
    fontSize: 15, fontWeight: '700', color: '#F0F0F5'
  },
  switchBtn: { alignItems: 'center', marginTop: 24 },
  switchText: { fontSize: 14, color: '#8888AA' },
  switchLink: { color: '#00C896', fontWeight: '700' },
});
