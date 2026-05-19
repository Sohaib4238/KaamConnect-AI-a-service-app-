import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProviderSlots, createManualBooking } from '../config/api';
import { useAuth } from '../context/AuthContext';

const C = {
  bg: '#F5F6FA', surface: '#FFFFFF', card: '#FFFFFF', primary: '#00C853',
  text: '#1A1A2E', textSec: '#555570', textMuted: '#9999AA',
  border: '#E4E5EF', headerBg: '#FFFFFF', warning: '#FF9500', star: '#FFB300',
  error: '#F44336'
};

export default function CheckoutScreen({ route, navigation }) {
  const { cart = [], provider = {} } = route.params || {};
  const { user, userProfile, incrementBookingCount } = useAuth();

  const [userDetails, setUserDetails] = useState({
    name: '', phone: '', address: '', address_label: 'Home'
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [slotError, setSlotError] = useState(null);

  // Load saved details and address
  useEffect(() => {
    AsyncStorage.getItem('user_profile').then(val => {
      if (val) {
        setUserDetails(prev => {
          const profile = JSON.parse(val);
          return { ...prev, ...profile };
        });
      }
    });

    // Default to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  // Prefill details from authenticated profile
  useEffect(() => {
    if (userProfile) {
      setUserDetails(prev => ({
        ...prev,
        name: userProfile.name || prev.name,
        phone: userProfile.phone || prev.phone,
      }));
    }
  }, [userProfile]);

  // Listen for focus to refresh address when returning from AddressScreen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      AsyncStorage.getItem('selected_address').then(val => {
        if (val) {
          const addr = JSON.parse(val);
          setUserDetails(prev => ({ 
            ...prev, 
            address: addr.address + (addr.details ? `, ${addr.details}` : '') + `, ${addr.city}`,
            address_label: addr.label 
          }));
        }
      });
    });
    return unsubscribe;
  }, [navigation]);

  // Fetch slots on date change
  useEffect(() => {
    if (selectedDate && provider) {
      fetchSlots(selectedDate);
    }
  }, [selectedDate, provider]);

  const fetchSlots = async (date) => {
    setSlotsLoading(true);
    setSelectedSlot(null);
    setSlotError(null);
    try {
      const provId = provider.id || provider.place_id;
      const data = await getProviderSlots(provId, date);
      setSlots(data.slots || []);
    } catch (error) {
      console.error('Slots fetch error:', error);
      setSlotError('Could not fetch available slots. Please try again.');
    } finally {
      setSlotsLoading(false);
    }
  };

  const getNext7Days = () => {
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push({
        value: d.toISOString().split('T')[0],
        dayName: dayNames[d.getDay()],
        dateNum: d.getDate().toString()
      });
    }
    return days;
  };

  const handleBooking = async () => {
    if (!selectedSlot || !userDetails.name.trim() || !userDetails.phone.trim()) {
      Alert.alert('Required', 'Please complete all user details and select a slot.');
      return;
    }
    if (!userDetails.address) {
      Alert.alert('Required', 'Please add your service address to continue.');
      return;
    }
    
    setBooking(true);
    setSlotError(null);
    
    // Save user details for next time (excluding address which is managed separately)
    await AsyncStorage.setItem('user_profile', JSON.stringify({
      name: userDetails.name,
      phone: userDetails.phone
    }));
    
    try {
      const isVisitQuote = cart.some(c => c.isVisitQuote);
      const result = await createManualBooking({
        provider_id: provider.id || provider.place_id,
        services: cart.map(c => ({
          id: c.id,
          name: c.name,
          price: c.isVisitQuote ? 0 : c.price * c.qty,
          isVisitQuote: c.isVisitQuote || false
        })),
        slot_time: selectedSlot.slot_time,
        user_details: userDetails,
        user_id: user?.uid || 'guest',
        isVisitQuote: isVisitQuote
      });
      
      if (result.status === 'booking_confirmed') {
        incrementBookingCount().catch(console.error);
        navigation.replace('BookingSuccessScreen', { 
          booking: {
            ...result.booking,
            services_booked: result.booking.services_booked?.map((s, idx) => ({
              ...s,
              isVisitQuote: cart[idx]?.isVisitQuote || false
            })) || []
          },
          provider,
          source: route.params?.source
        });
      }
    } catch (error) {
      console.error('Booking confirmation failed:', error);
      // Handle slot taken error (409)
      if (error.response?.status === 409 || 
          error.response?.data?.code === 'SLOT_TAKEN' ||
          (error.response?.data?.message && error.response.data.message.includes('already booked'))) {
        setSlotError(
          '⚠️ This slot was just booked by someone else. Please choose another time.'
        );
        setSelectedSlot(null);
        // Refresh slots to show updated availability
        await fetchSlots(selectedDate);
      } else {
        setSlotError('Booking failed. Please try again.');
      }
    } finally {
      setBooking(false);
    }
  };

  const totalCartPrice = cart.reduce((sum, c) => sum + c.price * c.qty, 0);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Order Summary Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>📋 Order Summary</Text>
          {cart.map((item, i) => (
            <View key={i} style={s.orderItem}>
              <Text style={s.orderItemName}>
                {item.name} {item.qty > 1 ? `×${item.qty}` : ''}
              </Text>
              <Text style={s.orderItemPrice}>
                {item.isVisitQuote ? 'To be quoted on-site' : `PKR ${(item.price * item.qty).toLocaleString()}`}
              </Text>
            </View>
          ))}
          <View style={s.divider} />
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalAmount}>
              {cart.some(c => c.isVisitQuote) ? 'TBD' : `PKR ${totalCartPrice.toLocaleString()}`}
            </Text>
          </View>
        </View>

        {/* Your Details Card */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <Text style={s.cardTitle}>👤 Your Details</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AddressScreen')}>
              <Text style={s.editLink}>Edit Address</Text>
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={s.input}
            placeholder="Full Name"
            placeholderTextColor={C.textMuted}
            value={userDetails.name}
            onChangeText={v => setUserDetails(p => ({ ...p, name: v }))}
          />
          <TextInput
            style={s.input}
            placeholder="Phone Number (03xx-xxxxxxx)"
            placeholderTextColor={C.textMuted}
            value={userDetails.phone}
            onChangeText={v => setUserDetails(p => ({ ...p, phone: v }))}
            keyboardType="phone-pad"
          />
          <View style={s.addressDisplay}>
            <Ionicons name="location" size={16} color={C.primary} style={{ marginRight: 8, marginTop: 2 }} />
            <Text style={s.addressDisplayText}>
              {userDetails.address || 'No address selected — tap Edit Address'}
            </Text>
          </View>
        </View>

        {/* Date Selection */}
        <View style={s.card}>
          <Text style={s.cardTitle}>📅 Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.dateScroll}>
            {getNext7Days().map((day, i) => (
              <TouchableOpacity
                key={i}
                style={[s.dateChip, selectedDate === day.value && s.dateChipActive]}
                onPress={() => setSelectedDate(day.value)}
              >
                <Text style={[s.dateChipDay, selectedDate === day.value && s.dateChipDayActive]}>
                  {day.dayName}
                </Text>
                <Text style={[s.dateChipDate, selectedDate === day.value && s.dateChipDateActive]}>
                  {day.dateNum}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Time Slots */}
        <View style={s.card}>
          <Text style={s.cardTitle}>⏰ Select Time</Text>
          {slotsLoading ? (
            <ActivityIndicator color={C.primary} style={{ marginVertical: 20 }} />
          ) : (
            <View style={s.slotsGrid}>
              {slots.map((slot, i) => {
                const isSelected = selectedSlot?.slot_time === slot.slot_time;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      s.slotChip,
                      !slot.is_available && s.slotChipUnavailable,
                      isSelected && s.slotChipSelected
                    ]}
                    onPress={() => slot.is_available && setSelectedSlot(slot)}
                    disabled={!slot.is_available}
                  >
                    <Text style={[
                      s.slotText,
                      !slot.is_available && s.slotTextUnavailable,
                      isSelected && s.slotTextSelected
                    ]}>
                      {slot.display_time}
                    </Text>
                    {!slot.is_available && (
                      <Text style={s.slotBooked}>Booked</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Slot Error Banner */}
        {slotError && (
          <View style={s.slotErrorBanner}>
            <Ionicons name="warning" size={18} color={C.warning} style={{ marginRight: 8 }} />
            <Text style={s.slotErrorText}>{slotError}</Text>
          </View>
        )}

        {/* Confirm Booking Button */}
        <TouchableOpacity
          style={[
            s.confirmBtn,
            (!selectedSlot || !userDetails.name.trim() || !userDetails.phone.trim() || !userDetails.address || booking) 
              && s.confirmBtnDisabled
          ]}
          onPress={handleBooking}
          disabled={!selectedSlot || !userDetails.name.trim() || !userDetails.phone.trim() || !userDetails.address || booking}
        >
          {booking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.confirmBtnText}>
              {cart.some(c => c.isVisitQuote) 
                ? 'Request Visit' 
                : `Confirm Booking — PKR ${totalCartPrice.toLocaleString()}`}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  headerTitle: { color: C.text, fontSize: 18, fontWeight: '700' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: { 
    backgroundColor: C.surface, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: C.border, 
    padding: 16, 
    marginBottom: 16,
    shadowColor: '#00000008',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2
  },
  cardTitle: { color: C.textSec, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  editLink: { color: C.primary, fontSize: 13, fontWeight: '600' },
  orderItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderItemName: { color: C.text, fontSize: 14 },
  orderItemPrice: { color: C.text, fontSize: 14, fontWeight: '600' },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: C.text, fontSize: 15, fontWeight: '700' },
  totalAmount: { color: C.primary, fontSize: 18, fontWeight: '800' },
  input: { 
    backgroundColor: '#F8F9FC', 
    color: C.text, 
    borderWidth: 1, 
    borderColor: C.border, 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    fontSize: 14,
    marginBottom: 12 
  },
  addressDisplay: { 
    flexDirection: 'row', 
    backgroundColor: '#F8F9FC', 
    borderWidth: 1, 
    borderColor: C.border,
    padding: 12,
    borderRadius: 8,
    alignItems: 'flex-start'
  },
  addressDisplayText: { color: C.textSec, fontSize: 12, flex: 1, lineHeight: 16 },
  dateScroll: { paddingRight: 16 },
  dateChip: { 
    width: 60, 
    height: 70, 
    borderRadius: 12, 
    backgroundColor: '#F8F9FC', 
    borderWidth: 1, 
    borderColor: C.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8
  },
  dateChipActive: { 
    backgroundColor: 'rgba(0, 200, 83, 0.08)',
    borderColor: C.primary 
  },
  dateChipDay: { color: C.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 4 },
  dateChipDayActive: { color: C.primary },
  dateChipDate: { color: C.text, fontSize: 16, fontWeight: '700' },
  dateChipDateActive: { color: C.primary },
  slotsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginHorizontal: -4 
  },
  slotChip: { 
    width: '23%', 
    backgroundColor: '#F8F9FC', 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: C.border,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: '1%',
    marginBottom: 8
  },
  slotChipUnavailable: { 
    backgroundColor: '#F0F0F5',
    borderColor: '#E4E5EF',
    opacity: 0.6
  },
  slotChipSelected: { 
    backgroundColor: 'rgba(0, 200, 83, 0.08)',
    borderColor: C.primary 
  },
  slotText: { color: C.text, fontSize: 11, fontWeight: '600' },
  slotTextUnavailable: { color: C.textMuted },
  slotTextSelected: { color: C.primary },
  slotBooked: { color: C.error, fontSize: 8, marginTop: 2, fontWeight: '700' },
  slotErrorBanner: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(255, 213, 79, 0.12)', 
    borderWidth: 1, 
    borderColor: C.warning, 
    borderRadius: 12, 
    padding: 12, 
    marginBottom: 16,
    alignItems: 'center'
  },
  slotErrorText: { color: C.warning, fontSize: 12, fontWeight: '600', flex: 1 },
  confirmBtn: { 
    backgroundColor: C.primary, 
    borderRadius: 12, 
    paddingVertical: 14, 
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  confirmBtnDisabled: { 
    backgroundColor: '#F0F0F5', 
    borderColor: '#E4E5EF',
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0
  },
  confirmBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' }
});
