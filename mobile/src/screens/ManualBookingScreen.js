import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import * as Location from 'expo-location';

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

const TRENDING_SERVICES = [
  {
    id: 1,
    title: 'AC General Service',
    subtitle: 'Complete cleaning + gas check',
    price: 'PKR 2,500',
    originalPrice: 'PKR 3,500',
    emoji: '❄️',
    category: 'AC_REPAIR',
    bgColor: '#EFF8FF',
    accentColor: '#1565C0',
    badge: '🔥 Most Booked',
  },
  {
    id: 2,
    title: 'Home Deep Clean',
    subtitle: 'Full apartment deep cleaning',
    price: 'PKR 5,000',
    originalPrice: 'PKR 7,000',
    emoji: '🧹',
    category: 'CLEANER',
    bgColor: '#F3E5F5',
    accentColor: '#6A1B9A',
    badge: '⭐ Top Rated',
  },
  {
    id: 3,
    title: 'Wiring Inspection',
    subtitle: 'Complete home wiring checkup',
    price: 'PKR 1,500',
    originalPrice: 'PKR 2,000',
    emoji: '⚡',
    category: 'ELECTRICIAN',
    bgColor: '#FFFDE7',
    accentColor: '#F57F17',
    badge: '⚡ Quick Service',
  },
  {
    id: 4,
    title: 'Pipe Leak Repair',
    subtitle: 'Fix leaking pipes and joints',
    price: 'PKR 1,200',
    originalPrice: 'PKR 1,800',
    emoji: '🔧',
    category: 'PLUMBER',
    bgColor: '#E8F5E9',
    accentColor: '#1B5E20',
    badge: '🏆 Best Value',
  },
];

const SectionHeader = ({ title }) => (
  <View style={s.sectionHeader}>
    <Text style={s.sectionTitle}>{title}</Text>
  </View>
);

export default function ManualBookingScreen({ navigation }) {
  const [currentAddress, setCurrentAddress] = useState(null);
  const { user, userProfile } = useAuth();

  const getInitials = () => {
    const n = userProfile?.name || user?.displayName || user?.email || 'U';
    return n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const autoDetectLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      const [place] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      if (place) {
        const addr = [
          place.district || place.subregion,
          place.city
        ].filter(Boolean).join(', ');
        const autoAddress = {
          id: 'auto-gps',
          label: 'Current Location',
          address: addr,
          city: place.city || 'Karachi',
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        // Only set if no address already selected
        const existing = await AsyncStorage.getItem('selected_address');
        if (!existing) {
          await AsyncStorage.setItem(
            'selected_address', 
            JSON.stringify(autoAddress)
          );
          setCurrentAddress(autoAddress);
        }
      }
    } catch (error) {
      console.log('[AutoLocation] Error:', error.message);
    }
  };

  useEffect(() => { autoDetectLocation(); }, []);

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
          <Text style={s.headerGreeting}>
            Welcome back, {userProfile?.name?.split(' ')[0] || 'there'}! 👋
          </Text>
          <Text style={s.headerTitle}>What service do you need?</Text>
        </View>
        <TouchableOpacity
          style={s.profileBtn}
          onPress={() => navigation.navigate('ProfileScreen')}>
          <View style={s.profileAvatar}>
            <Text style={s.profileInitials}>{getInitials()}</Text>
          </View>
        </TouchableOpacity>
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
                onPress={() => isHome 
                  ? navigation.navigate('HomeServices')
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

        {/* Trending section */}
        <View style={s.trendingSection}>
          <View style={s.trendingHeader}>
            <Text style={s.trendingTitle}>🔥 Trending Services</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('HomeServices')}>
              <Text style={s.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.trendingScroll}>
            {TRENDING_SERVICES.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[s.trendingCard, { backgroundColor: item.bgColor }]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('ProvidersListScreen', {
                  categories: [item.category],
                  title: item.title,
                  filterCategory: item.category,
                })}
              >
                {/* Badge */}
                <View style={[s.trendingBadge, { backgroundColor: item.accentColor }]}>
                  <Text style={s.trendingBadgeText}>{item.badge}</Text>
                </View>
                
                {/* Icon */}
                <Text style={s.trendingEmoji}>{item.emoji}</Text>
                
                {/* Content */}
                <Text style={s.trendingCardTitle}>{item.title}</Text>
                <Text style={s.trendingCardSub}>{item.subtitle}</Text>
                
                {/* Price row */}
                <View style={s.trendingPriceRow}>
                  <Text style={[s.trendingPrice, { color: item.accentColor }]}>
                    {item.price}
                  </Text>
                  <Text style={s.trendingOriginalPrice}>
                    {item.originalPrice}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerLeft: { flex: 1 },
  headerGreeting: { fontSize: 13, color: C.textSec, marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: C.text, marginRight: 8 },
  profileBtn: { padding: 4 },
  profileAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#00C853',
    alignItems: 'center', justifyContent: 'center',
  },
  profileInitials: { 
    color: '#FFFFFF', fontSize: 13, fontWeight: '800' 
  },
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
  trendingSection: { marginTop: 8 },
  trendingHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16,
    paddingTop: 20, paddingBottom: 12,
  },
  trendingTitle: {
    fontSize: 16, fontWeight: '800', color: '#1A1A2E'
  },
  viewAll: { fontSize: 13, color: '#00C853', fontWeight: '700' },
  trendingScroll: { paddingHorizontal: 12, paddingBottom: 8, gap: 12 },
  trendingCard: {
    width: 180, borderRadius: 16, padding: 14,
    shadowColor: '#00000012',
    shadowOffset: {width:0,height:3},
    shadowOpacity: 1, shadowRadius: 6,
    elevation: 3,
  },
  trendingBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, marginBottom: 10,
  },
  trendingBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  trendingEmoji: { fontSize: 32, marginBottom: 8 },
  trendingCardTitle: {
    fontSize: 14, fontWeight: '800',
    color: '#1A1A2E', marginBottom: 4,
  },
  trendingCardSub: {
    fontSize: 11, color: '#555570',
    lineHeight: 16, marginBottom: 10,
  },
  trendingPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trendingPrice: { fontSize: 14, fontWeight: '800' },
  trendingOriginalPrice: {
    fontSize: 11, color: '#AAAABC',
    textDecorationLine: 'line-through',
  }
});
