import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator,
  RefreshControl, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const BASE_URL_OPTIONS = [
  'http://192.168.1.100:3000',
  'http://10.0.2.2:3000',
  'http://localhost:3000',
];

// Import from api.js
import api from '../config/api';

const AGENT_COLORS = {
  'intent-parser': { bg: '#DBEAFE', border: '#93C5FD', text: '#1D4ED8', dot: '#2563EB' },
  'discovery-agent': { bg: '#DCFCE7', border: '#86EFAC', text: '#166534', dot: '#16A34A' },
  'ranking-agent': { bg: '#FEF9C3', border: '#FDE047', text: '#854D0E', dot: '#CA8A04' },
  'booking-agent': { bg: '#FEE2E2', border: '#FCA5A5', text: '#991B1B', dot: '#DC2626' },
  'follow-up-agent': { bg: '#F3E8FF', border: '#D8B4FE', text: '#6B21A8', dot: '#9333EA' },
};

const TOOL_COLORS = {
  'groq-llm-api': '#7C3AED',
  'google-maps-geocoding-api': '#1D4ED8',
  'google-maps-places-api': '#1D4ED8',
  'firestore': '#EA580C',
  'firestore-write': '#EA580C',
  'firestore-read': '#EA580C',
  'firestore-transaction': '#EA580C',
  'firestore-providers-collection': '#EA580C',
  'firestore-write (bookings collection)': '#EA580C',
  'firestore-write (follow-up record)': '#EA580C',
  'cloud-scheduler': '#0891B2',
  'firebase-cloud-messaging': '#F59E0B',
  'haversine-distance-calculator': '#166534',
  'roman-urdu-normalizer': '#7C3AED',
};

const getToolColor = (tool) => {
  for (const [key, color] of Object.entries(TOOL_COLORS)) {
    if (tool.toLowerCase().includes(key.toLowerCase().split(' ')[0])) {
      return color;
    }
  }
  return '#374151';
};

