import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

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
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          
          {/* Logo */}
          <View style={s.logoWrap}>
            <View style={s.logoCircle}>
              <Text style={s.logoEmoji}>🔧</Text>
            </View>
            <Text style={s.logoTitle}>Expertly</Text>
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
                  <Ionicons name="person-outline" size={18} color="#9999AA" style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    placeholder="Ahmed Khan"
                    placeholderTextColor="#BBBBCC"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              </>
            )}

            <Text style={s.label}>Email Address</Text>
            <View style={s.inputWrap}>
              <Ionicons name="mail-outline" size={18} color="#9999AA" style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="ahmed@example.com"
                placeholderTextColor="#BBBBCC"
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
                  <Ionicons name="call-outline" size={18} color="#9999AA" style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    placeholder="03xx-xxxxxxx"
                    placeholderTextColor="#BBBBCC"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </>
            )}

            <Text style={s.label}>Password</Text>
            <View style={s.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color="#9999AA" style={s.inputIcon} />
              <TextInput
                style={[s.input, { flex: 1 }]}
                placeholder="Min 6 characters"
                placeholderTextColor="#BBBBCC"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={s.eyeBtn}>
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={18} color="#9999AA" />
              </TouchableOpacity>
            </View>

            {mode === 'signup' && (
              <>
                <Text style={s.label}>Confirm Password</Text>
                <View style={s.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={18} color="#9999AA" style={s.inputIcon} />
                  <TextInput
                    style={[s.input, { flex: 1 }]}
                    placeholder="Re-enter password"
                    placeholderTextColor="#BBBBCC"
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
              style={[s.authBtn, loading && s.authBtnDisabled]}
              onPress={handleAuth}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.authBtnText}>
                  {mode === 'signup' ? 'Create Account' : 'Sign In'}
                </Text>
              )}
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
              disabled={googleLoading || !request}>
              {googleLoading ? (
                <ActivityIndicator color="#555" />
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  logoWrap: { alignItems: 'center', paddingTop: 40, paddingBottom: 32 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#E8F5E9',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  logoEmoji: { fontSize: 36 },
  logoTitle: { 
    fontSize: 28, fontWeight: '900', 
    color: '#1A1A2E', marginBottom: 6 
  },
  logoSub: { fontSize: 14, color: '#9999AA', textAlign: 'center' },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F5F6FA',
    borderRadius: 14, padding: 4,
    marginBottom: 28,
  },
  toggleBtn: {
    flex: 1, paddingVertical: 12,
    borderRadius: 11, alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: '#FFFFFF' },
  toggleText: { 
    fontSize: 14, fontWeight: '600', color: '#9999AA' 
  },
  toggleTextActive: { color: '#1A1A2E', fontWeight: '800' },
  form: { width: '100%' },
  label: {
    fontSize: 13, fontWeight: '700',
    color: '#555570', marginBottom: 6, marginTop: 14,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F9FC',
    borderWidth: 1.5, borderColor: '#E4E5EF',
    borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputIcon: { marginRight: 10 },
  input: { 
    flex: 1, fontSize: 15, 
    color: '#1A1A2E', 
  },
  eyeBtn: { padding: 4 },
  authBtn: {
    backgroundColor: '#00C853',
    borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 24,
  },
  authBtnDisabled: { opacity: 0.6 },
  authBtnText: { 
    color: '#FFFFFF', fontSize: 16, fontWeight: '800' 
  },
  dividerRow: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: { 
    flex: 1, height: 1, backgroundColor: '#E4E5EF' 
  },
  dividerText: { 
    marginHorizontal: 12, color: '#9999AA', fontSize: 13 
  },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5, borderColor: '#E4E5EF',
    borderRadius: 14, paddingVertical: 14,
  },
  googleIcon: {
    fontSize: 18, fontWeight: '900',
    color: '#4285F4', marginRight: 10,
  },
  googleBtnText: { 
    fontSize: 15, fontWeight: '700', color: '#1A1A2E' 
  },
  switchBtn: { alignItems: 'center', marginTop: 24 },
  switchText: { fontSize: 14, color: '#9999AA' },
  switchLink: { color: '#00C853', fontWeight: '800' },
});
