import React, { useState, useEffect } from 'react';
import { StatusBar, View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ChatScreen from './src/screens/ChatScreen';
import ManualBookingScreen from './src/screens/ManualBookingScreen';
import HomeServicesScreen from './src/screens/HomeServicesScreen';
import ProvidersListScreen from './src/screens/ProvidersListScreen';
import ProviderMenuScreen from './src/screens/ProviderMenuScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import BookingSuccessScreen from './src/screens/BookingSuccessScreen';
import AddressScreen from './src/screens/AddressScreen';
import ActiveRequestsScreen from './src/screens/ActiveRequestsScreen';
import AgentTraceScreen from './src/screens/AgentTraceScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AuthScreen from './src/screens/AuthScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import OnboardingAddressScreen from './src/screens/OnboardingAddressScreen';
import SplashScreen from './src/screens/SplashScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Tab = createBottomTabNavigator();
const ChatStack = createStackNavigator();
const ManualStack = createStackNavigator();

function ChatStackNav() {
  return (
    <ChatStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatStack.Screen name="ChatMain" component={ChatScreen} />
      <ChatStack.Screen name="AgentTrace" component={AgentTraceScreen} />
    </ChatStack.Navigator>
  );
}

function ManualBookingStackNav() {
  return (
    <ManualStack.Navigator screenOptions={{ headerShown: false }}>
      <ManualStack.Screen name="ManualBookingHome" component={ManualBookingScreen} />
      <ManualStack.Screen name="HomeServices" component={HomeServicesScreen} />
      <ManualStack.Screen name="ProvidersListScreen" component={ProvidersListScreen} />
      <ManualStack.Screen name="ProviderMenuScreen" component={ProviderMenuScreen} />
      <ManualStack.Screen name="CheckoutScreen" component={CheckoutScreen} />
      <ManualStack.Screen name="BookingSuccessScreen" component={BookingSuccessScreen} />
      <ManualStack.Screen name="AddressScreen" component={AddressScreen} />
      <ManualStack.Screen name="ProfileScreen" component={ProfileScreen} />
    </ManualStack.Navigator>
  );
}

const TAB_ICONS = {
  Chat: ['chatbubble-ellipses', 'chatbubble-ellipses-outline'],
  ManualBooking: ['clipboard', 'clipboard-outline'],
  ActiveRequests: ['notifications', 'notifications-outline'],
};

function AppNavigator() {
  const { user, loading, hasAddress } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    AsyncStorage.getItem('has_seen_welcome').then(val => {
      if (!val) setShowWelcome(true);
    });
  }, []);

  // 1. Show splash screen first always
  if (showSplash) {
    return (
      <SplashScreen
        onComplete={() => setShowSplash(false)}
      />
    );
  }

  // 2. Show welcome screen for first time users (only if not logged in yet)
  if (showWelcome && !user) {
    return (
      <WelcomeScreen
        onGetStarted={async () => {
          await AsyncStorage.setItem('has_seen_welcome', 'true');
          setShowWelcome(false);
        }}
      />
    );
  }

  // 3. Loading state (No buffering wheel indicator)
  if (loading) {
    return (
      <View style={{
        flex: 1, justifyContent: 'center',
        alignItems: 'center', backgroundColor: '#0A0A0F'
      }}>
        <Text style={{
          marginTop: 16, color: '#8888AA', fontSize: 14, fontWeight: '600'
        }}>Loading...</Text>
      </View>
    );
  }

  // 4. Not logged in — show auth
  if (!user) return <AuthScreen />;

  // 5. Logged in but no address — show onboarding
  if (!hasAddress) return <OnboardingAddressScreen />;

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            const [active, inactive] = TAB_ICONS[route.name] || ['ellipse', 'ellipse-outline'];
            return <Ionicons name={focused ? active : inactive} size={22} color={color} />;
          },
          tabBarActiveTintColor: '#00C896',
          tabBarInactiveTintColor: '#8888AA',
          tabBarStyle: {
            backgroundColor: '#111118',
            borderTopColor: 'rgba(255, 255, 255, 0.08)',
            borderTopWidth: 1,
            height: 72,
            paddingBottom: 12,
            paddingTop: 10,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            letterSpacing: 0.3,
          },
        })}
      >
        <Tab.Screen
          name="Chat"
          component={ChatStackNav}
          options={{ tabBarLabel: '💬 AI Chat' }}
        />
        <Tab.Screen
          name="ManualBooking"
          component={ManualBookingStackNav}
          options={{ tabBarLabel: '📋 Booking' }}
        />
        <Tab.Screen
          name="ActiveRequests"
          component={ActiveRequestsScreen}
          options={{ tabBarLabel: '🔔 Requests' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

