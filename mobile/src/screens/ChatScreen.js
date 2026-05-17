import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { discoverProviders, bookProvider } from '../config/api';

const C = {
  bg: '#0B1015', surface: '#141C24', card: '#1B2530',
  bubbleBot: '#1B2530', bubbleUser: '#005C43',
  primary: '#00C853', accent: '#25D366',
  text: '#E8ECF0', textSec: '#8B9BAA', textMuted: '#5F7082',
  border: '#1E2D3A', headerBg: '#111920',
  error: '#FF5252', warning: '#FFD54F', star: '#FFB300',
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

export default function ChatScreen({ navigation }) {
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  // Staged conversation state
  const [stage, setStage] = useState('idle'); // idle | providers_shown | confirmed
  const [pendingData, setPendingData] = useState(null); // { intent, ranking, trace_id }
  // GPS location state
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('unknown'); // 'unknown' | 'granted' | 'denied'
  const [currentStep, setCurrentStep] = useState(0);
  const [currentServiceType, setCurrentServiceType] = useState('');
  const scrollRef = useRef();

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

  // ── SEND MESSAGE ──────────────────────────────
  const sendMessage = async (overrideText) => {
    const text = (overrideText || input).trim();
    if (!text || loading) return;

    add({ id: uid(), type: 'user', text, timestamp: ts() });
    setInput('');
    setLoading(true);
    const cleanup = showStepByStep();
    const thinkId = uid();
    add({ id: thinkId, type: 'thinking', text: '', timestamp: ts() });

    try {
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
            await handleBooking(chosen);
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
      // Warn if no GPS and no location in message
      if (locationStatus === 'denied' && !hasLocationInMessage(text)) {
        add({
          id: uid(), type: 'bot', timestamp: ts(),
          text: '📍 Location access denied. Apne message mein area zaroor likhein (e.g. "DHA Karachi mein") taake behtar results mil sakein.',
        });
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

  // ── DISCOVER PROVIDERS (reusable) ─────────────
  const handleNewServiceRequest = async (text, thinkId) => {
    const result = await discoverProviders(text, userLocation);
    drop(thinkId);

    if (result.status === 'needs_clarification') {
      add({
        id: uid(), type: 'bot', timestamp: ts(),
        text: result.clarification || 'Aap kaunsi cheez theek karwana chahte hain — AC, geyser, wiring, ya kuch aur?',
      });
    } else if (result.status === 'no_providers') {
      const svcType = result.intent?.service_type || '';
      add({
        id: uid(), type: 'bot', timestamp: ts(),
        text: `Is waqt ${result.intent?.location || 'aapke area'} mein koi ${getServiceLabel(svcType)} available nahi. Kya aap timing flexible rakh sakte hain? ⏰`,
      });
    } else if (result.status === 'providers_found') {
      const svcType = result.intent?.service_type || '';
      setCurrentServiceType(svcType);
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
      setPendingData({ intent: result.intent, ranking: result.ranking, trace_id: result.trace_id });
    }
  };

  // ── BOOK A CHOSEN PROVIDER ────────────────────
  const handleBooking = async (provider) => {
    add({
      id: uid(), type: 'bot', timestamp: ts(),
      text: `✅ Aapne ${provider.name} ko select kiya!\n\nBooking confirm ho rahi hai...`,
    });
    setLoading(true);
    try {
      const result = await bookProvider(provider, pendingData.intent, pendingData.trace_id);
      console.log('[BookResult] slot:', result.booking?.slot);
      console.log('[BookResult] full booking:', JSON.stringify(result.booking));
      if (result.status === 'booking_confirmed') {
        // Show booking summary
        add({
          id: uid(), type: 'booking', timestamp: ts(), data: {
            booking: result.booking, provider, follow_up: result.follow_up,
          }
        });
        // Show confirmation
        add({
          id: uid(), type: 'bot', timestamp: ts(),
          text: `✅ Booking Confirmed! 🎉\nBooking ID: ${result.booking?.booking_id}\n${provider.name} ko notify kar diya gaya hai.\n\nAapko 1 ghante pehle reminder milega.\n🔔 Active Requests tab mein apni booking dekhein.`,
        });

        // Automated post-booking follow-up message
        const serviceType = result.booking?.service_type || pendingData?.intent?.service_type || '';
        const slotDate = result.booking?.slot ? new Date(result.booking.slot) : new Date();
        const arrivalDisplay = slotDate.toLocaleString('en-US', {
          timeZone: 'Asia/Karachi',
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });

        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'bot',
            text: '🔔 Reminder set for 1 hour before your appointment.\n\n' +
              '📋 Booking ID: ' + (result.booking?.booking_id || 'BK-XXX') + '\n' +
              `⏰ Your ${getServiceLabel(serviceType)} will arrive on ${arrivalDisplay}.\n\n` +
              'Track your booking in the Requests tab.',
            timestamp: new Date()
          }]);
        }, 1000);

        setStage('confirmed');
        setPendingData(null);
      }
    } catch (err) {
      add({
        id: uid(), type: 'error', timestamp: ts(),
        text: 'Booking mein masla aaya — dobara try karein.',
      });
    } finally { setLoading(false); }
  };

  // ── QUICK SELECT PROVIDER (tap on card) ───────
  const selectProvider = (provider) => {
    if (stage !== 'providers_shown' || loading) return;
    add({ id: uid(), type: 'user', text: `${provider.name} select kiya`, timestamp: ts() });
    handleBooking(provider);
  };

  // ── RENDER FUNCTIONS ──────────────────────────
  const renderProviderCard = (provider, idx, isTop) => (
    <TouchableOpacity
      key={idx}
      style={[s.providerCard, isTop ? s.providerCardTop : null]}
      activeOpacity={0.7}
      onPress={() => selectProvider(provider)}
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
      {isTop ? <Text style={s.provNote}>📝 AI-ranked best option — Score: {String(Number(provider.score || 0).toFixed(2))}</Text> : null}
      <Text style={s.tapHint}>Tap to select →</Text>
    </TouchableOpacity>
  );

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
            <Text style={s.provHeader}>Aapke area mein yeh {getServiceLabel(currentServiceType)}s available hain:</Text>
            {r?.top_pick ? renderProviderCard(r.top_pick, 0, true) : null}
            {r?.alternatives?.map((alt, i) => renderProviderCard(alt, i + 1, false))}
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
    <SafeAreaView style={s.container} edges={['top']}>
      {/* HEADER */}
      <View style={s.header}>
        <View style={s.headerLeft}>
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
          {(stage === 'providers_shown' || stage === 'confirmed') ? (
            <TouchableOpacity style={s.newChatBtn} onPress={stage === 'confirmed' ? () => {
              setMessages([GREETING]);
              setStage('idle');
              setPendingData(null);
            } : resetConversation}>
              <Ionicons name="add-circle-outline" size={16} color={C.primary} />
              <Text style={s.traceBtnText}>{stage === 'confirmed' ? ' New Chat' : ' New Request'}</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={s.devBtn} onPress={() => navigation.navigate('AgentTrace')}>
            <Text style={s.devBtnText}>🤖 Dev</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* QUICK PROMPTS */}
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

      {/* MESSAGES */}
      <ScrollView
        ref={scrollRef} style={s.msgArea} contentContainerStyle={s.msgContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map(renderMessage)}
      </ScrollView>

      {/* INPUT */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.inputBar}>
          <TextInput
            style={s.input} value={input} onChangeText={setInput}
            placeholder={stage === 'providers_shown' ? 'Number batain (1, 2, ya 3)...' : 'Apni zaroorat batain...'}
            placeholderTextColor={C.textMuted} multiline maxLength={500}
            onSubmitEditing={() => sendMessage()}
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
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.headerBg, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logoDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary, marginRight: 10 },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoText: { fontSize: 20, fontWeight: '800', color: '#fff' },
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
    backgroundColor: 'rgba(0,200,83,0.1)', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,200,83,0.2)',
  },
  locDotGreen: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary, marginRight: 4 },
  locText: { color: C.primary, fontSize: 9, fontWeight: '700' },
  locBadgeDenied: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,213,79,0.1)', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,213,79,0.2)',
  },
  locTextDenied: { color: C.warning, fontSize: 9, fontWeight: '600' },
  newChatBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,200,83,0.1)', borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14,
  },
  traceBtnText: { color: C.primary, fontSize: 11, fontWeight: '600' },
  devBtn: {
    backgroundColor: '#1E2D3A', borderWidth: 1, borderColor: '#4DA3FF',
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12,
  },
  devBtnText: { color: '#4DA3FF', fontSize: 11, fontWeight: '700' },
  quickWrap: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
  quickLabel: { color: C.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' },
  quickScroll: { flexDirection: 'row' },
  quickChip: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8,
  },
  quickChipText: { color: C.accent, fontSize: 12, fontWeight: '600' },
  msgArea: { flex: 1 },
  msgContent: { paddingHorizontal: 12, paddingVertical: 12, paddingBottom: 8 },
  rowBot: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10, maxWidth: '92%' },
  rowUser: { alignItems: 'flex-end', marginBottom: 10 },
  avatarWrap: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: C.surface,
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
  bubbleBotText: { color: C.text, fontSize: 14, lineHeight: 21 },
  bubbleUserText: { color: '#fff', fontSize: 14, lineHeight: 21 },
  errorText: { color: C.error, fontSize: 13 },
  timeBot: { color: C.textMuted, fontSize: 9, marginTop: 4, textAlign: 'right' },
  timeUser: { color: 'rgba(255,255,255,0.5)', fontSize: 9, marginTop: 4, textAlign: 'right' },
  thinkRow: { flexDirection: 'row', alignItems: 'center' },
  thinkText: { color: C.textSec, fontSize: 13 },
  provHeader: { color: C.textSec, fontSize: 13, marginBottom: 8 },
  providerCard: {
    backgroundColor: C.surface, borderRadius: 12, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: C.border,
  },
  providerCardTop: { borderColor: C.primary, backgroundColor: 'rgba(0,200,83,0.05)' },
  topBadge: {
    backgroundColor: C.primary, alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginBottom: 6,
  },
  topBadgeText: { color: '#0B1015', fontSize: 9, fontWeight: '800' },
  provHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  provIdx: {
    color: C.primary, fontSize: 14, fontWeight: '800',
    backgroundColor: 'rgba(0,200,83,0.15)', width: 24, height: 24,
    borderRadius: 12, textAlign: 'center', lineHeight: 24, marginRight: 8,
  },
  provName: { color: '#fff', fontSize: 14, fontWeight: '700', flex: 1 },
  provRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  provStat: { color: C.textSec, fontSize: 12 },
  provNote: { color: C.primary, fontSize: 11, marginTop: 4, fontStyle: 'italic' },
  tapHint: { color: C.textMuted, fontSize: 10, textAlign: 'right', marginTop: 4 },
  summaryCard: { paddingVertical: 4 },
  summaryDivider: { color: C.textMuted, fontSize: 11, letterSpacing: 1 },
  summaryTitle: { color: '#fff', fontSize: 15, fontWeight: '800', textAlign: 'center', marginVertical: 4 },
  summaryLine: { color: C.text, fontSize: 13, marginVertical: 2, lineHeight: 20 },
  summaryHighlight: { color: C.primary, fontSize: 14, fontWeight: '800', textAlign: 'center', marginVertical: 4 },
  summaryNote: { color: C.warning, fontSize: 11, marginTop: 4, fontStyle: 'italic' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 10, paddingVertical: 8,
    backgroundColor: C.headerBg, borderTopWidth: 1, borderTopColor: C.border,
  },
  input: {
    flex: 1, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10,
    color: '#fff', fontSize: 14, maxHeight: 100, marginRight: 8,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnOff: { backgroundColor: C.surface },
});
