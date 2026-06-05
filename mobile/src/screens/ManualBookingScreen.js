import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, ChevronDown, Sparkles } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const C = {
  bg: '#0A0A0F',
  white: '#111118',
  primary: '#00C896',
  primaryDark: '#00A882',
  text: '#F0F0F5',
  textSec: '#8888AA',
  textMuted: '#555570',
  border: 'rgba(255, 255, 255, 0.08)',
  card: '#16161F',
  shadow: 'rgba(0, 0, 0, 0.5)',
  warning: '#F5C842',
  headerBg: '#0A0A0F',
};

const SERVICE_CATEGORIES = [
  {
    id: 'home_services',
    title: 'Home Services',
    subtitle: 'AC, Plumber, Electric & more',
    emoji: '🔧',
    backgroundColor: '#16161F',
    borderColor: '#00C896',
    available: true,
    categories: ['AC_REPAIR', 'ELECTRICIAN', 'PLUMBER', 'CARPENTER', 'PAINTER', 'CLEANER', 'GARDENER', 'BEAUTICIAN', 'TUTOR']
  },
  {
    id: 'cleaning',
    title: 'Cleaning Services', 
    subtitle: 'Deep clean, sofa wash & more',
    emoji: '🧹',
    backgroundColor: '#16161F',
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    bgColor: '#16161F',
    accentColor: '#00C896',
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
    bgColor: '#16161F',
    accentColor: '#7B61FF',
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
    bgColor: '#16161F',
    accentColor: '#F5C842',
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
    bgColor: '#16161F',
    accentColor: '#00C896',
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
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />
      
      {/* Decorative glows */}
      <View style={s.circle1} />
      
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
          <LinearGradient
            colors={['#00C896', '#7B61FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.profileAvatarWrap}
          >
            <View style={s.profileAvatar}>
              <Text style={s.profileInitials}>{getInitials()}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Address Bar */}
      <TouchableOpacity 
        style={s.addressBar}
        onPress={() => navigation.navigate('AddressScreen')}
        activeOpacity={0.85}
      >
        <View style={s.addressIconWrap}>
          <MapPin size={18} color="#00C896" />
        </View>
        <View style={s.addressTextWrap}>
          <Text style={s.addressLabel}>
            Deliver to: {currentAddress?.label || 'Add address'}
          </Text>
          <Text style={s.addressText} numberOfLines={1}>
            {currentAddress?.address || 'Tap to add your address'}
          </Text>
        </View>
        <ChevronDown size={18} color="#8888AA" />
      </TouchableOpacity>

      <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
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
                    borderColor: isHome ? '#00C896' : 'rgba(255, 255, 255, 0.08)',
                    borderWidth: 1.5
                  }
                ]}
                onPress={() => isHome 
                  ? navigation.navigate('HomeServices')
                  : null
                }
                activeOpacity={cat.available ? 0.8 : 1}
              >
                <View style={[s.cardIconWrap, { backgroundColor: isHome ? 'rgba(0, 200, 150, 0.1)' : 'rgba(255, 255, 255, 0.04)' }]}>
                  <Text style={s.cardEmoji}>{cat.emoji}</Text>
                </View>
                <View>
                  <Text style={s.cardTitle}>{cat.title}</Text>
                  <Text style={s.cardSubtitle} numberOfLines={2}>{cat.subtitle}</Text>
                </View>
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
            <Text style={s.trendingTitle}>
              <Sparkles size={16} color="#F5C842" style={{ marginRight: 4 }} />
              Trending Services
            </Text>
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
                <View style={[s.trendingBadge, { backgroundColor: 'rgba(255, 255, 255, 0.06)', borderColor: item.accentColor, borderWidth: 1 }]}>
                  <Text style={[s.trendingBadgeText, { color: item.accentColor }]}>{item.badge}</Text>
                </View>
                
                {/* Icon */}
                <View style={s.trendingEmojiWrap}>
                  <Text style={s.trendingEmoji}>{item.emoji}</Text>
                </View>
                
                {/* Content */}
                <Text style={s.trendingCardTitle}>{item.title}</Text>
                <Text style={s.trendingCardSub}>{item.subtitle}</Text>
                
                {/* Price row */}
                <View style={s.trendingPriceRow}>
                  <Text style={[s.trendingPrice, { color: '#00C896' }]}>
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
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  circle1: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    backgroundColor: 'rgba(0, 200, 150, 0.04)',
    top: -width * 0.3,
    right: -width * 0.2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0A0A0F',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerLeft: { flex: 1 },
  headerGreeting: { fontSize: 13, color: '#8888AA', marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#F0F0F5', marginRight: 8, letterSpacing: -0.5 },
  profileBtn: { padding: 4 },
  profileAvatarWrap: {
    width: 38, height: 38, borderRadius: 19,
    padding: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  profileAvatar: {
    width: '100%', height: '100%', borderRadius: 18,
    backgroundColor: '#16161F',
    alignItems: 'center', justifyContent: 'center',
  },
  profileInitials: { 
    color: '#F0F0F5', fontSize: 13, fontWeight: '800' 
  },
  addressBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111118', marginHorizontal: 16,
    marginTop: 12, marginBottom: 8,
    padding: 14, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  addressIconWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0, 200, 150, 0.08)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 150, 0.15)',
  },
  addressTextWrap: { flex: 1 },
  addressLabel: { color: '#F0F0F5', fontSize: 12, fontWeight: '700', marginBottom: 2 },
  addressText: { color: '#8888AA', fontSize: 11 },
  scrollContent: { paddingBottom: 30 },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8888AA',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 12,
  },
  serviceCard: {
    borderRadius: 20,
    padding: 20,
    flex: 1,
    backgroundColor: '#16161F',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'space-between',
    minHeight: 180,
  },
  cardIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardEmoji: { fontSize: 28 },
  cardTitle: { 
    fontSize: 16, fontWeight: '800', 
    color: '#F0F0F5', marginBottom: 4 
  },
  cardSubtitle: { fontSize: 12, color: '#8888AA', lineHeight: 18 },
  comingSoonBadge: {
    backgroundColor: 'rgba(245, 200, 66, 0.1)',
    borderWidth: 1,
    borderColor: '#F5C842',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, alignSelf: 'flex-start',
    marginTop: 8,
  },
  comingSoonText: { color: '#F5C842', fontSize: 10, fontWeight: '700' },
  trendingSection: { marginTop: 8 },
  trendingHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16,
    paddingTop: 20, paddingBottom: 12,
  },
  trendingTitle: {
    fontSize: 16, fontWeight: '800', color: '#F0F0F5',
    flexDirection: 'row', alignItems: 'center', gap: 6
  },
  viewAll: { fontSize: 13, color: '#00C896', fontWeight: '700' },
  trendingScroll: { paddingHorizontal: 16, paddingBottom: 8, gap: 12 },
  trendingCard: {
    width: 180, borderRadius: 20, padding: 14,
    backgroundColor: '#16161F',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
    marginRight: 12,
  },
  trendingBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, marginBottom: 10,
  },
  trendingBadgeText: { fontSize: 9, fontWeight: '800' },
  trendingEmojiWrap: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  trendingEmoji: { fontSize: 24 },
  trendingCardTitle: {
    fontSize: 14, fontWeight: '800',
    color: '#F0F0F5', marginBottom: 4,
  },
  trendingCardSub: {
    fontSize: 11, color: '#8888AA',
    lineHeight: 16, marginBottom: 10,
  },
  trendingPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trendingPrice: { fontSize: 14, fontWeight: '800' },
  trendingOriginalPrice: {
    fontSize: 11, color: '#555570',
    textDecorationLine: 'line-through',
  }
});
