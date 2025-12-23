import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Linking,
  Platform,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Divider,
  PaperProvider,
  Searchbar,
  Text,
  useTheme,
} from "react-native-paper";
import { useDebounce } from "use-debounce";
import Header from "../../components/Header";
import { getPoints } from "../../services/api";

// --- 1. Yardımcı Fonksiyonlar ---
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

const getOccupancyInfo = (occupancy) => {
  if (occupancy < 30)
    return { color: ["#10b981", "#059669"], label: "Uygun", icon: "✅" };
  if (occupancy < 70)
    return { color: ["#f59e0b", "#d97706"], label: "Orta", icon: "⚠️" };
  return { color: ["#ef4444", "#dc2626"], label: "Dolu", icon: "🚫" };
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

// --- 2. Yardımcı Durum Component'leri ---
const LoadingComponent = () => (
  <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.centered}>
    <View style={styles.loadingCard}>
      <Text style={styles.loadingIcon}>🔋</Text>
      <ActivityIndicator size="large" color="#667eea" style={styles.spinner} />
      <Text style={styles.loadingTitle}>Teslim Noktaları Yükleniyor</Text>
      <Text style={styles.loadingSubtitle}>
        Size en yakın noktalar bulunuyor...
      </Text>
    </View>
  </LinearGradient>
);

const ErrorComponent = ({ message, onRetry }) => (
  <LinearGradient colors={["#f093fb", "#f5576c"]} style={styles.centered}>
    <View style={styles.errorCard}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>Bağlantı Hatası</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={onRetry}
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
    </View>
  </LinearGradient>
);

const EmptyComponent = ({ onRetry }) => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyIcon}>📭</Text>
    <Text style={styles.emptyTitle}>Nokta Bulunamadı</Text>
    <Text style={styles.emptySubtitle}>
      Arama kriterlerinizi değiştirin veya yeniden deneyin.
    </Text>
    <TouchableOpacity
      style={styles.emptyButton}
      onPress={onRetry}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={styles.emptyButtonGradient}
      >
        <Text style={styles.emptyButtonText}>🔄 Yenile</Text>
      </LinearGradient>
    </TouchableOpacity>
  </View>
);

const LocationPermissionBanner = ({ onGrant }) => (
  <View style={styles.permissionBanner}>
    <LinearGradient
      colors={["#fbbf24", "#f59e0b"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.permissionBannerGradient}
    >
      <View style={styles.permissionContent}>
        <Text style={styles.permissionIcon}>📍</Text>
        <View style={styles.permissionTextContainer}>
          <Text style={styles.permissionTitle}>Konum İzni Gerekli</Text>
          <Text style={styles.permissionText}>
            En yakın noktaları göstermek için konum izni verin
          </Text>
        </View>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={onGrant}
          activeOpacity={0.8}
        >
          <Text style={styles.permissionButtonText}>İzin Ver</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  </View>
);

// --- 3. Kart Component'i ---
const PointCard = memo(({ item, highlightedId, index, cardAnims }) => {
  const router = useRouter();
  const isHighlighted =
    (item.id || item.kurum_id).toString() === (highlightedId || "").toString();

  if (!cardAnims[index]) {
    cardAnims[index] = new Animated.Value(1);
  }

  const handleNavigate = () => {
    router.push({
      pathname: "/PilTeslim/PilTeslim",
      params: { ...item },
    });
  };

  const handleOpenMap = () => {
    openMap(item.latitude, item.longitude, item.kurum_name);
  };

  const occupancy = item.occupancy || 0;
  const occupancyInfo = getOccupancyInfo(occupancy);

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          opacity: cardAnims[index],
          transform: [
            {
              translateY: cardAnims[index].interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity activeOpacity={0.95} onPress={handleNavigate}>
        <View style={[styles.card, isHighlighted && styles.highlightedCard]}>
          {isHighlighted && (
            <View style={styles.highlightBadge}>
              <Text style={styles.highlightBadgeText}>📍 Seçili</Text>
            </View>
          )}

          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={["#667eea", "#764ba2"]}
                style={styles.iconGradient}
              >
                <Text style={styles.cardIcon}>🔋</Text>
              </LinearGradient>
            </View>

            <View style={styles.headerContent}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.kurum_name}
              </Text>
              {item.city && (
                <Text style={styles.cardSubtitle} numberOfLines={1}>
                  📍 {item.city}, {item.district || ""}
                </Text>
              )}
            </View>

            {item.distance != null && (
              <View style={styles.distanceBadge}>
                <Text style={styles.distanceText}>{item.distance}</Text>
                <Text style={styles.distanceUnit}>km</Text>
              </View>
            )}
          </View>

          <Divider style={styles.cardDivider} />

          {/* Card Body */}
          <View style={styles.cardBody}>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📍</Text>
              <Text style={styles.infoText} numberOfLines={2}>
                {item.kurum_adress}
              </Text>
            </View>

            {item.kurum_telefon && (
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📞</Text>
                <Text style={styles.infoText}>{item.kurum_telefon}</Text>
              </View>
            )}

            {occupancy > 0 && (
              <View style={styles.occupancySection}>
                <LinearGradient
                  colors={occupancyInfo.color}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.occupancyBadge}
                >
                  <Text style={styles.occupancyIcon}>{occupancyInfo.icon}</Text>
                  <Text style={styles.occupancyLabel}>
                    {occupancyInfo.label}
                  </Text>
                  <Text style={styles.occupancyValue}>%{occupancy}</Text>
                </LinearGradient>

                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBg}>
                    <LinearGradient
                      colors={occupancyInfo.color}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.progressBarFill,
                        { width: `${occupancy}%` },
                      ]}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Card Actions */}
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleOpenMap}
              activeOpacity={0.8}
            >
              <View style={styles.actionButtonOutline}>
                <Text style={styles.actionButtonIcon}>🗺️</Text>
                <Text style={styles.actionButtonTextOutline}>Yol Tarifi</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleNavigate}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#667eea", "#764ba2"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionButtonGradient}
              >
                <Text style={styles.actionButtonIcon}>🔋</Text>
                <Text style={styles.actionButtonTextFilled}>Teslim Et</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// --- 4. Ana Component ---
