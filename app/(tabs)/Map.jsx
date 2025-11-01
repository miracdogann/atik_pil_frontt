// Map.jsx (Değişiklik Gerekmiyor - Zaten Doğru Gönderiyor)
import { getPoints } from "@/services/api";
import { useFocusEffect } from "@react-navigation/native";
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
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Button,
  FAB,
  Icon,
  Provider as PaperProvider,
  Portal,
} from "react-native-paper";
import { WebView } from "react-native-webview";

const { height } = Dimensions.get("window");

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

  const DEFAULT_API_KEY = "vxNgHq8W1x8soPbMdhwWqgyDrT6ZVMXf";
  const DEFAULT_LATITUDE = 38.6191;
  const DEFAULT_LONGITUDE = 27.4222;
  const DEFAULT_ZOOM = 13;

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

  // 5. Marker tıklama handler'ı (YÖNLENDİRME BURADA)
  const handleMarkerClick = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "loadClick") {
        router.push({
          pathname: "/(tabs)/PilTeslimNoktalari", // Liste sayfasının yolu
          params: { pointId: data.id.toString() }, // Tıklanan noktanın ID'sini gönder
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
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0D1521" />
        <Text style={styles.loadingText}>Harita yükleniyor...</Text>
      </View>
    );
  }

  // 10. Hata durumu
  if (isErrorPoints) {
    return (
      <View style={styles.centerContainer}>
        <Icon source="cloud-off-outline" size={60} color="#D32F2F" />
        <Text style={styles.errorText}>Noktalar getirilemedi.</Text>
        <Text style={styles.errorSubText}>{isErrorPoints}</Text>
        <Button
          onPress={fetchPoints}
          mode="contained"
          buttonColor="#0D1521"
          textColor="#fff"
          style={{ marginTop: 10 }}
        >
          Yeniden Dene
        </Button>
      </View>
    );
  }

  // 11. Başarılı render
  return (
    <PaperProvider>
      <View style={styles.container}>
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
          <ActivityIndicator
            style={styles.webViewLoader}
            size="large"
            color="#0D1521"
          />
        )}

        <Portal>
          <FAB.Group
            open={fabOpen}
            visible={true}
            icon={fabOpen ? "close" : "layers-outline"}
            color="#fff"
            fabStyle={styles.fab}
            actions={[
              {
                icon: "refresh",
                label: "Yenile",
                onPress: onRefresh,
                style: styles.fabAction,
                color: "#0D1521",
                labelTextColor: "#0D1521",
                size: "small",
              },
              {
                icon: "map-marker-radius",
                label: "Konumuma Git",
                onPress: handleRecenter,
                style: styles.fabAction,
                color: "#0D1521",
                labelTextColor: "#0D1521",
                size: "small",
              },
              {
                icon: "format-list-bulleted",
                label: "Nokta Listesi",
                onPress: () => router.navigate("/(tabs)/PilTeslimNoktalari"),
                style: styles.fabAction,
                color: "#0D1521",
                labelTextColor: "#0D1521",
                size: "small",
              },
            ]}
            onStateChange={({ open }) => setFabOpen(open)}
          />
        </Portal>
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
    padding: 30,
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 17,
    color: "#555",
  },
  errorText: {
    marginTop: 15,
    fontSize: 20,
    fontWeight: "bold",
    color: "#D32F2F",
    textAlign: "center",
  },
  errorSubText: {
    marginTop: 10,
    fontSize: 15,
    color: "#444",
    textAlign: "center",
  },
  webViewLoader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  fab: {
    backgroundColor: "#0D1521",
  },
  fabAction: {
    backgroundColor: "white",
  },
});

export default Map;
