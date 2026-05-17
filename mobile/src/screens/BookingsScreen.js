import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  Alert
} from 'react-native';

export default function BookingsScreen({ apiUrl }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/bookings`);
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [apiUrl]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleStatusClick = (bookingId, currentStatus) => {
    Alert.alert(
      "Simulate Lifecycle",
      `Update simulation state for booking ${bookingId}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Mark Completed ✓", 
          onPress: () => updateStatus(bookingId, 'completed') 
        },
        { 
          text: "Cancel Booking ✕", 
          onPress: () => updateStatus(bookingId, 'cancelled'),
          style: 'destructive'
        }
      ]
    );
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`${apiUrl}/api/bookings/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        // Refresh local cache
        fetchBookings();
      }
    } catch (err) {
      Alert.alert("Error", "Failed to update booking status.");
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <Text style={[styles.badge, styles.confirmedBadge]}>Confirmed ✓</Text>;
      case 'completed':
        return <Text style={[styles.badge, styles.completedBadge]}>Completed ★</Text>;
      case 'cancelled':
        return <Text style={[styles.badge, styles.cancelledBadge]}>Cancelled</Text>;
      default:
        return <Text style={styles.badge}>{status}</Text>;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topInfo}>
        <Text style={styles.infoText}>💡 Tap a booking card to simulate completion or cancellation states.</Text>
      </View>

      {loading ? (
        <View style={styles.centerArea}>
          <ActivityIndicator size="large" color="#00C853" />
        </View>
      ) : (
        <FlatList 
          data={bookings}
          keyExtractor={(item) => item.booking_id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00C853" />
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => handleStatusClick(item.booking_id, item.status)}
            >
              <View style={styles.headerRow}>
                <Text style={styles.bookingId}>{item.booking_id}</Text>
                {renderStatusBadge(item.status)}
              </View>

              <Text style={styles.serviceType}>
                {String(item.service_type).replace(/_/g, ' ').toUpperCase()}
              </Text>

              <View style={styles.detailsBox}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Provider:</Text>
                  <Text style={styles.detailValue}>{item.provider_name}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Location:</Text>
                  <Text style={styles.detailValue}>{item.location}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Time:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(item.scheduled_time).toLocaleString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Est. Cost:</Text>
                  <Text style={styles.costValue}>
                    PKR {(item.estimated_cost || 0).toLocaleString()}
                  </Text>
                </View>
              </View>

              <View style={styles.reminderFooter}>
                <Text style={styles.reminderIcon}>🔔</Text>
                <Text style={styles.reminderText}>
                  Pre-appointment SMS Reminder Active (1 hr prior)
                </Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={() => (
            <View style={styles.emptyArea}>
              <Text style={styles.emptyIcon}>📂</Text>
              <Text style={styles.emptyTitle}>No Active Bookings</Text>
              <Text style={styles.emptyDesc}>
                Use the AI Assistant in the Chat tab to discover and book service providers instantly.
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
    backgroundColor: '#0D1117',
  },
  topInfo: {
    backgroundColor: '#161B22',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  infoText: {
    color: '#8B949E',
    fontSize: 11,
    fontWeight: '500',
  },
  centerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#30363D',
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingId: {
    color: '#8B949E',
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  badge: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  confirmedBadge: {
    backgroundColor: 'rgba(0, 200, 83, 0.15)',
    color: '#00C853',
    borderWidth: 1,
    borderColor: '#00C853',
  },
  completedBadge: {
    backgroundColor: 'rgba(56, 142, 60, 0.2)',
    color: '#81C784',
  },
  cancelledBadge: {
    backgroundColor: 'rgba(255, 82, 82, 0.15)',
    color: '#FF5252',
  },
  serviceType: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 6,
    letterSpacing: -0.3,
  },
  detailsBox: {
    backgroundColor: '#0D1117',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#21262D',
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    color: '#8B949E',
    fontSize: 12,
  },
  detailValue: {
    color: '#C9D1D9',
    fontSize: 12,
    fontWeight: '600',
  },
  costValue: {
    color: '#00C853',
    fontSize: 13,
    fontWeight: '700',
  },
  reminderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#21262D',
  },
  reminderIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  reminderText: {
    color: '#8B949E',
    fontSize: 10,
  },
  emptyArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyDesc: {
    color: '#8B949E',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 260,
  },
});
