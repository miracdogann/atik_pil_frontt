// PilTeslimlerim.jsx - Kullanıcının kendi pil teslimlerini listeler (Kurum Detayları Eklendi)
import { useFocusEffect } from "@react-navigation/native";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Badge,
  Button,
  Card,
  Divider,
  IconButton,
  PaperProvider,
  Searchbar,
  Text,
  useTheme,
} from "react-native-paper";
import Header from "../../components/Header";
import { getDelivery } from "../../services/api";

// Durum renkleri ve etiketleri (Aynı)
const getStatusConfig = (status) => {
  switch (status) {
    case "onaylandi":
      return { color: "#4CAF50", label: "Onaylandı" };
    case "beklemede":
      return { color: "#FF9800", label: "Beklemede" };
    default:
      return { color: "#9E9E9E", label: "Bilinmiyor" };
  }
};

// Empty state component (Aynı)
const EmptyComponent = ({ onNewDelivery }) => (
  <View style={styles.centered}>
    <Image
      source={require("../../assets/icons/battery.png")}
      style={styles.emptyIcon}
    />
    <Text style={styles.emptyTitle}>Henüz pil teslimi yok</Text>
    <Text style={styles.emptySubText}>
      İlk tesliminizi yaparak çevreye katkı sağlayın!
    </Text>
    <Button
      mode="contained"
      onPress={onNewDelivery}
      icon="battery-arrow-down"
      style={styles.emptyButton}
      buttonColor="#6200ee"
    >
      Yeni Teslim Başlat
    </Button>
  </View>
);

// Loading ve Error component'ler (Aynı)
const LoadingComponent = () => (
  <View style={styles.centered}>
    <ActivityIndicator size="large" color="#6200ee" />
    <Text style={styles.loadingText}>Teslimleriniz yükleniyor...</Text>
  </View>
);

const ErrorComponent = ({ onRetry }) => (
  <View style={styles.centered}>
    <Text style={styles.errorText}>Teslimler yüklenemedi.</Text>
    <Text style={styles.errorSubText}>Bağlantınızı kontrol edin.</Text>
    <Button mode="outlined" onPress={onRetry} icon="refresh">
      Yeniden Dene
    </Button>
  </View>
);

