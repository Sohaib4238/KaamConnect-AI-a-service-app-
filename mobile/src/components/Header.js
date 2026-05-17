import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Header({ title, subtitle, onOpenSettings, apiUrl }) {
  // Extract simple display host
  const getDisplayHost = () => {
    try {
      return apiUrl.replace('http://', '').replace('https://', '').split('/')[0];
    } catch {
      return 'localhost:3000';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1117" />
      <View style={styles.container}>
        <View style={styles.left}>
          <View style={styles.titleRow}>
            <Text style={styles.appName}>Kaam</Text>
            <Text style={styles.appAccent}>Connect</Text>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>{subtitle || 'Agentic Orchestrator'}</Text>
        </View>

        <TouchableOpacity style={styles.configBtn} onPress={onOpenSettings} activeOpacity={0.8}>
          <View style={styles.statusDot} />
          <Text style={styles.configText} numberOfLines={1}>
            {getDisplayHost()}
          </Text>
          <Text style={styles.gearIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#0D1117',
    paddingTop: Platform.OS === 'android' ? 35 : 0,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0D1117',
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  left: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  appAccent: {
    fontSize: 20,
    fontWeight: '800',
    color: '#00C853', // Premium vibrant green
    letterSpacing: -0.5,
  },
  aiBadge: {
    backgroundColor: 'rgba(0, 200, 83, 0.15)',
    borderWidth: 1,
    borderColor: '#00C853',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  aiBadgeText: {
    color: '#00C853',
    fontSize: 10,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    color: '#8B949E',
    marginTop: 2,
    fontWeight: '500',
  },
  configBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#30363D',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    maxWidth: 140,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00C853',
    marginRight: 6,
  },
  configText: {
    color: '#C9D1D9',
    fontSize: 11,
    fontWeight: '600',
    marginRight: 4,
    flexShrink: 1,
  },
  gearIcon: {
    fontSize: 12,
  },
});
