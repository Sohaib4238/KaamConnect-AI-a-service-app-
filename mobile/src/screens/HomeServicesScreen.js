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
import { 
  ArrowLeft, 
  Lightbulb, 
  Snowflake, 
  Flame, 
  Droplets, 
  Zap, 
  Sparkles, 
  Hammer, 
  Paintbrush, 
  Smile, 
  BookOpen, 
  Wrench, 
  Cpu 
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const TILE_SIZE = (width - 48) / 3;

const C = {
  bg: '#0A0A0F',
  white: '#111118',
  primary: '#00C896',
  primaryDark: '#00A882',
  text: '#F0F0F5',
  textSec: '#8888AA',
  textMuted: '#555570',
  border: 'rgba(255, 255, 255, 0.08)',
  warningBg: 'rgba(245, 200, 66, 0.08)',
  warningBorder: '#F5C842',
  warningText: '#F5C842',
};

const SERVICES = [
  { label: 'AC Services', Icon: Snowflake, color: '#00C896', category: 'AC_REPAIR' },
  { label: 'Geyser Services', Icon: Flame, color: '#FF7B54', category: 'GEYSER' },
  { label: 'Plumbing', Icon: Droplets, color: '#38B6FF', category: 'PLUMBER' },
  { label: 'Electrical', Icon: Zap, color: '#FFD23F', category: 'ELECTRICIAN' },
  { label: 'Home Cleaning', Icon: Sparkles, color: '#7B61FF', category: 'CLEANER' },
  { label: 'Carpentry', Icon: Hammer, color: '#A06A42', category: 'CARPENTER' },
  { label: 'Painting', Icon: Paintbrush, color: '#FF5964', category: 'PAINTER' },
  { label: 'Beauticians', Icon: Smile, color: '#FF92C2', category: 'BEAUTICIAN' },
  { label: 'Tutors', Icon: BookOpen, color: '#4EA8DE', category: 'TUTOR' },
  { label: 'Appliance Repair', Icon: Wrench, color: '#9AA0A6', category: 'APPLIANCE_REPAIR' },
  { label: 'Smart Home', Icon: Cpu, color: '#353535', category: 'SMART_HOME' },
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
          <ArrowLeft size={22} color={C.text} />
        </TouchableOpacity>
        <View style={s.headerTitleWrap}>
          <Text style={s.headerTitle}>Home Services</Text>
          <Text style={s.headerSub}>Select a category to view providers</Text>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search Hint / Ambient Banner */}
        <View style={s.banner}>
          <View style={s.bannerIconWrap}>
            <Lightbulb size={20} color={C.warningText} />
          </View>
          <Text style={s.bannerText}>
            Ambiguous prompt search: Ask the AI Chat in KaamConnect to auto-orchestrate multiple services at once!
          </Text>
        </View>

        {/* 3x3 Grid of categories */}
        <Text style={s.sectionTitle}>All Categories</Text>
        <View style={s.grid}>
          {SERVICES.map((svc, idx) => {
            const IconComponent = svc.Icon;
            return (
              <TouchableOpacity
                key={idx}
                style={s.tile}
                activeOpacity={0.8}
                onPress={() => handleSelectService(svc)}
              >
                <View style={[s.tileIconWrap, { backgroundColor: svc.color + '15' }]}>
                  <IconComponent size={28} color={svc.color} />
                </View>
                <Text style={s.tileLabel} numberOfLines={2}>{svc.label}</Text>
              </TouchableOpacity>
            );
          })}
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
    backgroundColor: '#0A0A0F',
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
    color: C.textSec,
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
    borderColor: C.warningText + '30',
    borderRadius: 16,
    padding: 14,
    marginBottom: 24,
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
    fontSize: 12,
    fontWeight: '800',
    color: C.textSec,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  tile: {
    width: TILE_SIZE,
    backgroundColor: '#16161F',
    borderRadius: 20,
    padding: 12,
    marginHorizontal: 4,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
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
