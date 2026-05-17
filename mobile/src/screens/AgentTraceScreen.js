import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, TouchableOpacity, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getTraces } from '../config/api';
import api from '../config/api';

const C = {
  bg: '#0B1015', surface: '#141C24', card: '#1B2530',
  primary: '#00C853', text: '#E8ECF0', textSec: '#8B9BAA',
  textMuted: '#5F7082', border: '#1E2D3A', headerBg: '#111920',
  blue: '#4DA3FF', googleBlue: '#4285F4', googleBg: 'rgba(66,133,244,0.08)',
};

export default function AgentTraceScreen({ navigation }) {
  const [traces, setTraces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [platformInfo, setPlatformInfo] = useState(null);

  const fetchData = async () => {
    try {
      const data = await getTraces();
      setTraces(data.traces || []);
    } catch (err) {
      console.error('Fetch traces error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Fetch Antigravity platform info
    api.get('/api/antigravity-info')
      .then(res => setPlatformInfo(res.data))
      .catch(err => console.error('Platform info error:', err.message));
  }, []);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) {
    return (
      <View style={s.loadWrap}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={s.loadText}>Loading agent traces...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={C.text} />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>🤖 Agent Trace Viewer</Text>
          <Text style={s.headerSub}>Multi-agent reasoning log</Text>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
        }>

        {/* ── Antigravity Platform Card ── */}
        {platformInfo ? (
          <View style={s.platformCard}>
            <View style={s.platformHeader}>
              <Text style={s.platformIcon}>⚡</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.platformTitle}>Google Antigravity</Text>
                <Text style={s.platformVersion}>{platformInfo.version} • {platformInfo.orchestration}</Text>
              </View>
              <View style={s.liveIndicator}>
                <View style={s.liveDot} />
                <Text style={s.liveText}>LIVE</Text>
              </View>
            </View>

            <Text style={s.sectionLabel}>ORCHESTRATED AGENTS</Text>
            <View style={s.agentsGrid}>
              {platformInfo.agents_active?.map((agent, i) => (
                <View key={i} style={s.agentChip}>
                  <View style={s.agentDot} />
                  <Text style={s.agentName}>{agent.name}</Text>
                </View>
              ))}
            </View>

            <Text style={s.sectionLabel}>GOOGLE TOOLS INTEGRATED</Text>
            <View style={s.toolsRow}>
              {platformInfo.google_tools_used?.map((tool, i) => (
                <View key={i} style={s.toolBadge}>
                  <Text style={s.toolText}>{tool}</Text>
                </View>
              ))}
            </View>

            <Text style={s.sectionLabel}>MCP SERVERS</Text>
            <View style={s.toolsRow}>
              {platformInfo.mcp_servers_connected?.map((mcp, i) => (
                <View key={i} style={s.mcpBadge}>
                  <Ionicons name="server-outline" size={10} color={C.primary} />
                  <Text style={s.mcpText}> {mcp}</Text>
                </View>
              ))}
            </View>

            <View style={s.roleBox}>
              <Ionicons name="information-circle-outline" size={14} color={C.googleBlue} />
              <Text style={s.roleText}> {platformInfo.antigravity_role}</Text>
            </View>
          </View>
        ) : null}

        {/* ── Trace Cards ── */}
        <Text style={s.tracesSectionTitle}>EXECUTION TRACES</Text>
        {traces.map((trace) => (
          <View key={String(trace.id || trace.trace_id)} style={s.traceCard}>
            <View style={s.traceHeader}>
              <Text style={s.traceId}>{String(trace.trace_id || trace.id)}</Text>
              <Text style={[s.traceStatus, { color: trace.final_status === 'booking_confirmed' ? C.primary : C.textMuted }]}>
                {String(trace.final_status || 'processing')}
              </Text>
            </View>
            <Text style={s.traceInput}>"{String(trace.user_input || '')}"</Text>
            <Text style={s.traceDuration}>⏱ {String(trace.total_duration_ms || '?')}ms</Text>
            {trace.steps_completed ? (
              <View style={s.stepsRow}>
                {trace.steps_completed.map((step, i) => (
                  <View key={i} style={s.stepBadge}>
                    <Text style={s.stepText}>{String(step)}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ))}
        {traces.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="analytics-outline" size={48} color={C.textMuted} />
            <Text style={s.emptyText}>No traces yet — make a booking to see agent reasoning</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  loadText: { color: C.textSec, marginTop: 10 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: C.headerBg, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitle: { color: C.blue, fontSize: 16, fontWeight: '700' },
  headerSub: { color: C.textMuted, fontSize: 11, marginTop: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 12, paddingBottom: 30 },

  // ── Antigravity Platform Card ──
  platformCard: {
    backgroundColor: C.googleBg,
    borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1.5, borderColor: 'rgba(66,133,244,0.3)',
  },
  platformHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 14,
  },
  platformIcon: { fontSize: 28, marginRight: 10 },
  platformTitle: {
    color: C.googleBlue, fontSize: 18, fontWeight: '800', letterSpacing: 0.3,
  },
  platformVersion: { color: C.textSec, fontSize: 11, marginTop: 2 },
  liveIndicator: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,200,83,0.15)', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,200,83,0.3)',
  },
  liveDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary, marginRight: 4,
  },
  liveText: { color: C.primary, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  sectionLabel: {
    color: C.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1.2,
    marginTop: 10, marginBottom: 6,
  },
  agentsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  agentChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(66,133,244,0.12)', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(66,133,244,0.2)',
  },
  agentDot: {
    width: 5, height: 5, borderRadius: 3, backgroundColor: C.primary, marginRight: 5,
  },
  agentName: { color: C.googleBlue, fontSize: 10, fontWeight: '600' },
  toolsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  toolBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1, borderColor: C.border,
  },
  toolText: { color: C.textSec, fontSize: 9, fontWeight: '600' },
  mcpBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,200,83,0.08)', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,200,83,0.15)',
  },
  mcpText: { color: C.primary, fontSize: 9, fontWeight: '600' },
  roleBox: {
    flexDirection: 'row', alignItems: 'flex-start', marginTop: 12,
    backgroundColor: 'rgba(66,133,244,0.06)', padding: 10, borderRadius: 10,
  },
  roleText: {
    color: C.textSec, fontSize: 10, lineHeight: 15, flex: 1,
  },

  // ── Trace Cards ──
  tracesSectionTitle: {
    color: C.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.2,
    marginBottom: 8,
  },
  traceCard: {
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: C.border,
  },
  traceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  traceId: { color: C.blue, fontSize: 10, fontFamily: 'monospace' },
  traceStatus: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  traceInput: { color: C.text, fontSize: 13, marginBottom: 6, fontStyle: 'italic' },
  traceDuration: { color: C.textMuted, fontSize: 11, marginBottom: 8 },
  stepsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  stepBadge: {
    backgroundColor: 'rgba(0,200,83,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  stepText: { color: C.primary, fontSize: 10, fontWeight: '600' },
  empty: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { color: C.textMuted, fontSize: 13, marginTop: 12, textAlign: 'center', maxWidth: 240 },
});
