import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking, Platform } from 'react-native';

export default function ProviderCard({ provider, isTopPick, onBook }) {
  if (!provider) return null;

  const handleCall = () => {
    if (provider.phone) {
      Linking.openURL(`tel:${provider.phone}`);
    }
  };

  return (
    <View style={[styles.card, isTopPick ? styles.topPickCard : null]}>
      {isTopPick && (
        <View style={styles.topPickBadge}>
          <Text style={styles.topPickText}>🏆 Best Match (AI Ranked)</Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{provider.name}</Text>
          {provider.nameUrdu ? (
            <Text style={styles.nameUrdu}>{provider.nameUrdu}</Text>
          ) : null}
        </View>

        {provider.score ? (
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreNumber}>{provider.score}</Text>
            <Text style={styles.scoreLabel}>Score</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaIcon}>⭐</Text>
          <Text style={styles.metaText}>
            {provider.rating || '4.5'} ({provider.reviews || 0} reviews)
          </Text>
        </View>

        <View style={styles.metaItem}>
          <Text style={styles.metaIcon}>📍</Text>
          <Text style={styles.metaText}>{provider.distance || 'Nearby'}</Text>
        </View>

        <View style={styles.metaItem}>
          <Text style={styles.metaIcon}>💰</Text>
          <Text style={styles.metaText}>{provider.hourlyRate || 'Variable'}/hr</Text>
        </View>
      </View>

      <View style={styles.tagsRow}>
        {provider.verified ? (
          <View style={[styles.tag, styles.verifiedTag]}>
            <Text style={styles.verifiedTagText}>✓ Verified Partner</Text>
          </View>
        ) : null}
        
        {provider.category ? (
          <View style={styles.tag}>
            <Text style={styles.tagText}>
              {String(provider.category).replace(/_/g, ' ').toUpperCase()}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity 
          style={styles.callBtn} 
          onPress={handleCall}
          activeOpacity={0.8}
        >
          <Text style={styles.callBtnText}>📞 Call Provider</Text>
        </TouchableOpacity>

        {onBook && (
          <TouchableOpacity 
            style={styles.bookBtn} 
            onPress={() => onBook(provider)}
            activeOpacity={0.8}
          >
            <Text style={styles.bookBtnText}>⚡ Instant Book</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#16161F',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  topPickCard: {
    borderColor: '#00C896',
    backgroundColor: 'rgba(0, 200, 150, 0.05)',
    borderWidth: 1.5,
  },
  topPickBadge: {
    position: 'absolute',
    top: -12,
    left: 16,
    backgroundColor: '#00C896',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  topPickText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  nameContainer: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F0F0F5',
  },
  nameUrdu: {
    fontSize: 16,
    color: '#00C896',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    marginTop: 2,
  },
  scoreBadge: {
    backgroundColor: 'rgba(0, 200, 150, 0.1)',
    borderWidth: 1,
    borderColor: '#00C896',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  scoreNumber: {
    color: '#00C896',
    fontSize: 16,
    fontWeight: '800',
  },
  scoreLabel: {
    color: '#8888AA',
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 4,
  },
  metaIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  metaText: {
    color: '#F0F0F5',
    fontSize: 13,
    fontWeight: '500',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  tag: {
    backgroundColor: '#111118',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  tagText: {
    color: '#8888AA',
    fontSize: 10,
    fontWeight: '600',
  },
  verifiedTag: {
    backgroundColor: 'rgba(0, 200, 150, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 150, 0.2)',
  },
  verifiedTagText: {
    color: '#00C896',
    fontSize: 10,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  callBtn: {
    flex: 1,
    backgroundColor: '#111118',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  callBtnText: {
    color: '#8888AA',
    fontSize: 13,
    fontWeight: '600',
  },
  bookBtn: {
    flex: 1,
    backgroundColor: '#00C896',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
