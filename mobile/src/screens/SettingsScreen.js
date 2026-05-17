import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  Platform 
} from 'react-native';
import { getDefaultApiUrl } from '../config/api';

export default function SettingsScreen({ apiUrl, setApiUrl }) {
  const [inputUrl, setInputUrl] = useState(apiUrl);

  const handleSave = () => {
    let cleanUrl = inputUrl.trim();
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    if (!cleanUrl.startsWith('http')) {
      cleanUrl = `http://${cleanUrl}`;
    }
    setApiUrl(cleanUrl);
    Alert.alert("Success", `Backend API targeted to:\n${cleanUrl}`);
  };

  const handleReset = () => {
    const defaultUrl = getDefaultApiUrl();
    setInputUrl(defaultUrl);
    setApiUrl(defaultUrl);
    Alert.alert("Reset", `Restored default target:\n${defaultUrl}`);
  };

  const applyPreset = (preset) => {
    setInputUrl(preset);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🌐 Connection Target Configuration</Text>
        <Text style={styles.cardDesc}>
          If testing on a physical iPhone using Expo Go over Wi-Fi, ensure your laptop/PC backend host IP address is entered below (e.g. 192.168.1.X:3000).
        </Text>

        <Text style={styles.label}>Backend Base Endpoint URL</Text>
        <TextInput 
          style={styles.input}
          value={inputUrl}
          onChangeText={setInputUrl}
          placeholder="http://192.168.1.5:3000"
          placeholderTextColor="#8B949E"
          autoCapitalize="none"
          keyboardType="url"
          autoCorrect={false}
        />

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.saveBtnText}>Save Target Base</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.8}>
            <Text style={styles.resetBtnText}>Restore Default</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📱 Environment Auto-Presets</Text>
        <Text style={styles.cardDesc}>Tap to load common simulator bindings:</Text>

        <View style={styles.presetRow}>
          <TouchableOpacity 
            style={styles.presetChip} 
            onPress={() => applyPreset('http://localhost:3000')}
          >
            <Text style={styles.presetLabel}>iOS Sim / Web</Text>
            <Text style={styles.presetVal}>localhost:3000</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.presetChip} 
            onPress={() => applyPreset('http://10.0.2.2:3000')}
          >
            <Text style={styles.presetLabel}>Android Emulator</Text>
            <Text style={styles.presetVal}>10.0.2.2:3000</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoHeading}>💡 Zero-Cost Stack Specifications</Text>
        <View style={styles.specRow}>
          <Text style={styles.specKey}>LLM Framework:</Text>
          <Text style={styles.specVal}>Gemini 2.5 Flash via AI Studio</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specKey}>Orchestration:</Text>
          <Text style={styles.specVal}>ReAct Agentic loop (Express)</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specKey}>Data Persistence:</Text>
          <Text style={styles.specVal}>better-sqlite3 WAL driver</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specKey}>Discovery & Paths:</Text>
          <Text style={styles.specVal}>Pre-computed Haversine Matrix</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#30363D',
    padding: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  cardDesc: {
    color: '#8B949E',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  label: {
    color: '#C9D1D9',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0D1117',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 16,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  saveBtn: {
    flex: 2,
    backgroundColor: '#00C853',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#0D1117',
    fontWeight: '700',
    fontSize: 13,
  },
  resetBtn: {
    flex: 1,
    backgroundColor: '#21262D',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  resetBtnText: {
    color: '#C9D1D9',
    fontWeight: '600',
    fontSize: 13,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 12,
  },
  presetChip: {
    flex: 1,
    backgroundColor: '#0D1117',
    borderWidth: 1,
    borderColor: '#30363D',
    padding: 12,
    borderRadius: 12,
  },
  presetLabel: {
    color: '#8B949E',
    fontSize: 11,
    fontWeight: '600',
  },
  presetVal: {
    color: '#00C853',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#0D1117',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 16,
    padding: 16,
  },
  infoHeading: {
    color: '#8B949E',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#161B22',
  },
  specKey: {
    color: '#8B949E',
    fontSize: 12,
  },
  specVal: {
    color: '#C9D1D9',
    fontSize: 12,
    fontWeight: '600',
  },
});
