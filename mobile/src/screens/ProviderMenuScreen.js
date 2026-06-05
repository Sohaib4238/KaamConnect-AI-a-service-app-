import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ShoppingCart, AlertTriangle, HelpCircle, ChevronRight } from 'lucide-react-native';
import { getProviderDetails } from '../config/api';
import { getServiceEmoji } from '../utils/serviceHelpers';
import { LinearGradient } from 'expo-linear-gradient';

const C = {
  bg: '#0A0A0F', surface: '#111118', card: '#16161F', primary: '#00C896',
  text: '#F0F0F5', textSec: '#8888AA', textMuted: '#555570',
  border: 'rgba(255, 255, 255, 0.08)', headerBg: '#0A0A0F', warning: '#F5C842', star: '#F5C842'
};

const CATEGORY_NAMES = {
  ac: '❄️ AC Services',
  el: '⚡ Electrical Services',
  pl: '🔧 Plumbing Services',
  ca: '🪚 Carpentry Services',
  pa: '🎨 Painting Services',
  tu: '📚 Tutoring Services',
  be: '💄 Beauty Services',
  cl: '🧹 Cleaning Services',
  dr: '🚗 Driving Services',
  ga: '🌱 Gardening Services'
};

export default function ProviderMenuScreen({ route, navigation }) {
  const { providerId, providerName = 'Provider Menu' } = route.params || {};

  const [provider, setProvider] = useState(null);
  const [cart, setCart] = useState([]); // [{id, name, price, qty}]
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProviderMenu();
  }, [providerId]);

  const fetchProviderMenu = async () => {
    setLoading(true);
    try {
      const data = await getProviderDetails(providerId);
      if (data.success) {
        setProvider(data.provider);
      }
    } catch (e) {
      console.error('Failed to get provider menu:', e);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (service) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === service.id);
      if (existing) {
        return prev.map(c => c.id === service.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { ...service, qty: 1 }];
    });
  };

  const removeFromCart = (serviceId) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === serviceId);
      if (existing?.qty === 1) {
        return prev.filter(c => c.id !== serviceId);
      }
      return prev.map(c => c.id === serviceId ? { ...c, qty: c.qty - 1 } : c);
    });
  };

  const isInCart = (serviceId) => cart.some(c => c.id === serviceId);

  const getQtyInCart = (serviceId) => {
    const item = cart.find(c => c.id === serviceId);
    return item ? item.qty : 0;
  };

  // Group services
  const groupServices = () => {
    if (!provider || !provider.services) return {};
    const grouped = {};
    provider.services.forEach(service => {
      const prefix = service.id.split('_')[0];
      const categoryName = CATEGORY_NAMES[prefix] || '🔧 Other Services';
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(service);
    });
    return grouped;
  };

  const grouped = groupServices();
  const totalCartCount = cart.reduce((sum, c) => sum + c.qty, 0);
  const totalCartPrice = cart.reduce((sum, c) => sum + c.price * c.qty, 0);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{providerName}</Text>
        
        <TouchableOpacity 
          style={s.cartBtn}
          onPress={() => cart.length > 0 && navigation.navigate('CheckoutScreen', { cart, provider })}
          disabled={cart.length === 0}
        >
          <ShoppingCart size={22} color={cart.length > 0 ? C.primary : '#8888AA'} />
          {cart.length > 0 && (
            <View style={s.cartBadge}>
              <Text style={s.cartBadgeText}>{totalCartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.loader}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.loaderText}>Loading menu...</Text>
        </View>
      ) : !provider ? (
        <View style={s.errorState}>
          <AlertTriangle size={48} color="#555570" style={{ marginBottom: 12 }} />
          <Text style={s.errorText}>Provider not found</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Provider Info Card */}
            <View style={s.provInfoCard}>
              <View style={s.provEmojiWrap}>
                <Text style={s.provInfoEmoji}>
                  {getServiceEmoji(provider.service_categories?.[0])}
                </Text>
              </View>
              <Text style={s.provInfoName}>{provider.name}</Text>
              <View style={s.provInfoStats}>
                <View style={s.statBadge}>
                  <Text style={s.statBadgeText}>⭐ {Number(provider.simulated_state?.rating || 4.8).toFixed(1)}</Text>
                </View>
                <View style={s.statBadge}>
                  <Text style={s.statBadgeText}>✅ {Math.round((provider.simulated_state?.on_time_score || 0.9) * 100)}% on-time</Text>
                </View>
                <View style={s.statBadge}>
                  <Text style={s.statBadgeText}>📞 Active</Text>
                </View>
              </View>
              <Text style={s.phoneText}>Contact: {provider.phone}</Text>
            </View>

            {/* Menu List */}
            {Object.keys(grouped).map(catName => (
              <View key={catName} style={s.menuSection}>
                <Text style={s.sectionHeader}>{catName}</Text>
                {grouped[catName].map(service => (
                  <View key={service.id} style={s.serviceItem}>
                    <View style={s.serviceInfo}>
                      <Text style={s.serviceName}>{service.name}</Text>
                      {service.description ? (
                        <Text style={s.serviceDesc}>{service.description}</Text>
                      ) : null}
                      <View style={s.serviceMeta}>
                        <Text style={s.servicePrice}>PKR {service.price.toLocaleString()}</Text>
                        <Text style={s.serviceDuration}>⏱ {service.duration_mins || 45} mins</Text>
                      </View>
                    </View>

                    {/* Add / Remove buttons */}
                    {isInCart(service.id) ? (
                      <View style={s.qtyControl}>
                        <TouchableOpacity 
                          style={s.qtyBtn}
                          onPress={() => removeFromCart(service.id)}
                        >
                          <Text style={s.qtyBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={s.qtyNum}>{getQtyInCart(service.id)}</Text>
                        <TouchableOpacity 
                          style={s.qtyBtn}
                          onPress={() => addToCart(service)}
                        >
                          <Text style={s.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={s.addBtn}
                        onPress={() => addToCart(service)}
                        activeOpacity={0.8}
                      >
                        <Text style={s.addBtnText}>+ Add</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            ))}

            {/* Special "Not sure? Request Visit" Option */}
            <View style={s.visitCard}>
              <View style={s.visitCardHeaderRow}>
                <HelpCircle size={22} color="#7B61FF" />
                <Text style={s.visitCardTitle}>Not sure what you need?</Text>
              </View>
              <Text style={s.visitCardDesc}>
                Get an on-site expert assessment. The provider will visit, diagnose the problem, and give a customized quote.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  const visitQuoteService = {
                    id: 'visit_quote',
                    serviceId: 'visit_quote',
                    serviceName: 'On-site Assessment & Quote',
                    name: 'On-site Assessment & Quote',
                    price: 0,
                    duration: 0,
                    qty: 1,
                    isVisitQuote: true,
                  };
                  navigation.navigate('CheckoutScreen', {
                    cart: [visitQuoteService],
                    provider,
                    source: route.params?.source || 'manual'
                  });
                }}
                activeOpacity={0.85}
                style={s.visitBtnWrapper}
              >
                <LinearGradient
                  colors={['#7B61FF', '#00C896']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.visitBtn}
                >
                  <Text style={s.visitBtnText}>Request Visit & Quote</Text>
                  <ChevronRight size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Sticky Bottom Bar */}
          {cart.length > 0 && (
            <View style={s.cartBar}>
              <View style={s.cartBarLeft}>
                <Text style={s.cartBarCount}>{totalCartCount} item{totalCartCount > 1 ? 's' : ''} added</Text>
                <Text style={s.cartBarTotal}>PKR {totalCartPrice.toLocaleString()}</Text>
              </View>
              
              <TouchableOpacity 
                onPress={() => navigation.navigate('CheckoutScreen', { cart, provider })}
                activeOpacity={0.85}
                style={s.cartBarBtnWrapper}
              >
                <LinearGradient
                  colors={['#00C896', '#7B61FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.cartBarBtn}
                >
                  <Text style={s.cartBarBtnText}>Checkout →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
  headerTitle: { color: C.text, fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center', letterSpacing: -0.3 },
  cartBtn: { 
    width: 40, 
    height: 40, 
    justifyContent: 'center', 
    alignItems: 'flex-end',
    position: 'relative'
  },
  cartBadge: { 
    position: 'absolute', 
    right: -4, 
    top: 0, 
    backgroundColor: '#FF5C5C', 
    borderRadius: 9, 
    width: 18, 
    height: 18, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { color: C.textSec, fontSize: 14, marginTop: 12 },
  errorState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: C.text, fontSize: 16, fontWeight: '700', marginTop: 12 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  provInfoCard: { 
    backgroundColor: '#16161F', 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.04)', 
    padding: 20, 
    alignItems: 'center',
    marginBottom: 24,
  },
  provEmojiWrap: { 
    width: 70, 
    height: 70, 
    borderRadius: 35, 
    backgroundColor: 'rgba(255, 255, 255, 0.04)', 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 12
  },
  provInfoEmoji: { fontSize: 36 },
  provInfoName: { color: C.text, fontSize: 18, fontWeight: '800', marginBottom: 8, letterSpacing: -0.3 },
  provInfoStats: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 8 },
  statBadge: { 
    backgroundColor: 'rgba(255, 255, 255, 0.04)', 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.08)', 
    borderRadius: 12, 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    marginHorizontal: 4,
    marginBottom: 4
  },
  statBadgeText: { color: C.textSec, fontSize: 11, fontWeight: '600' },
  phoneText: { color: C.textSec, fontSize: 12, marginTop: 4 },
  menuSection: { marginBottom: 20 },
  sectionHeader: { color: C.primary, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, paddingLeft: 4 },
  serviceItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#16161F', 
    padding: 16, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.04)', 
    marginBottom: 10,
  },
  serviceInfo: { flex: 1, marginRight: 16 },
  serviceName: { color: C.text, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  serviceDesc: { color: C.textSec, fontSize: 12, lineHeight: 16, marginBottom: 8 },
  serviceMeta: { flexDirection: 'row', alignItems: 'center' },
  servicePrice: { color: C.primary, fontSize: 13, fontWeight: '750', marginRight: 12 },
  serviceDuration: { color: C.textSec, fontSize: 12 },
  qtyControl: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255, 255, 255, 0.04)', 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 4,
    paddingVertical: 2
  },
  qtyBtn: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: '#16161F', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  qtyBtnText: { color: C.text, fontSize: 18, fontWeight: '600' },
  qtyNum: { color: C.text, fontSize: 14, fontWeight: '700', marginHorizontal: 12 },
  addBtn: { 
    backgroundColor: C.primary, 
    borderRadius: 20, 
    paddingHorizontal: 16, 
    paddingVertical: 8 
  },
  addBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  cartBar: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: '#111118', 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(255, 255, 255, 0.08)', 
    padding: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
  },
  cartBarLeft: { justifyContent: 'center' },
  cartBarCount: { color: C.textSec, fontSize: 12, fontWeight: '500' },
  cartBarTotal: { color: C.text, fontSize: 18, fontWeight: '800', marginTop: 2 },
  cartBarBtnWrapper: {
    borderRadius: 12,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4
  },
  cartBarBtn: { 
    borderRadius: 12, 
    paddingHorizontal: 24, 
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBarBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  visitCard: {
    backgroundColor: 'rgba(123, 97, 255, 0.06)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.2)',
    padding: 16,
    marginTop: 10,
    marginBottom: 20,
  },
  visitCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  visitCardTitle: {
    color: '#7B61FF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  visitCardDesc: {
    color: '#8888AA',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  visitBtnWrapper: {
    borderRadius: 12,
  },
  visitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  visitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  }
});
