import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
    </ManualStack.Navigator>
  );
}

const TAB_ICONS = {
  Chat: ['chatbubble-ellipses', 'chatbubble-ellipses-outline'],
  ManualBooking: ['clipboard', 'clipboard-outline'],
  ActiveRequests: ['notifications', 'notifications-outline'],
};

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ focused, color, size }) => {
              const [active, inactive] = TAB_ICONS[route.name] || ['ellipse', 'ellipse-outline'];
              return <Ionicons name={focused ? active : inactive} size={22} color={color} />;
            },
            tabBarActiveTintColor: '#00C853',
            tabBarInactiveTintColor: '#9999AA',
            tabBarStyle: {
              backgroundColor: '#FFFFFF',
              borderTopColor: '#E4E5EF',
              borderTopWidth: 1,
              height: 65,
              paddingBottom: 8,
              paddingTop: 6,
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
    </SafeAreaProvider>
  );
}

