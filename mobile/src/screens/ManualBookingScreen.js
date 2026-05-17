import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const C = {
  bg: '#F5F6FA',
  white: '#FFFFFF',
  primary: '#00C853',
  primaryDark: '#00A843',
  text: '#1A1A2E',
  textSec: '#666680',
  textMuted: '#9999AA',
  border: '#E8E8F0',
  card: '#FFFFFF',
  shadow: '#00000015',
  warning: '#FF9500',
  headerBg: '#FFFFFF',
};

const SERVICE_CATEGORIES = [
  {
    id: 'home_services',
    title: 'Home Services',
    subtitle: 'AC, Plumber, Electric & more',
    emoji: '🔧',
    backgroundColor: '#E8F5E9',  // light green
    borderColor: C.primary,
    available: true,
    categories: ['AC_REPAIR', 'ELECTRICIAN', 'PLUMBER', 'CARPENTER', 'PAINTER', 'CLEANER', 'GARDENER']
  },
  {
    id: 'cleaning',
    title: 'Cleaning Services', 
    subtitle: 'Deep clean, sofa wash & more',
    emoji: '🧹',
    backgroundColor: '#E3F2FD', // light blue
    borderColor: '#2196F3',
    available: false,  // Coming soon
    categories: ['CLEANER']
  },
];

const POPULAR_SERVICES = [
  { type: 'AC_REPAIR', label: 'AC Services', emoji: '❄️', color: '#E3F2FD', iconColor: '#1565C0' },
  { type: 'CARPENTER', label: 'Carpenter', emoji: '🪚', color: '#FFF3E0', iconColor: '#E65100' },
  { type: 'ELECTRICIAN', label: 'Electrician', emoji: '⚡', color: '#FFFDE7', iconColor: '#F57F17' },
  { type: 'CLEANER', label: 'Cleaning', emoji: '🧹', color: '#F3E5F5', iconColor: '#6A1B9A' },
  { type: 'PLUMBER', label: 'Plumber', emoji: '🔧', color: '#E8F5E9', iconColor: '#1B5E20' },
  { type: 'PAINTER', label: 'Painter', emoji: '🎨', color: '#FCE4EC', iconColor: '#880E4F' },
  { type: 'TUTOR', label: 'Tutor', emoji: '📚', color: '#E0F2F1', iconColor: '#004D40' },
  { type: 'BEAUTICIAN', label: 'Beauty', emoji: '💄', color: '#FFF8E1', iconColor: '#FF6F00' },
  { type: 'GARDENER', label: 'Gardener', emoji: '🌱', color: '#F1F8E9', iconColor: '#33691E' },
];

const SectionHeader = ({ title }) => (
  <View style={s.sectionHeader}>
    <Text style={s.sectionTitle}>{title}</Text>
  </View>
);

export default function ManualBookingScreen({ navigation }) {
  const [currentAddress, setCurrentAddress] = useState(null);

  useFocusEffect(
    React.useCallback(() => {
      AsyncStorage.getItem('selected_address').then(val => {
        if (val) {
          setCurrentAddress(JSON.parse(val));
        } else {
          setCurrentAddress(null);
        }
      }).catch(err => {
        console.error('AsyncStorage read error:', err);
      });
    }, [])
  );

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.headerGreeting}>Good day! 👋</Text>
          <Text style={s.headerTitle}>What service do you need?</Text>
        </View>
      </View>

      {/* Address Bar */}
      <TouchableOpacity 
        style={s.addressBar}
        onPress={() => navigation.navigate('AddressScreen')}
      >
        <View style={s.addressIconWrap}>
          <Ionicons name="location" size={20} color={C.primary} />
        </View>
        <View style={s.addressTextWrap}>
          <Text style={s.addressLabel}>
            Deliver to: {currentAddress?.label || 'Add address'}
          </Text>
          <Text style={s.addressText} numberOfLines={1}>
            {currentAddress?.address || 'Tap to add your address'}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={18} color={C.textMuted} />
      </TouchableOpacity>

      <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={s.scrollContent}>
        {/* Categories Section */}
        <SectionHeader title="🔧 Categories" />
        <View style={s.catRow}>
          {SERVICE_CATEGORIES.map(cat => {
            const isHome = cat.id === 'home_services';
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  s.serviceCard, 
                  { 
                    backgroundColor: cat.backgroundColor, 
                    borderColor: cat.borderColor,
                    borderWidth: isHome ? 2 : 1
                  }
                ]}
                onPress={() => cat.available 
                  ? navigation.navigate('ProvidersListScreen', { categories: cat.categories, title: cat.title })
                  : null
                }
                activeOpacity={cat.available ? 0.7 : 1}
              >
                <View style={[s.cardIconWrap, { backgroundColor: isHome ? C.primary : '#2196F3' }]}>
                  <Text style={s.cardEmoji}>{cat.emoji}</Text>
                </View>
                <Text style={s.cardTitle}>{cat.title}</Text>
                <Text style={s.cardSubtitle} numberOfLines={2}>{cat.subtitle}</Text>
                {!cat.available && (
                  <View style={s.comingSoonBadge}>
                    <Text style={s.comingSoonText}>Coming Soon</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Popular Services Section */}
        <SectionHeader title="🔥 Popular Services" />
        <View style={s.servicesGrid}>
          {POPULAR_SERVICES.map((svc, i) => (
            <TouchableOpacity
              key={i}
              style={[s.svcTile, { backgroundColor: svc.color }]}
              onPress={() => navigation.navigate('ProvidersListScreen', {
                categories: [svc.type],
                title: svc.label,
                filterCategory: svc.type
              })}
              activeOpacity={0.75}
            >
              <View style={[s.svcIconWrap, { backgroundColor: svc.iconColor }]}>
                <Text style={s.svcEmoji}>{svc.emoji}</Text>
              </View>
              <Text style={s.svcLabel}>{svc.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.white },
  header: {
    backgroundColor: C.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerGreeting: { fontSize: 13, color: C.textSec, marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: C.text },
  addressBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.white, marginHorizontal: 16,
    marginTop: 12, marginBottom: 4,
    padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 4, elevation: 2,
  },
  addressIconWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#E8F5E9',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  addressTextWrap: { flex: 1 },
  addressLabel: { color: C.text, fontSize: 12, fontWeight: '700', marginBottom: 2 },
  addressText: { color: C.textSec, fontSize: 11 },
  scrollContent: { paddingBottom: 30 },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: C.textSec,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10
  },
  serviceCard: {
    borderRadius: 16,
    padding: 20,
    width: '48%',
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 4, elevation: 2,
    justifyContent: 'space-between',
    minHeight: 170,
  },
  cardIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  cardEmoji: { fontSize: 28 },
  cardTitle: { 
    fontSize: 16, fontWeight: '800', 
    color: C.text, marginBottom: 4 
  },
  cardSubtitle: { fontSize: 12, color: C.textSec, lineHeight: 18 },
  comingSoonBadge: {
    backgroundColor: C.warning,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10, alignSelf: 'flex-start',
    marginTop: 8,
  },
  comingSoonText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 10,
  },
  svcTile: {
    width: '30%',
    aspectRatio: 0.9,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00000010',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  svcIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  svcEmoji: { fontSize: 24 },
  svcLabel: {
    fontSize: 11, fontWeight: '700',
    color: C.text, textAlign: 'center',
  }
});
