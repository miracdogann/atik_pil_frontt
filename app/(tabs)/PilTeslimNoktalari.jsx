// PilTeslimNoktalari.jsx (Haritadan Yönlendirmeyi Alır, Kayar ve VURGULAR)
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
  Platform,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Divider,
  FAB,
  PaperProvider,
  Portal,
  ProgressBar,
  Searchbar,
  Text,
  useTheme,
} from "react-native-paper";
import { useDebounce } from "use-debounce";
import Header from "../../components/Header";
import { getPoints } from "../../services/api";

// --- 1. Yardımcı Fonksiyonlar (Değişiklik yok) ---
const calculateDistance = (userLoc, pointLoc) => {
  if (!userLoc || !pointLoc || !pointLoc.lat || !pointLoc.lng) return null;
  const R = 6371;
  const dLat = (pointLoc.lat - userLoc.latitude) * (Math.PI / 180);
  const dLng = (pointLoc.lng - userLoc.longitude) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((userLoc.latitude * Math.PI) / 180) *
      Math.cos((pointLoc.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

const getOccupancyColor = (occupancy) => {
  if (occupancy < 30) return "#4CAF50";
  if (occupancy < 70) return "#FF9800";
  return "#F44336";
};

const openMap = (latitude, longitude, name) => {
  if (!latitude || !longitude) {
    Alert.alert("Konum Yok", "Bu nokta için konum bilgisi bulunamadı.");
    return;
  }
  const scheme = Platform.OS === "ios" ? "maps:0,0?q=" : "geo:0,0?q=";
  const latLng = `${latitude},${longitude}`;
  const label = encodeURIComponent(name);
  const url =
    Platform.OS === "ios"
      ? `${scheme}${label}@${latLng}`
      : `${scheme}${latLng}(${label})`;

  Linking.openURL(url).catch((err) => {
    console.error("Harita açılamadı", err);
    Alert.alert("Hata", "Harita uygulaması açılamadı.");
  });
};

// --- 2. Yardımcı Durum Component'leri (Değişiklik yok) ---
const LoadingComponent = () => (
  <View style={styles.centered}>
    <ActivityIndicator size="large" />
    <Text style={styles.loadingText}>Noktalar yükleniyor...</Text>
  </View>
);

const ErrorComponent = ({ message, onRetry }) => (
  <View style={styles.centered}>
    <Text style={styles.errorText}>Hata: {message}</Text>
    <Button mode="outlined" onPress={onRetry}>
      Yeniden Dene
    </Button>
  </View>
);

const EmptyComponent = ({ onRetry }) => (
  <View style={styles.centered}>
    <Text style={styles.emptyText}>Teslim noktası bulunamadı.</Text>
    <Text style={styles.emptySubText}>
      Arama kriterlerinizi değiştirin veya daha sonra tekrar deneyin.
    </Text>
    <Button mode="outlined" onPress={onRetry}>
      Yenile
    </Button>
  </View>
);

const LocationPermissionBanner = ({ onGrant }) => (
  <View style={styles.banner}>
    <Text style={styles.bannerText}>
      Size en yakın noktaları göstermek için konum izni gerekli.
    </Text>
    <Button mode="text" onPress={onGrant}>
      İzin Ver
    </Button>
  </View>
);

// --- 3. Kart Component'i (!!! DEĞİŞİKLİK BURADA !!!) ---
// Artık 'highlightedId' prop'unu alıyor
const PointCard = memo(({ item, highlightedId }) => {
  const router = useRouter();

  // Kendi ID'si ile haritadan gelen ID'yi karşılaştır
  const isHighlighted =
    (item.id || item.kurum_id).toString() === (highlightedId || "").toString();

  const handleNavigate = () => {
    router.push({
      pathname: "/PilTeslim/PilTeslim",
      params: { ...item },
    });
  };

  const handleOpenMap = () => {
    openMap(item.latitude, item.longitude, item.kurum_name);
  };

  const occupancy = item.occupancy;
  const progress = Math.min(Math.max(occupancy || 0, 0) / 100, 1);

  return (
    // <-- DEĞİŞİKLİK: Vurgu stili eklendi
    <Card
      style={[styles.card, isHighlighted && styles.highlightedCard]}
      mode="elevated"
      elevation={isHighlighted ? 8 : 2} // Vurgulu karta daha fazla gölge ver
      onPress={handleNavigate}
    >
      <Card.Title
        title={item.kurum_name}
        titleNumberOfLines={2}
        titleStyle={styles.cardTitle}
        subtitle={item.city ? `${item.city}, ${item.district || ""}` : null}
        subtitleNumberOfLines={1}
        left={(props) => (
          <Text {...props} style={styles.cardIcon}>
            🔋
          </Text>
        )}
        right={(props) =>
          item.distance != null ? (
            <Text {...props} style={styles.cardDistance}>
              {item.distance} km
            </Text>
          ) : null
        }
      />
      <Card.Content>
        <Text
          variant="bodyMedium"
          style={styles.cardDescription}
          numberOfLines={2}
        >
          {item.kurum_adress}
        </Text>
        {item.kurum_telefon && (
          <Text variant="bodySmall" style={styles.cardDescription}>
            Tel: {item.kurum_telefon}
          </Text>
        )}
        {occupancy != null && occupancy > 0 && (
          <View style={styles.occupancyContainer}>
            <Text variant="bodySmall" style={styles.occupancyText}>
              Doluluk: %{occupancy}
            </Text>
            <ProgressBar
              progress={progress}
              color={getOccupancyColor(occupancy)}
              style={styles.progressBar}
            />
          </View>
        )}
      </Card.Content>
      <Card.Actions>
        <Button
          mode="outlined"
          onPress={handleOpenMap}
          icon="map-marker-outline"
          style={styles.actionButton}
        >
          Yol Tarifi
        </Button>
        <Button
          mode="contained"
          onPress={handleNavigate}
          icon="battery-arrow-down"
          style={styles.actionButton}
        >
          Teslim Et
        </Button>
      </Card.Actions>
    </Card>
  );
});

// --- 4. Ana Component (!!! DEĞİŞİKLİK BURADA !!!) ---

const PilTeslimNoktalari = () => {
  // --- State'ler ---
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [fabOpen, setFabOpen] = useState(false);

  // --- ID'yi Almak ve Kaydırmak için State'ler ---
  const flatListRef = useRef(null);
  const params = useLocalSearchParams();
  const navigatedPointId = params.pointId;
  const [scrolledToItem, setScrolledToItem] = useState(false);

  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
  const theme = useTheme();
  const router = useRouter();

  // --- Fonksiyonlar ---
  const requestLocationPermission = useCallback(async () => {
    setLocationError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const newUserLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setUserLocation(newUserLocation);
        return newUserLocation;
      } else {
        setLocationError("Konum izni reddedildi. Mesafeler gösterilemeyecek.");
        return null;
      }
    } catch (err) {
      console.warn("Konum alınamadı:", err);
      setLocationError("Konum alınırken bir hata oluştu.");
      return null;
    }
  }, []);

  const fetchPoints = useCallback(
    async (location) => {
      const loc = location || userLocation;
      setError(null);
      if (!refreshing) {
        setLoading(true);
      }

      try {
        const response = await getPoints();
        const data = (response?.data || []).map((point) => ({
          ...point,
          distance: calculateDistance(loc, {
            lat: point.latitude,
            lng: point.longitude,
          }),
        }));

        if (loc) {
          data.sort((a, b) => (a.distance || 999) - (b.distance || 999));
        } else {
          data.sort((a, b) =>
            (a.kurum_name || "").localeCompare(b.kurum_name || "")
          );
        }
        setPoints(data);
      } catch (err) {
        setError("Noktalar yüklenemedi. İnternet bağlantınızı kontrol edin.");
        console.error("Pil Teslim Noktaları hatası:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userLocation, refreshing]
  );

  // İlk Yükleme
  useEffect(() => {
    const loadData = async () => {
      const newLocation = await requestLocationPermission();
      await fetchPoints(newLocation);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Yenileme
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    const newLocation = await requestLocationPermission();
    await fetchPoints(newLocation);
  }, [requestLocationPermission, fetchPoints]);

  // Filtrelenmiş Noktalar
  const filteredPoints = useMemo(() => {
    let filtered = points;
    if (debouncedSearchQuery) {
      const lowerQuery = debouncedSearchQuery.toLowerCase();
      filtered = points.filter(
        (point) =>
          (point.kurum_name || "").toLowerCase().includes(lowerQuery) ||
          (point.kurum_adress || "").toLowerCase().includes(lowerQuery) ||
          (point.city || "").toLowerCase().includes(lowerQuery)
      );
    }
    if (userLocation) {
      filtered.sort((a, b) => (a.distance || 999) - (b.distance || 999));
    }
    return filtered;
  }, [points, debouncedSearchQuery, userLocation]);

  // --- Karta Kaydırma Efekti (!!! GÜNCELLENDİ !!!) ---

  // <-- DEĞİŞİKLİK: Bu 'useEffect', haritadan yeni bir ID geldiğinde
  // kaydırma kilidini ('scrolledToItem') açar. Bu, art arda
  // farklı noktalara tıklamanın çalışmasını sağlar.
  useEffect(() => {
    if (navigatedPointId) {
      setScrolledToItem(false); // Yeni ID geldi, kaydırmaya izin ver
    }
  }, [navigatedPointId]);

  // Bu 'useEffect' asıl kaydırma işlemini yapar
  useEffect(() => {
    if (
      !navigatedPointId || // Kaydırılacak ID yoksa
      scrolledToItem || // Zaten kaydırılmışsa
      loading || // Veri henüz yükleniyorsa
      filteredPoints.length === 0 // Liste boşsa
    ) {
      return; // İşlem yapma
    }

    const targetIndex = filteredPoints.findIndex(
      (point) =>
        (point.id || point.kurum_id).toString() === navigatedPointId.toString()
    );

    if (targetIndex !== -1 && flatListRef.current) {
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({
            index: targetIndex,
            animated: true,
            viewPosition: 0.5, // 0.5 = Kartı ekranın ortasına getir
          });
          setScrolledToItem(true); // "Kaydırma yapıldı" olarak işaretle
        }
      }, 300);
    }
  }, [filteredPoints, loading, navigatedPointId, scrolledToItem]);
  // --- Kaydırma Efekti Sonu ---

  // --- Render Fonksiyonları (FlatList için) ---

  // <-- DEĞİŞİKLİK: 'renderItem' artık 'highlightedId' prop'unu kartlara aktarıyor
  const renderItem = useCallback(
    ({ item }) => <PointCard item={item} highlightedId={navigatedPointId} />,
    [navigatedPointId] // 'navigatedPointId' değiştiğinde 'renderItem'ı güncelle
  );

  const keyExtractor = useCallback(
    (item) => (item.id || item.kurum_id).toString(),
    []
  );

  // 'En Yakın' FAB Tıklaması
  const handleFabPress = () => {
    const nearestPoint = filteredPoints[0];
    if (nearestPoint) {
      openMap(
        nearestPoint.latitude,
        nearestPoint.longitude,
        nearestPoint.kurum_name
      );
    }
  };

  // --- Render Durumları ---
  if (loading && points.length === 0) {
    return <LoadingComponent />;
  }

  if (error && points.length === 0) {
    return <ErrorComponent message={error} onRetry={handleRefresh} />;
  }

  // --- Ana Render ---
  return (
    <PaperProvider>
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Header />
        <Divider style={styles.divider} />

        <Text
          variant="headlineSmall"
          style={styles.headerText}
          accessibilityRole="header"
        >
          Pil Teslim Noktaları
        </Text>

        <Searchbar
          placeholder="Nokta, adres veya şehir ara..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          icon="magnify"
        />

        <FlatList
          ref={flatListRef}
          data={filteredPoints}
          keyExtractor={keyExtractor}
          renderItem={renderItem} // <-- Güncellenmiş 'renderItem'
          contentContainerStyle={styles.flatList}
          showsVerticalScrollIndicator={false}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={10}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
            />
          }
          ListHeaderComponent={
            locationError && !userLocation ? (
              <LocationPermissionBanner onGrant={requestLocationPermission} />
            ) : null
          }
          ListEmptyComponent={
            !loading ? <EmptyComponent onRetry={handleRefresh} /> : null
          }
        />

        {/* FAB.Group */}
        <Portal>
          <FAB.Group
            open={fabOpen}
            visible={true}
            icon={fabOpen ? "close" : "layers-outline"}
            color="#fff"
            fabStyle={[styles.fab, { backgroundColor: theme.colors.primary }]}
            actions={[
              {
                icon: "map",
                label: "Haritada Göster",
                onPress: () => router.navigate("/(tabs)/LoadMap"),
                style: styles.fabAction,
                color: "#0D1521",
                labelTextColor: "#0D1521",
                size: "small",
              },
              {
                icon: "navigation-variant",
                label: "En Yakın",
                onPress: handleFabPress,
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

// --- 5. Stiller (!!! DEĞİŞİKLİK BURADA !!!) ---

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    textAlign: "center",
    fontSize: 16,
  },
  headerText: {
    paddingHorizontal: 16,
    marginVertical: 12,
    fontWeight: "bold",
    color: "#333",
  },
  divider: { height: 1 },
  searchbar: { marginHorizontal: 12, marginBottom: 8, elevation: 1 },
  flatList: { paddingBottom: 80 },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "500",
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginBottom: 20,
  },
  errorText: {
    textAlign: "center",
    color: "#d32f2f",
    marginBottom: 15,
    fontSize: 16,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
  fabAction: {
    backgroundColor: "white",
  },
  banner: {
    backgroundColor: "#fff8e1",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    margin: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffe57f",
  },
  bannerText: {
    flex: 1,
    color: "#6d4c41",
  },
  card: {
    marginVertical: 8,
    marginHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 2, // Vurgu için yer hazırla
    borderColor: "transparent", // Normalde görünmez
  },
  // <-- DEĞİŞİKLİK: Vurgulanan kart için yeni stil
  highlightedCard: {
    borderColor: "#6200ee", // Ana tema renginiz (veya dilediğiniz bir renk)
    borderWidth: 2,
    transform: [{ scale: 1.01 }], // Hafif büyüt
  },
  cardIcon: {
    fontSize: 28,
    marginLeft: 8,
  },
  cardTitle: {
    fontWeight: "bold",
    fontSize: 17,
    lineHeight: 22,
  },
  cardDistance: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#6200ee",
    marginRight: 16,
  },
  cardDescription: {
    color: "#444",
    marginBottom: 4,
  },
  occupancyContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  occupancyText: {
    fontSize: 13,
    color: "#666",
    marginRight: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default PilTeslimNoktalari;
