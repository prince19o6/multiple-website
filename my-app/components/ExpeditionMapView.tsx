import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { DestinationLandmark } from '../types';

interface ExpeditionMapViewProps {
  landmarks: DestinationLandmark[];
  selectedLandmarkId?: string | null;
  onSelectLandmark: (landmark: DestinationLandmark) => void;
  primaryColor?: string;
  isDarkMode?: boolean;
}

export const ExpeditionMapView: React.FC<ExpeditionMapViewProps> = ({
  landmarks,
  selectedLandmarkId,
  onSelectLandmark,
  primaryColor = '#E11D48',
  isDarkMode = false,
}) => {
  const webViewRef = useRef<any>(null);
  const iframeRef = useRef<any>(null);
  const WebViewComponent = WebView as any;

  // Compute bounding box or center
  const centerLat = landmarks.length > 0 ? landmarks[0].latitude : 22.0;
  const centerLng = landmarks.length > 0 ? landmarks[0].longitude : 71.0;

  // Sync selected landmark to map (both web iframe and native WebView)
  useEffect(() => {
    if (selectedLandmarkId && landmarks.length > 0) {
      const target = landmarks.find((l) => l.id === selectedLandmarkId);
      if (target) {
        if (Platform.OS === 'web') {
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify({
                type: 'SELECT_MARKER',
                id: target.id,
                lat: target.latitude,
                lng: target.longitude,
              }),
              '*'
            );
          }
        } else if (webViewRef.current) {
          const script = `
            if (window.selectMarkerById) {
              window.selectMarkerById('${target.id}', ${target.latitude}, ${target.longitude});
            }
            true;
          `;
          webViewRef.current.injectJavaScript(script);
        }
      }
    }
  }, [selectedLandmarkId, landmarks]);

  // Listen for message events on Web from the iframe
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleWebMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && data.type === 'SELECT_LANDMARK' && data.id) {
          const matched = landmarks.find((l) => l.id === data.id);
          if (matched) {
            onSelectLandmark(matched);
          }
        }
      } catch {
        // Ignore non-JSON postMessage events
      }
    };

    window.addEventListener('message', handleWebMessage);
    return () => {
      window.removeEventListener('message', handleWebMessage);
    };
  }, [landmarks, onSelectLandmark]);

  const mapHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map {
      height: 100%;
      width: 100%;
      margin: 0;
      padding: 0;
      background: ${isDarkMode ? '#0f172a' : '#f8fafc'};
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .custom-marker {
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .marker-pin {
      width: 38px;
      height: 38px;
      border-radius: 50% 50% 50% 0;
      background: ${primaryColor};
      position: absolute;
      transform: rotate(-45deg);
      left: 50%;
      top: 50%;
      margin: -20px 0 0 -20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.35);
      border: 2px solid #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .marker-pin::after {
      content: '';
      width: 16px;
      height: 16px;
      margin: 9px 0 0 9px;
      background: #ffffff;
      position: absolute;
      border-radius: 50%;
    }
    .marker-active .marker-pin {
      transform: rotate(-45deg) scale(1.25);
      background: #F59E0B;
      box-shadow: 0 0 0 6px rgba(245, 158, 11, 0.35), 0 8px 18px rgba(0,0,0,0.45);
    }
    .leaflet-popup-content-wrapper {
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.25);
      padding: 4px;
      background: ${isDarkMode ? '#1e293b' : '#ffffff'};
      color: ${isDarkMode ? '#f8fafc' : '#0f172a'};
    }
    .leaflet-popup-tip {
      background: ${isDarkMode ? '#1e293b' : '#ffffff'};
    }
    .popup-title {
      font-weight: 700;
      font-size: 14px;
      margin: 0 0 4px 0;
      color: ${primaryColor};
    }
    .popup-sub {
      font-size: 12px;
      opacity: 0.85;
      margin: 0;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const tileUrl = ${
      isDarkMode
        ? "'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'"
        : "'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'"
    };

    const map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([${centerLat}, ${centerLng}], 8);

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    const landmarks = ${JSON.stringify(landmarks)};
    const markers = {};
    const bounds = [];

    function createMarkerIcon(isActive) {
      return L.divIcon({
        className: 'custom-marker ' + (isActive ? 'marker-active' : ''),
        iconSize: [40, 40],
        iconAnchor: [20, 38],
        popupAnchor: [0, -38],
        html: '<div class="marker-pin"></div>'
      });
    }

    landmarks.forEach(function(l) {
      if (!l.latitude || !l.longitude) return;

      bounds.push([l.latitude, l.longitude]);
      const marker = L.marker([l.latitude, l.longitude], {
        icon: createMarkerIcon(l.id === '${selectedLandmarkId || ''}')
      }).addTo(map);

      marker.bindPopup(
        '<div style="text-align:center;">' +
          '<div class="popup-title">' + (l.title || '') + '</div>' +
          '<div class="popup-sub">' + (l.city || '') + ' • ' + (l.category || '') + '</div>' +
        '</div>'
      );

      marker.on('click', function() {
        var payload = JSON.stringify({ type: 'SELECT_LANDMARK', id: l.id });
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(payload);
        } else if (window.parent && window.parent.postMessage) {
          window.parent.postMessage(payload, '*');
        }
      });

      markers[l.id] = marker;
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }

    window.selectMarkerById = function(id, lat, lng) {
      Object.keys(markers).forEach(function(mId) {
        markers[mId].setIcon(createMarkerIcon(mId === id));
      });

      if (markers[id]) {
        map.flyTo([lat, lng], 14, { duration: 1.2 });
        markers[id].openPopup();
      }
    };

    window.addEventListener('message', function(event) {
      try {
        var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && data.type === 'SELECT_MARKER' && window.selectMarkerById) {
          window.selectMarkerById(data.id, data.lat, data.lng);
        }
      } catch(e) {}
    });

    window.recenterAll = function() {
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    };

    window.zoomIn = function() {
      map.zoomIn();
    };

    window.zoomOut = function() {
      map.zoomOut();
    };
  </script>
</body>
</html>
  `;

  // On Web browsers, render clean responsive iframe to avoid "React Native WebView does not support this platform"
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        {React.createElement('iframe', {
          ref: iframeRef,
          srcDoc: mapHtml,
          style: {
            width: '100%',
            height: '100%',
            border: 'none',
            backgroundColor: 'transparent',
          },
          title: 'Expedition Map Explorer',
        })}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebViewComponent
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={primaryColor} />
          </View>
        )}
        onMessage={(event: any) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'SELECT_LANDMARK' && data.id) {
              const matched = landmarks.find((l) => l.id === data.id);
              if (matched) {
                onSelectLandmark(matched);
              }
            }
          } catch {
            // handle parse error
          }
        }}
        style={styles.webView}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
});
