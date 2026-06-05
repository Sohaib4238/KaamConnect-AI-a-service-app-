import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LeafletMap from '../components/LeafletMap';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Compass, Map, ArrowLeft, MapPin } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

export default function OnboardingAddressScreen() {
  const { user, markAddressSet } = useAuth();
  const [step, setStep] = useState('welcome'); 
  // 'welcome' | 'map' | 'details'
  const [mapRegion, setMapRegion] = useState({
    latitude: 24.8607,
    longitude: 67.0011,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [detectedAddress, setDetectedAddress] = useState('');
  const [addressLabel, setAddressLabel] = useState('Home');
  const [addressDetail, setAddressDetail] = useState('');
  const [city, setCity] = useState('Karachi');
  const [saving, setSaving] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const mapRef = useRef(null);

  const LABELS = ['Home', 'Office', 'Parents', 'Other'];

  const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyD4ar1JvuWVEgClUXjxW87KfpT3Sx9kfuA';

  const reverseGeocode = async (coords) => {
    const { latitude, longitude } = coords;
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const formatted = result.formatted_address;
        const components = result.address_components;
        const locality = components.find(c => c.types.includes('locality'))?.long_name || 'Karachi';
        return { address: formatted, city: locality };
      }
    } catch (e) {
      console.error('REST reverse geocode failed:', e);
    }
    // Fallback: use expo-location reverse geocoding
    try {
      const [place] = await Location.reverseGeocodeAsync(coords);
      if (place) {
        const addr = [
          place.streetNumber, place.street, place.district
        ].filter(Boolean).join(', ');
        return { address: addr, city: place.city || 'Karachi' };
      }
    } catch (e2) {
      console.error('Expo reverse geocode failed:', e2);
    }
    return null;
  };

  const useCurrentLocation = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 
          'Please allow location access to auto-detect your area.');
        setGpsLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setSelectedCoords(coords);
      const region = { ...coords, latitudeDelta: 0.005, longitudeDelta: 0.005 };
      setMapRegion(region);
      mapRef.current?.animateToRegion(region, 800);
      
      // Reverse geocode
      const place = await reverseGeocode(coords);
      if (place) {
        setDetectedAddress(place.address);
        setCity(place.city);
        setAddressDetail(place.address);
      }
      setStep('map');
    } catch (error) {
      Alert.alert('Error', 'Could not detect location. Please pin manually.');
    } finally {
      setGpsLoading(false);
    }
  };

  const onMapPress = async (e) => {
    const coords = e.nativeEvent.coordinate;
    setSelectedCoords(coords);
    try {
      const place = await reverseGeocode(coords);
      if (place) {
        setDetectedAddress(place.address);
        setCity(place.city);
        setAddressDetail(place.address);
      }
    } catch (e) {
      console.log('Reverse geocode error:', e);
    }
  };

  const saveAddress = async () => {
    if (!selectedCoords && !addressDetail.trim()) {
      Alert.alert('Required', 'Please pin your location on map or enter address manually.');
      return;
    }
    setSaving(true);
    try {
      const address = {
        id: Date.now().toString(),
        label: addressLabel,
        address: addressDetail || detectedAddress || city,
        city,
        latitude: selectedCoords?.latitude,
        longitude: selectedCoords?.longitude,
        full_address: `${addressDetail || detectedAddress}, ${city}`,
      };
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('selected_address', JSON.stringify(address));
      await AsyncStorage.setItem('saved_addresses', JSON.stringify([address]));
      
      // Mark address setup complete
      await markAddressSet();
      // AppNavigator will automatically show main app
    } catch (error) {
      Alert.alert('Error', 'Could not save address. Try again.');
      setSaving(false);
    }
  };

  const skipForNow = async () => {
    // Allow skipping but mark as set so they get to main app
    // They can set address later from booking tab
    await markAddressSet();
  };

  // STEP: Welcome
  if (step === 'welcome') {
    return (
      <SafeAreaView style={s.container} edges={['top', 'bottom']}>
        <View style={s.welcomeContent}>
          <Text style={s.welcomeEmoji}>📍</Text>
          <Text style={s.welcomeTitle}>Set your location</Text>
          <Text style={s.welcomeSub}>
            We need your address to show nearby service providers. 
            Your location helps us find the closest professionals.
          </Text>
          
          <TouchableOpacity
            style={s.primaryBtn}
            onPress={useCurrentLocation}
            disabled={gpsLoading}
          >
            {gpsLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Compass size={20} color="#fff" />
                <Text style={s.primaryBtnText}>
                  Use my current location
                </Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={s.secondaryBtn}
            onPress={() => setStep('map')}
          >
            <Map size={20} color="#00C896" />
            <Text style={s.secondaryBtnText}>
              Pin location on map
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={s.skipBtn}
            onPress={skipForNow}
          >
            <Text style={s.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // STEP: Map
  if (step === 'map') {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.mapHeader}>
          <TouchableOpacity onPress={() => setStep('welcome')} style={s.backBtn}>
            <ArrowLeft size={24} color="#F0F0F5" />
          </TouchableOpacity>
          <Text style={s.mapHeaderTitle}>Pin your location</Text>
          <View style={{width: 40}} />
        </View>
        
        <LeafletMap
          latitude={mapRegion.latitude}
          longitude={mapRegion.longitude}
          zoom={15}
          markerLat={selectedCoords?.latitude}
          markerLng={selectedCoords?.longitude}
          style={s.fullMap}
          onMapPress={async (lat, lng) => {
            const coords = { latitude: lat, longitude: lng };
            setSelectedCoords(coords);
            try {
              const [place] = await Location.reverseGeocodeAsync(coords);
              if (place) {
                const addr = [
                  place.streetNumber, place.street, place.district
                ].filter(Boolean).join(', ');
                setDetectedAddress(addr);
                setCity(place.city || 'Karachi');
                setAddressDetail(addr);
              }
            } catch (e) {
              console.log('Reverse geocode error:', e);
            }
          }}
        />
        
        {/* Bottom sheet */}
        <View style={s.mapBottom}>
          {detectedAddress ? (
            <View style={s.detectedAddr}>
              <MapPin size={16} color="#00C896" />
              <Text style={s.detectedAddrText} numberOfLines={2}>
                {detectedAddress}
              </Text>
            </View>
          ) : (
            <Text style={s.mapHint}>
              Tap anywhere on the map to pin your location
            </Text>
          )}
          
          <TouchableOpacity
            style={s.currentLocBtn}
            onPress={useCurrentLocation}
          >
            <Compass size={16} color="#00C896" />
            <Text style={s.currentLocText}>Use current location</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[s.primaryBtn, !selectedCoords && s.btnDisabled]}
            onPress={() => selectedCoords 
              ? setStep('details') 
              : Alert.alert('Pin required', 'Please tap on the map first')}
          >
            <Text style={s.primaryBtnText}>Confirm Location →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // STEP: Details
  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={s.detailsContent}
        keyboardShouldPersistTaps="handled">
        <View style={s.mapHeader}>
          <TouchableOpacity onPress={() => setStep('map')} style={s.backBtn}>
            <ArrowLeft size={24} color="#F0F0F5" />
          </TouchableOpacity>
          <Text style={s.mapHeaderTitle}>Address details</Text>
          <View style={{width: 40}} />
        </View>
        
        {/* Mini map preview */}
        {selectedCoords && (
          <LeafletMap
            latitude={selectedCoords.latitude}
            longitude={selectedCoords.longitude}
            zoom={16}
            markerLat={selectedCoords.latitude}
            markerLng={selectedCoords.longitude}
            scrollEnabled={false}
            zoomEnabled={false}
            style={s.miniMap}
          />
        )}
        
        {/* Label selection */}
        <Text style={s.fieldLabel}>Save as</Text>
        <View style={s.labelsRow}>
          {LABELS.map(label => (
            <TouchableOpacity
              key={label}
              style={[s.labelChip, 
                addressLabel === label && s.labelChipActive]}
              onPress={() => setAddressLabel(label)}
            >
              <Text style={[s.labelChipText,
                addressLabel === label && s.labelChipTextActive]}>
                {label === 'Home' ? '🏠' : 
                 label === 'Office' ? '🏢' : 
                 label === 'Parents' ? '👨👩👧' : '📍'} {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Address input */}
        <Text style={s.fieldLabel}>Street address</Text>
        <TextInput
          style={s.input}
          value={addressDetail}
          onChangeText={setAddressDetail}
          placeholder="House/flat, street name, area"
          placeholderTextColor="#8888AA"
        />
        
        <Text style={s.fieldLabel}>City</Text>
        <TextInput
          style={s.input}
          value={city}
          onChangeText={setCity}
          placeholder="Karachi"
          placeholderTextColor="#8888AA"
        />
        
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <TouchableOpacity
            style={[s.primaryBtn, saving && s.btnDisabled]}
            onPress={saveAddress}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.primaryBtnText}>Save & Continue →</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  welcomeContent: {
    flex: 1, alignItems: 'center',
    justifyContent: 'center', paddingHorizontal: 32,
  },
  welcomeEmoji: { fontSize: 64, marginBottom: 20 },
  welcomeTitle: {
    fontSize: 26, fontWeight: '900',
    color: '#F0F0F5', marginBottom: 12, textAlign: 'center',
  },
  welcomeSub: {
    fontSize: 15, color: '#8888AA', textAlign: 'center',
    lineHeight: 24, marginBottom: 36,
  },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00C896', borderRadius: 14,
    paddingVertical: 16, paddingHorizontal: 24,
    width: '100%', gap: 8, marginBottom: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF', fontSize: 16, fontWeight: '800'
  },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111118', borderRadius: 14,
    paddingVertical: 16, paddingHorizontal: 24,
    width: '100%', gap: 8, marginBottom: 12,
    borderWidth: 1.5, borderColor: '#00C896',
  },
  secondaryBtnText: {
    color: '#00C896', fontSize: 16, fontWeight: '700'
  },
  skipBtn: { marginTop: 8, padding: 12 },
  skipText: { color: '#8888AA', fontSize: 14 },
  btnDisabled: { opacity: 0.6 },
  mapHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0A0A0F', paddingHorizontal: 16,
    paddingVertical: 12, borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  mapHeaderTitle: {
    fontSize: 17, fontWeight: '800', color: '#F0F0F5'
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#16161F',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  fullMap: { flex: 1 },
  mapBottom: {
    backgroundColor: '#111118', padding: 16,
    borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  detectedAddr: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0, 200, 150, 0.06)', borderRadius: 10,
    padding: 10, gap: 8,
    borderWidth: 1, borderColor: 'rgba(0, 200, 150, 0.2)',
  },
  detectedAddrText: {
    flex: 1, fontSize: 13, color: '#F0F0F5', fontWeight: '600'
  },
  mapHint: {
    fontSize: 13, color: '#8888AA', textAlign: 'center'
  },
  currentLocBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6, padding: 8,
  },
  currentLocText: {
    color: '#00C896', fontSize: 13, fontWeight: '700'
  },
  miniMap: {
    height: 150, borderRadius: 12,
    marginHorizontal: 16, marginTop: 16, marginBottom: 8,
    overflow: 'hidden',
  },
  detailsContent: { paddingBottom: 40 },
  fieldLabel: {
    fontSize: 13, fontWeight: '700', color: '#8888AA',
    marginTop: 16, marginBottom: 6, marginHorizontal: 16,
  },
  labelsRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, gap: 8, marginBottom: 4,
  },
  labelChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: '#16161F', borderRadius: 20,
    borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  labelChipActive: {
    backgroundColor: 'rgba(0, 200, 150, 0.1)', borderColor: '#00C896',
  },
  labelChipText: {
    fontSize: 13, fontWeight: '600', color: '#8888AA'
  },
  labelChipTextActive: { color: '#00C896' },
  input: {
    marginHorizontal: 16, backgroundColor: '#16161F',
    borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 15, color: '#F0F0F5',
  },
});