const PilTeslimNoktalari = () => {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [fabOpen, setFabOpen] = useState(false);

  const flatListRef = useRef(null);
  const params = useLocalSearchParams();
  const navigatedPointId = params.pointId;
  const [scrolledToItem, setScrolledToItem] = useState(false);
  const cardAnims = useRef([]).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
  const theme = useTheme();
  const router = useRouter();

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

        // Animasyonlar
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();

        data.forEach((_, index) => {
          if (!cardAnims[index]) {
            cardAnims[index] = new Animated.Value(0);
          }
          Animated.timing(cardAnims[index], {
            toValue: 1,
            duration: 400,
            delay: index * 60,
            useNativeDriver: true,
          }).start();
        });
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

  useEffect(() => {
    const loadData = async () => {
      const newLocation = await requestLocationPermission();
      await fetchPoints(newLocation);
    };
    loadData();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    const newLocation = await requestLocationPermission();
    await fetchPoints(newLocation);
  }, [requestLocationPermission, fetchPoints]);

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

  useEffect(() => {
    if (navigatedPointId) {
      setScrolledToItem(false);
    }
  }, [navigatedPointId]);

  useEffect(() => {
    if (
      !navigatedPointId ||
      scrolledToItem ||
      loading ||
      filteredPoints.length === 0
    ) {
      return;
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
            viewPosition: 0.5,
          });
          setScrolledToItem(true);
        }
      }, 300);
    }
  }, [filteredPoints, loading, navigatedPointId, scrolledToItem]);

  const renderItem = useCallback(
    ({ item, index }) => (
      <PointCard
        item={item}
        highlightedId={navigatedPointId}
        index={index}
        cardAnims={cardAnims}
      />
    ),
    [navigatedPointId, cardAnims]
  );

  const keyExtractor = useCallback(
    (item) => (item.id || item.kurum_id).toString(),
    []
  );

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

  if (loading && points.length === 0) {
    return <LoadingComponent />;
  }

  if (error && points.length === 0) {
    return <ErrorComponent message={error} onRetry={handleRefresh} />;
  }

  return (
    <PaperProvider>
      <View style={styles.container}>
        <Header />

        {/* Title Section */}
        <LinearGradient
          colors={["#667eea", "#764ba2"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.titleSection}
        >
          <Text style={styles.titleText}>🔋 Pil Teslim Noktaları</Text>
          <Text style={styles.subtitleText}>
            {filteredPoints.length} nokta bulundu
          </Text>
        </LinearGradient>

        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Adres veya şehir ara..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
            iconColor="#667eea"
            inputStyle={styles.searchInput}
          />
        </View>

        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <FlatList
            ref={flatListRef}
            data={filteredPoints}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={styles.flatList}
            showsVerticalScrollIndicator={false}
            initialNumToRender={5}
            maxToRenderPerBatch={5}
            windowSize={10}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={["#667eea"]}
                tintColor="#667eea"
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
        </Animated.View>

        {/* FAB Buttons */}
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fabButton}
            onPress={() => router.navigate("/(tabs)/Map")}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#667eea", "#764ba2"]}
              style={styles.fabGradient}
            >
              <Text style={styles.fabIcon}>🗺️</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </PaperProvider>
  );
};