// Memoized Card (YENİ EK: Kurum detayları row'ları)
const DeliveryCard = React.memo(({ item }) => {
  const router = useRouter();
  const theme = useTheme();

  const handlePress = () => {
    Alert.alert(
      "Teslim Detayı",
      `Adet: ${item.quantity}\nAçıklama: ${
        item.description || "Yok"
      }\nTarih: ${format(
        new Date(item.delivery_date),
        "dd/MM/yyyy HH:mm"
      )}\nKurum: ${item.kurum?.kurum_name || "N/A"}`,
      [{ text: "Tamam" }]
    );
  };

  const formattedDate = item.delivery_date
    ? format(new Date(item.delivery_date), "dd/MM/yyyy HH:mm")
    : "Tarih yok";

  // YENİ EK: Kurum detayları hazırla (güvenli erişim)
  const kurum = item.kurum || {};
  const kurumAdres = kurum.kurum_adress || "Adres yok";
  const kurumTelefon = kurum.kurum_telefon || "Telefon yok";
  const kurumKonum =
    [kurum.city, kurum.district].filter(Boolean).join(", ") || "Konum yok";

  const kurumStatus = getStatusConfig(item.kurum_onay_durumu);
  const adminStatus = getStatusConfig(item.admin_onay_durumu);

  return (
    <Card
      style={styles.card}
      onPress={handlePress}
      mode="elevated"
      accessibilityLabel={`Teslim ${item.delivery_id}`}
    >
      <Card.Cover source={{ uri: item.image_url }} style={styles.cardCover} />
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Pil Teslim Bilgileri
          </Text>
          <IconButton
            icon="dots-vertical"
            size={20}
            onPress={() => {}}
            accessibilityLabel="Daha fazla seçenek"
          />
        </View>
        <Divider style={styles.divider} />
        <View style={styles.infoRow}>
          <Text variant="bodyMedium" style={styles.infoLabel}>
            Adet:
          </Text>
          <Text variant="bodyMedium" style={styles.infoValue}>
            {item.quantity || "N/A"}
          </Text>
        </View>
        {item.description && (
          <View style={styles.infoRow}>
            <Text variant="bodySmall" style={styles.infoLabel}>
              Açıklama:
            </Text>
            <Text
              variant="bodySmall"
              style={styles.infoValue}
              numberOfLines={2}
            >
              {item.description}
            </Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Text variant="bodySmall" style={styles.infoLabel}>
            Tarih:
          </Text>
          <Text variant="bodySmall" style={styles.infoValue}>
            {formattedDate}
          </Text>
        </View>
        {/* YENİ EK: Kurum Detayları Grubu */}
        <View style={styles.kurumSection}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            Kurum Detayları
          </Text>
          <Divider style={styles.sectionDivider} />
          <View style={styles.infoRow}>
            <Text variant="bodySmall" style={styles.infoLabel}>
              Ad:
            </Text>
            <Text variant="bodySmall" style={styles.infoValue}>
              {kurum.kurum_name || "N/A"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text variant="bodySmall" style={styles.infoLabel}>
              Adres:
            </Text>
            <Text
              variant="bodySmall"
              style={styles.infoValue}
              numberOfLines={1}
            >
              {kurumAdres}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text variant="bodySmall" style={styles.infoLabel}>
              Telefon:
            </Text>
            <Text variant="bodySmall" style={styles.infoValue}>
              {kurumTelefon}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text variant="bodySmall" style={styles.infoLabel}>
              Şehir/İlçe:
            </Text>
            <Text variant="bodySmall" style={styles.infoValue}>
              {kurumKonum}
            </Text>
          </View>
        </View>
        {/* Ayrı Onay Badge'leri (Aynı) */}
        <View style={styles.statusContainer}>
          <View style={styles.badgeWrapper}>
            <Badge
              style={[
                styles.statusBadge,
                { backgroundColor: kurumStatus.color },
              ]}
              labelStyle={{ color: "white", fontSize: 11 }}
              accessibilityLabel="Kurum Onayı"
            >
              {kurumStatus.label}
            </Badge>
            <Text style={styles.badgeLabel}>Kurum Onayı</Text>
          </View>
          <View style={styles.badgeWrapper}>
            <Badge
              style={[
                styles.statusBadge,
                { backgroundColor: adminStatus.color },
              ]}
              labelStyle={{ color: "white", fontSize: 11 }}
              accessibilityLabel="Admin Onayı"
            >
              {adminStatus.label}
            </Badge>
            <Text style={styles.badgeLabel}>Admin Onayı</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
});

const PilTeslimlerim = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const theme = useTheme();
  const router = useRouter();

  // Veri çekme (Aynı)
  const fetchDeliveries = useCallback(async () => {
    setError(null);
    if (!refreshing) setLoading(true);
    try {
      const response = await getDelivery();
      setDeliveries(response.data || []);
    } catch (err) {
      setError("Teslimler getirilemedi. Bağlantınızı kontrol edin.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useFocusEffect(
    useCallback(() => {
      fetchDeliveries();
    }, [fetchDeliveries])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDeliveries();
  }, [fetchDeliveries]);

  const handleNewDelivery = useCallback(() => {
    router.push("/(tabs)/PilTeslimNoktalari");
  }, [router]);

  // Filtrelenmiş liste (Arama güncellendi: Kurum detaylarına da ara)
  const filteredDeliveries = useMemo(() => {
    if (!searchQuery) return deliveries;
    const lowerQuery = searchQuery.toLowerCase();
    return deliveries.filter(
      (item) =>
        (item.admin_onay_durumu || "").toLowerCase().includes(lowerQuery) ||
        (item.kurum_onay_durumu || "").toLowerCase().includes(lowerQuery) ||
        (item.kurum?.kurum_name || "").toLowerCase().includes(lowerQuery) ||
        (item.kurum?.kurum_adress || "").toLowerCase().includes(lowerQuery) || // YENİ EK
        (item.kurum?.kurum_telefon || "").toLowerCase().includes(lowerQuery) || // YENİ EK
        (item.kurum?.city || "").toLowerCase().includes(lowerQuery) || // YENİ EK
        (item.kurum?.district || "").toLowerCase().includes(lowerQuery) || // YENİ EK
        (item.description || "").toLowerCase().includes(lowerQuery)
    );
  }, [deliveries, searchQuery]);

  const renderItem = useCallback(
    ({ item }) => <DeliveryCard key={item.delivery_id} item={item} />,
    []
  );

  const keyExtractor = useCallback((item) => item.delivery_id.toString(), []);

  if (loading && deliveries.length === 0) {
    return <LoadingComponent />;
  }

  if (error && deliveries.length === 0) {
    return <ErrorComponent onRetry={fetchDeliveries} />;
  }

  return (
    <PaperProvider>
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Header
          title="Pil Teslimlerim"
          rightContent={
            <IconButton
              icon="battery-arrow-down"
              size={24}
              onPress={handleNewDelivery}
              accessibilityLabel="Yeni teslim başlat"
              iconColor="#6200ee"
            />
          }
        />
        <Divider style={styles.divider} />

        <Searchbar
          placeholder="Durum, kurum adı, adres veya açıklama ara..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          icon="magnify"
          elevation={1}
        />

        <FlatList
          data={filteredDeliveries}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.flatList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            !loading ? (
              <EmptyComponent onNewDelivery={handleNewDelivery} />
            ) : null
          }
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          removeClippedSubviews={true}
        />

        <View style={styles.bottomPadding} />
      </View>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    textAlign: "center",
    fontSize: 16,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    tintColor: "#6200ee",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    marginTop: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#d32f2f",
    textAlign: "center",
    marginBottom: 8,
  },
  errorSubText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  searchbar: {
    marginHorizontal: 16,
    marginBottom: 8,
    elevation: 2,
  },
  flatList: { paddingBottom: 16 },
  divider: { height: 1 },
  card: {
    marginVertical: 8,
    marginHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    elevation: 3,
  },
  cardCover: {
    height: 160,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontWeight: "600",
    flex: 1,
    color: "#333",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  infoLabel: {
    fontWeight: "500",
    color: "#666",
    flex: 0.4,
  },
  infoValue: {
    color: "#333",
    flex: 0.6,
    textAlign: "right",
  },
  // YENİ EK: Kurum section stilleri
  kurumSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  sectionTitle: {
    fontWeight: "bold",
    color: "#6200ee",
    marginBottom: 8,
  },
  sectionDivider: {
    marginBottom: 8,
    height: 1,
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  badgeWrapper: {
    alignItems: "center",
    flex: 0.5,
  },
  statusBadge: {
    alignSelf: "center",
  },
  badgeLabel: {
    fontSize: 10,
    color: "#999",
    marginTop: 2,
    textAlign: "center",
  },
  bottomPadding: {
    height: 20,
  },
});

export default PilTeslimlerim;
