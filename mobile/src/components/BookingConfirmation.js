import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking, Alert } from 'react-native';

export default function BookingConfirmation({ receipt, booking }) {
  if (!receipt && !booking) return null;

  // Use values from receipt if available, fallback to booking payload
  const bookingId = receipt?.bookingId || booking?.bookingId || 'BK-DEMO-001';
  const providerName = receipt?.providerName || booking?.provider || 'Assigned Specialist';
  const providerPhone = receipt?.providerPhone || booking?.providerPhone || '+92-300-0000000';
  const serviceType = receipt?.serviceType || booking?.serviceType || 'Home Service';
  const scheduledTime = receipt?.scheduledTime || booking?.scheduledTime || 'As soon as possible';
  const location = receipt?.location || booking?.location || 'Islamabad Area';
  const estimatedCost = receipt?.estimatedCost || booking?.estimatedCost || 'PKR 1,600';
  const notes = receipt?.notes || 'Payment via cash upon successful completion.';

  const handleWhatsAppDemo = () => {
    const textStr = `Salam ${providerName}, I have booked your ${serviceType} service via KaamConnect (Booking ID: ${bookingId}). Please confirm your arrival at ${scheduledTime}.`;
    const encoded = encodeURIComponent(textStr);
    const url = `whatsapp://send?phone=${providerPhone.replace(/[^0-9+]/g, '')}&text=${encoded}`;
    
    // Simulate navigation/launch capability gracefully
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert(
          "💬 Direct WhatsApp Connection",
          `[Simulated WhatsApp Demo]\n\nRecipient: ${providerName} (${providerPhone})\n\nMessage: "${textStr}"`,
          [{ text: "Excellent", style: "default" }]
        );
      }
    }).catch(() => {
      Alert.alert(
        "💬 Direct WhatsApp Connection",
        `[Simulated WhatsApp Demo]\n\nRecipient: ${providerName} (${providerPhone})\n\nMessage: "${textStr}"`,
        [{ text: "Excellent", style: "default" }]
      );
    });
  };

  const handleCallDemo = () => {
    Alert.alert(
      "📞 Cellular Dispatch",
      `Dialing ${providerName} at ${providerPhone}...`,
      [{ text: "End Call", style: "cancel" }]
    );
  };

  return (
    <View style={styles.card}>
      {/* Top green success banner */}
      <View style={styles.bannerHeader}>
        <View style={styles.badgeWrapper}>
          <Text style={styles.badgeText}>CONFIRMED</Text>
        </View>
        <Text style={styles.titleText}>Autonomous Specialist Dispatch</Text>
        <Text style={styles.bookingIdText}>{bookingId}</Text>
      </View>

      {/* Primary details list */}
      <View style={styles.detailsBody}>
        <View style={styles.rowItem}>
          <Text style={styles.itemLabel}>Specialist Assigned</Text>
          <Text style={styles.itemValueBold}>{providerName}</Text>
        </View>

        <View style={styles.rowItem}>
          <Text style={styles.itemLabel}>Contact Line</Text>
          <Text style={styles.itemValuePhone}>{providerPhone}</Text>
        </View>

        <View style={styles.rowItem}>
          <Text style={styles.itemLabel}>Service Category</Text>
          <Text style={styles.itemValue}>{serviceType}</Text>
        </View>

        <View style={styles.rowItemHighlight}>
          <Text style={styles.itemLabelHighlight}>Scheduled Arrival</Text>
          <Text style={styles.itemValueHighlight}>{scheduledTime}</Text>
        </View>

        <View style={styles.rowItem}>
          <Text style={styles.itemLabel}>Location Address</Text>
          <Text style={styles.itemValue}>{location}</Text>
        </View>

        <View style={styles.rowItem}>
          <Text style={styles.itemLabel}>Estimated Fare</Text>
          <Text style={styles.itemValueCost}>{estimatedCost}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.notesText}>📌 Note: {notes}</Text>
      </View>

      {/* Direct communication CTA controls */}
      <View style={styles.actionFooter}>
        <TouchableOpacity style={styles.btnWhatsApp} onPress={handleWhatsAppDemo} activeOpacity={0.85}>
          <Text style={styles.btnWhatsAppText}>💬 Direct WhatsApp Connect</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnCall} onPress={handleCallDemo} activeOpacity={0.85}>
          <Text style={styles.btnCallText}>📞 Call Specialist</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E232D',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#30363D',
    marginTop: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bannerHeader: {
    backgroundColor: '#00C853',
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  badgeWrapper: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  badgeText: {
    color: '#00C853',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  bookingIdText: {
    color: '#E8F5E9',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  detailsBody: {
    padding: 20,
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rowItemHighlight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#262D38',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#29B6F6',
  },
  itemLabel: {
    color: '#8B949E',
    fontSize: 13,
  },
  itemLabelHighlight: {
    color: '#29B6F6',
    fontSize: 13,
    fontWeight: '700',
  },
  itemValue: {
    color: '#E6EDF3',
    fontSize: 13,
    fontWeight: '500',
  },
  itemValueBold: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  itemValuePhone: {
    color: '#A5D6A7',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  itemValueHighlight: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  itemValueCost: {
    color: '#FFD54F',
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#30363D',
    marginVertical: 12,
  },
  notesText: {
    color: '#8B949E',
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  actionFooter: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  btnWhatsApp: {
    backgroundColor: '#25D366',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  btnWhatsAppText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  btnCall: {
    backgroundColor: '#30363D',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#484F58',
  },
  btnCallText: {
    color: '#E6EDF3',
    fontSize: 14,
    fontWeight: '600',
  },
});
