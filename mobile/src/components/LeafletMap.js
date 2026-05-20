import React, { useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * LeafletMap — A WebView-based OpenStreetMap component.
 * 
 * Props:
 *   latitude, longitude  — center of the map
 *   zoom                 — zoom level (default 15)
 *   markerLat, markerLng — optional marker position
 *   onMapPress(lat, lng) — called when user taps the map
 *   scrollEnabled        — allow panning (default true)
 *   zoomEnabled          — allow zoom gestures (default true)
 *   style                — container style override
 */
export default function LeafletMap({
  latitude = 24.8607,
  longitude = 67.0011,
  zoom = 15,
  markerLat,
  markerLng,
  onMapPress,
  scrollEnabled = true,
  zoomEnabled = true,
  style,
}) {
  const webRef = useRef(null);

  // When parent updates lat/lng, pan the map
  useEffect(() => {
    if (webRef.current) {
      webRef.current.injectJavaScript(`
        if(window.map) {
          window.map.setView([${latitude}, ${longitude}], ${zoom});
          if(window.marker) window.marker.setLatLng([${latitude}, ${longitude}]);
        }
        true;
      `);
    }
  }, [latitude, longitude, zoom]);

  // Update marker when markerLat/markerLng change
  useEffect(() => {
    if (webRef.current && markerLat != null && markerLng != null) {
      webRef.current.injectJavaScript(`
        if(window.marker) {
          window.marker.setLatLng([${markerLat}, ${markerLng}]);
          window.marker.addTo(window.map);
        }
        true;
      `);
    }
  }, [markerLat, markerLng]);

  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapPress' && onMapPress) {
        onMapPress(data.lat, data.lng);
      }
    } catch (e) {
      // ignore
    }
  }, [onMapPress]);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; }
    html, body, #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      center: [${latitude}, ${longitude}],
      zoom: ${zoom},
      zoomControl: false,
      dragging: ${scrollEnabled},
      touchZoom: ${zoomEnabled},
      scrollWheelZoom: ${zoomEnabled},
      doubleClickZoom: ${zoomEnabled},
      pinchZoom: ${zoomEnabled},
      attributionControl: false
    });
    window.map = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    // Green marker icon
    var greenIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    var marker = L.marker([${markerLat || latitude}, ${markerLng || longitude}], { icon: greenIcon });
    window.marker = marker;
    ${(markerLat != null && markerLng != null) ? 'marker.addTo(map);' : ''}

    map.on('click', function(e) {
      var lat = e.latlng.lat;
      var lng = e.latlng.lng;
      marker.setLatLng([lat, lng]).addTo(map);
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'mapPress',
        lat: lat,
        lng: lng
      }));
    });
  </script>
</body>
</html>
  `;

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={handleMessage}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
