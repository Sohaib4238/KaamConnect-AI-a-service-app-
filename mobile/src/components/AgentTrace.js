import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';

const AGENT_SEQUENCE = [
  'Intent Agent',
  'Discovery Agent',
  'Matching Agent',
  'Booking Agent',
  'Follow-Up Agent',
  'Response Agent',
];

export default function AgentTrace({ apiUrl, isLoading, finalTrace }) {
  const [stepsState, setStepsState] = useState(() =>
    AGENT_SEQUENCE.map((agentName, idx) => ({
      step: idx + 1,
      agent: agentName,
      action: 'Awaiting execution context...',
      result: null,
      status: idx === 0 ? (isLoading ? 'active' : 'pending') : 'pending',
      duration_ms: 0,
    }))
  );

  // Initialize/reset states when loading triggers
  useEffect(() => {
    if (isLoading) {
      setStepsState(
        AGENT_SEQUENCE.map((agentName, idx) => ({
          step: idx + 1,
          agent: agentName,
          action: idx === 0 ? 'Parsing multilingual user input stream...' : 'Awaiting execution context...',
          result: null,
          status: idx === 0 ? 'active' : 'pending',
          duration_ms: 0,
        }))
      );
    }
  }, [isLoading]);

  // Connect WebSocket listener for live trace updates
  useEffect(() => {
    if (!apiUrl) return;

    // Convert http:// URL to ws:// URL securely
    const wsUrl = apiUrl.replace(/^http/, 'ws');
    let ws = null;

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('📡 [AgentTrace Panel] WebSocket connected successfully to live backend stream');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'agent_step') {
            setStepsState((prevSteps) => {
              const updated = [...prevSteps];
              const targetIndex = data.step - 1;

              if (targetIndex >= 0 && targetIndex < updated.length) {
                // Update completed step
                updated[targetIndex] = {
                  ...updated[targetIndex],
                  agent: data.agent || updated[targetIndex].agent,
                  action: data.action,
                  result: data.result,
                  status: 'done',
                  duration_ms: data.duration_ms || 0,
                };

                // Set next step to active if available
                if (targetIndex + 1 < updated.length) {
                  updated[targetIndex + 1] = {
                    ...updated[targetIndex + 1],
                    status: 'active',
                    action: 'Processing operational instructions reasoning...',
                  };
                }
              }
              return updated;
            });
          }
        } catch (parseErr) {
          console.error('⚠️ [AgentTrace] WebSocket event payload decoding exception:', parseErr);
        }
      };

      ws.onerror = (err) => {
        console.log('⚠️ [AgentTrace] WebSocket transport stream fallback active');
      };
    } catch (e) {
      console.log('⚠️ [AgentTrace] Secure WebSocket fallback initialized');
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [apiUrl, isLoading]);

  // Reconcile final completed trace list payload if WS events dropped/arrived late
  useEffect(() => {
    if (!isLoading && finalTrace && finalTrace.length > 0) {
      setStepsState((prev) => {
        const merged = [...prev];
        finalTrace.forEach((tStep) => {
          const targetIndex = tStep.step - 1;
          if (targetIndex >= 0 && targetIndex < merged.length) {
            merged[targetIndex] = {
              ...merged[targetIndex],
              agent: tStep.agent || merged[targetIndex].agent,
              action: tStep.action || merged[targetIndex].action,
              result: typeof tStep.result === 'object' ? JSON.stringify(tStep.result) : String(tStep.result || ''),
              status: 'done',
              duration_ms: tStep.durationMs || tStep.duration_ms || merged[targetIndex].duration_ms,
            };
          }
        });
        return merged;
      });
    }
  }, [isLoading, finalTrace]);

  const getStatusBadgeStyles = (status) => {
    switch (status) {
      case 'done':
        return { bg: '#00C85320', border: '#00C853', text: '#00C853', label: '✓ Done' };
      case 'active':
        return { bg: '#29B6F620', border: '#29B6F6', text: '#29B6F6', label: '⚡ Active' };
      default:
        return { bg: '#21262D', border: '#30363D', text: '#8B949E', label: 'Pending' };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔬 Live Agentic Trace Panel</Text>
        <Text style={styles.headerSub}>Autonomous multi-step execution streaming live</Text>
      </View>

      <ScrollView style={styles.scrollArea} nestedScrollEnabled={true}>
        {stepsState.map((item, idx) => {
          const isLast = idx === stepsState.length - 1;
          const badge = getStatusBadgeStyles(item.status);

          return (
            <View key={item.step || idx} style={styles.stepContainer}>
              {/* Vertical connector line column */}
              <View style={styles.timelineColumn}>
                <View style={[styles.nodeIndicator, { backgroundColor: badge.border }]} />
                {!isLast ? <View style={[styles.timelineConnector, item.status === 'done' ? styles.timelineConnectorActive : null]} /> : null}
              </View>

              {/* Data card info */}
              <View style={styles.contentColumn}>
                <View style={styles.agentTitleRow}>
                  <Text style={styles.agentNameText}>{item.agent}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                    <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
                  </View>
                </View>

                <Text style={[styles.actionDescText, item.status === 'pending' ? styles.textMuted : null]}>
                  {item.action}
                </Text>

                {item.result ? (
                  <View style={styles.resultBox}>
                    <Text style={styles.resultLabel}>Result Output:</Text>
                    <Text style={styles.resultContentText}>{String(item.result)}</Text>
                  </View>
                ) : null}

                {item.duration_ms > 0 && (
                  <Text style={styles.durationText}>Completed in {item.duration_ms}ms</Text>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0D1117',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#30363D',
    marginTop: 16,
    marginBottom: 8,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#161B22',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 11,
    color: '#8B949E',
    marginTop: 2,
  },
  scrollArea: {
    maxHeight: 340,
    padding: 16,
  },
  stepContainer: {
    flexDirection: 'row',
  },
  timelineColumn: {
    alignItems: 'center',
    width: 20,
    marginRight: 12,
  },
  nodeIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: '#30363D',
    marginTop: 4,
    marginBottom: 2,
  },
  timelineConnectorActive: {
    backgroundColor: '#00C85350',
  },
  contentColumn: {
    flex: 1,
    paddingBottom: 20,
  },
  agentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  agentNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E6EDF3',
  },
  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  actionDescText: {
    color: '#C9D1D9',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  textMuted: {
    color: '#6E7681',
    fontStyle: 'italic',
  },
  resultBox: {
    backgroundColor: '#161B22',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#00C853',
  },
  resultLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8B949E',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  resultContentText: {
    color: '#A5D6A7',
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 15,
  },
  durationText: {
    fontSize: 9,
    color: '#8B949E',
    marginTop: 6,
    fontFamily: 'monospace',
    textAlign: 'right',
  },
});
