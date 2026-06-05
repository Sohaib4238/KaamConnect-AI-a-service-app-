import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BookingConfirmedScreen({ route, navigation }) {
  const { result } = route.params;
  const { booking, ranking, follow_up, summary } = result;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Success Header */}
        <View style={styles.successHeader}>
          <Text style={styles.checkmark}>✅</Text>
          <Text style={styles.confirmedTitle}>Booking Confirmed!</Text>
          <Text style={styles.bookingId}>{booking?.booking_id}</Text>
        </View>

        {/* Provider Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Selected Provider</Text>
          <Text style={styles.providerName}>{ranking?.top_pick?.name}</Text>
          <View style={styles.row}>
            <Text style={styles.detail}>
              📍 {ranking?.top_pick?.distance_km} km away
            </Text>
            <Text style={styles.detail}>
              ⭐ {ranking?.top_pick?.rating}/5
            </Text>
          </View>
          <Text style={styles.detail}>
            📞 {ranking?.top_pick?.phone || 'Contact via app'}
          </Text>
          <Text style={styles.price}>
            💰 PKR {booking?.price_estimate?.min}–{booking?.price_estimate?.max}
          </Text>
        </View>

        {/* Appointment Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Appointment Details</Text>
          <Text style={styles.detail}>
            🗓️ {new Date(booking?.slot).toLocaleDateString('en-US', {
              timeZone: 'Asia/Karachi',
              weekday: 'long', year: 'numeric', 
              month: 'long', day: 'numeric'
            })}
          </Text>
          <Text style={styles.detail}>
            ⏰ {new Date(booking?.slot).toLocaleTimeString('en-US', {
              timeZone: 'Asia/Karachi',
              hour: '2-digit', minute: '2-digit',
              hour12: true
            })}
          </Text>
          <Text style={styles.detail}>
            🔧 {booking?.service_type?.replace('_', ' ')}
          </Text>
        </View>

        {/* AI Reasoning Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Why this provider?</Text>
          <Text style={styles.reasoning}>{summary?.reasoning}</Text>
        </View>

        {/* Alternatives */}
        {ranking?.alternatives?.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Alternatives considered</Text>
            {ranking.alternatives.map((alt, i) => (
              <View key={i} style={styles.altRow}>
                <Text style={styles.altName}>{alt.name}</Text>
                <Text style={styles.altDetail}>
                  {String(alt.distance_km)}km · ⭐{String(alt.rating)} · Score: {String(alt.score)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Reminder */}
        <View style={styles.reminderCard}>
          <Text style={styles.reminderText}>
            🔔 Reminder set for {new Date(
              follow_up?.reminder_scheduled
            ).toLocaleTimeString('en-US', {
              timeZone: 'Asia/Karachi',
              hour: '2-digit', minute: '2-digit',
              hour12: true
            })} — 1 hour before appointment
          </Text>
        </View>

        {/* Buttons */}
        <TouchableOpacity 
          style={styles.traceBtn}
          onPress={() => navigation.navigate('AgentTrace', { 
            traceId: result.trace_id 
          })}>
          <Text style={styles.traceBtnText}>
            View Agent Reasoning Trace
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.homeBtn}
          onPress={() => navigation.navigate('Home')}>
          <Text style={styles.homeBtnText}>New Booking</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  content: { padding: 16 },
  successHeader: { 
    alignItems: 'center', padding: 24, 
    backgroundColor: '#16161F', borderRadius: 16, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  checkmark: { fontSize: 48, marginBottom: 8 },
  confirmedTitle: { 
    fontSize: 24, fontWeight: 'bold', color: '#00C896' 
  },
  bookingId: { 
    fontSize: 12, color: '#8888AA', marginTop: 4, fontFamily: 'monospace' 
  },
  card: { 
    backgroundColor: '#16161F', borderRadius: 16, padding: 16, 
    marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  cardTitle: { 
    fontSize: 13, fontWeight: '700', color: '#8888AA', 
    marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5
  },
  providerName: { 
    fontSize: 20, fontWeight: 'bold', color: '#F0F0F5', marginBottom: 8 
  },
  row: { flexDirection: 'row', gap: 16, marginBottom: 4 },
  detail: { fontSize: 15, color: '#8888AA', marginBottom: 4 },
  price: { 
    fontSize: 16, fontWeight: '600', color: '#00C896', marginTop: 4 
  },
  reasoning: { 
    fontSize: 14, color: '#8888AA', lineHeight: 22, fontStyle: 'italic' 
  },
  altRow: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.04)' },
  altName: { fontSize: 15, fontWeight: '600', color: '#F0F0F5' },
  altDetail: { fontSize: 13, color: '#8888AA', marginTop: 2 },
  reminderCard: { 
    backgroundColor: 'rgba(0, 200, 150, 0.06)', borderRadius: 12, padding: 14, 
    marginBottom: 16, borderWidth: 1, borderColor: 'rgba(0, 200, 150, 0.2)',
  },
  reminderText: { fontSize: 14, color: '#00C896', textAlign: 'center' },
  traceBtn: { 
    backgroundColor: '#111118', padding: 16, borderRadius: 12, 
    alignItems: 'center', marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  traceBtnText: { color: '#F0F0F5', fontWeight: '600', fontSize: 15 },
  homeBtn: { 
    backgroundColor: '#00C896', padding: 16, borderRadius: 12, 
    alignItems: 'center', marginBottom: 30 
  },
  homeBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 }
});
