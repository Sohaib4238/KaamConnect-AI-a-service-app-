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
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16 },
  successHeader: { 
    alignItems: 'center', padding: 24, 
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 16 
  },
  checkmark: { fontSize: 48, marginBottom: 8 },
  confirmedTitle: { 
    fontSize: 24, fontWeight: 'bold', color: '#1a73e8' 
  },
  bookingId: { 
    fontSize: 12, color: '#999', marginTop: 4, fontFamily: 'monospace' 
  },
  card: { 
    backgroundColor: '#fff', borderRadius: 16, padding: 16, 
    marginBottom: 12, elevation: 2, shadowOpacity: 0.05 
  },
  cardTitle: { 
    fontSize: 13, fontWeight: '700', color: '#666', 
    marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5
  },
  providerName: { 
    fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8 
  },
  row: { flexDirection: 'row', gap: 16, marginBottom: 4 },
  detail: { fontSize: 15, color: '#555', marginBottom: 4 },
  price: { 
    fontSize: 16, fontWeight: '600', color: '#1a73e8', marginTop: 4 
  },
  reasoning: { 
    fontSize: 14, color: '#555', lineHeight: 22, fontStyle: 'italic' 
  },
  altRow: { paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  altName: { fontSize: 15, fontWeight: '600', color: '#333' },
  altDetail: { fontSize: 13, color: '#888', marginTop: 2 },
  reminderCard: { 
    backgroundColor: '#e8f4fd', borderRadius: 12, padding: 14, 
    marginBottom: 16 
  },
  reminderText: { fontSize: 14, color: '#1a73e8', textAlign: 'center' },
  traceBtn: { 
    backgroundColor: '#333', padding: 16, borderRadius: 12, 
    alignItems: 'center', marginBottom: 10 
  },
  traceBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  homeBtn: { 
    backgroundColor: '#1a73e8', padding: 16, borderRadius: 12, 
    alignItems: 'center', marginBottom: 30 
  },
  homeBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 }
});
