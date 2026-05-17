import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const C = {
  bg: '#0B1015', surface: '#141C24', card: '#1B2530',
  primary: '#00C853', text: '#E8ECF0', textSec: '#8B9BAA',
  textMuted: '#5F7082', border: '#1E2D3A', headerBg: '#111920',
};

export default function ManualBookingScreen() {
  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>📋 Manual Booking</Text>
      </View>
      <View style={s.body}>
        <View style={s.iconWrap}>
          <Ionicons name="construct-outline" size={64} color={C.primary} />
        </View>
        <Text style={s.title}>Coming Soon!</Text>
        <Text style={s.subtitle}>Phase 2 mein yeh feature launch hoga.</Text>
        <View style={s.divider} />
        <Text style={s.hint}>Abhi AI Chat tab se booking karein 😊</Text>
        <View style={s.featureList}>
          {[
            ['📝', 'Manual form-based booking'],
            ['📸', 'Photo upload for issue description'],
            ['📍', 'Saved addresses'],
            ['🔁', 'Repeat previous bookings'],
          ].map(([icon, label], i) => (
            <View key={i} style={s.featureRow}>
              <Text style={s.featureIcon}>{icon}</Text>
              <Text style={s.featureText}>{label}</Text>
              <View style={s.comingSoonBadge}>
                <Text style={s.comingSoonText}>SOON</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: C.headerBg, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  iconWrap: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(0,200,83,0.08)', borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  title: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: C.textSec, fontSize: 14, textAlign: 'center', marginBottom: 16 },
  divider: { width: 40, height: 2, backgroundColor: C.primary, borderRadius: 1, marginBottom: 16 },
  hint: { color: C.primary, fontSize: 14, fontWeight: '600', marginBottom: 24 },
  featureList: { width: '100%' },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: C.surface, borderRadius: 12, marginBottom: 8,
    borderWidth: 1, borderColor: C.border,
  },
  featureIcon: { fontSize: 18, marginRight: 12 },
  featureText: { flex: 1, color: C.text, fontSize: 13, fontWeight: '500' },
  comingSoonBadge: {
    backgroundColor: 'rgba(255,213,79,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  comingSoonText: { color: '#FFD54F', fontSize: 9, fontWeight: '700' },
});
