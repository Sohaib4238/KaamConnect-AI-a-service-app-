import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { orchestrate } from '../config/api';

export default function HomeScreen({ navigation }) {
  const [messages, setMessages] = useState([
    {
      id: '1',
      type: 'bot',
      text: 'Assalam o Alaikum! 👋 Mujhe batain aap ko kaunsi service chahiye?\n\nExamples:\n• "AC repair kal subah G-13 mein"\n• "Plumber chahiye aaj DHA Karachi mein"\n• "Bijli wala chahiye F-7 mein"',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef();

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: input.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    const userInput = input.trim();
    setInput('');
    setLoading(true);

    // Add thinking indicator
    const thinkingId = Date.now().toString() + '-thinking';
    setMessages(prev => [...prev, {
      id: thinkingId,
      type: 'thinking',
      text: 'AI agents working...',
      timestamp: new Date()
    }]);

    try {
      const result = await orchestrate(userInput);
      
      // Remove thinking indicator
      setMessages(prev => prev.filter(m => m.id !== thinkingId));
      
      if (result.final_status === 'booking_confirmed') {
        // Add success message
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'bot',
          text: '✅ Booking confirmed!',
          timestamp: new Date()
        }]);
        
        // Navigate to booking confirmation screen
        navigation.navigate('BookingConfirmed', { result });
        
      } else if (result.final_status === 'needs_clarification') {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'bot',
          text: result.clarification_question || 'Aap kaunsi service chahiye?',
          timestamp: new Date()
        }]);
        
      } else {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'bot', 
          text: 'Koi provider nahi mila aapke area mein. Dobara try karein.',
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      setMessages(prev => prev.filter(m => m.id !== thinkingId));
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'error',
        text: 'Connection error. Check if server is running.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const getBubbleStyle = (type) => {
    switch(type) {
      case 'user': return [styles.bubble, styles.userBubble];
      case 'bot': return [styles.bubble, styles.botBubble];
      case 'thinking': return [styles.bubble, styles.thinkingBubble];
      case 'error': return [styles.bubble, styles.errorBubble];
      default: return [styles.bubble, styles.botBubble];
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Expertly</Text>
        <Text style={styles.headerSubtitle}>AI Service Orchestrator</Text>
        <TouchableOpacity 
          style={styles.traceBtn}
          onPress={() => navigation.navigate('AgentTrace')}>
          <Text style={styles.traceBtnText}>Dev Mode</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        ref={scrollRef}
        style={styles.messages}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd()}
        contentContainerStyle={{ padding: 16 }}>
        {messages.map(msg => (
          <View key={msg.id} style={
            msg.type === 'user' ? styles.userRow : styles.botRow
          }>
            <View style={getBubbleStyle(msg.type)}>
              {msg.type === 'thinking' ? (
                <View style={styles.thinkingRow}>
                  <ActivityIndicator size="small" color="#666" />
                  <Text style={styles.thinkingText}> {msg.text}</Text>
                </View>
              ) : (
                <Text style={
                  msg.type === 'user' ? styles.userText : styles.botText
                }>{msg.text}</Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Service request likhain..."
            placeholderTextColor="#999"
            multiline
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, loading ? styles.sendBtnDisabled : null]}
            onPress={sendMessage}
            disabled={loading}>
            <Text style={styles.sendBtnText}>
              {loading ? '...' : 'Send'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { 
    backgroundColor: '#1a73e8', padding: 16, paddingTop: 20,
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap'
  },
  headerTitle: { 
    color: '#fff', fontSize: 20, fontWeight: 'bold', flex: 1 
  },
  headerSubtitle: { 
    color: '#cce0ff', fontSize: 12, width: '100%', marginTop: 2 
  },
  traceBtn: { 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 
  },
  traceBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  messages: { flex: 1 },
  userRow: { alignItems: 'flex-end', marginBottom: 8 },
  botRow: { alignItems: 'flex-start', marginBottom: 8 },
  bubble: { 
    maxWidth: '80%', padding: 12, borderRadius: 16 
  },
  userBubble: { 
    backgroundColor: '#1a73e8', borderBottomRightRadius: 4 
  },
  botBubble: { 
    backgroundColor: '#fff', borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOpacity: 0.05, 
    shadowRadius: 4, elevation: 2
  },
  thinkingBubble: { backgroundColor: '#f0f0f0' },
  errorBubble: { backgroundColor: '#fff3f3' },
  userText: { color: '#fff', fontSize: 15 },
  botText: { color: '#333', fontSize: 15, lineHeight: 22 },
  thinkingRow: { flexDirection: 'row', alignItems: 'center' },
  thinkingText: { color: '#666', fontSize: 14 },
  inputRow: { 
    flexDirection: 'row', padding: 12, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#eee', alignItems: 'flex-end'
  },
  input: { 
    flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15,
    maxHeight: 100, marginRight: 8, backgroundColor: '#fafafa'
  },
  sendBtn: { 
    backgroundColor: '#1a73e8', paddingHorizontal: 20, 
    paddingVertical: 12, borderRadius: 24 
  },
  sendBtnDisabled: { backgroundColor: '#999' },
  sendBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 }
});
