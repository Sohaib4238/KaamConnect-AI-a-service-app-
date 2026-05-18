import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getProviderDetails } from '../config/api';
import { getServiceEmoji } from '../utils/serviceHelpers';

const C = {
  bg: '#F5F6FA', surface: '#FFFFFF', card: '#FFFFFF', primary: '#00C853',
  text: '#1A1A2E', textSec: '#555570', textMuted: '#9999AA',
  border: '#E4E5EF', headerBg: '#FFFFFF', warning: '#FF9500', star: '#FFB300'
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
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{providerName}</Text>
        
        <TouchableOpacity 
          style={s.cartBtn}
          onPress={() => cart.length > 0 && navigation.navigate('CheckoutScreen', { cart, provider })}
          disabled={cart.length === 0}
        >
          <Ionicons name="cart" size={24} color={cart.length > 0 ? C.primary : C.textSec} />
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
          <Ionicons name="alert-circle-outline" size={48} color={C.textMuted} />
          <Text style={s.errorText}>Provider not found</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={s.scrollContent}>
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
                  <Text style={s.statBadgeText}>⭐ {provider.simulated_state?.rating?.toFixed(1) || '4.8'}</Text>
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
                <Ionicons name="help-circle" size={24} color="#0288D1" />
                <Text style={s.visitCardTitle}>Not sure what you need?</Text>
              </View>
              <Text style={s.visitCardDesc}>
                Get an on-site expert assessment. The provider will visit, diagnose the problem, and give a customized quote.
              </Text>
              <TouchableOpacity
                style={s.visitBtn}
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
              >
                <Text style={s.visitBtnText}>Request Visit & Quote</Text>
                <Ionicons name="chevron-forward" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
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
                style={s.cartBarBtn}
                onPress={() => navigation.navigate('CheckoutScreen', { cart, provider })}
              >
                <Text style={s.cartBarBtnText}>Checkout →</Text>
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
    backgroundColor: C.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: C.border
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { color: C.text, fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
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
    backgroundColor: '#FF3D00', 
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
    backgroundColor: C.surface, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: C.border, 
    padding: 20, 
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#0000000A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  provEmojiWrap: { 
    width: 70, 
    height: 70, 
    borderRadius: 35, 
    backgroundColor: '#F8F9FC', 
    borderWidth: 1, 
    borderColor: C.border,
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 12
  },
  provInfoEmoji: { fontSize: 36 },
  provInfoName: { color: C.text, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  provInfoStats: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 8 },
  statBadge: { 
    backgroundColor: '#F8F9FC', 
    borderWidth: 1, 
    borderColor: C.border, 
    borderRadius: 12, 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    marginHorizontal: 4,
    marginBottom: 4
  },
  statBadgeText: { color: C.textSec, fontSize: 11, fontWeight: '600' },
  phoneText: { color: C.textMuted, fontSize: 12, marginTop: 4 },
  menuSection: { marginBottom: 20 },
  sectionHeader: { color: C.primary, fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, paddingLeft: 4 },
  serviceItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: C.surface, 
    padding: 16, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: C.border, 
    marginBottom: 10,
    shadowColor: '#00000006',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  serviceInfo: { flex: 1, marginRight: 16 },
  serviceName: { color: C.text, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  serviceDesc: { color: C.textMuted, fontSize: 12, lineHeight: 16, marginBottom: 8 },
  serviceMeta: { flexDirection: 'row', alignItems: 'center' },
  servicePrice: { color: C.text, fontSize: 13, fontWeight: '700', marginRight: 12 },
  serviceDuration: { color: C.textSec, fontSize: 12 },
  qtyControl: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F8F9FC', 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: C.border,
    paddingHorizontal: 4,
    paddingVertical: 2
  },
  qtyBtn: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: C.surface, 
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
    backgroundColor: C.headerBg, 
    borderTopWidth: 1, 
    borderTopColor: C.border, 
    padding: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    shadowColor: '#00000010',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 8,
  },
  cartBarLeft: { justifyContent: 'center' },
  cartBarCount: { color: C.textSec, fontSize: 12, fontWeight: '500' },
  cartBarTotal: { color: C.text, fontSize: 18, fontWeight: '800', marginTop: 2 },
  cartBarBtn: { 
    backgroundColor: C.primary, 
    borderRadius: 12, 
    paddingHorizontal: 24, 
    paddingVertical: 12,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  cartBarBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  visitCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#B3E5FC',
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
    color: '#01579B',
    fontSize: 15,
    fontWeight: '750',
    marginLeft: 8,
  },
  visitCardDesc: {
    color: '#0277BD',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  visitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0288D1',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  visitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  }
});
