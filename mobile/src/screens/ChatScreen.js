import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { discoverProviders, bookProvider, getProviderDetails, BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const C = {
  bg: '#F5F6FA',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  bubbleBot: '#FFFFFF',
  bubbleUser: '#00C853',
  primary: '#00C853',
  accent: '#00A843',
  text: '#1A1A2E',
  textSec: '#555570',
  textMuted: '#9999AA',
  border: '#E4E5EF',
  headerBg: '#FFFFFF',
  error: '#F44336',
  warning: '#FF9500',
  star: '#FFB300',
};

const GREETING = {
  id: 'greeting', type: 'bot', timestamp: new Date(),
  text: 'Assalam o Alaikum! 👋\nMain aapka Khidmatgar hoon — aapki ghar ki zarooraton ka AI assistant.\n\nBatain, aaj aapko kaunsi service chahiye?\n\n• "AC bilkul kaam nahi kar raha"\n• "Geyser leak ho raha hai"\n• "Bijli ki wiring check karwani hai"',
};

const QUICK = [
  'AC repair kal subah G-13 mein',
  'Plumber chahiye DHA Karachi',
  'Bijli wala chahiye F-7 mein',
];

const AGENT_STEPS = [
  { emoji: '🧠', text: 'Step 1: Understanding your request...' },
  { emoji: '📍', text: 'Step 2: Finding providers nearby...' },
  { emoji: '⚖️', text: 'Step 3: Ranking by distance & rating...' },
  { emoji: '✅', text: 'Step 4: Preparing your results...' }
];

const SERVICE_LABELS = {
  'AC_REPAIR': 'AC technician',
  'ELECTRICIAN': 'electrician',
  'PLUMBER': 'plumber',
  'CARPENTER': 'carpenter',
  'PAINTER': 'painter',
  'TUTOR': 'tutor',
  'BEAUTICIAN': 'beautician',
  'DRIVER': 'driver',
  'CLEANER': 'cleaner',
  'GARDENER': 'gardener'
};

const getServiceLabel = (serviceType) => {
  return SERVICE_LABELS[serviceType] || 'professional';
};

const SERVICE_EMOJIS = {
  'AC_REPAIR': '❄️',
  'ELECTRICIAN': '⚡',
  'PLUMBER': '🔧',
  'CARPENTER': '🪚',
  'PAINTER': '🎨',
  'TUTOR': '📚',
  'BEAUTICIAN': '💄',
  'DRIVER': '🚗',
  'CLEANER': '🧹',
  'GARDENER': '🌱'
};

const getServiceEmoji = (serviceType) => {
  return SERVICE_EMOJIS[serviceType] || '👤';
};

const SERVICES_NEEDING_PARTS = [
  'AC_REPAIR', 'ELECTRICIAN', 'PLUMBER', 'CARPENTER'
];

export default function ChatScreen({ navigation, route }) {
  const { user, incrementBookingCount } = useAuth();
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  // Staged conversation state
  const [stage, setStage] = useState('idle'); // idle | providers_shown | services_shown | awaiting_time | confirmed
  const [pendingData, setPendingData] = useState(null); // { intent, ranking, trace_id, originalPrompt }
  // GPS location state
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('unknown'); // 'unknown' | 'granted' | 'denied'
  const [currentStep, setCurrentStep] = useState(0);
  const [currentServiceType, setCurrentServiceType] = useState('');
  const scrollRef = useRef();
  const cleanupRef = useRef(null);

  // Inline state for agentic matching/service selections
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [currentBookingId, setCurrentBookingId] = useState(null);
  const [showLogs, setShowLogs] = useState(false);
  const [agentLogs, setAgentLogs] = useState([
    { time: new Date().toLocaleTimeString('en-US', { hour12: false }), agent: 'System', action: 'KaamConnect AI Agentic Session Initialized', tool: 'LocalInit', result: 'Ready' }
  ]);

  // Premium Chat Upgrades State
  const [clickedMessageIds, setClickedMessageIds] = useState([]);
  const [selectedServicesMap, setSelectedServicesMap] = useState({});
  const [ratingsMap, setRatingsMap] = useState({});
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [historyVisible, setHistoryVisible] = useState(false);

  // Load and save chat sessions for Gemini/ChatGPT style history
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const stored = await AsyncStorage.getItem('kaamconnect_chat_sessions');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.length > 0) {
            setSessions(parsed);
            const lastSession = parsed[parsed.length - 1];
            setCurrentSessionId(lastSession.id);
            const loadedMsgs = lastSession.messages.map(m => ({
              ...m,
              timestamp: m.timestamp ? new Date(m.timestamp) : new Date()
            }));
            setMessages(loadedMsgs);
            setStage(lastSession.stage || 'idle');
            setPendingData(lastSession.pendingData || null);
            setSelectedProvider(lastSession.selectedProvider || null);
            setSelectedService(lastSession.selectedService || null);
            if (lastSession.clickedMessageIds) {
              setClickedMessageIds(lastSession.clickedMessageIds);
            }
            if (lastSession.selectedServicesMap) {
              setSelectedServicesMap(lastSession.selectedServicesMap);
            }
            if (lastSession.ratingsMap) {
              setRatingsMap(lastSession.ratingsMap);
            }
            return;
          }
        }
        
        // Initial setup
        const initialId = uid();
        const initialSession = {
          id: initialId,
          title: 'Naya Chat',
          messages: [GREETING],
          stage: 'idle',
          pendingData: null,
          selectedProvider: null,
          selectedService: null,
          clickedMessageIds: [],
          selectedServicesMap: {},
          ratingsMap: {},
          timestamp: Date.now()
        };
        setSessions([initialSession]);
        setCurrentSessionId(initialId);
        await AsyncStorage.setItem('kaamconnect_chat_sessions', JSON.stringify([initialSession]));
      } catch (err) {
        console.error('Failed to load chat sessions:', err);
      }
    };
    loadSessions();
  }, []);

  // Auto-sync active session state to AsyncStorage when it changes
  useEffect(() => {
    if (!currentSessionId || sessions.length === 0) return;

    const activeSession = sessions.find(s => s.id === currentSessionId);
    if (!activeSession) return;

    let title = activeSession.title || 'Naya Chat';
    if (title === 'Naya Chat') {
      const firstUserMsg = messages.find(m => m.type === 'user');
      if (firstUserMsg) {
        title = firstUserMsg.text.substring(0, 24) + (firstUserMsg.text.length > 24 ? '...' : '');
      }
    }

    const updatedSessions = sessions.map(s => {
      if (s.id === currentSessionId) {
        return {
          ...s,
          title,
          messages,
          stage,
          pendingData,
          selectedProvider,
          selectedService,
          clickedMessageIds,
          selectedServicesMap,
          ratingsMap,
          timestamp: Date.now()
        };
      }
      return s;
    });

    const hasChanged = JSON.stringify(sessions) !== JSON.stringify(updatedSessions);
    if (hasChanged) {
      setSessions(updatedSessions);
      AsyncStorage.setItem('kaamconnect_chat_sessions', JSON.stringify(updatedSessions));
    }
  }, [messages, stage, pendingData, selectedProvider, selectedService, clickedMessageIds, selectedServicesMap, ratingsMap]);

  const startNewChat = async () => {
    const newId = uid();
    const newSession = {
      id: newId,
      title: 'Naya Chat',
      messages: [GREETING],
      stage: 'idle',
      pendingData: null,
      selectedProvider: null,
      selectedService: null,
      clickedMessageIds: [],
      selectedServicesMap: {},
      ratingsMap: {},
      timestamp: Date.now()
    };
    const updatedSessions = [...sessions, newSession];
    setSessions(updatedSessions);
    setCurrentSessionId(newId);
    setMessages([GREETING]);
    setStage('idle');
    setPendingData(null);
    setSelectedProvider(null);
    setSelectedService(null);
    setClickedMessageIds([]);
    setSelectedServicesMap({});
    setRatingsMap({});
    await AsyncStorage.setItem('kaamconnect_chat_sessions', JSON.stringify(updatedSessions));
  };

  const selectSession = (session) => {
    setCurrentSessionId(session.id);
    const loadedMsgs = session.messages.map(m => ({
      ...m,
      timestamp: m.timestamp ? new Date(m.timestamp) : new Date()
    }));
    setMessages(loadedMsgs);
    setStage(session.stage || 'idle');
    setPendingData(session.pendingData || null);
    setSelectedProvider(session.selectedProvider || null);
    setSelectedService(session.selectedService || null);
    setClickedMessageIds(session.clickedMessageIds || []);
    setSelectedServicesMap(session.selectedServicesMap || {});
    setRatingsMap(session.ratingsMap || {});
    setHistoryVisible(false);
  };

  const deleteSession = async (sessionId) => {
    const remaining = sessions.filter(s => s.id !== sessionId);
    if (remaining.length === 0) {
      const newId = uid();
      const newSession = {
        id: newId,
        title: 'Naya Chat',
        messages: [GREETING],
        stage: 'idle',
        pendingData: null,
        selectedProvider: null,
        selectedService: null,
        clickedMessageIds: [],
        selectedServicesMap: {},
        ratingsMap: {},
        timestamp: Date.now()
      };
      setSessions([newSession]);
      setCurrentSessionId(newId);
      setMessages([GREETING]);
      setStage('idle');
      setPendingData(null);
      setSelectedProvider(null);
      setSelectedService(null);
      setClickedMessageIds([]);
      setSelectedServicesMap({});
      setRatingsMap({});
      await AsyncStorage.setItem('kaamconnect_chat_sessions', JSON.stringify([newSession]));
    } else {
      setSessions(remaining);
      if (currentSessionId === sessionId) {
        const first = remaining[0];
        setCurrentSessionId(first.id);
        const loadedMsgs = first.messages.map(m => ({
          ...m,
          timestamp: m.timestamp ? new Date(m.timestamp) : new Date()
        }));
        setMessages(loadedMsgs);
        setStage(first.stage || 'idle');
        setPendingData(first.pendingData || null);
        setSelectedProvider(first.selectedProvider || null);
        setSelectedService(first.selectedService || null);
        setClickedMessageIds(first.clickedMessageIds || []);
        setSelectedServicesMap(first.selectedServicesMap || {});
        setRatingsMap(first.ratingsMap || {});
      }
      await AsyncStorage.setItem('kaamconnect_chat_sessions', JSON.stringify(remaining));
    }
  };

  const toggleServiceInMessage = (msgId, service) => {
    setSelectedServicesMap(prev => {
      const current = prev[msgId] || [];
      const exists = current.some(s => s.id === service.id);
      const updated = exists
        ? current.filter(s => s.id !== service.id)
        : [...current, service];
      return { ...prev, [msgId]: updated };
    });
  };

  const addLog = (agent, action, tool = '—', result = 'Success') => {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    setAgentLogs(p => [...p, { time: timeStr, agent, action, tool, result }]);
  };

  const handleJobDone = async (bookingId, msgId) => {
    if (!bookingId) return;
    try {
      addLog('AutomationAgent', `Completing booking: ${bookingId}`, 'API_Call', 'In-Progress');
      const response = await fetch(`${BASE_URL}/api/bookings/${bookingId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        addLog('AutomationAgent', `Booking completed: ${bookingId}`, 'FirestoreWrite', 'Completed');
        add({
          id: uid(),
          type: 'bot',
          timestamp: ts(),
          text: '💖 Bohat shukriya confirm karne ka! Booking status database mein COMPLETE mark ho chuki hai. Stay blessed! ✨'
        });
        
        // Append rating prompt
        setTimeout(() => {
          add({
            id: uid(),
            type: 'rating_prompt',
            timestamp: ts(),
            data: {
              bookingId: bookingId,
              providerName: selectedProvider?.name || 'Provider'
            }
          });
        }, 1000);
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (e) {
      console.error('[ChatScreen] Error completing booking:', e.message);
      add({
        id: uid(),
        type: 'bot',
        timestamp: ts(),
        text: '💖 Bohat shukriya confirm karne ka! Agar aapko koi aur madad chahiye ho toh humein chat mein likhein. Stay blessed! ✨'
      });
      
      // Append rating prompt as fallback
      setTimeout(() => {
        add({
          id: uid(),
          type: 'rating_prompt',
          timestamp: ts(),
          data: {
            bookingId: bookingId,
            providerName: selectedProvider?.name || 'Provider'
          }
        });
      }, 1000);
    }
  };

  const handleIssueRaised = async (bookingId, msgId) => {
    if (!bookingId) return;
    try {
      addLog('AutomationAgent', `Raising issue for booking: ${bookingId}`, 'API_Call', 'In-Progress');
      const response = await fetch(`${BASE_URL}/api/bookings/${bookingId}/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        addLog('AutomationAgent', `Issue raised for booking: ${bookingId}`, 'FirestoreWrite', 'Completed');
        add({
          id: uid(),
          type: 'bot',
          timestamp: ts(),
          text: '⚠️ Oh ho! Humne database mein issue raise kar diya hai aur ticket coordinate ho rahi hai. Hamara customer care representative jald hi aapse contact karega details ke sath. 📞'
        });
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (e) {
      console.error('[ChatScreen] Error raising issue:', e.message);
      add({
        id: uid(),
        type: 'bot',
        timestamp: ts(),
        text: '⚠️ Oh ho! Hum iski gehraee se jaanch kar rahe hain. Hamara customer care representative jald hi aapse contact karega details ke sath. 📞'
      });
    }
  };

  // ── GPS LOCATION ──────────────────────────────
  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        const coords = {
          lat: location.coords.latitude,
          lng: location.coords.longitude
        };
        setUserLocation(coords);
        setLocationStatus('granted');
        console.log('[Location] GPS:', coords);
        return coords;
      } else {
        setLocationStatus('denied');
        return null;
      }
    } catch (error) {
      console.log('[Location] Error:', error.message);
      setLocationStatus('denied');
      return null;
    }
  };

  useEffect(() => { requestLocation(); }, []);

  useEffect(() => {
    if (route.params?.addressUpdated && route.params?.pendingRequest) {
      const request = route.params.pendingRequest;
      // Clear route params so this only runs once
      navigation.setParams({ addressUpdated: undefined, pendingRequest: undefined });
      
      const proceedAfterNewAddress = async () => {
        const savedAddrStr = await AsyncStorage.getItem('selected_address');
        const savedAddress = savedAddrStr ? JSON.parse(savedAddrStr) : null;
        
        if (savedAddress) {
          await handleAddressConfirmed(savedAddress, request);
        }
      };
      
      proceedAfterNewAddress();
    }
  }, [route.params]);

  const hasLocationInMessage = (text) => {
    const locationWords = [
      'karachi', 'islamabad', 'lahore', 'rawalpindi', 'peshawar', 'faisalabad',
      'dha', 'gulshan', 'clifton', 'bahria', 'gulberg',
      'g-13', 'f-7', 'f7', 'g13', 'f-6', 'f6', 'g-11', 'g11', 'i-8', 'i8',
      'mein', 'main', 'near', 'paas', 'area', 'sector', 'block', 'phase'
    ];
    return locationWords.some(w => text.toLowerCase().includes(w));
  };

  const add = (msg) => setMessages(p => [...p, msg]);
  const drop = (id) => setMessages(p => p.filter(m => m.id !== id));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const ts = () => new Date();

  // Collect all current providers for name-matching
  const getCurrentProviders = () => {
    if (!pendingData?.ranking) return [];
    const r = pendingData.ranking;
    return [r.top_pick, ...(r.alternatives || [])].filter(Boolean);
  };

  const isProviderSelection = (text) => {
    const t = text.trim().toLowerCase();
    if (['1', '2', '3', 'ek', 'do', 'teen', 'first', 'second', 'third', 'pehla', 'doosra', 'teesra', 'best'].some(
      n => t === n || t.startsWith(n + ' ')
    )) return true;
    const providers = getCurrentProviders();
    if (providers.some(p => p.name && t.includes(p.name.toLowerCase().split(' ')[0].toLowerCase()))) return true;
    return false;
  };

  const resetConversation = () => {
    setStage('idle');
    setPendingData(null);
    add({ id: uid(), type: 'bot', text: 'Theek hai! Aap kaunsi nayi service chahiye? 🔍', timestamp: ts() });
  };

  const showStepByStep = () => {
    setCurrentStep(0);
    const intervals = AGENT_STEPS.map((step, index) =>
      setTimeout(() => {
        setCurrentStep(index);
      }, index * 800)
    );
    return () => intervals.forEach(clearTimeout);
  };

  // Helper for date/time parsing (Urdu & English)
  const parseTimeSlot = (pref) => {
    const t = pref.toLowerCase();
    const today = new Date();
    
    let day = 'today';
    let dateObj = today;
    if (t.includes('tomorrow') || t.includes('kal')) {
      day = 'tomorrow';
      dateObj = new Date();
      dateObj.setDate(today.getDate() + 1);
    } else if (t.includes('parson') || t.includes('day after')) {
      day = 'day_after';
      dateObj = new Date();
      dateObj.setDate(today.getDate() + 2);
    }

    let slot = 'morning';
    let timeStr = '10:00 AM';
    if (t.includes('evening') || t.includes('shaam')) {
      slot = 'evening';
      timeStr = '05:00 PM';
    } else if (t.includes('afternoon') || t.includes('dopahar')) {
      slot = 'afternoon';
      timeStr = '02:00 PM';
    } else if (t.includes('night') || t.includes('raat')) {
      slot = 'evening';
      timeStr = '08:00 PM';
    }

    const dateFormatted = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });

    return {
      date: dateFormatted,
      displayTime: timeStr,
      slotName: slot
    };
  };

  const hasTimeInMessage = (text) => {
    const t = text.toLowerCase();
    return (
      t.includes('kal') ||
      t.includes('tomorrow') ||
      t.includes('aaj') ||
      t.includes('today') ||
      t.includes('parson') ||
      t.includes('day after') ||
      t.includes('subah') ||
      t.includes('morning') ||
      t.includes('dopahar') ||
      t.includes('afternoon') ||
      t.includes('shaam') ||
      t.includes('evening') ||
      t.includes('raat') ||
      t.includes('night') ||
      /\b\d{1,2}\s*(am|pm|baje|o'clock)\b/i.test(t)
    );
  };

  // ── SEND MESSAGE ──────────────────────────────
  const sendMessage = async (overrideText) => {
    const text = (overrideText || input).trim();
    if (!text || loading) return;

    add({ id: uid(), type: 'user', text, timestamp: ts() });
    setInput('');
    setLoading(true);
    const cleanup = showStepByStep();
    cleanupRef.current = cleanup;
    const thinkId = uid();
    add({ id: thinkId, type: 'thinking', text: '', timestamp: ts() });

    try {
      // ── If awaiting problem description ──
      if (stage === 'awaiting_problem_description') {
        const problemText = text.trim();
        const provider = pendingData?.selectedProvider;
        
        drop(thinkId);
        
        // Ask Groq to suggest service based on problem
        try {
          const response = await fetch(`${BASE_URL}/api/suggest-service`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              problem: problemText,
              provider_services: provider?.services || [],
              service_type: pendingData?.intent?.service_type
            })
          });
          const data = await response.json();
          
          add({
            id: uid(), type: 'bot', timestamp: ts(),
            text: `Aapke masle ke mutabiq main suggest karta hoon:\n\n` +
              `✅ ${data.suggested_service}\n\n` +
              `${data.reasoning}\n\n` +
              `Kya aap yeh service book karna chahte hain?`
          });
          
          // Show the specific service as a bookable option
          add({
            id: uid(), type: 'service_suggestion', timestamp: ts(),
            data: { service: data.service_object, provider }
          });
          
          setStage('providers_shown');
        } catch (error) {
          add({
            id: uid(), type: 'bot', timestamp: ts(),
            text: `Samajh gaya! Main aapko ${provider?.name} ` +
              `ki services dikha raha hoon — wahan se select kar lein.`
          });
          setStage('providers_shown');
        }
        setLoading(false);
        cleanup();
        return;
      }

      // ── If awaiting address confirm ──
      if (stage === 'awaiting_address_confirm' && pendingData) {
        drop(thinkId);
        const lower = text.toLowerCase();
        if (lower.includes('yes') || lower.includes('haan') || lower.includes('confirm') || lower.includes('ok') || lower.includes('theek')) {
          await handleAddressConfirmed(pendingData.savedAddress, pendingData.originalRequest);
        } else if (lower.includes('no') || lower.includes('change') || lower.includes('nahin') || lower.includes('badal')) {
          handleAddressChange(pendingData.originalRequest);
        } else {
          add({
            id: uid(), type: 'bot', timestamp: ts(),
            text: `Kripya batayein ke kya aap isi address par service chahte hain? Niche diye gaye options select karein ya "Yes" / "No" likhein. 😊`
          });
        }
        setLoading(false);
        cleanup();
        return;
      }

      // ── If awaiting location ──
      if (stage === 'awaiting_location' && pendingData?.originalPrompt) {
        drop(thinkId);
        const originalPrompt = pendingData.originalPrompt;
        const combinedPrompt = `${originalPrompt} in ${text}`;
        setStage('idle');
        setPendingData(null);
        await handleNewServiceRequest(combinedPrompt, thinkId);
        setLoading(false);
        cleanup();
        return;
      }

      // ── If providers already shown, check if selecting or new request ──
      if (stage === 'providers_shown' && pendingData) {
        if (isProviderSelection(text)) {
          drop(thinkId);
          const choice = text.trim();
          const ranking = pendingData.ranking;
          let chosen = null;

          if (choice === '1' || choice.toLowerCase().includes('1') || choice.toLowerCase().includes('pehla') || choice.toLowerCase().includes('first') || choice.toLowerCase().includes('best')) {
            chosen = ranking.top_pick;
          } else if (choice === '2' || choice.toLowerCase().includes('2') || choice.toLowerCase().includes('doosra') || choice.toLowerCase().includes('second')) {
            chosen = ranking.alternatives?.[0];
          } else if (choice === '3' || choice.toLowerCase().includes('3') || choice.toLowerCase().includes('teesra') || choice.toLowerCase().includes('third')) {
            chosen = ranking.alternatives?.[1];
          }

          if (chosen) {
            await selectProvider(chosen);
          } else {
            add({
              id: uid(), type: 'bot', timestamp: ts(),
              text: 'Number batain (1, 2, ya 3) ya provider ka naam likhein 😊',
            });
          }
          setLoading(false);
          cleanup();
          return;
        } else {
          // Not a selection — treat as new service request
          setStage('idle');
          setPendingData(null);
        }
      }

      // ── If confirmed, reset for new request ──
      if (stage === 'confirmed') {
        setStage('idle');
        setPendingData(null);
      }

      // ── Stage 1+2+3: Discover providers ──
      // Check if location already stored in AsyncStorage
      const savedAddrStr = await AsyncStorage.getItem('selected_address');
      const storedArea = await AsyncStorage.getItem('userArea');
      let hasSavedLoc = false;
      if (savedAddrStr) {
        try {
          const parsed = JSON.parse(savedAddrStr);
          if (parsed.address || parsed.area || parsed.name) hasSavedLoc = true;
        } catch (e) {}
      }
      if (storedArea) hasSavedLoc = true;

      // Intercept if no location available in manual booking AND not in user prompt
      if (!hasSavedLoc && !hasLocationInMessage(text)) {
        drop(thinkId);
        add({
          id: uid(), type: 'bot', timestamp: ts(),
          text: 'Apka location set nahi hai. Kripya apna area batain (e.g. Clifton ya DHA Karachi) taake hum aapko qareeb ke providers dikha sakein. 📍',
        });
        setStage('awaiting_location');
        setPendingData({ originalPrompt: text });
        setLoading(false);
        cleanup();
        return;
      }
      await handleNewServiceRequest(text, thinkId);
    } catch (err) {
      drop(thinkId);
      add({
        id: uid(), type: 'error', timestamp: ts(),
        text: 'Connection error — backend server check karein. 🔌',
      });
    } finally {
      setLoading(false);
      cleanup();
    }
  };

  const handleAddressConfirmed = async (savedAddress, originalRequest) => {
    setStage('idle');
    setPendingData({ addressConfirmed: true });
    
    add({
      id: uid(), type: 'bot', timestamp: ts(),
      text: `✅ Perfect! Searching near ${savedAddress.address}...`
    });
    
    const thinkId = uid();
    add({ id: thinkId, type: 'thinking', timestamp: ts(), text: '' });
    setLoading(true);
    const cleanup = showStepByStep();
    cleanupRef.current = cleanup;
    
    await handleNewServiceRequest(originalRequest, thinkId, true);
    setLoading(false);
    cleanup();
  };

  const handleAddressChange = (originalRequest) => {
    setStage('idle');
    
    add({
      id: uid(), type: 'bot', timestamp: ts(),
      text: `📍 Apna naya address set karein — phir wapas aayein ` +
        `aur apni request dobara bhejein.\n\n` +
        `Main aapko wahan ke providers dikhaunga! 😊`
    });
    
    add({
      id: uid(), type: 'address_change_prompt', timestamp: ts(),
      data: { originalRequest }
    });
  };

  // ── DISCOVER PROVIDERS (reusable) ─────────────
  const handleNewServiceRequest = async (text, thinkId, addressAlreadyConfirmed = false) => {
    let enrichedText = text;
    addLog('IntentAgent', `Parsing user request intent: "${text}"`, 'NLP-Parser', 'In Progress');
    
    let savedAddress = null;
    try {
      const savedAddrStr = await AsyncStorage.getItem('selected_address');
      savedAddress = savedAddrStr ? JSON.parse(savedAddrStr) : null;
      
      if (!addressAlreadyConfirmed && savedAddress && !pendingData?.addressConfirmed) {
        drop(thinkId);
        setLoading(false);
        cleanupRef.current?.();
        
        add({
          id: uid(), type: 'bot', timestamp: ts(),
          text: `📍 Kya aap yeh service apne saved address par chahte hain?\n\n` +
            `🏠 ${savedAddress.label}: ${savedAddress.address}, ${savedAddress.city}`
        });
        
        add({
          id: uid(), type: 'address_confirm', timestamp: ts(),
          data: { 
            savedAddress, 
            originalRequest: text 
          }
        });
        
        setStage('awaiting_address_confirm');
        setPendingData({ 
          originalRequest: text, 
          savedAddress,
          addressConfirmed: false 
        });
        return;
      }
      
      const userArea = await AsyncStorage.getItem('userArea');
      let currentArea = userArea;
      if (savedAddress) {
        currentArea = savedAddress.address || savedAddress.area || savedAddress.name || userArea;
      }
      
      const locationMentioned = /karachi|clifton|gulshan|defence|dha|nazimabad|korangi|malir|saddar|pechs|bahadurabad|islamabad|g-13|f-7|f-6|g-11|i-8/i.test(text);
      if (!locationMentioned && currentArea) {
        enrichedText = `${text} (User is located in: ${currentArea})`;
        addLog('DiscoveryAgent', `Resolved user location from saved address: "${currentArea}"`, 'AsyncStorage', 'Resolved');
      } else if (locationMentioned) {
        addLog('DiscoveryAgent', 'Resolved user location from user prompt', 'TextParsing', 'Resolved');
      } else {
        addLog('DiscoveryAgent', 'No saved location found and no location in prompt', 'Validation', 'Awaiting Location');
      }
    } catch (e) {
      console.log('Failed to check userArea in ChatScreen:', e);
    }

    const locationToUse = savedAddress ? {
      lat: savedAddress.latitude,
      lng: savedAddress.longitude
    } : userLocation;
    
    const result = await discoverProviders(enrichedText, locationToUse);
    drop(thinkId);

    if (result.status === 'needs_clarification') {
      addLog('IntentAgent', 'Ambiguous request context requires user clarification', 'IntentClassifier', 'Clarifying');
      add({
        id: uid(), type: 'bot', timestamp: ts(),
        text: result.clarification || 'Aap kaunsi cheez theek karwana chahte hain — AC, geyser, wiring, ya kuch aur?',
      });
    } else if (result.status === 'no_providers') {
      addLog('DiscoveryAgent', 'No providers currently matching filters in target area', 'FirestoreQuery', 'Empty Results');
      const svcType = result.intent?.service_type || '';
      add({
        id: uid(), type: 'bot', timestamp: ts(),
        text: `Is waqt ${result.intent?.location || 'aapke area'} mein koi ${getServiceLabel(svcType)} available nahi. Kya aap timing flexible rakh sakte hain? ⏰`,
      });
    } else if (result.status === 'providers_found') {
      const svcType = result.intent?.service_type || '';
      setCurrentServiceType(svcType);
      
      addLog('DiscoveryAgent', `Queried and retrieved available ${svcType} technicians`, 'FirestoreQuery', 'Success');
      addLog('MatchingAgent', `Ranking providers in Clifton/DHA based on distance and rating`, 'DecisionMatrix', 'Completed');

      add({
        id: uid(), type: 'bot', timestamp: ts(),
        text: `${svcType} ke liye aapke area mein best ${getServiceLabel(svcType)} dhundh liye. 🔍`,
      });
      add({ id: uid(), type: 'providers', timestamp: ts(), data: result.ranking });

      const sparePartsText = SERVICES_NEEDING_PARTS.includes(svcType)
        ? '\n\n⚠️ Note: Agar koi spare parts chahiye honge toh wo aap khud provide karein ge.'
        : '';

      add({
        id: uid(), type: 'bot', timestamp: ts(),
        text: `Kaun sa ${getServiceLabel(svcType)} pasand hai? 😊${sparePartsText}`,
      });
      setStage('providers_shown');
      setPendingData({ intent: result.intent, ranking: result.ranking, trace_id: result.trace_id, originalPrompt: text });
    }
  };

  // ── SELECT PROVIDER (INLINE CATALOG FETCH) ────
  const selectProvider = async (provider) => {
    if (loading) return;
    setLoading(true);
    addLog('DiscoveryAgent', `Provider chosen: ${provider.name}`, 'UserSelection', 'Provider Selected');
    
    // Add user response bubble
    add({ id: uid(), type: 'user', text: `${provider.name} ko select kiya`, timestamp: ts() });
    
    const thinkId = uid();
    add({ id: thinkId, type: 'thinking', text: '', timestamp: ts() });

    try {
      let providerDetails = null;
      let isGoogleMaps = provider.source === 'google_maps' || String(provider.provider_id || provider.id).startsWith('ChI');
      
      if (!isGoogleMaps) {
        try {
          const res = await getProviderDetails(provider.provider_id || provider.id);
          if (res.success && res.provider) {
            providerDetails = res.provider;
          }
        } catch (e) {
          console.log('[ChatScreen] Error fetching DB provider details, falling back:', e.message);
        }
      }

      drop(thinkId);

      if (providerDetails && providerDetails.services && providerDetails.services.length > 0) {
        setSelectedProvider(providerDetails);
        addLog('MatchingAgent', `Fetched ${providerDetails.services.length} services for ${providerDetails.name}`, 'getProviderDetails', 'Success');
        
        // Add services menu bubble inline!
        add({
          id: uid(),
          type: 'services_menu',
          timestamp: ts(),
          data: {
            provider: providerDetails,
            services: providerDetails.services
          }
        });
      } else {
        // Fallback service catalog
        const fallbackServices = [
          { id: 'svc_1', name: `${getServiceLabel(currentServiceType)} General Service`, price: 1500 },
          { id: 'svc_2', name: `${getServiceLabel(currentServiceType)} Diagnostic & Repair`, price: 2500 },
          { id: 'svc_3', name: `${getServiceLabel(currentServiceType)} Comprehensive Care`, price: 4000 }
        ];
        const fullProvider = { ...provider, services: fallbackServices };
        setSelectedProvider(fullProvider);
        addLog('MatchingAgent', 'Fallback service catalog populated', 'MockServiceCatalog', 'Fallback');
        add({
          id: uid(),
          type: 'services_menu',
          timestamp: ts(),
          data: {
            provider: fullProvider,
            services: fallbackServices
          }
        });
      }
      setStage('services_shown');
    } catch (e) {
      console.error(e);
      drop(thinkId);
      add({ id: uid(), type: 'error', text: 'Provider services fetch karne mein masla aya.', timestamp: ts() });
    } finally {
      setLoading(false);
    }
  };

  const handleNotSure = (provider, intent) => {
    const inspectionService = {
      id: 'inspection_diagnosis',
      name: 'Inspection & Diagnosis (Ghar par check-up)',
      price: 1000
    };
    setSelectedService(inspectionService);
    addLog('MatchingAgent', `User is unsure, automatically selected fallback: Inspection & Diagnosis (PKR 1000)`, 'UserSelection', 'FallbackServiceSelected');
    add({ id: uid(), type: 'user', text: `Nahi pata kia chahye (Inspection & Diagnosis) PKR 1000 choose kiya`, timestamp: ts() });
    
    // Process service selection directly to continue booking
    const originalText = pendingData?.originalPrompt || '';
    if (hasTimeInMessage(originalText)) {
      addLog('BookingAgent', 'Date/Time parsed from prompt. Auto-booking initiated...', 'parseTimeSlot', 'Found');
      executeAutoBooking(inspectionService, originalText);
    } else {
      addLog('BookingAgent', 'No Date/Time in prompt. Prompting user with slot options.', 'PromptSlots', 'Waiting');
      const slots = generateTimeSlots();
      add({
        id: uid(),
        type: 'time_slots',
        timestamp: ts(),
        data: slots
      });
      setStage('awaiting_time');
    }
  };

  const selectService = (service) => {
    setSelectedService(service);
    addLog('MatchingAgent', `Service chosen: ${service.name} (PKR ${service.price})`, 'UserSelection', 'Service Selected');
    add({ id: uid(), type: 'user', text: `${service.name} (PKR ${service.price}) choose kiya`, timestamp: ts() });
    
    // Check if time slot was already mentioned in original user prompt
    const originalText = pendingData?.originalPrompt || messages.find(m => m.type === 'user')?.text || '';
    if (hasTimeInMessage(originalText)) {
      addLog('BookingAgent', 'Date/Time parsed from prompt. Auto-booking initiated...', 'parseTimeSlot', 'Found');
      executeAutoBooking(service, originalText);
    } else {
      addLog('BookingAgent', 'No Date/Time in prompt. Prompting user with slot options.', 'PromptSlots', 'Waiting');
      const slots = generateTimeSlots();
      add({
        id: uid(),
        type: 'time_slots',
        timestamp: ts(),
        data: slots
      });
      setStage('awaiting_time');
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const times = [
      { label: 'Morning', hour: 10, display: '10:00 AM' },
      { label: 'Afternoon', hour: 14, display: '02:00 PM' },
      { label: 'Evening', hour: 17, display: '05:00 PM' }
    ];

    const currentHour = today.getHours();
    times.forEach(t => {
      // Only show today's slot if the hour has not passed yet
      if (currentHour < t.hour) {
        slots.push({
          label: `Today ${t.label} (${t.display})`,
          value: `Today at ${t.display}`,
          hour: t.hour,
          date: today
        });
      }
    });

    times.forEach(t => {
      slots.push({
        label: `Tomorrow ${t.label} (${t.display})`,
        value: `Tomorrow at ${t.display}`,
        hour: t.hour,
        date: tomorrow
      });
    });

    return slots;
  };

  const selectTimeSlot = (slot) => {
    addLog('BookingAgent', `Time slot chosen: ${slot.value}`, 'TimeSelected', 'Success');
    add({ id: uid(), type: 'user', text: `${slot.label} select kiya`, timestamp: ts() });
    executeAutoBooking(selectedService, slot.value);
  };

  const executeAutoBooking = async (service, timePref) => {
    setLoading(true);
    addLog('BookingAgent', 'Executing secure booking transaction...', 'bookProvider API', 'Initiated');
    
    const thinkId = uid();
    add({ id: thinkId, type: 'thinking', text: '', timestamp: ts() });

    try {
      // 1. Resolve Location
      let location = 'Karachi';
      const savedAddrStr = await AsyncStorage.getItem('selected_address');
      const savedArea = await AsyncStorage.getItem('userArea');
      if (savedAddrStr) {
        const parsed = JSON.parse(savedAddrStr);
        location = parsed.address || parsed.area || parsed.name || savedArea || location;
      } else if (savedArea) {
        location = savedArea;
      }

      // Parse time preference
      const timeParsed = parseTimeSlot(timePref);

      // Construct request payload
      const updatedIntent = {
        ...(pendingData?.intent || {}),
        service_type: currentServiceType,
        location,
        time_preference: timePref
      };

      addLog('BookingAgent', `Sending booking request to backend`, 'bookProvider', 'Request');

      // Call real backend booking
      const result = await bookProvider(
        selectedProvider, 
        updatedIntent, 
        pendingData?.trace_id || `TR-${Date.now().toString(36)}`, 
        user?.uid || 'mobile-user'
      );

      drop(thinkId);

      if (result.status === 'booking_confirmed') {
        incrementBookingCount().catch(console.error);
        const bk = result.booking;
        setCurrentBookingId(bk?.booking_id || bk?.bookingId);
        
        // Render booking card
        add({
          id: uid(),
          type: 'booking_confirmed',
          timestamp: ts(),
          data: {
            booking: {
              booking_id: bk?.booking_id || bk?.bookingId || `BK-${Date.now()}`,
              location: bk?.location || location,
              scheduledDate: timeParsed.date,
              scheduledTime: timeParsed.displayTime,
              estimatedCost: `PKR ${(service.price || 1500).toLocaleString()}`,
              provider: selectedProvider?.name || 'Specialist'
            },
            provider: selectedProvider,
            serviceName: service.name
          }
        });

        // Show warm success greeting
        add({
          id: uid(),
          type: 'bot',
          timestamp: ts(),
          text: `🎉 Aapki booking successfully CONFIRM ho gayi hai!\n\n${selectedProvider?.name} ko notify kar diya gaya hai aur wo schedule ke mutabiq aapke address par pohanch jayenge.\n\nNiche diye gaye button se aap download kar sakte hain iska certified invoice receipt! 🧾`,
        });

        addLog('BookingAgent', `Booking confirmed: ${bk?.booking_id || 'BK-SUCCESS'}`, 'FirestoreWrite', 'Completed');

        // Start follow-up automation simulation
        simulateFollowUps(bk || { booking_id: 'BK-SUCCESS' });

        setStage('confirmed');
      } else {
        throw new Error('Booking failed');
      }
    } catch (e) {
      console.error(e);
      drop(thinkId);
      add({ id: uid(), type: 'error', text: 'Booking complete karne mein masla aya. Backend verify karein.', timestamp: ts() });
    } finally {
      setLoading(false);
    }
  };

  const simulateFollowUps = (booking) => {
    addLog('AutomationAgent', 'Scheduled pre-appointment automated reminders & completions', 'Scheduler', 'Active');
    
    const _providerName = booking?.provider_name 
      || selectedProvider?.name 
      || 'Your provider';
    
    const _serviceType = booking?.service_type 
      || currentServiceType 
      || '';
    
    const _serviceLabel = SERVICE_LABELS[_serviceType] 
      || _serviceType?.replace(/_/g,' ') 
      || 'service';
    
    const _phone = selectedProvider?.phone 
      || selectedProvider?.simulated_state?.phone 
      || 'Contact via app';
    
    const _address = booking?.user_details?.address
      || booking?.location
      || 'your address';
    
    const _slotDate = booking?.slot 
      ? new Date(booking.slot).toLocaleString('en-US', {
          timeZone: 'Asia/Karachi',
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      : 'scheduled time';

    // 1. Reminder simulation (after 4 seconds)
    setTimeout(() => {
      addLog('AutomationAgent', 'Triggering pre-appointment SMS & Local Notification reminder', 'expo-notifications', 'Sent');
      add({
        id: uid(),
        type: 'bot',
        timestamp: ts(),
        text: `🔔 Reminder\n\nAapka ${_serviceLabel} appointment:\n\n` +
          `👤 Provider: ${_providerName}\n` +
          `📅 Time: ${_slotDate}\n` +
          `📍 Address: ${_address}\n\n` +
          `Provider waqt par aapke paas pohonch jayega. ✅\n\n` +
          `_(This is a demo simulation. In production, reminders would fire at actual scheduled times.)_`
      });
    }, 4000);

    // 2. Status Update simulation (after 9 seconds)
    setTimeout(() => {
      addLog('AutomationAgent', 'Simulating provider status change: En Route', 'FirestoreUpdate', 'EnRoute');
      add({
        id: uid(),
        type: 'bot',
        timestamp: ts(),
        text: `🚗 Status Update: En Route\n\n` +
          `${_providerName} aapki taraf rawana ho chuke hain.\n\n` +
          `📞 Contact: ${_phone}\n` +
          `📍 ETA: 15 minutes\n` +
          `🕐 Appointment: ${_slotDate}`
      });
    }, 9000);

    // 3. Completion confirmation simulation (after 15 seconds)
    setTimeout(() => {
      addLog('AutomationAgent', 'Simulating job completion by provider app', 'FirestoreUpdate', 'Completed');
      add({
        id: uid(),
        type: 'bot',
        timestamp: ts(),
        text: `✅ Service Completed\n\n` +
          `${_providerName} ne aapka ${_serviceLabel} ` +
          `service successfully complete kar liya hai!\n\n` +
          `Kya kaam sahi tarike se hua? 😊`
      });

      // Show inline follow-up interaction buttons!
      add({
        id: uid(),
        type: 'follow_up_interaction',
        timestamp: ts(),
        data: {
          booking
        }
      });
    }, 15000);
  };

  const downloadReceiptPDF = async (booking, provider, serviceName) => {
    addLog('System', 'Generating PDF Invoice Receipt...', 'expo-print', 'Processing');
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>KaamConnect Invoice</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1A1A2E; margin: 0; padding: 40px; background-color: #F8F9FC; }
          .invoice-box { max-width: 600px; margin: auto; padding: 30px; border: 1px solid #E4E5EF; background: #FFFFFF; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #00C853; padding-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; color: #1A1A2E; }
          .logo span { color: #00C853; }
          .badge { background-color: #00C853; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
          .details-table { width: 100%; margin-top: 30px; border-collapse: collapse; }
          .details-table td { padding: 10px; border-bottom: 1px solid #F0F0F8; font-size: 14px; }
          .details-table tr:last-child td { border-bottom: none; }
          .label { color: #555570; font-weight: 600; width: 40%; }
          .value { color: #1A1A2E; font-weight: 500; }
          .total-box { margin-top: 30px; padding: 15px; background: rgba(0, 200, 83, 0.06); border: 1px dashed #00C853; border-radius: 8px; text-align: center; }
          .total-price { font-size: 20px; font-weight: bold; color: #00A843; }
          .footer { text-align: center; margin-top: 40px; font-size: 11px; color: #9999AA; }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header">
            <div class="logo">Kaam<span>Connect</span></div>
            <div class="badge">BOOKING CONFIRMED</div>
          </div>
          
          <table class="details-table">
            <tr>
              <td class="label">Booking ID</td>
              <td class="value">${booking.booking_id || booking.bookingId || 'BK-TEMP'}</td>
            </tr>
            <tr>
              <td class="label">Service</td>
              <td class="value">🛠️ ${serviceName || 'Home Service'}</td>
            </tr>
            <tr>
              <td class="label">Provider</td>
              <td class="value">👤 ${provider.name || 'Specialist'}</td>
            </tr>
            <tr>
              <td class="label">Phone</td>
              <td class="value">📞 ${provider.phone || '0300-0000000'}</td>
            </tr>
            <tr>
              <td class="label">Address / Area</td>
              <td class="value">📍 ${booking.location || 'Karachi'}</td>
            </tr>
            <tr>
              <td class="label">Scheduled Time</td>
              <td class="value">📅 ${booking.scheduledDate || 'As scheduled'} at ${booking.scheduledTime || ''}</td>
            </tr>
            <tr>
              <td class="label">Simulated Log</td>
              <td class="value">🤖 Matched & Verified via AI Orchestrator</td>
            </tr>
          </table>
          
          <div class="total-box">
            <div style="font-size: 12px; color: #555570; font-weight: bold; text-transform: uppercase;">Estimated Cost</div>
            <div class="total-price">${booking.estimatedCost || 'PKR 1,500'}</div>
          </div>
          
          <div class="footer">
            Thank you for choosing KaamConnect AI-a-Service App!<br>
            For support or changes, use the chat agent in-app.
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      addLog('System', 'Invoice PDF compiled successfully', 'expo-print', 'Success');
      await Sharing.shareAsync(uri);
      addLog('System', 'Sharing invoice dialog completed', 'expo-sharing', 'Success');
    } catch (error) {
      console.error('Failed to generate/share PDF:', error);
      addLog('System', 'Invoice PDF generation error', 'expo-print', 'Failed');
    }
  };

  // ── RENDER FUNCTIONS ──────────────────────────
  const renderProviderCard = (provider, idx, isTop, msgId) => {
    const isClicked = clickedMessageIds.includes(msgId);
    const isDisabled = isClicked || stage !== 'providers_shown';
    return (
      <TouchableOpacity
        key={idx}
        style={[s.providerCard, isTop ? s.providerCardTop : null, isDisabled ? { opacity: 0.65 } : null]}
        activeOpacity={isDisabled ? 1 : 0.7}
        onPress={() => {
          if (isDisabled) return;
          setClickedMessageIds(prev => [...prev, msgId]);
          selectProvider(provider);
        }}
        disabled={isDisabled}
      >
        {isTop ? (
          <View style={s.topBadge}><Text style={s.topBadgeText}>🏆 BEST MATCH</Text></View>
        ) : null}
        <View style={s.provHeaderRow}>
          <Text style={s.provIdx}>{String(idx + 1)}</Text>
          <Text style={s.provName}>{getServiceEmoji(provider.service_type || currentServiceType)} {String(provider.name || 'Provider')}</Text>
        </View>
        <View style={s.provRow}>
          <Text style={s.provStat}>⭐ {String(provider.rating || provider.simulated_state?.rating || '4.5')}/5</Text>
          <Text style={s.provStat}>✅ On-Time: {String(Math.round((provider.simulated_state?.on_time_score || provider.on_time_score || 0.9) * 100))}%</Text>
        </View>
        <View style={s.provRow}>
          <Text style={s.provStat}>📍 {String(Number(provider.distance_km || 0).toFixed(1))} km away</Text>
          <Text style={s.provStat}>💰 PKR {String(provider.simulated_state?.price_range_pkr?.min || provider.price_range?.min || '1500')}–{String(provider.simulated_state?.price_range_pkr?.max || provider.price_range?.max || '3000')}</Text>
        </View>
        {(provider.extended_area || provider.surcharge_pkr) ? (
          <View style={s.surchargeBadge}>
            <Text style={s.surchargeText}>🚗 Long Distance Surcharge: +PKR {provider.surcharge_pkr || 150}</Text>
          </View>
        ) : null}
        {isTop ? <Text style={s.provNote}>📝 AI-ranked best option — Score: {String(Number(provider.score || 0).toFixed(2))}</Text> : null}
        <Text style={s.tapHint}>{isDisabled ? 'Selected ✓' : 'Tap to select →'}</Text>
      </TouchableOpacity>
    );
  };

  const renderBookingSummary = (data) => (
    <View style={s.summaryCard}>
      <Text style={s.summaryDivider}>━━━━━━━━━━━━━━━━━━━━</Text>
      <Text style={s.summaryTitle}>📋 BOOKING SUMMARY</Text>
      <Text style={s.summaryDivider}>━━━━━━━━━━━━━━━━━━━━</Text>
      <Text style={s.summaryLine}>{getServiceEmoji(data.booking?.service_type || currentServiceType)} Service: {String(data.booking?.service_type || 'Service').replace(/_/g, ' ')}</Text>
      <Text style={s.summaryLine}>👤 {getServiceLabel(data.booking?.service_type || currentServiceType)}: {String(data.provider?.name || data.booking?.provider_name || 'Provider')}</Text>
      <Text style={s.summaryLine}>📍 Location: {String(data.booking?.location || '—')}</Text>
      <Text style={s.summaryLine}>🕐 Time: {data.booking?.slot
        ? new Date(data.booking.slot).toLocaleString('en-US', {
            timeZone: 'Asia/Karachi',
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        : 'TBD'}</Text>
      <Text style={s.summaryDivider}>━━━━━━━━━━━━━━━━━━━━</Text>
      <Text style={s.summaryHighlight}>💰 ESTIMATED TOTAL: PKR {String(data.booking?.price_estimate?.min || '?')}–{String(data.booking?.price_estimate?.max || '?')}</Text>
      <Text style={s.summaryDivider}>━━━━━━━━━━━━━━━━━━━━</Text>
      {SERVICES_NEEDING_PARTS.includes(data.booking?.service_type || currentServiceType) && (
        <Text style={s.summaryNote}>⚠️ Spare parts ki zimmedari customer ki hogi.</Text>
      )}
    </View>
  );

  const renderMessage = (msg) => {
    if (msg.type === 'user') {
      return (
        <View key={msg.id} style={s.rowUser}>
          <View style={s.bubbleUser}>
            <Text style={s.bubbleUserText}>{msg.text}</Text>
            <Text style={s.timeUser}>{msg.timestamp?.toLocaleTimeString?.([], { hour: '2-digit', minute: '2-digit' }) || ''}</Text>
          </View>
        </View>
      );
    }
    if (msg.type === 'thinking') {
      return (
        <View key={msg.id} style={s.rowBot}>
          <View style={s.avatarWrap}><Text style={s.avatar}>🤖</Text></View>
          <View style={s.bubbleBot}>
            <View style={s.thinkRow}>
              <ActivityIndicator size="small" color={C.primary} />
              <Text style={s.thinkText}> {AGENT_STEPS[currentStep].emoji} {AGENT_STEPS[currentStep].text}</Text>
            </View>
          </View>
        </View>
      );
    }
    if (msg.type === 'providers') {
      const r = msg.data;
      return (
        <View key={msg.id} style={s.rowBot}>
          <View style={s.avatarWrap}><Text style={s.avatar}>🤖</Text></View>
          <View style={s.bubbleBotWide}>
            {(r?.search_expanded || r?.expanded || r?.expandedRadiusUsed) ? (
              <View style={s.expansionBanner}>
                <Text style={s.expansionBannerText}>⚠️ Qareeb koi professional nahi mila, isliye humne search radius barha kar 100km kar diya hai.</Text>
              </View>
            ) : null}
            <Text style={s.provHeader}>Aapke area mein yeh {getServiceLabel(currentServiceType)}s available hain:</Text>
            {r?.top_pick ? renderProviderCard(r.top_pick, 0, true, msg.id) : null}
            {r?.alternatives?.map((alt, i) => renderProviderCard(alt, i + 1, false, msg.id))}
          </View>
        </View>
      );
    }
    if (msg.type === 'services_menu') {
      const { provider, services } = msg.data;
      const isClicked = clickedMessageIds.includes(msg.id);
      const isDisabled = isClicked || stage !== 'services_shown';
      const currentSelection = selectedServicesMap[msg.id] || [];

      return (
        <View key={msg.id} style={s.rowBot}>
          <View style={s.avatarWrap}><Text style={s.avatar}>🤖</Text></View>
          <View style={s.bubbleBotWide}>
            <Text style={s.inlineMenuTitle}>📋 {provider.name} Service Catalog</Text>
            <Text style={s.inlineMenuSub}>Ek ya ek se zyada services select karein:</Text>
            {services.map((svc, idx) => {
              const isSelected = currentSelection.some(s => s.id === svc.id);
              return (
                <TouchableOpacity
                  key={svc.id || idx}
                  style={[
                    s.inlineSvcCard,
                    isSelected ? s.inlineSvcCardSelected : null,
                    isDisabled ? { opacity: 0.7 } : null
                  ]}
                  onPress={() => {
                    if (isDisabled) return;
                    toggleServiceInMessage(msg.id, svc);
                  }}
                  disabled={isDisabled}
                >
                  <View style={s.inlineSvcInfo}>
                    <Text style={s.inlineSvcName}>
                      {isSelected ? '✅ ' : '⚡ '} {svc.name}
                    </Text>
                    <Text style={s.inlineSvcPrice}>PKR {svc.price.toLocaleString()}</Text>
                  </View>
                  <Text style={[s.inlineSelectBtnText, isSelected ? { color: '#00C853', fontWeight: '800' } : null]}>
                    {isSelected ? 'Selected' : 'Select'}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Confirm Multiple Selection Button */}
            {!isDisabled && currentSelection.length > 0 ? (
              <TouchableOpacity
                style={s.confirmSvcBtn}
                onPress={() => {
                  if (isDisabled) return;
                  setClickedMessageIds(prev => [...prev, msg.id]);
                  
                  // Combine selected services into a single unified service item
                  const combinedName = currentSelection.map(s => s.name).join(' + ');
                  const combinedPrice = currentSelection.reduce((sum, s) => sum + s.price, 0);
                  const combinedService = {
                    id: 'combined_' + currentSelection.map(s => s.id).join('_'),
                    name: combinedName,
                    price: combinedPrice,
                    isCombined: true,
                    servicesList: currentSelection
                  };
                  
                  selectService(combinedService);
                }}
              >
                <Text style={s.confirmSvcBtnText}>
                  Confirm {currentSelection.length} {currentSelection.length === 1 ? 'Service' : 'Services'} (PKR {currentSelection.reduce((sum, s) => sum + s.price, 0).toLocaleString()})
                </Text>
              </TouchableOpacity>
            ) : null}
            
            {/* Fallback Option */}
            <TouchableOpacity
              style={[s.notSureCard, isDisabled ? { opacity: 0.6 } : null]}
              onPress={() => {
                if (isDisabled) return;
                setClickedMessageIds(prev => [...prev, msg.id]);
                handleNotSure(provider, pendingData?.intent);
              }}
              disabled={isDisabled}
            >
              <Text style={s.notSureEmoji}>🤔</Text>
              <View style={s.notSureText}>
                <Text style={s.notSureTitle}>Nahi pta kia chahye koi baat nh</Text>
                <Text style={s.notSureSub}>provider apky pss akr chk krlega</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    if (msg.type === 'service_suggestion') {
      const { service, provider } = msg.data;
      const isClicked = clickedMessageIds.includes(msg.id);
      const isDisabled = isClicked || stage !== 'services_shown';
      return (
        <View key={msg.id} style={s.rowBot}>
          <View style={s.avatarWrap}><Text style={s.avatar}>🤖</Text></View>
          <View style={s.bubbleBotWide}>
            <Text style={s.inlineMenuTitle}>💡 Recommended Service</Text>
            <TouchableOpacity
              style={[s.inlineSvcCard, isDisabled ? { opacity: 0.65 } : null]}
              onPress={() => {
                if (isDisabled) return;
                setClickedMessageIds(prev => [...prev, msg.id]);
                setSelectedProvider(provider);
                selectService(service);
              }}
              disabled={isDisabled}
            >
              <View style={s.inlineSvcInfo}>
                <Text style={s.inlineSvcName}>⚡ {service?.name || 'Suggested Service'}</Text>
                <Text style={s.inlineSvcPrice}>PKR {(service?.price || 1500).toLocaleString()}</Text>
              </View>
              <Text style={s.inlineSelectBtnText}>{isDisabled ? 'Booked' : 'Book Now'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    if (msg.type === 'time_slots') {
      const slots = msg.data;
      const isClicked = clickedMessageIds.includes(msg.id);
      const isDisabled = isClicked || stage !== 'awaiting_time';
      return (
        <View key={msg.id} style={s.rowBot}>
          <View style={s.avatarWrap}><Text style={s.avatar}>🤖</Text></View>
          <View style={s.bubbleBotWide}>
            <Text style={s.inlineMenuTitle}>⏰ Date & Time Preference</Text>
            <Text style={s.inlineMenuSub}>Apna preferred arrival slot choose karein:</Text>
            <View style={s.slotGrid}>
              {slots.map((slot, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[s.slotItem, isDisabled ? { opacity: 0.65 } : null]}
                  onPress={() => {
                    if (isDisabled) return;
                    setClickedMessageIds(prev => [...prev, msg.id]);
                    selectTimeSlot(slot);
                  }}
                  disabled={isDisabled}
                >
                  <Text style={s.slotText}>{slot.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      );
    }
    if (msg.type === 'booking_confirmed') {
      const { booking, provider, serviceName } = msg.data;
      return (
        <View key={msg.id} style={s.rowBot}>
          <View style={s.avatarWrap}><Text style={s.avatar}>🤖</Text></View>
          <View style={s.bubbleBotWide}>
            <View style={s.receiptCard}>
              <View style={s.receiptHeader}>
                <Text style={s.receiptTitle}>🎉 BOOKING CONFIRMED</Text>
                <Text style={s.receiptId}>ID: {booking.booking_id}</Text>
              </View>
              
              <View style={s.receiptRow}>
                <Text style={s.receiptLabel}>Service:</Text>
                <Text style={s.receiptVal}>🛠️ {serviceName}</Text>
              </View>
              <View style={s.receiptRow}>
                <Text style={s.receiptLabel}>Professional:</Text>
                <Text style={s.receiptVal}>👤 {booking.provider}</Text>
              </View>
              <View style={s.receiptRow}>
                <Text style={s.receiptLabel}>Address:</Text>
                <Text style={s.receiptVal} numberOfLines={2}>📍 {booking.location}</Text>
              </View>
              <View style={s.receiptRow}>
                <Text style={s.receiptLabel}>Scheduled:</Text>
                <Text style={s.receiptVal}>📅 {booking.scheduledDate} ({booking.scheduledTime})</Text>
              </View>
              <View style={s.receiptRow}>
                <Text style={s.receiptLabel}>Cost Est:</Text>
                <Text style={s.receiptValHighlight}>{booking.estimatedCost}</Text>
              </View>
 
              <TouchableOpacity
                style={s.pdfButton}
                activeOpacity={0.8}
                onPress={() => downloadReceiptPDF(booking, provider, serviceName)}
              >
                <Text style={s.pdfButtonText}>🧾 Share PDF Invoice Receipt</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }
    if (msg.type === 'follow_up_interaction') {
      const { booking } = msg.data;
      const isClicked = clickedMessageIds.includes(msg.id);
      const isDisabled = isClicked;
      return (
        <View key={msg.id} style={s.rowBot}>
          <View style={s.avatarWrap}><Text style={s.avatar}>🤖</Text></View>
          <View style={s.bubbleBotWide}>
            <Text style={s.inlineMenuTitle}>💡 Confirm Job Status</Text>
            <View style={s.followUpRow}>
              <TouchableOpacity
                style={[s.followUpBtn, { backgroundColor: '#00C853' }, isDisabled ? { opacity: 0.65 } : null]}
                onPress={() => {
                  if (isDisabled) return;
                  setClickedMessageIds(prev => [...prev, msg.id]);
                  handleJobDone(currentBookingId || booking?.booking_id, msg.id);
                }}
                disabled={isDisabled}
              >
                <Text style={s.followUpBtnText}>Yes, Job is Done ✅</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.followUpBtn, { backgroundColor: '#FF3D00' }, isDisabled ? { opacity: 0.65 } : null]}
                onPress={() => {
                  if (isDisabled) return;
                  setClickedMessageIds(prev => [...prev, msg.id]);
                  handleIssueRaised(currentBookingId || booking?.booking_id, msg.id);
                }}
                disabled={isDisabled}
              >
                <Text style={s.followUpBtnText}>No, Issue Raised ⚠️</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }
    if (msg.type === 'rating_prompt') {
      const { bookingId, providerName } = msg.data;
      const selectedStars = ratingsMap[msg.id] || 0;
      const isRated = selectedStars > 0;
      
      return (
        <View key={msg.id} style={s.rowBot}>
          <View style={s.avatarWrap}><Text style={s.avatar}>🤖</Text></View>
          <View style={s.bubbleBotWide}>
            <Text style={s.inlineMenuTitle}>⭐ Feedback & Rating</Text>
            {isRated ? (
              <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#00C853', marginBottom: 4 }}>
                  Feedback Submitted!
                </Text>
                <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name="star"
                      size={24}
                      color="#FFD700"
                    />
                  ))}
                </View>
                <Text style={{ fontSize: 12, color: C.textSec, textAlign: 'center' }}>
                  Aapne {providerName} ko {selectedStars} stars diye hain. Shukriya!
                </Text>
              </View>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Text style={{ fontSize: 13, color: '#1A1A2E', marginBottom: 8, fontWeight: '600' }}>
                  Aapka {providerName} ke sath experience kaisa raha?
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={async () => {
                        setRatingsMap(prev => ({ ...prev, [msg.id]: star }));
                        try {
                          addLog('AutomationAgent', `Submitting rating of ${star} stars for booking: ${bookingId}`, 'API_Call', 'In-Progress');
                          const response = await fetch(`${BASE_URL}/api/bookings/${bookingId}/complete`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ rating: star })
                          });
                          const resData = await response.json();
                          if (resData.success) {
                            addLog('AutomationAgent', `Rating of ${star} stars saved successfully!`, 'FirestoreWrite', 'Completed');
                          }
                        } catch (err) {
                          console.error('Failed to submit rating:', err);
                        }
                      }}
                    >
                      <Ionicons
                        name="star-outline"
                        size={32}
                        color="#FFD700"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={{ fontSize: 11, color: C.textMuted }}>
                  Tap stars to rate & complete
                </Text>
              </View>
            )}
          </View>
        </View>
      );
    }
    if (msg.type === 'address_confirm') {
      const { savedAddress, originalRequest } = msg.data;
      const isClicked = clickedMessageIds.includes(msg.id);
      const isDisabled = isClicked || stage !== 'awaiting_address_confirm';
      return (
        <View key={msg.id} style={s.rowBot}>
          <View style={s.avatarWrap}><Text style={s.avatar}>🤖</Text></View>
          <View style={s.bubbleBotWide}>
            <View style={s.addressConfirmCard}>
              <TouchableOpacity
                style={[s.addrConfirmYes, isDisabled ? { opacity: 0.65 } : null]}
                onPress={() => {
                  if (isDisabled) return;
                  setClickedMessageIds(prev => [...prev, msg.id]);
                  handleAddressConfirmed(savedAddress, originalRequest);
                }}
                disabled={isDisabled}
              >
                <Text style={s.addrConfirmBtnText}>Haan, isi address par ✅</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.addrConfirmNo, isDisabled ? { opacity: 0.65 } : null]}
                onPress={() => {
                  if (isDisabled) return;
                  setClickedMessageIds(prev => [...prev, msg.id]);
                  handleAddressChange(originalRequest);
                }}
                disabled={isDisabled}
              >
                <Text style={s.addrConfirmBtnText}>Nahi, address badlein 📍</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }
    if (msg.type === 'address_change_prompt') {
      const { originalRequest } = msg.data;
      return (
        <View key={msg.id} style={s.rowBot}>
          <View style={s.avatarWrap}><Text style={s.avatar}>🤖</Text></View>
          <View style={s.bubbleBotWide}>
            <TouchableOpacity
              style={s.changeAddressBtn}
              onPress={() => {
                navigation.navigate('ManualBooking', {
                  screen: 'AddressScreen',
                  params: { returnToChat: true, pendingRequest: originalRequest }
                });
              }}
            >
              <Text style={s.changeAddressBtnText}>⚙️ Go to Address Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    if (msg.type === 'booking') {
      return (
        <View key={msg.id} style={s.rowBot}>
          <View style={s.avatarWrap}><Text style={s.avatar}>🤖</Text></View>
          <View style={s.bubbleBotWide}>{renderBookingSummary(msg.data)}</View>
        </View>
      );
    }
    if (msg.type === 'error') {
      return (
        <View key={msg.id} style={s.rowBot}>
          <View style={s.avatarWrap}><Text style={s.avatar}>⚠️</Text></View>
          <View style={[s.bubbleBot, s.bubbleError]}>
            <Text style={s.errorText}>{msg.text}</Text>
          </View>
        </View>
      );
    }
    return (
      <View key={msg.id} style={s.rowBot}>
        <View style={s.avatarWrap}><Text style={s.avatar}>🤖</Text></View>
        <View style={s.bubbleBot}>
          <Text style={s.bubbleBotText}>{msg.text}</Text>
          <Text style={s.timeBot}>{msg.timestamp?.toLocaleTimeString?.([], { hour: '2-digit', minute: '2-digit' }) || ''}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F6FA' }} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      
      {/* History Sidebar Panel Overlay */}
      {historyVisible && (
        <View style={s.historySidebarOverlay}>
          <TouchableOpacity style={s.historySidebarBackdrop} activeOpacity={1} onPress={() => setHistoryVisible(false)} />
          <View style={s.historySidebar}>
            <View style={s.historyHeader}>
              <Text style={s.historyTitle}>Chat History 📚</Text>
              <TouchableOpacity onPress={() => setHistoryVisible(false)}>
                <Ionicons name="close" size={24} color={C.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={s.sidebarNewChatBtn} onPress={() => { startNewChat(); setHistoryVisible(false); }}>
              <Ionicons name="add" size={18} color="#FFF" />
              <Text style={s.sidebarNewChatText}>Naya Chat Shuru Karein</Text>
            </TouchableOpacity>

            <ScrollView style={s.historyList} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {sessions.map((session) => {
                const isActive = session.id === currentSessionId;
                return (
                  <View key={session.id} style={[s.historyItemWrap, isActive ? s.historyItemActive : null]}>
                    <TouchableOpacity style={s.historyItemClickable} onPress={() => selectSession(session)}>
                      <Ionicons name="chatbubble-ellipses-outline" size={16} color={isActive ? C.primary : C.textSec} style={{ marginRight: 8 }} />
                      <Text style={[s.historyItemText, isActive ? s.historyItemTextActive : null]} numberOfLines={1}>
                        {session.title || 'Naya Chat'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.historyDeleteBtn} onPress={() => deleteSession(session.id)}>
                      <Ionicons name="trash-outline" size={16} color="#FF3D00" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Header — stays fixed at top */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity style={{ marginRight: 10, padding: 4 }} onPress={() => setHistoryVisible(true)}>
            <Ionicons name="menu-outline" size={26} color={C.text} />
          </TouchableOpacity>
          <View style={s.logoDot} />
          <View>
            <View style={s.logoRow}>
              <Text style={s.logoText}>Kaam</Text>
              <Text style={s.logoAccent}>Connect</Text>
              <View style={s.aiBadge}><Text style={s.aiBadgeText}>AI</Text></View>
            </View>
            <Text style={s.headerSub}>Aapka Khidmatgar</Text>
          </View>
        </View>
        <View style={s.headerRight}>
          {locationStatus === 'granted' ? (
            <View style={s.locBadge}>
              <View style={s.locDotGreen} />
              <Text style={s.locText}>GPS On</Text>
            </View>
          ) : locationStatus === 'denied' ? (
            <TouchableOpacity style={s.locBadgeDenied} onPress={requestLocation}>
              <Ionicons name="location-outline" size={12} color={C.warning} />
              <Text style={s.locTextDenied}> Enable GPS</Text>
            </TouchableOpacity>
          ) : null}
          
          <TouchableOpacity style={s.newChatBtn} onPress={startNewChat}>
            <Ionicons name="add" size={16} color={C.primary} />
            <Text style={s.traceBtnText}> New Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.devBtn} onPress={() => navigation.navigate('AgentTrace')}>
            <Text style={s.devBtnText}>🤖 Trace Logs</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* This View fills remaining space and handles keyboard */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Quick prompts — stays fixed below header */}
        {messages.length <= 1 ? (
          <View style={s.quickWrap}>
            <Text style={s.quickLabel}>✨ Jaldi try karein:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.quickScroll}>
              {QUICK.map((p, i) => (
                <TouchableOpacity key={i} style={s.quickChip} onPress={() => sendMessage(p)}>
                  <Text style={s.quickChipText}>{p}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Messages scroll area */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={s.msgContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(renderMessage)}
        </ScrollView>

        {/* Input bar — this moves up with keyboard */}
        <View style={s.inputBar}>
          <TextInput
            style={s.input} value={input} onChangeText={setInput}
            placeholder={stage === 'providers_shown' ? 'Number batain (1, 2, ya 3)...' : 'Apni zaroorat batain...'}
            placeholderTextColor={C.textMuted} multiline maxLength={500}
            onSubmitEditing={() => sendMessage()}
            onFocus={() => {
              setTimeout(() => {
                scrollRef.current?.scrollToEnd({ animated: true });
              }, 300);
            }}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || loading) ? s.sendBtnOff : null]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            <Ionicons name="send" size={18} color={loading ? C.textMuted : '#fff'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── STYLES ──────────────────────────────────────
// ── STYLES ──────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.headerBg, borderBottomWidth: 1, borderBottomColor: '#E4E5EF',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logoDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary, marginRight: 10 },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoText: { fontSize: 20, fontWeight: '800', color: '#1A1A2E' },
  logoAccent: { fontSize: 20, fontWeight: '800', color: C.primary },
  aiBadge: {
    backgroundColor: 'rgba(0,200,83,0.15)', borderWidth: 1, borderColor: C.primary,
    paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5, marginLeft: 6,
  },
  aiBadgeText: { color: C.primary, fontSize: 9, fontWeight: '700' },
  headerSub: { color: C.textSec, fontSize: 11, marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,200,83,0.2)',
  },
  locDotGreen: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary, marginRight: 4 },
  locText: { color: '#00A843', fontSize: 9, fontWeight: '700' },
  locBadgeDenied: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,213,79,0.1)', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,213,79,0.2)',
  },
  locTextDenied: { color: C.warning, fontSize: 9, fontWeight: '600' },
  newChatBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F0FFF4', borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14,
  },
  traceBtnText: { color: C.primary, fontSize: 11, fontWeight: '600' },
  devBtn: {
    backgroundColor: '#F0F8FF', borderWidth: 1, borderColor: '#2196F3',
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12,
  },
  devBtnText: { color: '#2196F3', fontSize: 11, fontWeight: '700' },
  
  mainBodyRow: { flex: 1, flexDirection: 'row' },
  chatContainer: { flex: 2, height: '100%' },
  
  // LOGS DRAWER STYLING
  logsDrawer: {
    flex: 1,
    maxWidth: 320,
    backgroundColor: '#1E1E2F',
    borderLeftWidth: 1.5,
    borderLeftColor: '#2D2D44',
    height: '100%',
    padding: 12,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D44',
    paddingBottom: 8,
    marginBottom: 8,
  },
  drawerTitle: { color: '#00C853', fontSize: 14, fontWeight: '800' },
  logsScroll: { flex: 1 },
  logsContent: { paddingVertical: 4 },
  logItemRow: {
    backgroundColor: '#252538',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#00C853',
  },
  logTimeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  logTimeText: { color: '#8888AA', fontSize: 10, fontFamily: 'Courier' },
  logAgentText: { color: '#80DEEA', fontSize: 10, fontWeight: '700' },
  logActionText: { color: '#FFFFFF', fontSize: 12, lineHeight: 16, marginVertical: 4 },
  logMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  logMetaLabel: { color: '#8888AA', fontSize: 9 },
  logMetaVal: { color: '#FFFFFF', fontWeight: '600' },

  quickWrap: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
  quickLabel: { color: C.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' },
  quickScroll: { flexDirection: 'row' },
  quickChip: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4E5EF',
    borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8,
  },
  quickChipText: { color: '#00A843', fontSize: 12, fontWeight: '600' },
  msgArea: { flex: 1, backgroundColor: '#F5F6FA' },
  msgContent: { paddingHorizontal: 12, paddingVertical: 12, paddingBottom: 8 },
  rowBot: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10, maxWidth: '92%' },
  rowUser: { alignItems: 'flex-end', marginBottom: 10 },
  avatarWrap: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: '#F0F0F8',
    alignItems: 'center', justifyContent: 'center', marginRight: 6, marginBottom: 2,
  },
  avatar: { fontSize: 16 },
  bubbleBot: {
    backgroundColor: C.bubbleBot, borderRadius: 16,
    borderBottomLeftRadius: 4, padding: 12, maxWidth: '85%',
    borderWidth: 1, borderColor: C.border,
  },
  bubbleBotWide: {
    backgroundColor: C.bubbleBot, borderRadius: 16,
    borderBottomLeftRadius: 4, padding: 12, flex: 1,
    borderWidth: 1, borderColor: C.border,
  },
  bubbleUser: {
    backgroundColor: C.bubbleUser, borderRadius: 16,
    borderBottomRightRadius: 4, padding: 12, maxWidth: '80%',
  },
  bubbleError: { borderColor: C.error, backgroundColor: 'rgba(255,82,82,0.08)' },
  bubbleBotText: { color: '#1A1A2E', fontSize: 14, lineHeight: 21 },
  bubbleUserText: { color: '#fff', fontSize: 14, lineHeight: 21 },
  errorText: { color: C.error, fontSize: 13 },
  timeBot: { color: '#AAAABC', fontSize: 9, marginTop: 4, textAlign: 'right' },
  timeUser: { color: 'rgba(255,255,255,0.75)', fontSize: 9, marginTop: 4, textAlign: 'right' },
  thinkRow: { flexDirection: 'row', alignItems: 'center' },
  thinkText: { color: '#555570', fontSize: 13 },
  provHeader: { color: C.textSec, fontSize: 13, marginBottom: 8 },
  providerCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: '#E4E5EF',
  },
  providerCardTop: { borderColor: C.primary, backgroundColor: '#F0FFF4' },
  topBadge: {
    backgroundColor: C.primary, alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginBottom: 6,
  },
  topBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  provHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  provIdx: {
    color: C.primary, fontSize: 14, fontWeight: '800',
    backgroundColor: 'rgba(0,200,83,0.15)', width: 24, height: 24,
    borderRadius: 12, textAlign: 'center', lineHeight: 24, marginRight: 8,
  },
  provName: { color: '#1A1A2E', fontSize: 14, fontWeight: '700', flex: 1 },
  provRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  provStat: { color: '#555570', fontSize: 12 },
  provNote: { color: '#00A843', fontSize: 11, marginTop: 4, fontStyle: 'italic' },
  tapHint: { color: '#9999AA', fontSize: 10, textAlign: 'right', marginTop: 4 },
  summaryCard: { paddingVertical: 4 },
  summaryDivider: { color: '#CCCCDD', fontSize: 11, letterSpacing: 1 },
  summaryTitle: { color: '#1A1A2E', fontSize: 15, fontWeight: '800', textAlign: 'center', marginVertical: 4 },
  summaryLine: { color: '#333344', fontSize: 13, marginVertical: 2, lineHeight: 20 },
  summaryHighlight: { color: '#00A843', fontSize: 14, fontWeight: '800', textAlign: 'center', marginVertical: 4 },
  summaryNote: { color: C.warning, fontSize: 11, marginTop: 4, fontStyle: 'italic' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 10, paddingVertical: 8,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E4E5EF',
  },
  input: {
    flex: 1, backgroundColor: '#F8F9FC', borderWidth: 1, borderColor: '#E4E5EF',
    borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10,
    color: '#1A1A2E', fontSize: 14, maxHeight: 100, marginRight: 8,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: '#00C853',
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnOff: { backgroundColor: '#F8F9FC' },

  // INLINE SERVICE SELECTOR MENU
  inlineMenuTitle: { color: '#1A1A2E', fontSize: 15, fontWeight: '800', marginBottom: 4 },
  inlineMenuSub: { color: C.textSec, fontSize: 12, marginBottom: 12 },
  inlineSvcCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E5EF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  inlineSvcInfo: { flex: 1, marginRight: 8 },
  inlineSvcName: { color: '#1A1A2E', fontSize: 13, fontWeight: '700' },
  inlineSvcPrice: { color: '#00C853', fontSize: 12, fontWeight: '800', marginTop: 2 },
  inlineSelectBtnText: { color: C.primary, fontWeight: '700', fontSize: 12 },

  // INLINE TIME SLOTS SELECTOR
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  slotItem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E5EF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: '47%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotText: { color: '#1A1A2E', fontSize: 11, fontWeight: '600', textAlign: 'center' },

  // VERIFIED PREMIUM DIGITAL RECEIPT
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#00C853',
    padding: 12,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#F0F0F8',
    paddingBottom: 8,
    marginBottom: 10,
  },
  receiptTitle: { color: '#00C853', fontSize: 13, fontWeight: '800' },
  receiptId: { color: '#8888AA', fontSize: 10, fontFamily: 'Courier' },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  receiptLabel: { color: '#555570', fontSize: 12, fontWeight: '600', width: '35%' },
  receiptVal: { color: '#1A1A2E', fontSize: 12, fontWeight: '600', flex: 1, textAlign: 'right' },
  receiptValHighlight: { color: '#00C853', fontSize: 13, fontWeight: '800', flex: 1, textAlign: 'right' },
  pdfButton: {
    backgroundColor: '#00C853',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  pdfButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },

  // AUTOMATED FOLLOW UP TIMERS VIEW
  followUpRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 8 },
  followUpBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followUpBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },

  notSureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF4',
    borderWidth: 1,
    borderColor: '#A3E635',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  notSureEmoji: { fontSize: 20, marginRight: 10 },
  notSureText: { flex: 1 },
  notSureTitle: { color: '#1A1A2E', fontSize: 13, fontWeight: '700' },
  notSureSub: { color: '#555570', fontSize: 11, marginTop: 1 },

  addressConfirmCard: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 8 },
  addrConfirmYes: { flex: 1, backgroundColor: '#00C853', paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  addrConfirmNo: { flex: 1, backgroundColor: '#FF9500', paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  addrConfirmBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  changeAddressBtn: { backgroundColor: '#00C853', paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  changeAddressBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },

  surchargeBadge: {
    backgroundColor: '#FFF2E6',
    borderWidth: 1,
    borderColor: '#FF9500',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  surchargeText: {
    color: '#D46B08',
    fontSize: 11,
    fontWeight: '800',
  },
  expansionBanner: {
    backgroundColor: '#FFF9E6',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  expansionBannerText: {
    color: '#B36B00',
    fontSize: 12,
    fontWeight: '700',
  },
  // PREMIUM MULTI-SELECT CATALOG STYLES
  inlineSvcCardSelected: {
    borderColor: '#00C853',
    backgroundColor: '#F0FFF4',
    borderWidth: 2,
  },
  confirmSvcBtn: {
    backgroundColor: '#00C853',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 8,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmSvcBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },

  // SLIDING CHAT HISTORY DRAWER/SIDEBAR STYLES
  historySidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    flexDirection: 'row',
  },
  historySidebarBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  historySidebar: {
    width: 280,
    height: '100%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E5EF',
    paddingBottom: 12,
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  sidebarNewChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00C853',
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  sidebarNewChatText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    marginLeft: 6,
  },
  historyList: {
    flex: 1,
  },
  historyItemWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E4E5EF',
  },
  historyItemActive: {
    borderColor: '#00C853',
    backgroundColor: '#F0FFF4',
  },
  historyItemClickable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyItemText: {
    fontSize: 13,
    color: '#555570',
    fontWeight: '500',
  },
  historyItemTextActive: {
    color: '#00A843',
    fontWeight: '700',
  },
  historyDeleteBtn: {
    padding: 4,
    marginLeft: 6,
  },
});
