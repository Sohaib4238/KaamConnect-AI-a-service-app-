import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';

export default function NotificationBanner({ booking, receipt }) {
  const [visible, setVisible] = useState(false);
  const slideAnim = useState(new Animated.Value(-100))[0]; // Initial position off-screen top

  useEffect(() => {
    if (booking || receipt) {
      // Trigger mock top-of-screen notification exactly 2 seconds after confirmation appears
      const timer = setTimeout(() => {
        setVisible(true);
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }).start();
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [booking, receipt, slideAnim]);

  if (!visible) return null;

  const providerName = receipt?.providerName || booking?.provider || 'AC Specialist';
  const serviceType = receipt?.serviceType || booking?.serviceType || 'Specialist';
  const locStr = receipt?.location || booking?.location || 'G-13';

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -120,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  return (
    <Animated.View style={[styles.bannerContainer, { transform: [{ translateY: slideAnim }] }]}>
      <TouchableOpacity style={styles.bannerTouchable} onPress={handleDismiss} activeOpacity={0.9}>
        <View style={styles.iconWrapper}>
          <Text style={styles.iconText}>💬</Text>
        </View>

        <View style={styles.contentColumn}>
          <View style={styles.headerRow}>
            <Text style={styles.senderNameText}>{providerName} ({serviceType})</Text>
            <Text style={styles.appNameBadge}>WhatsApp</Text>
          </View>

          <Text style={styles.msgBodyText} numberOfLines={2}>
            "Assalam-o-Alaikum Sir, main 30 minute me {locStr} pohnch raha hon. Location confirm kr dain."
          </Text>

          <Text style={styles.tapToDismissText}>Tap to dismiss notification simulation</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 999,
    backgroundColor: '#1C2C22',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#25D366',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  bannerTouchable: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'flex-start',
  },
  iconWrapper: {
    backgroundColor: '#25D366',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  iconText: {
    fontSize: 18,
  },
  contentColumn: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderNameText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  appNameBadge: {
    color: '#25D366',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  msgBodyText: {
    color: '#E8F5E9',
    fontSize: 12,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  tapToDismissText: {
    color: '#8B949E',
    fontSize: 9,
    marginTop: 6,
    textAlign: 'right',
  },
});