export default function AgentTraceScreen({ navigation, route }) {
  const [traces, setTraces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTrace, setExpandedTrace] = useState(null);

  const fetchTraces = useCallback(async () => {
    try {
      const response = await api.get('/api/traces?limit=10');
      const data = response.data;
      if (data.success && data.traces) {
        setTraces(data.traces);
        // Auto-expand most recent trace
        if (data.traces.length > 0) {
          setExpandedTrace(data.traces[0].trace_id || data.traces[0].id);
        }
      }
    } catch (error) {
      console.error('[Traces] Fetch error:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchTraces();
    }, [fetchTraces])
  );

  // Also fetch if a specific traceId is passed
  useEffect(() => {
    const traceId = route?.params?.traceId;
    if (traceId) {
      setExpandedTrace(traceId);
      fetchTraces();
    }
  }, [route?.params?.traceId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTraces();
  };

  const renderStepTimeline = (steps) => {
    if (!steps || steps.length === 0) return null;
    
    return (
      <View style={s.timeline}>
        {steps.map((step, index) => {
          const colors = AGENT_COLORS[step.skill] || AGENT_COLORS['intent-parser'];
          const isLast = index === steps.length - 1;
          
          return (
            <View key={index} style={s.timelineItem}>
              {/* Left side: dot + line */}
              <View style={s.timelineLeft}>
                <View style={[s.timelineDot, { backgroundColor: colors.dot }]}>
                  <Text style={s.timelineDotNum}>{step.step}</Text>
                </View>
                {!isLast && <View style={s.timelineLine} />}
              </View>
              
              {/* Right side: content */}
              <View style={[s.stepCard, { 
                backgroundColor: colors.bg,
                borderColor: colors.border,
                marginBottom: isLast ? 0 : 8
              }]}>
                {/* Agent name header */}
                <View style={s.stepHeader}>
                  <Text style={[s.stepAgentName, { color: colors.text }]}>
                    {step.agent || step.skill}
                  </Text>
                  <View style={[s.stepStatusBadge, { backgroundColor: colors.dot }]}>
                    <Text style={s.stepStatusText}>
                      {step.status || 'completed'}
                    </Text>
                  </View>
                </View>
                
                {/* Observation */}
                <View style={s.stepSection}>
                  <Text style={s.stepSectionLabel}>👁 OBSERVED</Text>
                  <Text style={s.stepSectionText}>{step.observation}</Text>
                </View>
                
                {/* Inference */}
                <View style={s.stepSection}>
                  <Text style={[s.stepSectionLabel, { color: '#1D4ED8' }]}>
                    🧠 INFERRED
                  </Text>
                  <Text style={s.stepSectionText}>{step.inference}</Text>
                </View>
                
                {/* Decision */}
                <View style={s.stepSection}>
                  <Text style={[s.stepSectionLabel, { color: '#166534' }]}>
                    🎯 DECIDED
                  </Text>
                  <Text style={s.stepSectionText}>{step.decision}</Text>
                </View>
                
                {/* Action */}
                <View style={s.stepSection}>
                  <Text style={[s.stepSectionLabel, { color: '#854D0E' }]}>
                    ⚡ EXECUTED
                  </Text>
                  <Text style={s.stepSectionText}>{step.action}</Text>
                </View>
                
                {/* Tool calls */}
                {step.tool_calls?.length > 0 && (
                  <View style={s.toolsSection}>
                    <Text style={s.toolsLabel}>🔧 TOOLS USED</Text>
                    <View style={s.toolsRow}>
                      {step.tool_calls.map((tool, i) => (
                        <View key={i} style={[s.toolChip, 
                          { backgroundColor: getToolColor(tool) }]}>
                          <Text style={s.toolChipText}>{tool}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                
                {/* Duration */}
                <Text style={s.stepDuration}>
                  ⏱ {step.duration_ms || 0}ms
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderTrace = (trace) => {
    const isExpanded = expandedTrace === (trace.trace_id || trace.id);
    const hasSteps = trace.steps?.length > 0;
    const stepsCount = trace.steps?.length || 0;
    
    const statusColor = trace.final_status === 'booking_confirmed' 
      ? { bg: '#DCFCE7', text: '#166534' }
      : { bg: '#FEF9C3', text: '#854D0E' };
    
    return (
      <View key={trace.trace_id || trace.id} style={s.traceCard}>
        {/* Trace header — always visible */}
        <TouchableOpacity
          style={s.traceHeader}
          onPress={() => setExpandedTrace(
            isExpanded ? null : (trace.trace_id || trace.id)
          )}
          activeOpacity={0.7}
        >
          <View style={s.traceHeaderLeft}>
            <Text style={s.traceId} numberOfLines={1}>
              {(trace.trace_id || trace.id || '').substring(0, 20)}...
            </Text>
            <Text style={s.traceInput} numberOfLines={1}>
              "{trace.user_input || 'Service request'}"
            </Text>
            <View style={s.traceMetaRow}>
              <View style={[s.statusBadge, 
                { backgroundColor: statusColor.bg }]}>
                <Text style={[s.statusText, 
                  { color: statusColor.text }]}>
                  {trace.final_status === 'booking_confirmed' 
                    ? '✅ Confirmed' : '⏳ Processing'}
                </Text>
              </View>
              <Text style={s.traceDuration}>
                {trace.total_duration_ms 
                  ? `${trace.total_duration_ms}ms` : 'N/A'}
              </Text>
              <Text style={s.traceAgentCount}>
                {stepsCount > 0 
                  ? `${stepsCount} agents` : 'Legacy trace'}
              </Text>
            </View>
            {trace.booking_id && (
              <Text style={s.traceBookingId}>
                📋 {trace.booking_id}
              </Text>
            )}
          </View>
          <Ionicons 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={20} color="#9999AA" 
          />
        </TouchableOpacity>
        
        {/* Expanded content */}
        {isExpanded && (
          <View style={s.traceExpanded}>
            {/* Google Antigravity badge */}
            <View style={s.agBadge}>
              <Text style={s.agBadgeIcon}>⚡</Text>
              <View style={s.agBadgeText}>
                <Text style={s.agBadgeTitle}>Google Antigravity</Text>
                <Text style={s.agBadgeSub}>
                  {stepsCount}-agent pipeline · 
                  {trace.total_duration_ms 
                    ? ` ${trace.total_duration_ms}ms total` : ''}
                </Text>
              </View>
            </View>
            
            {hasSteps ? (
              renderStepTimeline(trace.steps)
            ) : (
              <View style={s.noSteps}>
                <Text style={s.noStepsText}>
                  📋 Make a new booking to see the full 5-agent 
                  pipeline visualization
                </Text>
              </View>
            )}
            
            {/* Google tools used */}
            {trace.google_tools_used?.length > 0 && (
              <View style={s.googleToolsSection}>
                <Text style={s.googleToolsTitle}>
                  🔧 Google Tools Used
                </Text>
                <View style={s.googleToolsRow}>
                  {trace.google_tools_used.map((tool, i) => (
                    <View key={i} style={s.googleToolChip}>
                      <Text style={s.googleToolText}>{tool}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color="#00C853" />
          <Text style={s.loadingText}>
            Loading agent traces...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity 
          style={s.backBtn}
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#1A1A2E" />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>🤖 Agent Trace Viewer</Text>
          <Text style={s.headerSub}>
            Multi-agent reasoning pipeline log
          </Text>
        </View>
        <TouchableOpacity style={s.refreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color="#00C853" />
        </TouchableOpacity>
      </View>

      {/* Antigravity platform info */}
      <View style={s.platformCard}>
        <View style={s.platformRow}>
          <View style={s.platformIconWrap}>
            <Text style={s.platformIcon}>⚡</Text>
          </View>
          <View style={s.platformInfo}>
            <Text style={s.platformName}>Google Antigravity</Text>
            <Text style={s.platformDesc}>
              Orchestrates 5-agent pipeline
            </Text>
          </View>
          <View style={s.agentCountBadge}>
            <Text style={s.agentCountText}>5 Agents</Text>
          </View>
        </View>
        <View style={s.agentDotsRow}>
          {Object.entries(AGENT_COLORS).map(([skill, colors]) => (
            <View key={skill} style={[s.agentDot, 
              { backgroundColor: colors.dot }]}>
              <Text style={s.agentDotText}>
                {skill.split('-')[0].charAt(0).toUpperCase()}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#00C853"
          />
        }
      >
        <Text style={s.sectionLabel}>
          EXECUTION TRACES ({traces.length})
        </Text>
        
        {traces.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyEmoji}>🤖</Text>
            <Text style={s.emptyTitle}>No traces yet</Text>
            <Text style={s.emptySub}>
              Make a booking via AI Chat to see the 
              full 5-agent reasoning pipeline here
            </Text>
          </View>
        ) : (
          traces.map(renderTrace)
        )}
        
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  loadingWrap: { 
    flex: 1, alignItems: 'center', justifyContent: 'center' 
  },
  loadingText: { marginTop: 12, color: '#9999AA', fontSize: 14 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingHorizontal: 16,
    paddingVertical: 12, borderBottomWidth: 1,
    borderBottomColor: '#E4E5EF',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F5F6FA',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { 
    fontSize: 16, fontWeight: '800', color: '#1A1A2E' 
  },
  headerSub: { fontSize: 11, color: '#9999AA', marginTop: 1 },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F0FFF4',
    alignItems: 'center', justifyContent: 'center',
  },
  platformCard: {
    backgroundColor: '#EFF6FF', margin: 12,
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  platformRow: { 
    flexDirection: 'row', alignItems: 'center', 
    marginBottom: 12, gap: 10 
  },
  platformIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1D4ED8',
    alignItems: 'center', justifyContent: 'center',
  },
  platformIcon: { fontSize: 20 },
  platformInfo: { flex: 1 },
  platformName: { 
    fontSize: 15, fontWeight: '800', color: '#1D4ED8' 
  },
  platformDesc: { fontSize: 12, color: '#555570', marginTop: 1 },
  agentCountBadge: {
    backgroundColor: '#1D4ED8', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  agentCountText: { 
    color: '#fff', fontSize: 11, fontWeight: '800' 
  },
  agentDotsRow: { flexDirection: 'row', gap: 8 },
  agentDot: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  agentDotText: { 
    color: '#fff', fontSize: 12, fontWeight: '800' 
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 12 },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: '#9999AA',
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 10,
  },
  traceCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14,
    marginBottom: 10, borderWidth: 1,
    borderColor: '#E4E5EF', overflow: 'hidden',
  },
  traceHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 8,
  },
  traceHeaderLeft: { flex: 1 },
  traceId: { 
    fontSize: 11, fontWeight: '700',
    color: '#1D4ED8', fontVariant: ['tabular-nums'],
    marginBottom: 3,
  },
  traceInput: { 
    fontSize: 13, color: '#1A1A2E',
    fontStyle: 'italic', marginBottom: 6,
  },
  traceMetaRow: { 
    flexDirection: 'row', alignItems: 'center', gap: 8 
  },
  statusBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  statusText: { fontSize: 10, fontWeight: '700' },
  traceDuration: { fontSize: 10, color: '#9999AA' },
  traceAgentCount: { fontSize: 10, color: '#9999AA' },
  traceBookingId: { 
    fontSize: 10, color: '#9999AA', marginTop: 3 
  },
  traceExpanded: {
    borderTopWidth: 1, borderTopColor: '#E4E5EF',
    padding: 12,
  },
  agBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#EFF6FF', borderRadius: 10,
    padding: 10, marginBottom: 14, gap: 10,
  },
  agBadgeIcon: { fontSize: 20 },
  agBadgeText: { flex: 1 },
  agBadgeTitle: { 
    fontSize: 13, fontWeight: '800', color: '#1D4ED8' 
  },
  agBadgeSub: { fontSize: 11, color: '#555570', marginTop: 1 },
  timeline: { gap: 0 },
  timelineItem: { flexDirection: 'row', gap: 10 },
  timelineLeft: { 
    alignItems: 'center', width: 28, paddingTop: 2 
  },
  timelineDot: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  timelineDotNum: { 
    color: '#fff', fontSize: 11, fontWeight: '900' 
  },
  timelineLine: {
    width: 2, flex: 1, backgroundColor: '#E4E5EF',
    marginTop: 2, marginBottom: 2, minHeight: 16,
  },
  stepCard: {
    flex: 1, borderRadius: 12, padding: 12,
    borderWidth: 1, marginBottom: 8,
  },
  stepHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 10,
  },
  stepAgentName: { 
    fontSize: 12, fontWeight: '900',
    textTransform: 'uppercase', letterSpacing: 0.5,
    flex: 1,
  },
  stepStatusBadge: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
  },
  stepStatusText: { 
    color: '#fff', fontSize: 9, fontWeight: '800' 
  },
  stepSection: { marginBottom: 8 },
  stepSectionLabel: {
    fontSize: 9, fontWeight: '800', color: '#854D0E',
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 3,
  },
  stepSectionText: { 
    fontSize: 12, color: '#1A1A2E', lineHeight: 18 
  },
  toolsSection: { marginBottom: 8 },
  toolsLabel: {
    fontSize: 9, fontWeight: '800', color: '#374151',
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 6,
  },
  toolsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  toolChip: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6,
  },
  toolChipText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  stepDuration: { fontSize: 10, color: '#9999AA', textAlign: 'right' },
  googleToolsSection: {
    marginTop: 12, borderTopWidth: 1,
    borderTopColor: '#E4E5EF', paddingTop: 12,
  },
  googleToolsTitle: {
    fontSize: 11, fontWeight: '800', color: '#555570',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 8,
  },
  googleToolsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  googleToolChip: {
    backgroundColor: '#1D4ED8', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 8,
  },
  googleToolText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  noSteps: {
    backgroundColor: '#F5F6FA', borderRadius: 10,
    padding: 16, alignItems: 'center',
  },
  noStepsText: {
    color: '#9999AA', fontSize: 12, textAlign: 'center',
    lineHeight: 18,
  },
  emptyState: { 
    alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 
  },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { 
    fontSize: 18, fontWeight: '800', color: '#1A1A2E',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14, color: '#9999AA', textAlign: 'center',
    lineHeight: 22,
  },
});