// --- 5. Stiller ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  centered: {
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  loadingIcon: { fontSize: 80, marginBottom: 20 },
  spinner: { marginVertical: 15 },
  loadingTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2d3748",
    marginTop: 10,
  },
  loadingSubtitle: {
    fontSize: 15,
    color: "#718096",
    marginTop: 8,
    textAlign: "center",
  },
  errorCard: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    width: "90%",
  },
  errorIcon: { fontSize: 80, marginBottom: 20 },
  errorTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2d3748",
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: "#718096",
    textAlign: "center",
    marginBottom: 30,
  },
  retryButton: { borderRadius: 20, overflow: "hidden" },
  retryButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: "center",
  },
  retryButtonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  titleSection: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  titleText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },
  subtitleText: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    marginTop: 6,
  },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  searchbar: { backgroundColor: "#fff", borderRadius: 20, elevation: 4 },
  searchInput: { fontSize: 15 },
  flatList: { paddingBottom: 100 },
  permissionBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    overflow: "hidden",
  },
  permissionBannerGradient: { padding: 16 },
  permissionContent: { flexDirection: "row", alignItems: "center" },
  permissionIcon: { fontSize: 32, marginRight: 12 },
  permissionTextContainer: { flex: 1 },
  permissionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  permissionText: { fontSize: 13, color: "rgba(255,255,255,0.9)" },
  permissionButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  permissionButtonText: { fontSize: 14, fontWeight: "700", color: "#f59e0b" },
  cardWrapper: { marginHorizontal: 16, marginVertical: 8 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  highlightedCard: {
    borderWidth: 3,
    borderColor: "#667eea",
    shadowOpacity: 0.25,
    elevation: 10,
  },
  highlightBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#667eea",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 10,
  },
  highlightBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  cardHeader: { flexDirection: "row", alignItems: "center", padding: 16 },
  iconContainer: { marginRight: 12 },
  iconGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  cardIcon: { fontSize: 28 },
  headerContent: { flex: 1 },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  cardSubtitle: { fontSize: 13, color: "#6b7280" },
  distanceBadge: {
    alignItems: "center",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  distanceText: { fontSize: 20, fontWeight: "800", color: "#3b82f6" },
  distanceUnit: { fontSize: 11, fontWeight: "600", color: "#3b82f6" },
  cardDivider: { height: 1, backgroundColor: "#e5e7eb" },
  cardBody: { padding: 16 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  infoIcon: { fontSize: 18, marginRight: 8, marginTop: 2 },
  infoText: { flex: 1, fontSize: 14, color: "#4b5563", lineHeight: 20 },
  occupancySection: { marginTop: 12 },
  occupancyBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  occupancyIcon: { fontSize: 16, marginRight: 6 },
  occupancyLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    marginRight: 8,
  },
  occupancyValue: { fontSize: 14, fontWeight: "700", color: "#fff" },
  progressBarContainer: { marginTop: 8 },
  progressBarBg: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", borderRadius: 4 },
  cardActions: { flexDirection: "row", padding: 12, gap: 8 },
  actionButton: { flex: 1, borderRadius: 12, overflow: "hidden" },
  actionButtonOutline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: "#667eea",
    borderRadius: 12,
  },
  actionButtonIcon: { fontSize: 18, marginRight: 6 },
  actionButtonTextOutline: {
    fontSize: 14,
    fontWeight: "700",
    color: "#667eea",
  },
  actionButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  actionButtonTextFilled: { fontSize: 14, fontWeight: "700", color: "#fff" },
  emptyContainer: { alignItems: "center", paddingVertical: 60 },
  emptyIcon: { fontSize: 80, marginBottom: 20 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2d3748",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#718096",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: { borderRadius: 16, overflow: "hidden" },
  emptyButtonGradient: { paddingVertical: 14, paddingHorizontal: 32 },
  emptyButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  fabContainer: { position: "absolute", bottom: 120, right: 20, gap: 12 },
  fabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    hadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  fabIcon: { fontSize: 28 },
});

export default PilTeslimNoktalari;
