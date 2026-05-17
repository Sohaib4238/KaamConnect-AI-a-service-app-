import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getBookings, cancelBooking, completeBooking } from '../config/api';

const C = {
  bg: '#F5F6FA', surface: '#F8F9FC', card: '#FFFFFF',
  primary: '#00C853', text: '#1A1A2E', textSec: '#555570',
  textMuted: '#9999AA', border: '#E4E5EF', headerBg: '#FFFFFF',
  warning: '#FF9500', error: '#F44336', blue: '#2196F3',
};

const STATUS_MAP = {
  confirmed: { label: '🟡 Technician Notified', color: C.warning },
  in_progress: { label: '🟢 Service In Progress', color: C.primary },
  completed: { label: '✅ Completed', color: C.primary },
  cancelled: { label: '🔴 Cancelled', color: C.error },
};

export default function ActiveRequestsScreen() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const data = await getBookings();
      const list = data.bookings || [];
      list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      setBookings(list);
    } catch (err) {
      console.error('Fetch bookings error:', err.message);
      setError('Backend se connect nahi ho paya');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchBookings = fetchData;

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const onRefresh = () => { setRefreshing(true); fetchBookings(); };

  const handleCancel = (bookingId) => {
    Alert.alert(
      'Cancel Booking',
      'Kya aap yeh booking cancel karna chahte hain?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
          try {
            const data = await cancelBooking(bookingId);
            if (data.success) {
              setBookings(prev => prev.map(b => 
                (b.booking_id === bookingId || b.id === bookingId)
                  ? { ...b, status: 'cancelled' } 
                  : b
              ));
              await fetchBookings();
              Alert.alert('Cancelled', 'Booking cancel ho gayi hai.');
            } else {
              Alert.alert('Error', 'Could not cancel booking');
            }
          } catch (err) {
            Alert.alert('Error', 'Cancel nahi ho saki — dobara try karein.');
          }
        }},
      ]
    );
  };

  const handleComplete = async (bookingId) => {
    try {
      const data = await completeBooking(bookingId);
      if (data.success) {
        setBookings(prev => prev.map(b => 
          (b.booking_id === bookingId || b.id === bookingId)
            ? { ...b, status: 'completed' } 
            : b
        ));
        await fetchBookings();
        Alert.alert(
          '⭐ Rate your experience',
          'Technician ne kaisa kaam kiya?',
          [
            { text: '⭐⭐⭐', onPress: () => Alert.alert('Shukriya!', 'Aapka feedback record ho gaya hai.') },
            { text: '⭐⭐⭐⭐', onPress: () => Alert.alert('Shukriya!', 'Aapka feedback record ho gaya hai.') },
            { text: '⭐⭐⭐⭐⭐', onPress: () => Alert.alert('Zabardast!', 'Aapka feedback record ho gaya hai.') }
          ]
        );
      } else {
        Alert.alert('Error', 'Could not complete booking');
      }
    } catch (err) {
      Alert.alert('Error', 'Complete nahi ho saki — dobara try karein.');
    }
  };

  const renderBooking = (item, isActive) => {
    const st = STATUS_MAP[item.status] || STATUS_MAP.confirmed;
    return (
      <View key={String(item.booking_id || item.id)} style={s.card}>
        <View style={s.cardHeader}>
          <Text style={[s.statusBadge, { color: st.color }]}>{st.label}</Text>
          <Text style={s.bookingId}>{String(item.booking_id || item.id)}</Text>
        </View>
        <Text style={s.serviceType}>
          {String(item.service_type || 'Service').replace(/_/g, ' ').toUpperCase()}
        </Text>
        <View style={s.detailBox}>
          <DetailRow icon="person" label="Technician" value={String(item.provider_name || 'Assigned')} />
          <DetailRow icon="location" label="Location" value={String(item.location || '—')} />
          <DetailRow icon="time" label="Time" value={
            item.slot ? new Date(item.slot).toLocaleString('en-US', {
              timeZone: 'Asia/Karachi',
              weekday: 'short', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
              hour12: true
            }) : 'TBD'
          } />
          <DetailRow icon="cash" label="Est. Cost" value={
            item.price_estimate ? `PKR ${String(item.price_estimate.min)}–${String(item.price_estimate.max)}` : '—'
          } accent />
        </View>

        {isActive ? (
          <>
            <View style={s.actionRow}>
              <TouchableOpacity style={s.actionBtn}>
                <Ionicons name="call-outline" size={16} color={C.primary} />
                <Text style={s.actionText}> Contact</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.actionBtn, s.actionBtnDanger]}
                onPress={() => handleCancel(item.booking_id || item.id)}>
                <Ionicons name="close-circle-outline" size={16} color={C.error} />
                <Text style={[s.actionText, { color: C.error }]}> Cancel</Text>
              </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
              <TouchableOpacity 
                style={s.completeBtn}
                onPress={() => handleComplete(item.booking_id || item.id)}>
                <Text style={s.completeBtnText}>✅ Mark as Completed</Text>
              </TouchableOpacity>
            </View>

            <View style={s.reminderBar}>
              <Ionicons name="notifications-outline" size={12} color={C.textMuted} />
              <Text style={s.reminderText}> Reminder active — 1 hr before appointment</Text>
            </View>
          </>
        ) : null}
      </View>
    );
  };

  const EmptyState = () => (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <Ionicons name="document-text-outline" size={48} color={C.textMuted} />
      </View>
      <Text style={s.emptyTitle}>Koi Active Request Nahi</Text>
      <Text style={s.emptySub}>AI Chat tab se apna pehla booking karein! 💬</Text>
      {error ? <Text style={s.errorMsg}>{error}</Text> : null}
    </View>
  );

  // Separate bookings by status
  const activeBookings = bookings.filter(
    b => b.status === 'confirmed' || b.status === 'pending' || b.status === 'in_progress'
  );
  const pastBookings = bookings.filter(
    b => b.status === 'completed' || b.status === 'cancelled'
  );

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>🔔 Active Requests</Text>
        <Text style={s.headerCount}>{String(bookings.length)} booking{bookings.length !== 1 ? 's' : ''}</Text>
      </View>
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.loadText}>Loading bookings...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
          }
        >
          {activeBookings.length > 0 && (
            <View>
              <Text style={s.sectionHeader}>Active Bookings</Text>
              {activeBookings.map(item => renderBooking(item, true))}
            </View>
          )}
          {pastBookings.length > 0 && (
            <View style={{ marginTop: 20 }}>
              <Text style={s.sectionHeader}>Past Bookings</Text>
              {pastBookings.map(item => renderBooking(item, false))}
            </View>
          )}
          {activeBookings.length === 0 && pastBookings.length === 0 && <EmptyState />}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function DetailRow({ icon, label, value, accent }) {
  return (
    <View style={s.detailRow}>
      <Ionicons name={icon + '-outline'} size={14} color={C.textMuted} />
      <Text style={s.detailLabel}> {label}:</Text>
      <Text style={[s.detailValue, accent ? { color: C.primary, fontWeight: '700' } : null]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: C.headerBg, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { color: '#1A1A2E', fontSize: 18, fontWeight: '700' },
  headerCount: { color: C.textMuted, fontSize: 12, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadText: { color: C.textSec, fontSize: 13, marginTop: 10 },
  list: { padding: 12 },
  sectionHeader: {
    color: '#1A1A2E', fontSize: 14, fontWeight: '800',
    marginTop: 15, marginBottom: 8, paddingHorizontal: 4,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  card: {
    backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border,
    marginBottom: 14, overflow: 'hidden',
    shadowColor: '#00000010', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 4, elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4,
  },
  statusBadge: { fontSize: 12, fontWeight: '700' },
  bookingId: { color: C.textMuted, fontSize: 10, fontFamily: 'monospace' },
  serviceType: {
    color: '#1A1A2E', fontSize: 17, fontWeight: '800', paddingHorizontal: 14,
    paddingBottom: 8, letterSpacing: -0.3,
  },
  detailBox: {
    marginHorizontal: 14, backgroundColor: C.bg, borderRadius: 10,
    padding: 10, marginBottom: 10, borderWidth: 1, borderColor: C.border,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  detailLabel: { color: C.textMuted, fontSize: 12, width: 80 },
  detailValue: { color: C.text, fontSize: 12, fontWeight: '500', flex: 1 },
  actionRow: { flexDirection: 'row', paddingHorizontal: 14, paddingBottom: 10, gap: 8 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 10, paddingVertical: 8,
    borderWidth: 1, borderColor: C.border,
  },
  actionBtnDanger: { borderColor: C.error, backgroundColor: '#FFFFFF' },
  actionText: { color: C.primary, fontSize: 11, fontWeight: '600' },
  completeBtn: {
    backgroundColor: '#00C853', borderRadius: 10, paddingVertical: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#00A843',
  },
  completeBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  reminderBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, backgroundColor: C.surface,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  reminderText: { color: C.textMuted, fontSize: 10 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, marginTop: 60 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { color: '#1A1A2E', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptySub: { color: C.textSec, fontSize: 13, textAlign: 'center' },
  errorMsg: { color: C.error, fontSize: 12, marginTop: 10, textAlign: 'center' },
});
