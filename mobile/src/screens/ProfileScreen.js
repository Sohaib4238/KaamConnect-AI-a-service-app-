import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, TextInput, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, LogOut } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

const C = {
  bg: '#0A0A0F', surface: '#111118', card: '#16161F', primary: '#00C896',
  text: '#F0F0F5', textSec: '#8888AA', textMuted: '#555570',
  border: 'rgba(255, 255, 255, 0.08)', headerBg: '#0A0A0F', error: '#FF5C5C'
};

export default function ProfileScreen({ navigation }) {
  const { user, userProfile, logout, updateUserProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(userProfile?.name || user?.displayName || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserProfile({ name, phone });
      setEditing(false);
      Alert.alert('Saved', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: logout
        }
      ]
    );
  };

  const getInitials = () => {
    const n = name || user?.displayName || user?.email || 'U';
    return n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={() => setEditing(!editing)}>
          <Text style={s.editBtn}>
            {editing ? 'Cancel' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={s.avatarSection}>
          <LinearGradient
            colors={['#00C896', '#7B61FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.avatarCircle}
          >
            <Text style={s.avatarText}>{getInitials()}</Text>
          </LinearGradient>
          <Text style={s.userName}>
            {name || user?.displayName || 'User'}
          </Text>
          <Text style={s.userEmail}>{user?.email}</Text>
        </View>

        {/* Details card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Personal Information</Text>

          <Text style={s.fieldLabel}>Full Name</Text>
          {editing ? (
            <TextInput
              style={s.fieldInput}
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              placeholderTextColor="#555570"
            />
          ) : (
            <Text style={s.fieldValue}>
              {name || 'Not set'}
            </Text>
          )}

          <View style={s.divider} />

          <Text style={s.fieldLabel}>Email</Text>
          <Text style={s.fieldValue}>{user?.email}</Text>

          <View style={s.divider} />

          <Text style={s.fieldLabel}>Phone Number</Text>
          {editing ? (
            <TextInput
              style={s.fieldInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="03xx-xxxxxxx"
              placeholderTextColor="#555570"
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={s.fieldValue}>
              {phone || 'Not set'}
            </Text>
          )}
        </View>

        {editing && (
          <TouchableOpacity
            style={s.saveBtnWrapper}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#00C896', '#7B61FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.saveBtn}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.saveBtnText}>Save Changes</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Stats card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Account Info</Text>
          <View style={s.statRow}>
            <View style={s.stat}>
              <Text style={s.statVal}>
                {userProfile?.booking_count || 0}
              </Text>
              <Text style={s.statLabel}>Total Bookings</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.stat}>
              <Text style={s.statVal}>
                {user?.metadata?.creationTime
                  ? new Date(user.metadata.creationTime)
                    .toLocaleDateString('en-PK', { month: 'short', year: 'numeric' })
                  : 'N/A'}
              </Text>
              <Text style={s.statLabel}>Member Since</Text>
            </View>
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={s.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut size={20} color={C.error} />
          <Text style={s.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0A0A0F', paddingHorizontal: 16,
    paddingVertical: 14, borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  editBtn: { fontSize: 15, color: C.primary, fontWeight: '700' },
  scroll: { flex: 1 },
  avatarSection: {
    alignItems: 'center', paddingVertical: 28,
    backgroundColor: '#111118',
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  userName: { fontSize: 20, fontWeight: '850', color: C.text, letterSpacing: -0.5 },
  userEmail: { fontSize: 14, color: C.textSec, marginTop: 4 },
  card: {
    backgroundColor: '#16161F', marginHorizontal: 16,
    marginTop: 16, borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  cardTitle: {
    fontSize: 12, fontWeight: '800', color: C.textSec,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 16,
  },
  fieldLabel: { fontSize: 12, color: C.textSec, marginBottom: 4 },
  fieldValue: {
    fontSize: 15, color: C.text,
    fontWeight: '600', paddingVertical: 4
  },
  fieldInput: {
    fontSize: 15, color: C.text,
    backgroundColor: '#111118',
    borderWidth: 1, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 12,
    paddingVertical: 10,
  },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 12 },
  saveBtnWrapper: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3
  },
  saveBtn: {
    borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', justify: 'center'
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  statRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  statLabel: { fontSize: 12, color: C.textSec, marginTop: 4 },
  statDivider: {
    width: 1, height: 40, backgroundColor: C.border
  },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 92, 92, 0.08)',
    borderWidth: 1, borderColor: 'rgba(255, 92, 92, 0.15)',
    marginHorizontal: 16, marginTop: 16,
    borderRadius: 12, paddingVertical: 14,
    gap: 8,
  },
  logoutText: {
    color: C.error, fontSize: 15, fontWeight: '800'
  },
});
