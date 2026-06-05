import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, XCircle, PlusCircle, Navigation, MapPin, CheckCircle, Trash2 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LeafletMap from '../components/LeafletMap';
import { useAuth } from '../context/AuthContext';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';

const C = {
  bg: '#0A0A0F', surface: '#111118', card: '#16161F', primary: '#00C896',
  text: '#F0F0F5', textSec: '#8888AA', textMuted: '#555570',
  border: 'rgba(255, 255, 255, 0.08)', headerBg: '#0A0A0F', warning: '#F5C842', star: '#F5C842',
  error: '#FF5C5C'
};

const LABELS = ['Home', 'Office', 'Parents', 'Other'];

export default function AddressScreen({ navigation, route }) {
  const { updateUserProfile } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Home', address: '', city: 'Karachi', details: ''
  });
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const [mapRegion, setMapRegion] = useState({
    latitude: 24.8607,   // Default Karachi
    longitude: 67.0011,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [reverseGeoAddress, setReverseGeoAddress] = useState('');
  const [locating, setLocating] = useState(false);

  const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyD4ar1JvuWVEgClUXjxW87KfpT3Sx9kfuA';

  const reverseGeocode = async (latitude, longitude) => {
    // Try Google Geocoding API first
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results;
      }
    } catch (e) {
      console.error('REST reverse geocode failed:', e);
    }
    // Fallback: use expo-location reverse geocoding
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (place) {
        const addr = [place.streetNumber, place.street, place.district, place.city].filter(Boolean).join(', ');
        return [{
          formatted_address: addr,
          address_components: [
            { long_name: place.city || 'Karachi', types: ['locality'] },
            { long_name: place.district || place.subregion || '', types: ['sublocality_level_1'] }
          ]
        }];
      }
    } catch (e2) {
      console.error('Expo reverse geocode also failed:', e2);
    }
    return null;
  };

  const handleRegionChangeComplete = async (region) => {
    setMapRegion(region);
    setSelectedCoords({
      latitude: region.latitude,
      longitude: region.longitude
    });
    
    const results = await reverseGeocode(region.latitude, region.longitude);
    if (results && results.length > 0) {
      const formattedAddress = results[0].formatted_address;
      setReverseGeoAddress(formattedAddress);
      
      const components = results[0].address_components;
      const locality = components.find(c => c.types.includes('locality'))?.long_name;
      
      setNewAddress(prev => ({
        ...prev,
        address: formattedAddress,
        city: locality || 'Karachi'
      }));

      // Store resolved area name globally
      const sublocality_comp = components.find(c => c.types.includes('sublocality_level_1'))?.long_name;
      const locality_comp = components.find(c => c.types.includes('locality'))?.long_name;
      const areaName = sublocality_comp ? `${sublocality_comp}, ${locality_comp}` : locality_comp;
      if (areaName) {
        await AsyncStorage.setItem('userArea', areaName);
      }
    }
  };

  const getCurrentLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocating(false); return; }

      // Use Low accuracy for fast GPS fix (~1 sec vs 5+ sec)
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low
      });
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      // Show map IMMEDIATELY with the pin
      setSelectedCoords(coords);
      setMapRegion({ ...coords, latitudeDelta: 0.005, longitudeDelta: 0.005 });
      setShowMap(true);
      setLocating(false);

      // Resolve address in background (non-blocking)
      reverseGeocode(coords.latitude, coords.longitude).then(results => {
        if (results && results.length > 0) {
          const formattedAddress = results[0].formatted_address;
          setReverseGeoAddress(formattedAddress);
          const components = results[0].address_components;
          const locality = components.find(c => c.types.includes('locality'))?.long_name;
          setNewAddress(prev => ({ ...prev, address: formattedAddress, city: locality || 'Karachi' }));
          const sublocality_comp = components.find(c => c.types.includes('sublocality_level_1'))?.long_name;
          const locality_comp = components.find(c => c.types.includes('locality'))?.long_name;
          const areaName = sublocality_comp ? `${sublocality_comp}, ${locality_comp}` : locality_comp;
          if (areaName) AsyncStorage.setItem('userArea', areaName);
        }
      });
    } catch (error) {
      console.error('[Map] Location error:', error);
      setLocating(false);
    }
  };

  const onMapPress = async (e) => {
    const coords = e.nativeEvent.coordinate;
    setSelectedCoords(coords);
    setMapRegion(prev => ({
      ...prev,
      latitude: coords.latitude,
      longitude: coords.longitude
    }));
    try {
      const results = await reverseGeocode(coords.latitude, coords.longitude);
      if (results && results.length > 0) {
        const formattedAddress = results[0].formatted_address;
        setReverseGeoAddress(formattedAddress);
        
        const components = results[0].address_components;
        const locality = components.find(c => c.types.includes('locality'))?.long_name;
        
        setNewAddress(prev => ({
          ...prev,
          address: formattedAddress,
          city: locality || prev.city
        }));

        // Store userArea
        const sublocality_comp = components.find(c => c.types.includes('sublocality_level_1'))?.long_name;
        const locality_comp = components.find(c => c.types.includes('locality'))?.long_name;
        const areaName = sublocality_comp ? `${sublocality_comp}, ${locality_comp}` : locality_comp;
        if (areaName) {
          await AsyncStorage.setItem('userArea', areaName);
        }
      }
    } catch (error) {
      console.error('[Map] Reverse geocode error:', error);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const val = await AsyncStorage.getItem('saved_addresses');
      if (val) setAddresses(JSON.parse(val));
      const sel = await AsyncStorage.getItem('selected_address');
      if (sel) {
        const parsed = JSON.parse(sel);
        setSelectedAddressId(parsed.id);
        if (parsed.address) {
          const parts = parsed.address.split(',').map(p => p.trim());
          let area = parsed.city;
          if (parts.length > 2) {
            area = `${parts[parts.length - 2]}, ${parsed.city}`;
          } else if (parts.length > 1) {
            area = `${parts[0]}, ${parsed.city}`;
          }
          await AsyncStorage.setItem('userArea', area);
        }
      }
    } catch (e) {
      console.error('Failed to load addresses:', e);
    }
  };

  const selectAddress = async (addr) => {
    setSelectedAddressId(addr.id);
    await AsyncStorage.setItem('selected_address', JSON.stringify(addr));
    if (addr.address) {
      const parts = addr.address.split(',').map(p => p.trim());
      let area = addr.city;
      if (parts.length > 2) {
        area = `${parts[parts.length - 2]}, ${addr.city}`;
      } else if (parts.length > 1) {
        area = `${parts[0]}, ${addr.city}`;
      }
      await AsyncStorage.setItem('userArea', area);
    }
    try {
      await updateUserProfile({ selected_address: addr });
    } catch (err) {
      console.error('Failed to sync selected address to Firestore:', err);
    }
    if (route.params?.returnToChat) {
      navigation.navigate('Chat', {
        screen: 'ChatMain',
        params: {
          addressUpdated: true,
          pendingRequest: route.params.pendingRequest
        }
      });
    } else {
      navigation.goBack();
    }
  };

  const saveAddress = async () => {
    if (!newAddress.address.trim()) {
      Alert.alert('Required', 'Please enter your street address.');
      return;
    }
    const addr = {
      ...newAddress,
      id: Date.now().toString(),
      full_address: `${newAddress.address}, ${newAddress.city}`
    };
    const updated = [...addresses, addr];
    setAddresses(updated);
    await AsyncStorage.setItem('saved_addresses', JSON.stringify(updated));
    try {
      await updateUserProfile({ 
        saved_addresses: updated,
        selected_address: addr
      });
    } catch (err) {
      console.error('Failed to sync saved address to Firestore:', err);
    }
    
    // Automatically select the newly created address
    setSelectedAddressId(addr.id);
    await AsyncStorage.setItem('selected_address', JSON.stringify(addr));

    if (addr.address) {
      const parts = addr.address.split(',').map(p => p.trim());
      let area = addr.city;
      if (parts.length > 2) {
        area = `${parts[parts.length - 2]}, ${addr.city}`;
      } else if (parts.length > 1) {
        area = `${parts[0]}, ${addr.city}`;
      }
      await AsyncStorage.setItem('userArea', area);
    }

    setShowAddForm(false);
    setNewAddress({ label: 'Home', address: '', city: 'Karachi', details: '' });
    if (route.params?.returnToChat) {
      navigation.navigate('Chat', {
        screen: 'ChatMain',
        params: {
          addressUpdated: true,
          pendingRequest: route.params.pendingRequest
        }
      });
    } else {
      navigation.goBack();
    }
  };

  const deleteAddress = async (id, e) => {
    // Prevent selecting while deleting
    if (e && e.stopPropagation) e.stopPropagation();
    
    const updated = addresses.filter(addr => addr.id !== id);
    setAddresses(updated);
    await AsyncStorage.setItem('saved_addresses', JSON.stringify(updated));
    try {
      if (selectedAddressId === id) {
        await updateUserProfile({ 
          saved_addresses: updated,
          selected_address: null 
        });
      } else {
        await updateUserProfile({ saved_addresses: updated });
      }
    } catch (err) {
      console.error('Failed to sync deleted address to Firestore:', err);
    }

    if (selectedAddressId === id) {
      setSelectedAddressId(null);
      await AsyncStorage.removeItem('selected_address');
    }
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Manage Addresses</Text>
        <TouchableOpacity 
          style={s.addHeaderBtn} 
          onPress={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? (
            <XCircle size={24} color={C.primary} />
          ) : (
            <PlusCircle size={24} color={C.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Add Address Form */}
        {showAddForm && (
          <View style={s.formCard}>
            <Text style={s.formTitle}>✨ Add New Address</Text>

            {/* Label Pills */}
            <Text style={s.inputLabel}>Address Label</Text>
            <View style={s.pillContainer}>
              {LABELS.map(lbl => (
                <TouchableOpacity
                  key={lbl}
                  style={[s.pill, newAddress.label === lbl && s.pillActive]}
                  onPress={() => setNewAddress(p => ({ ...p, label: lbl }))}
                >
                  <Text style={[s.pillText, newAddress.label === lbl && s.pillTextActive]}>
                    {lbl === 'Home' ? '🏠 ' : lbl === 'Office' ? '🏢 ' : '📍 '}
                    {lbl}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Map picker */}
            <TouchableOpacity
              style={[s.mapPickerBtn, locating && { opacity: 0.7 }]}
              onPress={getCurrentLocation}
              disabled={locating}>
              {locating ? (
                <ActivityIndicator size="small" color={C.primary} />
              ) : (
                <Navigation size={18} color={C.primary} />
              )}
              <Text style={s.mapPickerBtnText}>
                {locating ? 'Detecting location...' : '📍 Use my current location'}
              </Text>
            </TouchableOpacity>

            {showMap && (
              <View style={s.mapWrap}>
                <LeafletMap
                  latitude={mapRegion.latitude}
                  longitude={mapRegion.longitude}
                  zoom={15}
                  markerLat={selectedCoords?.latitude}
                  markerLng={selectedCoords?.longitude}
                  style={s.map}
                  onMapPress={async (lat, lng) => {
                    const coords = { latitude: lat, longitude: lng };
                    setSelectedCoords(coords);
                    setMapRegion(prev => ({ ...prev, latitude: lat, longitude: lng }));
                    const results = await reverseGeocode(lat, lng);
                    if (results && results.length > 0) {
                      const formattedAddress = results[0].formatted_address;
                      setReverseGeoAddress(formattedAddress);
                      const components = results[0].address_components;
                      const locality = components.find(c => c.types.includes('locality'))?.long_name;
                      setNewAddress(prev => ({ ...prev, address: formattedAddress, city: locality || prev.city }));
                      const sublocality_comp = components.find(c => c.types.includes('sublocality_level_1'))?.long_name;
                      const locality_comp = components.find(c => c.types.includes('locality'))?.long_name;
                      const areaName = sublocality_comp ? `${sublocality_comp}, ${locality_comp}` : locality_comp;
                      if (areaName) await AsyncStorage.setItem('userArea', areaName);
                    }
                  }}
                />
                <View style={s.mapHint}>
                  <Text style={s.mapHintText}>
                    Tap anywhere on map to adjust location
                  </Text>
                </View>
                {reverseGeoAddress ? (
                  <View style={s.mapAddressBar}>
                    <MapPin size={16} color={C.primary} />
                    <Text style={s.mapAddressText} numberOfLines={2}>
                      {reverseGeoAddress}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* Inputs */}
            <Text style={s.inputLabel}>Street Address</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. House 45, Street 4, Sector G-11"
              placeholderTextColor="#555570"
              value={newAddress.address}
              onChangeText={v => setNewAddress(p => ({ ...p, address: v }))}
            />

            <Text style={s.inputLabel}>City</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. Islamabad or Karachi"
              placeholderTextColor="#555570"
              value={newAddress.city}
              onChangeText={v => setNewAddress(p => ({ ...p, city: v }))}
            />

            <Text style={s.inputLabel}>Flat / Floor / Near Landmarks (Optional)</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. Flat 302, near Markaz"
              placeholderTextColor="#555570"
              value={newAddress.details}
              onChangeText={v => setNewAddress(p => ({ ...p, details: v }))}
            />

            {/* Save Button */}
            <TouchableOpacity 
              style={s.saveBtnWrapper} 
              onPress={saveAddress}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#00C896', '#7B61FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.saveBtn}
              >
                <Text style={s.saveBtnText}>Save Address</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Saved Addresses List */}
        <Text style={s.sectionTitle}>📋 Saved Addresses</Text>
        {addresses.length === 0 ? (
          <View style={s.emptyState}>
            <MapPin size={48} color="#555570" style={{ marginBottom: 12 }} />
            <Text style={s.emptyStateText}>No saved addresses yet.</Text>
            <Text style={s.emptyStateSub}>Tap add button at the top to save your address.</Text>
          </View>
        ) : (
          addresses.map(addr => (
            <TouchableOpacity
              key={addr.id}
              style={[s.addrCard, selectedAddressId === addr.id && s.addrCardSelected]}
              onPress={() => selectAddress(addr)}
            >
              <View style={s.addrIconWrap}>
                <Text style={s.addrIcon}>
                  {addr.label === 'Home' ? '🏠' : addr.label === 'Office' ? '🏢' : '📍'}
                </Text>
              </View>
              <View style={s.addrInfo}>
                <Text style={s.addrCardLabel}>{addr.label}</Text>
                <Text style={s.addrText}>{addr.address}, {addr.city}</Text>
                {addr.details ? <Text style={s.addrDetails}>{addr.details}</Text> : null}
              </View>
              {selectedAddressId === addr.id && (
                <CheckCircle size={22} color={C.primary} style={s.checkIcon} />
              )}
              <TouchableOpacity 
                style={s.deleteBtn}
                onPress={(e) => deleteAddress(addr.id, e)}
              >
                <Trash2 size={18} color={C.error} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
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
    backgroundColor: '#0A0A0F',
    borderBottomWidth: 1,
    borderBottomColor: C.border
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { color: C.text, fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  addHeaderBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionTitle: { color: C.textSec, fontSize: 12, fontWeight: '800', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  emptyState: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#16161F', 
    padding: 32, 
    borderRadius: 20,
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.04)',
  },
  emptyStateText: { color: C.text, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptyStateSub: { color: C.textSec, fontSize: 12, textAlign: 'center' },
  formCard: { 
    backgroundColor: '#16161F', 
    padding: 16, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.04)',
    marginBottom: 24,
  },
  formTitle: { color: C.text, fontSize: 16, fontWeight: '700', marginBottom: 16 },
  inputLabel: { color: C.textSec, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 },
  pill: { 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: '#111118', 
    borderWidth: 1, 
    borderColor: C.border, 
    marginRight: 8,
    marginBottom: 8
  },
  pillActive: { 
    backgroundColor: 'rgba(0, 200, 150, 0.08)', 
    borderColor: C.primary 
  },
  pillText: { color: C.textSec, fontSize: 12, fontWeight: '600' },
  pillTextActive: { color: C.primary },
  input: { 
    backgroundColor: '#111118', 
    color: C.text, 
    borderWidth: 1, 
    borderColor: C.border, 
    borderRadius: 12, 
    paddingHorizontal: 14, 
    paddingVertical: 12, 
    fontSize: 14,
    marginBottom: 14 
  },
  saveBtnWrapper: {
    borderRadius: 12, 
    marginTop: 8,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3
  },
  saveBtn: { 
    borderRadius: 12, 
    paddingVertical: 14, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  addrCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#16161F', 
    padding: 16, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.04)',
    marginBottom: 10,
  },
  addrCardSelected: { borderColor: C.primary },
  addrIconWrap: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.04)', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  addrIcon: { fontSize: 18 },
  addrInfo: { flex: 1 },
  addrCardLabel: { color: C.text, fontSize: 14, fontWeight: '750', marginBottom: 2 },
  addrText: { color: C.textSec, fontSize: 12, lineHeight: 16 },
  addrDetails: { color: C.textMuted, fontSize: 11, marginTop: 2, fontStyle: 'italic' },
  checkIcon: { marginRight: 8 },
  deleteBtn: { padding: 8 },
  mapPickerBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0, 200, 150, 0.08)', borderRadius: 12,
    padding: 14, marginBottom: 14, gap: 8,
    borderWidth: 1, borderColor: 'rgba(0, 200, 150, 0.2)',
  },
  mapPickerBtnText: { 
    color: C.primary, fontWeight: '700', fontSize: 14 
  },
  mapWrap: {
    borderRadius: 14, overflow: 'hidden',
    marginBottom: 14, borderWidth: 1,
    borderColor: C.border, height: 220,
  },
  map: { width: '100%', height: 180 },
  mapHint: {
    backgroundColor: '#111118', padding: 6,
    alignItems: 'center',
  },
  mapHintText: { fontSize: 11, color: '#8888AA' },
  mapAddressBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#16161F', padding: 10,
    borderTopWidth: 1, borderTopColor: C.border,
    gap: 6,
  },
  mapAddressText: { 
    flex: 1, fontSize: 12, color: C.textSec 
  }
});
