import { useAuth } from "@/context/AuthContext";
import { getUserReward } from "@/services/api";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const MyOrder = () => {
  const { isAuthenticated, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef([]).current;

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }
    loadOrders();
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!loading && orders.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // Kart animasyonlarını başlat
      orders.forEach((_, index) => {
        if (!cardAnims[index]) {
          cardAnims[index] = new Animated.Value(0);
        }
        Animated.timing(cardAnims[index], {
          toValue: 1,
          duration: 400,
          delay: index * 100,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [loading, orders]);

  const loadOrders = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const response = await getUserReward();
      setOrders(response.data || []);
    } catch (error) {
      console.error(
        "Siparişler yükleme hatası:",
        error.response?.data || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      siparis_alindi: {
        label: "Sipariş Alındı",
        color: ["#3b82f6", "#2563eb"],
        icon: "📦",
        textColor: "#fff",
      },
      siparis_gonderildi: {
        label: "Kargoda",
        color: ["#f59e0b", "#d97706"],
        icon: "🚚",
        textColor: "#fff",
      },
      siparis_teslim_edildi: {
        label: "Teslim Edildi",
        color: ["#10b981", "#059669"],
        icon: "✅",
        textColor: "#fff",
      },
      siparis_iptal_edildi: {
        label: "İptal Edildi",
        color: ["#ef4444", "#dc2626"],
        icon: "❌",
        textColor: "#fff",
      },
    };
    return (
      statusMap[status] || {
        label: status,
        color: ["#6b7280", "#4b5563"],
        icon: "📋",
        textColor: "#fff",
      }
    );
  };

  const renderOrderItem = ({ item, index }) => {
    const statusInfo = getStatusInfo(item.status);

    // Her kart için animasyon değeri oluştur
    if (!cardAnims[index]) {
      cardAnims[index] = new Animated.Value(1);
    }

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
        <TouchableOpacity activeOpacity={0.95}>
          <View style={styles.card}>
            {/* Status Badge */}
            <LinearGradient
              colors={statusInfo.color}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.statusBadge}
            >
              <Text style={styles.statusIcon}>{statusInfo.icon}</Text>
              <Text style={styles.statusText}>{statusInfo.label}</Text>
            </LinearGradient>

            <View style={styles.cardContent}>
              {/* Product Image & Info */}
              <View style={styles.productSection}>
                {item.reward_detail?.image_url ? (
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: item.reward_detail.image_url }}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                  </View>
                ) : (
                  <View
                    style={[styles.imageContainer, styles.placeholderImage]}
                  >
                    <Text style={styles.placeholderIcon}>🎁</Text>
                  </View>
                )}

                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {item.reward_detail?.reward_name ||
                      item.reward_name ||
                      "Bilinmeyen Ürün"}
                  </Text>
                  <View style={styles.pointBadge}>
                    <Text style={styles.pointIcon}>⭐</Text>
                    <Text style={styles.pointText}>
                      {item.total_point || 0} Puan
                    </Text>
                  </View>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Order Details */}
              <View style={styles.detailsSection}>
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Text style={styles.iconText}>📅</Text>
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Sipariş Tarihi</Text>
                    <Text style={styles.detailValue}>
                      {item.formatted_date ||
                        item.order_date?.slice(0, 10) ||
                        "Tarih yok"}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Text style={styles.iconText}>📍</Text>
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Teslimat Adresi</Text>
                    <Text style={styles.detailValue} numberOfLines={2}>
                      {item.adress || "Adres belirtilmemiş"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingIcon}>📦</Text>
          <Text style={styles.loadingText}>Siparişleriniz yükleniyor...</Text>
        </View>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyIcon}>🔒</Text>
          <Text style={styles.emptyTitle}>Giriş Yapın</Text>
          <Text style={styles.emptySubtitle}>
            Siparişlerinizi görmek için lütfen giriş yapın
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Siparişlerim</Text>
        <View style={styles.orderCountBadge}>
          <Text style={styles.orderCountText}>{orders.length}</Text>
        </View>
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) =>
            item.id?.toString() || Math.random().toString()
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#667eea"]}
              tintColor="#667eea"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>Henüz Sipariş Yok</Text>
              <Text style={styles.emptySubtitle}>
                Puanlarınızla ödül kazanmaya başlayın!
              </Text>
            </View>
          }
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2d3748",
  },
  orderCountBadge: {
    backgroundColor: "#667eea",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 40,
    alignItems: "center",
  },
  orderCountText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  cardWrapper: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  statusIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  statusText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  cardContent: {
    padding: 16,
  },
  productSection: {
    flexDirection: "row",
    marginBottom: 16,
  },
  imageContainer: {
    width: 90,
    height: 90,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e5e7eb",
  },
  placeholderIcon: {
    fontSize: 40,
  },
  productInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "space-between",
  },
  productName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    lineHeight: 24,
    marginBottom: 8,
  },
  pointBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  pointIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  pointText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#92400e",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginBottom: 16,
  },
  detailsSection: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 15,
    color: "#1f2937",
    fontWeight: "500",
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: "center",
  },
  loadingIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    color: "#667eea",
    fontWeight: "600",
  },
  emptyStateContainer: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2d3748",
    marginBottom: 12,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#718096",
    textAlign: "center",
    lineHeight: 24,
  },
});

export default MyOrder;
