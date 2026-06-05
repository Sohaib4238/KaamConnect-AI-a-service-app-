import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  TextInput,
  Animated,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, XCircle, Users } from 'lucide-react-native';
import { getProviders } from '../config/api';
import { getServiceEmoji } from '../utils/serviceHelpers';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const C = {
  bg: '#0A0A0F',
  white: '#111118',
  primary: '#00C896',
  text: '#F0F0F5',
  textSec: '#8888AA',
  textMuted: '#555570',
  border: 'rgba(255, 255, 255, 0.08)',
  card: '#16161F',
  headerBg: '#0A0A0F',
  liveDot: '#00C896',
  closedDot: '#FF5C5C',
};

const DEFAULT_LAT = 24.8607;
const DEFAULT_LNG = 67.0011;

const CATEGORY_LABELS = {
  'AC_REPAIR': 'AC Services',
  'ELECTRICIAN': 'Electrician',
  'PLUMBER': 'Plumber',
  'CARPENTER': 'Carpenter',
  'PAINTER': 'Painter',
  'TUTOR': 'Tutor',
  'BEAUTICIAN': 'Beauty',
  'DRIVER': 'Driver',
  'CLEANER': 'Cleaning',
  'GARDENER': 'Gardener'
};

export default function ProvidersListScreen({ route, navigation }) {
  const { categories = [], title = 'Providers', filterCategory = null } = route.params || {};

  const [activeCategory, setActiveCategory] = useState(filterCategory || categories[0] || 'ALL');
  const [displayTitle, setDisplayTitle] = useState(() => {
    if (filterCategory && filterCategory !== 'ALL') {
      return CATEGORY_LABELS[filterCategory] || filterCategory.replace(/_/g, ' ');
    }
    return title;
  });
  
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLoc, setUserLoc] = useState({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
  const [searchQuery, setSearchQuery] = useState('');

  // Animated pulse opacity for skeleton loading
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    // Try to load user GPS coordinates
    AsyncStorage.getItem('user_location').then(val => {
      if (val) setUserLoc(JSON.parse(val));
    });
  }, []);

  useEffect(() => {
    fetchProvidersList();
  }, [activeCategory]);

  const fetchProvidersList = async () => {
    setLoading(true);
    try {
      // Fetch all/filtered from server
      const categoryFilter = activeCategory === 'ALL' ? null : activeCategory;
      const data = await getProviders(categoryFilter);
      
      let fetched = data.providers || [];

      // Calculate distance simulation
      fetched = fetched.map(p => {
        let dist = 1.2; // default
        if (p.location && p.location.lat && p.location.lng) {
          dist = calculateDistance(
            userLoc.lat, userLoc.lng,
            p.location.lat, p.location.lng
          );
        }
        return { ...p, distance_km: dist };
      });

      // Distance fix - filter out providers where distance_km > 100
      let finalProviders = fetched.filter(p => p.distance_km <= 100);
      
      // If after filtering less than 3 providers remain, show all providers regardless of distance
      if (finalProviders.length < 3) {
        finalProviders = fetched;
      }

      // Sort by: available first, then rating descending
      finalProviders.sort((a, b) => {
        const aAvail = a.simulated_state?.availability ? 1 : 0;
        const bAvail = b.simulated_state?.availability ? 1 : 0;
        if (aAvail !== bAvail) return bAvail - aAvail;
        return (b.simulated_state?.rating || 0) - (a.simulated_state?.rating || 0);
      });

      // Show max 10 providers
      finalProviders = finalProviders.slice(0, 10);

      setProviders(finalProviders);
    } catch (e) {
      console.error('Failed to get providers:', e);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleCategoryChange = (item) => {
    setActiveCategory(item);
    if (item === 'ALL') {
      setDisplayTitle(title);
    } else {
      setDisplayTitle(CATEGORY_LABELS[item] || item.replace(/_/g, ' '));
    }
  };

  const getFilteredProviders = () => {
    if (!searchQuery.trim()) return providers;
    return providers.filter(p => 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.service_categories?.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const renderSkeleton = () => (
    <View style={s.skeletonContainer}>
      {[1, 2, 3].map(item => (
        <Animated.View key={item} style={[s.skeletonCard, { opacity: pulseAnim }]}>
          <View style={s.skeletonAvatar} />
          <View style={s.skeletonInfo}>
            <View style={s.skeletonLine} />
            <View style={[s.skeletonLine, { width: '60%' }]} />
            <View style={[s.skeletonLine, { width: '40%' }]} />
          </View>
        </Animated.View>
      ))}
    </View>
  );

  const filteredProviders = getFilteredProviders();

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{displayTitle}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={s.searchBar}>
        <Search size={18} color="#8888AA" style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search provider name or service..."
          placeholderTextColor="#555570"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={s.searchInput}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <XCircle size={16} color="#8888AA" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Chips (Only show if multiple categories passed) */}
      {categories.length > 1 && (
        <View style={s.chipWrapper}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={['ALL', ...categories]}
            keyExtractor={item => item}
            contentContainerStyle={s.chipList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[s.chip, activeCategory === item && s.chipActive]}
                onPress={() => handleCategoryChange(item)}
              >
                <Text style={[s.chipText, activeCategory === item && s.chipTextActive]}>
                  {item === 'ALL' ? '🌎 All' : `${getServiceEmoji(item)} ${CATEGORY_LABELS[item] || item.replace(/_/g, ' ')}`}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Body List */}
      {loading ? (
        renderSkeleton()
      ) : filteredProviders.length === 0 ? (
        <View style={s.emptyContainer}>
          <Users size={48} color="#555570" style={{ marginBottom: 12 }} />
          <Text style={s.emptyTitle}>No Providers Found</Text>
          <Text style={s.emptySub}>No active providers match this service category.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProviders}
          keyExtractor={item => item.id || item.place_id}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={s.provCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('ProviderMenuScreen', { 
                providerId: item.id || item.place_id,
                providerName: item.name
              })}
            >
              <View style={s.provCardTop}>
                {/* Provider Avatar */}
                <View style={s.provAvatar}>
                  <Text style={s.provAvatarEmoji}>
                    {getServiceEmoji(item.service_categories?.[0])}
                  </Text>
                </View>
                
                {/* Provider Info */}
                <View style={s.provInfo}>
                  <View style={s.provNameRow}>
                    <Text style={s.provName} numberOfLines={1}>{item.name}</Text>
                    {item.simulated_state?.availability ? (
                      <View style={s.liveBadge}>
                        <Text style={s.liveText}>● OPEN</Text>
                      </View>
                    ) : (
                      <View style={[s.liveBadge, { backgroundColor: 'rgba(255, 92, 92, 0.08)' }]}>
                        <Text style={[s.liveText, { color: C.closedDot }]}>● BUSY</Text>
                      </View>
                    )}
                  </View>
                  
                  <Text style={s.provCategory} numberOfLines={1}>
                    {item.service_categories?.map(c => CATEGORY_LABELS[c] || c.replace(/_/g, ' ')).join(' · ')}
                  </Text>
                  
                  {/* Stats Row */}
                  <View style={s.provStats}>
                    <Text style={s.provStat}>
                      ⭐ {Number(item.simulated_state?.rating || 4.0).toFixed(1)}
                    </Text>
                    <Text style={s.statDot}>·</Text>
                    <Text style={s.provStat}>
                      ✅ {Math.round((item.simulated_state?.on_time_score || 0.8) * 100)}% on-time
                    </Text>
                    <Text style={s.statDot}>·</Text>
                    <Text style={s.provStat}>
                      {item.distance_km ? `${Number(item.distance_km).toFixed(1)} km` : 'Nearby'}
                    </Text>
                  </View>
                  
                  {/* Price Range */}
                  <Text style={s.provPrice}>
                    PKR {item.simulated_state?.price_range_pkr?.min || 1500} – {item.simulated_state?.price_range_pkr?.max || 5000}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#0A0A0F',
    borderBottomWidth: 1,
    borderBottomColor: C.border
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { color: C.text, fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#16161F',
    marginHorizontal: 12, marginBottom: 10,
    marginTop: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
  },
  searchInput: { flex: 1, color: C.text, fontSize: 14, padding: 0 },
  chipWrapper: { 
    borderBottomWidth: 1, 
    borderBottomColor: C.border, 
    backgroundColor: '#0A0A0F',
    paddingVertical: 8
  },
  chipList: { paddingHorizontal: 16 },
  chip: { 
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#16161F', borderRadius: 20,
    marginRight: 8, borderWidth: 1, borderColor: C.border,
  },
  chipActive: { 
    backgroundColor: 'rgba(0, 200, 150, 0.08)', 
    borderColor: C.primary,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: C.textSec },
  chipTextActive: { color: C.primary, fontWeight: '700' },
  listContent: { paddingBottom: 32 },
  provCard: { 
    backgroundColor: '#16161F',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  provCardTop: { flexDirection: 'row', flex: 1 },
  provAvatar: { 
    width: 60, height: 60, borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  provAvatarEmoji: { fontSize: 28 },
  provInfo: { flex: 1, justifyContent: 'center' },
  provNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  provName: { color: C.text, fontSize: 16, fontWeight: '800', flex: 1, marginRight: 8, letterSpacing: -0.3 },
  liveBadge: { 
    backgroundColor: 'rgba(0, 200, 150, 0.08)',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8,
  },
  liveText: { color: C.primary, fontSize: 10, fontWeight: '800' },
  provCategory: { fontSize: 12, color: C.textSec, marginTop: 2, textTransform: 'capitalize' },
  provStats: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  provStat: { fontSize: 12, color: C.textSec },
  statDot: { color: C.textMuted, marginHorizontal: 4 },
  provPrice: { 
    fontSize: 13, fontWeight: '700', 
    color: C.primary, marginTop: 4 
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { color: C.text, fontSize: 16, fontWeight: '700', marginTop: 12, marginBottom: 4 },
  emptySub: { color: C.textSec, fontSize: 12, textAlign: 'center' },
 
  // Skeletons
  skeletonContainer: { padding: 12 },
  skeletonCard: { 
    backgroundColor: '#16161F', borderRadius: 20,
    padding: 16, marginHorizontal: 12, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  skeletonAvatar: { 
    width: 60, height: 60, borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)', marginRight: 14,
  },
  skeletonInfo: { flex: 1, gap: 8 },
  skeletonLine: { 
    height: 12, borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)', width: '80%',
  }
});
