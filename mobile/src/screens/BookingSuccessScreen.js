import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const C = {
  bg: '#F5F6FA', surface: '#FFFFFF', card: '#FFFFFF', primary: '#00C853',
  text: '#1A1A2E', textSec: '#555570', textMuted: '#9999AA',
  border: '#E4E5EF', headerBg: '#FFFFFF', warning: '#FF9500', star: '#FFB300'
};

export default function BookingSuccessScreen({ route, navigation }) {
  const { booking = {}, provider = {} } = route.params || {};
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 60,
      friction: 5,
      useNativeDriver: true
    }).start();
  }, []);

  const formatPKTTime = (isoString) => {
    if (!isoString) return 'Date/Time not set';
    try {
      return new Date(isoString).toLocaleString('en-US', {
        timeZone: 'Asia/Karachi',
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }) + ' (PKT)';
    } catch (e) {
      return isoString;
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.content}>
        {/* Animated Check Circle */}
        <Animated.View style={[s.checkCircle, { transform: [{ scale: scaleAnim }] }]}>
          <Ionicons name="checkmark" size={54} color="#FFFFFF" />
        </Animated.View>
        
        <Text style={s.successTitle}>Booking Confirmed!</Text>
        <Text style={s.bookingId}>ID: {booking?.booking_id}</Text>
        
        {/* Detail Card */}
        <View style={s.detailCard}>
          <View style={s.detailRow}>
            <Ionicons name="construct" size={16} color={C.primary} style={s.detailIcon} />
            <Text style={s.detailText}>
              <Text style={s.boldLabel}>Provider: </Text>
              {provider?.name || booking?.provider_name}
            </Text>
          </View>

          <View style={s.detailRow}>
            <Ionicons name="list" size={16} color={C.primary} style={s.detailIcon} />
            <Text style={s.detailText}>
              <Text style={s.boldLabel}>Services: </Text>
              {booking?.services_booked?.map(s => s.name).join(', ')}
            </Text>
          </View>

          <View style={s.detailRow}>
            <Ionicons name="time" size={16} color={C.primary} style={s.detailIcon} />
            <Text style={s.detailText}>
              <Text style={s.boldLabel}>Time: </Text>
              {formatPKTTime(booking?.slot)}
            </Text>
          </View>

          <View style={s.detailRow}>
            <Ionicons name="person" size={16} color={C.primary} style={s.detailIcon} />
            <Text style={s.detailText}>
              <Text style={s.boldLabel}>Client: </Text>
              {booking?.user_details?.name} · {booking?.user_details?.phone}
            </Text>
          </View>

          <View style={s.detailRow}>
            <Ionicons name="location" size={16} color={C.primary} style={s.detailIcon} />
            <Text style={s.detailText}>
              <Text style={s.boldLabel}>Address: </Text>
              {booking?.user_details?.address}
            </Text>
          </View>
          
          <View style={s.divider} />
          
          <View style={s.priceRow}>
            <Text style={s.priceLabel}>Amount Paid / Due</Text>
            <Text style={s.priceAmount}>
              {booking?.services_booked?.some(s => s.isVisitQuote) 
                ? 'TBD' 
                : `PKR ${booking?.total_price?.toLocaleString()}`}
            </Text>
          </View>
        </View>
        
        {/* Buttons */}
        <TouchableOpacity 
          style={s.homeBtn}
          onPress={() => {
            if (route.params?.source === 'aiChat') {
              navigation.navigate('Chat', { screen: 'ChatMain' });
            } else {
              navigation.navigate('ManualBookingHome');
            }
          }}
        >
          <Text style={s.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={s.requestsBtn}
          onPress={() => navigation.navigate('ActiveRequests')}
        >
          <Text style={s.requestsBtnText}>View My Bookings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 24 
  },
  checkCircle: { 
    width: 90, 
    height: 90, 
    borderRadius: 45, 
    backgroundColor: C.primary, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6
  },
  successTitle: { color: C.text, fontSize: 24, fontWeight: '800', marginBottom: 4 },
  bookingId: { color: C.primary, fontSize: 13, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 24 },
  detailCard: { 
    width: '100%',
    backgroundColor: C.surface, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: C.border, 
    padding: 20, 
    marginBottom: 24,
    shadowColor: '#00000008',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2
  },
  detailRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start',
    marginBottom: 12 
  },
  detailIcon: { marginRight: 12, marginTop: 2 },
  detailText: { color: C.textSec, fontSize: 13, flex: 1, lineHeight: 18 },
  boldLabel: { color: C.text, fontWeight: '700' },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 14 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { color: C.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  priceAmount: { color: C.primary, fontSize: 20, fontWeight: '800' },
  homeBtn: { 
    width: '100%',
    backgroundColor: C.primary, 
    borderRadius: 12, 
    paddingVertical: 14, 
    alignItems: 'center', 
    marginBottom: 12,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3
  },
  homeBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  requestsBtn: { 
    width: '100%',
    backgroundColor: C.card, 
    borderWidth: 1, 
    borderColor: C.border,
    borderRadius: 12, 
    paddingVertical: 14, 
    alignItems: 'center' 
  },
  requestsBtnText: { color: C.text, fontSize: 14, fontWeight: '700' }
});
