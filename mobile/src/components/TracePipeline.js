import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';

export default function TracePipeline({ trace }) {
  if (!trace || trace.length === 0) return null;

  const getAgentColor = (agent) => {
    switch (agent) {
      case 'IntentAgent': return '#388E3C'; // Deep Green
      case 'DiscoveryAgent': return '#0288D1'; // Light Blue
      case 'MatchingAgent': return '#F57C00'; // Orange
      case 'BookingAgent': return '#7B1FA2'; // Purple
      case 'FollowUpAgent': return '#C2185B'; // Pink
      case 'ResponseAgent': return '#00C853'; // Premium Accent Green
      default: return '#8B949E';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔬 Live Agentic Trace & Reasoning</Text>
        <Text style={styles.subtitle}>Autonomous execution log for Hackathon Judges</Text>
      </View>

      <ScrollView style={styles.scrollContainer} nestedScrollEnabled={true}>
        {trace.map((step, index) => {
          const isLast = index === trace.length - 1;
          const agentColor = getAgentColor(step.agent);

          return (
            <View key={step.step || index} style={styles.stepRow}>
              {/* Timeline Connector */}
              <View style={styles.timelineCol}>
                <View style={[styles.dot, { backgroundColor: agentColor }]} />
                {!isLast && <View style={styles.line} />}
              </View>

              {/* Content */}
              <View style={styles.contentCol}>
                <View style={styles.agentBadgeRow}>
                  <View style={[styles.agentBadge, { backgroundColor: `${agentColor}20`, borderColor: agentColor }]}>
                    <Text style={[styles.agentName, { color: agentColor }]}>
                      Step {step.step}: {step.agent}
                    </Text>
                  </View>
                  <Text style={styles.duration}>{(step.durationMs || 0)}ms</Text>
                </View>

                <Text style={styles.actionText}>{step.action}</Text>

                {/* Optional result data display */}
                {step.result && typeof step.result === 'object' ? (
                  <View style={styles.dataBox}>
                    <Text style={styles.dataText}>
                      {JSON.stringify(step.result, null, 2)}
                    </Text>
                  </View>
                ) : step.result ? (
                  <View style={styles.dataBox}>
                    <Text style={styles.dataText}>{String(step.result)}</Text>
                  </View>
                ) : null}
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
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#161B22',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 11,
    color: '#8B949E',
    marginTop: 2,
  },
  scrollContainer: {
    maxHeight: 280,
    padding: 16,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timelineCol: {
    alignItems: 'center',
    width: 24,
    marginRight: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#30363D',
    marginTop: 4,
    marginBottom: 2,
  },
  contentCol: {
    flex: 1,
    paddingBottom: 16,
  },
  agentBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  agentBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  agentName: {
    fontSize: 10,
    fontWeight: '700',
  },
  duration: {
    fontSize: 10,
    color: '#8B949E',
    fontFamily: 'monospace',
  },
  actionText: {
    color: '#C9D1D9',
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  dataBox: {
    backgroundColor: '#161B22',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#30363D',
  },
  dataText: {
    color: '#8B949E',
    fontSize: 10,
    fontFamily: 'monospace',
  },
});
