import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, TextInput, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

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
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={() => setEditing(!editing)}>
          <Text style={s.editBtn}>
            {editing ? 'Cancel' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll}>
        {/* Avatar */}
        <View style={s.avatarSection}>
          <View style={s.avatarCircle}>
            <Text style={s.avatarText}>{getInitials()}</Text>
          </View>
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
              placeholderTextColor="#BBBBCC"
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
              placeholderTextColor="#BBBBCC"
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
            style={[s.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.saveBtnText}>Save Changes</Text>
            )}
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
          onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#F44336" />
          <Text style={s.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', paddingHorizontal: 16,
    paddingVertical: 14, borderBottomWidth: 1,
    borderBottomColor: '#E4E5EF',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F5F6FA',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  editBtn: { fontSize: 15, color: '#00C853', fontWeight: '700' },
  scroll: { flex: 1 },
  avatarSection: {
    alignItems: 'center', paddingVertical: 28,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#E4E5EF',
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#00C853',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  userName: { fontSize: 20, fontWeight: '800', color: '#1A1A2E' },
  userEmail: { fontSize: 14, color: '#9999AA', marginTop: 4 },
  card: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16,
    marginTop: 16, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#E4E5EF',
  },
  cardTitle: {
    fontSize: 13, fontWeight: '800', color: '#555570',
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 16,
  },
  fieldLabel: { fontSize: 12, color: '#9999AA', marginBottom: 4 },
  fieldValue: {
    fontSize: 15, color: '#1A1A2E',
    fontWeight: '600', paddingVertical: 4
  },
  fieldInput: {
    fontSize: 15, color: '#1A1A2E',
    backgroundColor: '#F8F9FC',
    borderWidth: 1, borderColor: '#E4E5EF',
    borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 10,
  },
  divider: { height: 1, backgroundColor: '#F0F1F8', marginVertical: 12 },
  saveBtn: {
    backgroundColor: '#00C853', marginHorizontal: 16,
    marginTop: 12, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  statRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '800', color: '#1A1A2E' },
  statLabel: { fontSize: 12, color: '#9999AA', marginTop: 4 },
  statDivider: {
    width: 1, height: 40, backgroundColor: '#E4E5EF'
  },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    marginHorizontal: 16, marginTop: 16,
    borderRadius: 14, paddingVertical: 16,
    gap: 8,
  },
  logoutText: {
    color: '#F44336', fontSize: 16, fontWeight: '700'
  },
});
