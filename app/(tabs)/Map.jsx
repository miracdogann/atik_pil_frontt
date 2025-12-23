import { getPoints } from "@/services/api";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Provider as PaperProvider } from "react-native-paper";
import { WebView } from "react-native-webview";

const { height, width } = Dimensions.get("window");

const boxIconAsset = Image.resolveAssetSource(
  require("@/assets/icons/battery-2.png")
);
const boxIconUri = boxIconAsset.uri;

const Map = () => {
  // --- State'ler ---
  const [pointsData, setPointsData] = useState([]);
  const [isLoadingPoints, setIsLoadingPoints] = useState(true);
  const [isErrorPoints, setIsErrorPoints] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [fabOpen, setFabOpen] = useState(false);
  const [isWebViewLoading, setIsWebViewLoading] = useState(false);
  const webViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const DEFAULT_API_KEY = "vxNgHq8W1x8soPbMdhwWqgyDrT6ZVMXf";
  const DEFAULT_LATITUDE = 38.6191;
  const DEFAULT_LONGITUDE = 27.4222;
  const DEFAULT_ZOOM = 13;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // 1. Konum alma
  const getUserLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync({
        rationale: {
          title: "Konum Erişimi Gerekli",
          message:
            "Haritada size en yakın noktaları gösterebilmemiz için konumunuza erişmemize izin verin.",
          buttonPositive: "İzin Ver",
          buttonNegative: "Reddet",
        },
      });
      if (status !== "granted") {
        Alert.alert(
          "Konum İzni Gerekli",
          "Konum izni vermediğiniz için harita varsayılan konumda açılacaktır."
        );
        setUserLocation({
          latitude: DEFAULT_LATITUDE,
          longitude: DEFAULT_LONGITUDE,
        });
        setIsLoadingLocation(false);
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.log("Konum alınamadı:", error);
      Alert.alert(
        "Konum Hatası",
        "Konumunuz alınamadı. Harita varsayılan konumda gösteriliyor."
      );
      setUserLocation({
        latitude: DEFAULT_LATITUDE,
        longitude: DEFAULT_LONGITUDE,
      });
    } finally {
      setIsLoadingLocation(false);
    }
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  // 2. Veri Çekme Fonksiyonu
  const fetchPoints = useCallback(async () => {
    setIsLoadingPoints(true);
    setIsErrorPoints(null);
    try {
      const response = await getPoints();
      setPointsData(response.data || []);
    } catch (error) {
      console.error("Noktalar alınamadı:", error);
      setIsErrorPoints("Noktalar getirilemedi. Bağlantınızı kontrol edin.");
    } finally {
      setIsLoadingPoints(false);
    }
  }, []);

  // 3. Ekrana odaklanıldığında veriyi çek
  useFocusEffect(
    useCallback(() => {
      fetchPoints();
    }, [fetchPoints])
  );

  // 4. Veriyi Harita formatına DÖNÜŞTÜR
  const mapMarkers = useMemo(() => {
    return pointsData
      .filter((point) => {
        const lat = parseFloat(point.latitude);
        const lng = parseFloat(point.longitude);
        return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
      })
      .map((point) => ({
        id: point.id || point.kurum_id,
        description: point.kurum_name || "Teslim Noktası",
        latitude: parseFloat(point.latitude),
        longitude: parseFloat(point.longitude),
      }));
  }, [pointsData]);

  // 5. Marker tıklama handler'ı
  const handleMarkerClick = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "loadClick") {
        router.push({
          pathname: "/(tabs)/PilTeslimNoktalari",
          params: { pointId: data.id.toString() },
        });
      }
    } catch (error) {
      console.log("Mesaj parse hatası:", error);
    }
  };

  // 6. "Konumuma Git"
  const handleRecenter = () => {
    if (webViewRef.current && userLocation) {
      const script = `map.flyTo({ center: [${userLocation.longitude}, ${userLocation.latitude}], zoom: 14, speed: 1.5 });`;
      webViewRef.current.injectJavaScript(script);
      setFabOpen(false);
    }
  };

  // 7. Yenileme
  const onRefresh = useCallback(() => {
    console.log("Harita ve veriler yenileniyor...");
    setFabOpen(false);
    getUserLocation();
    fetchPoints();
  }, [fetchPoints]);

  // 8. HTML içeriğini 'useMemo' ile oluştur
  const htmlContent = useMemo(() => {
    if (!userLocation) {
      return null;
    }
    const latitude = userLocation.latitude;
    const longitude = userLocation.longitude;
    const markersJson = JSON.stringify(mapMarkers);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.14.0/maps/maps-web.min.js"></script>
          <link rel="stylesheet" href="https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.14.0/maps/maps.css"/>
          <style>
            html, body, #map { margin:0; padding:0; height:100%; width:100%; }
            .tt-logo, .tt-attribution { display:none !important; }
            .user-marker-dot {
              width: 18px; height: 18px; border-radius: 50%;
              background-color: #4285F4; border: 3px solid #FFFFFF;
              box-shadow: 0 0 0 rgba(66, 133, 244, 0.4);
              animation: pulse-blue 2s infinite;
            }
            @keyframes pulse-blue {
              0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(66, 133, 244, 0.7); }
              70% { transform: scale(1); box-shadow: 0 0 0 20px rgba(66, 133, 244, 0); }
              100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(66, 133, 244, 0); }
            }
            .load-marker {
              width: 32px; height: 32px; border-radius: 50%;
              background-color: #0e0b0bff;
              background-image: url('${boxIconUri}');
              background-size: cover; background-position: center;
              border: 2px solid #FFFFFF; box-shadow: 0 2px 6px rgba(0,0,0,0.4);
              cursor: pointer;
            }
            .custom-popup .tt-popup-content {
              background-color: #0D1521; color: #FFFFFF;
              padding: 12px; border-radius: 8px;
            }
            .custom-popup .tt-popup-anchor-bottom .tt-popup-tip { border-top-color: #0D1521; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            tt.setProductInfo("ReactNativeTomTomDemo","1.0");
            var map = tt.map({
              key: "${DEFAULT_API_KEY}",
              container: "map",
              center: [${longitude}, ${latitude}],
              zoom: ${DEFAULT_ZOOM}
            });
            map.addControl(new tt.NavigationControl());

            map.on('load', function() {
              const userLngLat = [${longitude}, ${latitude}];
              var userMarkerEl = document.createElement('div');
              var innerDotEl = document.createElement('div');
              innerDotEl.className = 'user-marker-dot';
              userMarkerEl.appendChild(innerDotEl);
              new tt.Marker({ element: userMarkerEl, anchor: 'center' })
                .setLngLat(userLngLat)
                .addTo(map);

              const points = ${markersJson};
              var bounds = new tt.LngLatBounds(userLngLat, userLngLat);

              points.forEach(point => {
                const pointLngLat = [point.longitude, point.latitude];
                var markerElement = document.createElement('div');
                markerElement.className = 'load-marker';
                
                markerElement.addEventListener('click', function() {
                  window.ReactNativeWebView.postMessage(JSON.stringify({type: 'loadClick', id: point.id}));
                });
                
                new tt.Marker({ element: markerElement, anchor: 'center' })
                  .setLngLat(pointLngLat)
                  .setPopup(new tt.Popup({ offset: 30, className: 'custom-popup' }).setText(point.description))
                  .addTo(map);
                
                bounds.extend(pointLngLat);
              });

              if (points.length > 0) {
                map.fitBounds(bounds, { padding: 70 });
              }
            });
          </script>
        </body>
      </html>
    `;
  }, [userLocation, mapMarkers]);

  // 9. Yükleme durumu
  if (isLoadingLocation || (isLoadingPoints && pointsData.length === 0)) {
    return (
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={styles.centerContainer}
      >
        <Animated.View
          style={[
            styles.loadingCard,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.loadingIconContainer}>
            <Text style={styles.loadingIcon}>🗺️</Text>
          </View>
          <ActivityIndicator
            size="large"
            color="#667eea"
            style={styles.spinner}
          />
          <Text style={styles.loadingTitle}>Harita Hazırlanıyor</Text>
          <Text style={styles.loadingSubtitle}>
            Konumunuz ve teslim noktaları yükleniyor...
          </Text>
        </Animated.View>
      </LinearGradient>
    );
  }

  // 10. Hata durumu
  if (isErrorPoints) {
    return (
      <LinearGradient
        colors={["#f093fb", "#f5576c"]}
        style={styles.centerContainer}
      >
        <Animated.View
          style={[
            styles.errorCard,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Bağlantı Hatası</Text>
          <Text style={styles.errorMessage}>{isErrorPoints}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchPoints}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#667eea", "#764ba2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.retryButtonGradient}
            >
              <Text style={styles.retryButtonText}>🔄 Yeniden Dene</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    );
  }

  // 11. Başarılı render
  return (
    <PaperProvider>
      <View style={styles.container}>
        {/* Info Badge */}
        <View style={styles.infoBadge}>
          <LinearGradient
            colors={["rgba(255,255,255,0.95)", "rgba(255,255,255,0.9)"]}
            style={styles.infoBadgeGradient}
          >
            <Text style={styles.infoBadgeIcon}>📍</Text>
            <Text style={styles.infoBadgeText}>
              {mapMarkers.length} Teslim Noktası
            </Text>
          </LinearGradient>
        </View>

        {htmlContent && (
          <WebView
            ref={webViewRef}
            originWhitelist={["*"]}
            source={{ html: htmlContent }}
            style={styles.map}
            onMessage={handleMarkerClick}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            onLoadStart={() => setIsWebViewLoading(true)}
            onLoadEnd={() => setIsWebViewLoading(false)}
            cacheEnabled={false}
          />
        )}

        {(isWebViewLoading || (isLoadingPoints && !isLoadingLocation)) && (
          <View style={styles.webViewLoader}>
            <View style={styles.loaderCard}>
              <ActivityIndicator size="large" color="#667eea" />
              <Text style={styles.loaderText}>Harita yükleniyor...</Text>
            </View>
          </View>
        )}

        {/* Floating Action Buttons */}
        <View style={styles.fabContainer}>
          {/* List Button */}
          <TouchableOpacity
            style={styles.fabButton}
            onPress={() => router.navigate("/(tabs)/PilTeslimNoktalari")}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#667eea", "#764ba2"]}
              style={styles.fabGradient}
            >
              <Text style={styles.fabIcon}>📋</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Location Button */}
          <TouchableOpacity
            style={styles.fabButton}
            onPress={handleRecenter}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#4285F4", "#2563eb"]}
              style={styles.fabGradient}
            >
              <Text style={styles.fabIcon}>🎯</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Refresh Button */}
          <TouchableOpacity
            style={styles.fabButton}
            onPress={onRefresh}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#10b981", "#059669"]}
              style={styles.fabGradient}
            >
              <Text style={styles.fabIcon}>🔄</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5ff",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingCard: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 40,
    alignItems: "center",
    width: width * 0.85,
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  loadingIconContainer: {
    marginBottom: 20,
  },
  loadingIcon: {
    fontSize: 80,
  },
  spinner: {
    marginVertical: 20,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2d3748",
    marginTop: 10,
    textAlign: "center",
  },
  loadingSubtitle: {
    fontSize: 16,
    color: "#718096",
    marginTop: 10,
    textAlign: "center",
    lineHeight: 22,
  },
  errorCard: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 40,
    alignItems: "center",
    width: width * 0.85,
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  errorIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2d3748",
    marginBottom: 12,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: "#718096",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
  },
  retryButton: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  retryButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: "center",
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  webViewLoader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  loaderCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  loaderText: {
    marginTop: 15,
    fontSize: 16,
    color: "#2d3748",
    fontWeight: "600",
  },
  infoBadge: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 10,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  infoBadgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  infoBadgeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  infoBadgeText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2d3748",
  },
  fabContainer: {
    position: "absolute",
    bottom: 150,
    right: 20,
    gap: 5,
  },
  fabButton: {
    width: 40,
    height: 40,
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  fabIcon: {
    fontSize: 18,
  },
});

export default Map;
