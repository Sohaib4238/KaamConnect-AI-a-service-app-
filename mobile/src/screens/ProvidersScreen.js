import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  Alert
} from 'react-native';
import ProviderCard from '../components/ProviderCard';

const CATEGORIES = [
  { id: 'all', label: 'All Providers' },
  { id: 'ac_technician', label: 'AC Repair' },
  { id: 'plumber', label: 'Plumbing' },
  { id: 'electrician', label: 'Electrician' },
  { id: 'tutor', label: 'Tutors' },
  { id: 'beautician', label: 'Beautician' },
];

export default function ProvidersScreen({ apiUrl }) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const url = selectedCategory === 'all' 
        ? `${apiUrl}/api/providers`
        : `${apiUrl}/api/providers?type=${selectedCategory}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setProviders(data.providers);
      }
    } catch (err) {
      console.error('Failed to fetch providers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [selectedCategory, apiUrl]);

  // Filter list by simple client-side keyword searching
  const filteredProviders = providers.filter((p) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const nameMatch = p.name?.toLowerCase().includes(query) || p.nameUrdu?.includes(query);
    const sectorMatch = p.sector?.toLowerCase().includes(query);
    return nameMatch || sectorMatch;
  });

  const handleBook = (provider) => {
    Alert.alert(
      "Provider Selected",
      `Would you like the AI Orchestrator to instantiate a service booking for ${provider.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Let's Go!", 
          onPress: () => {
            Alert.alert("Tip", "Switch to the Chat Tab to experience the end-to-end agentic workflow with live trace outputs!");
          } 
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Category Horizontal Bar */}
      <View style={styles.categoriesArea}>
        <FlatList 
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isActive = selectedCategory === item.id;
            return (
              <TouchableOpacity
                style={[styles.catChip, isActive ? styles.catChipActive : null]}
                onPress={() => setSelectedCategory(item.id)}
              >
                <Text style={[styles.catChipText, isActive ? styles.catChipTextActive : null]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.catScroll}
        />
      </View>

      {/* Search text input */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput 
          style={styles.searchInput}
          placeholder="Search by name, sector (e.g. G-13, F-8)..."
          placeholderTextColor="#8888AA"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List content */}
      {loading ? (
        <View style={styles.centerArea}>
          <ActivityIndicator size="large" color="#00C896" />
          <Text style={styles.loadingText}>Fetching available providers...</Text>
        </View>
      ) : (
        <FlatList 
          data={filteredProviders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProviderCard provider={item} onBook={handleBook} />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={() => (
            <View style={styles.emptyArea}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>No Providers Found</Text>
              <Text style={styles.emptyDesc}>
                Try adjusting your search query or selecting a different category tab above.
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  categoriesArea: {
    backgroundColor: '#111118',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  catScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  catChip: {
    backgroundColor: '#16161F',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  catChipActive: {
    backgroundColor: '#00C896',
    borderColor: '#00C896',
  },
  catChipText: {
    color: '#8888AA',
    fontSize: 12,
    fontWeight: '600',
  },
  catChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16161F',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    color: '#F0F0F5',
    fontSize: 13,
  },
  clearBtn: {
    color: '#8888AA',
    fontSize: 16,
    paddingHorizontal: 8,
  },
  centerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8888AA',
    fontSize: 13,
    marginTop: 12,
  },
  listContent: {
    padding: 16,
  },
  emptyArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#F0F0F5',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyDesc: {
    color: '#8888AA',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 260,
  },
});
