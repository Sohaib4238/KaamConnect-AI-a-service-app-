import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Wrench, List, Clock, User, MapPin } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const C = {
  bg: '#0A0A0F', surface: '#111118', card: '#16161F', primary: '#00C896',
  text: '#F0F0F5', textSec: '#8888AA', textMuted: '#555570',
  border: 'rgba(255, 255, 255, 0.08)', headerBg: '#0A0A0F', warning: '#F5C842', star: '#F5C842'
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
        <Animated.View style={[s.checkCircleWrapper, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient
            colors={['#00C896', '#7B61FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.checkCircle}
          >
            <Check size={44} color="#FFFFFF" strokeWidth={3} />
          </LinearGradient>
        </Animated.View>
        
        <Text style={s.successTitle}>Booking Confirmed!</Text>
        <Text style={s.bookingId}>ID: {booking?.booking_id}</Text>
        
        {/* Detail Card */}
        <View style={s.detailCard}>
          <View style={s.detailRow}>
            <Wrench size={16} color={C.primary} style={s.detailIcon} />
            <Text style={s.detailText}>
              <Text style={s.boldLabel}>Provider: </Text>
              {provider?.name || booking?.provider_name}
            </Text>
          </View>

          <View style={s.detailRow}>
            <List size={16} color={C.primary} style={s.detailIcon} />
            <Text style={s.detailText}>
              <Text style={s.boldLabel}>Services: </Text>
              {booking?.services_booked?.map(s => s.name).join(', ')}
            </Text>
          </View>

          <View style={s.detailRow}>
            <Clock size={16} color={C.primary} style={s.detailIcon} />
            <Text style={s.detailText}>
              <Text style={s.boldLabel}>Time: </Text>
              {formatPKTTime(booking?.slot)}
            </Text>
          </View>

          <View style={s.detailRow}>
            <User size={16} color={C.primary} style={s.detailIcon} />
            <Text style={s.detailText}>
              <Text style={s.boldLabel}>Client: </Text>
              {booking?.user_details?.name} · {booking?.user_details?.phone}
            </Text>
          </View>

          <View style={s.detailRow}>
            <MapPin size={16} color={C.primary} style={s.detailIcon} />
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
          style={s.homeBtnWrapper}
          activeOpacity={0.85}
          onPress={() => {
            if (route.params?.source === 'aiChat') {
              navigation.navigate('Chat', { screen: 'ChatMain' });
            } else {
              navigation.navigate('ManualBookingHome');
            }
          }}
        >
          <LinearGradient
            colors={['#00C896', '#7B61FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.homeBtn}
          >
            <Text style={s.homeBtnText}>Back to Home</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={s.requestsBtn}
          activeOpacity={0.8}
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
  checkCircleWrapper: {
    marginBottom: 20,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6
  },
  checkCircle: { 
    width: 90, 
    height: 90, 
    borderRadius: 45, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  successTitle: { color: C.text, fontSize: 24, fontWeight: '800', marginBottom: 4, letterSpacing: -0.5 },
  bookingId: { color: C.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 24 },
  detailCard: { 
    width: '100%',
    backgroundColor: '#16161F', 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.04)', 
    padding: 20, 
    marginBottom: 24,
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
  priceLabel: { color: C.textSec, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  priceAmount: { color: C.primary, fontSize: 20, fontWeight: '800' },
  homeBtnWrapper: {
    width: '100%',
    borderRadius: 12, 
    marginBottom: 12,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3
  },
  homeBtn: { 
    borderRadius: 12, 
    paddingVertical: 14, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  homeBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '850' },
  requestsBtn: { 
    width: '100%',
    backgroundColor: '#111118', 
    borderWidth: 1, 
    borderColor: C.border,
    borderRadius: 12, 
    paddingVertical: 14, 
    alignItems: 'center' 
  },
  requestsBtnText: { color: C.text, fontSize: 14, fontWeight: '750' }
});
