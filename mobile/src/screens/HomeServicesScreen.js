import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const TILE_SIZE = (width - 48) / 3;

const C = {
  bg: '#F5F6FA',
  white: '#FFFFFF',
  primary: '#00C853',
  primaryDark: '#00A843',
  text: '#1A1A2E',
  textSec: '#555570',
  textMuted: '#9999AA',
  border: '#E4E5EF',
  warningBg: '#FFF8E1',
  warningBorder: '#FFE082',
  warningText: '#B78103',
  shadow: '#0000000A',
};

const SERVICES = [
  { label: 'AC Services', icon: 'snow-outline', color: '#2196F3', category: 'AC_REPAIR' },
  { label: 'Geyser Services', icon: 'flame-outline', color: '#FF9800', category: 'GEYSER' },
  { label: 'Plumbing', icon: 'water-outline', color: '#00897B', category: 'PLUMBER' },
  { label: 'Electrical', icon: 'flash-outline', color: '#FFC107', category: 'ELECTRICIAN' },
  { label: 'Home Cleaning', icon: 'sparkles-outline', color: '#E91E63', category: 'CLEANER' },
  { label: 'Carpentry', icon: 'hammer-outline', color: '#795548', category: 'CARPENTER' },
  { label: 'Painting', icon: 'brush-outline', color: '#9C27B0', category: 'PAINTER' },
  { label: 'Appliance Repair', icon: 'construct-outline', color: '#607D8B', category: 'APPLIANCE_REPAIR' },
  { label: 'Smart Home', icon: 'keypad-outline', color: '#3F51B5', category: 'SMART_HOME' },
];

export default function HomeServicesScreen({ navigation }) {
  const handleSelectService = (svc) => {
    navigation.navigate('ProvidersListScreen', {
      categories: [svc.category],
      title: svc.label,
      filterCategory: svc.category,
    });
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Custom Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <View style={s.headerTitleWrap}>
          <Text style={s.headerTitle}>Home Services</Text>
          <Text style={s.headerSub}>Select a category to view providers</Text>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
        {/* Search Hint / Ambient Banner */}
        <View style={s.banner}>
          <View style={s.bannerIconWrap}>
            <Ionicons name="bulb-outline" size={20} color={C.warningText} />
          </View>
          <Text style={s.bannerText}>
            Ambiguous prompt search: Ask the AI Chat in KaamConnect to auto-orchestrate multiple services at once!
          </Text>
        </View>

        {/* 3x3 Grid of categories */}
        <Text style={s.sectionTitle}>All Categories</Text>
        <View style={s.grid}>
          {SERVICES.map((svc, idx) => (
            <TouchableOpacity
              key={idx}
              style={s.tile}
              activeOpacity={0.7}
              onPress={() => handleSelectService(svc)}
            >
              <View style={[s.tileIconWrap, { backgroundColor: svc.color + '15' }]}>
                <Ionicons name={svc.icon} size={28} color={svc.color} />
              </View>
              <Text style={s.tileLabel} numberOfLines={2}>{svc.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    padding: 4,
    marginRight: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
  },
  headerSub: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: C.warningBg,
    borderWidth: 1,
    borderColor: C.warningBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  bannerIconWrap: {
    marginRight: 10,
    marginTop: 1,
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
    color: C.warningText,
    lineHeight: 18,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: C.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  tile: {
    width: TILE_SIZE,
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 4,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
    height: TILE_SIZE + 10,
  },
  tileIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  tileLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.text,
    textAlign: 'center',
  },
});
