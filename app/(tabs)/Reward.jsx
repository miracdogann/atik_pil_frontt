import { useAuth } from "@/context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Modal,
  Portal,
  Text,
  TextInput,
} from "react-native-paper";
import Header from "../../components/Header";
import { createUserReward, getRewards } from "../../services/api";

const { width, height } = Dimensions.get("window");
const CARD_MARGIN = 12;
const CARD_WIDTH = (width - CARD_MARGIN * 6) / 2;

const Reward = () => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState([]);
  const [selectedReward, setSelectedReward] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({ address: "" });

  const { user, updateUser } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef([]).current;

  const showModal = (reward) => {
    setSelectedReward(reward);
    setFormData({ address: "" });
    setVisible(true);
  };

  const hideModal = () => setVisible(false);

  useEffect(() => {
    getRewards()
      .then((response) => {
        setRewards(response.data);
        setLoading(false);

        // Fade-in animasyonu
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();

        // Kart animasyonları
        response.data.forEach((_, index) => {
          if (!cardAnims[index]) {
            cardAnims[index] = new Animated.Value(0);
          }
          Animated.timing(cardAnims[index], {
            toValue: 1,
            duration: 400,
            delay: index * 80,
            useNativeDriver: true,
          }).start();
        });
      })
      .catch((error) => {
        console.error("Ödüller alınırken hata oluştu:", error);
        setLoading(false);
      });
  }, []);

  const handleConfirmOrder = () => {
    if (!formData.address.trim()) {
      alert("Lütfen teslimat adresini girin.");
      return;
    }

    if (user.point < selectedReward.point) {
      alert(
        `Yetersiz puan! Gerekli: ${selectedReward.point}, Mevcut: ${user.point}`
      );
      return;
    }

    setModalLoading(true);
    createUserReward({
      reward: selectedReward.reward_id,
      adress: formData.address.trim(),
    })
      .then((response) => {
        const newPoint =
          response.updated_point || user.point - selectedReward.point;
        updateUser({ ...user, point: newPoint });
        alert(`🎉 Sipariş başarıyla alındı!\n\nKalan puan: ${newPoint}`);
        hideModal();
      })
      .catch((error) => {
        console.error("Sipariş hatası:", error);
        alert("❌ Sipariş oluşturulamadı. Lütfen tekrar deneyin.");
      })
      .finally(() => setModalLoading(false));
  };

  const renderItem = ({ item, index }) => {
    if (!cardAnims[index]) {
      cardAnims[index] = new Animated.Value(1);
    }

    const hasEnoughPoints = user?.point >= item.point;

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
              {
                scale: cardAnims[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => showModal(item)}
          disabled={!hasEnoughPoints}
        >
          <View style={styles.card}>
            {/* Image Container */}
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: item.image_url }}
                style={styles.cardImage}
                resizeMode="cover"
              />
              {!hasEnoughPoints && (
                <View style={styles.lockedOverlay}>
                  <Text style={styles.lockedIcon}>🔒</Text>
                  <Text style={styles.lockedText}>Yetersiz Puan</Text>
                </View>
              )}
            </View>

            {/* Card Content */}
            <View style={styles.cardContent}>
              <Text style={styles.productName} numberOfLines={2}>
                {item.reward_name}
              </Text>

              <View style={styles.pointBadge}>
                <LinearGradient
                  colors={
                    hasEnoughPoints
                      ? ["#fbbf24", "#f59e0b"]
                      : ["#9ca3af", "#6b7280"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.pointBadgeGradient}
                >
                  <Text style={styles.pointIcon}>⭐</Text>
                  <Text style={styles.pointText}>{item.point}</Text>
                </LinearGradient>
              </View>

              <TouchableOpacity
                style={[
                  styles.orderButton,
                  !hasEnoughPoints && styles.orderButtonDisabled,
                ]}
                onPress={() => showModal(item)}
                disabled={!hasEnoughPoints}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    hasEnoughPoints
                      ? ["#667eea", "#764ba2"]
                      : ["#d1d5db", "#9ca3af"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.orderButtonGradient}
                >
                  <Text style={styles.orderButtonText}>
                    {hasEnoughPoints ? "Sipariş Ver" : "Puan Yetersiz"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header />
        <LinearGradient
          colors={["#667eea", "#764ba2"]}
          style={styles.loadingContainer}
        >
          <View style={styles.loadingCard}>
            <Text style={styles.loadingIcon}>🎁</Text>
            <ActivityIndicator
              size="large"
              color="#667eea"
              style={styles.spinner}
            />
            <Text style={styles.loadingText}>Ödüller yükleniyor...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />

      {/* Point Display Banner */}
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.pointBanner}
      >
        <View style={styles.pointBannerContent}>
          <Text style={styles.pointLabel}>Toplam Puanınız</Text>
          <View style={styles.pointValueContainer}>
            <Text style={styles.pointValue}>{user?.point || 0}</Text>
            <Text style={styles.pointStar}>⭐</Text>
          </View>
        </View>
      </LinearGradient>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <FlatList
          data={rewards}
          keyExtractor={(item) => item.reward_id.toString()}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.flatList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>Henüz ödül bulunmuyor</Text>
            </View>
          }
        />
      </Animated.View>

      {/* Order Modal */}
      <Portal>
        <Modal
          visible={visible}
          onDismiss={hideModal}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modal}>
            {/* Modal Header */}
            <LinearGradient
              colors={["#667eea", "#764ba2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>🎁 Sipariş Onayı</Text>
              {selectedReward && (
                <View style={styles.modalRewardInfo}>
                  <Text style={styles.modalRewardName}>
                    {selectedReward.reward_name}
                  </Text>
                  <View style={styles.modalPointBadge}>
                    <Text style={styles.modalPointIcon}>⭐</Text>
                    <Text style={styles.modalPointText}>
                      {selectedReward.point} Puan
                    </Text>
                  </View>
                </View>
              )}
            </LinearGradient>

            {/* Modal Body */}
            <ScrollView
              style={styles.modalBody}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Text style={styles.inputIcon}>📍</Text>
                </View>
                <TextInput
                  label="Teslimat Adresi"
                  value={formData.address}
                  onChangeText={(text) =>
                    setFormData({ ...formData, address: text })
                  }
                  mode="outlined"
                  style={styles.input}
                  multiline
                  numberOfLines={4}
                  placeholder="Ödülünüzün teslim edileceği adresi girin..."
                  outlineColor="#e5e7eb"
                  activeOutlineColor="#667eea"
                  theme={{
                    colors: {
                      primary: "#667eea",
                      text: "#1f2937",
                      placeholder: "#9ca3af",
                    },
                  }}
                />
              </View>

              {/* Info Box */}
              <View style={styles.infoBox}>
                <Text style={styles.infoIcon}>ℹ️</Text>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoTitle}>Önemli Bilgi</Text>
                  <Text style={styles.infoText}>
                    Siparişiniz onaylandıktan sonra {selectedReward?.point} puan
                    hesabınızdan düşülecektir.
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={hideModal}
                disabled={modalLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirmOrder}
                disabled={modalLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#667eea", "#764ba2"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.confirmButtonGradient}
                >
                  {modalLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.confirmButtonText}>
                      ✓ Siparişi Onayla
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  loadingIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  spinner: {
    marginVertical: 15,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d3748",
    marginTop: 10,
  },
  pointBanner: {
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
  pointBannerContent: {
    alignItems: "center",
  },
  pointLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  pointValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  pointValue: {
    fontSize: 48,
    fontWeight: "800",
    color: "#fff",
    marginRight: 8,
  },
  pointStar: {
    fontSize: 32,
  },
  flatList: {
    padding: CARD_MARGIN,
    paddingBottom: 30,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    margin: CARD_MARGIN,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: CARD_WIDTH * 0.85,
    backgroundColor: "#f3f4f6",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  lockedIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  lockedText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  cardContent: {
    padding: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 12,
    lineHeight: 22,
    minHeight: 44,
  },
  pointBadge: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  pointBadgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  pointIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  pointText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  orderButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  orderButtonDisabled: {
    opacity: 0.6,
  },
  orderButtonGradient: {
    paddingVertical: 12,
    alignItems: "center",
  },
  orderButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6b7280",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 30,
    width: "100%",
    maxWidth: 500,
    maxHeight: height * 0.8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHeader: {
    padding: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 16,
  },
  modalRewardInfo: {
    alignItems: "center",
  },
  modalRewardName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  modalPointBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modalPointIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  modalPointText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  modalBody: {
    flex: 1,
    padding: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputIconContainer: {
    marginBottom: 12,
  },
  inputIcon: {
    fontSize: 32,
  },
  input: {
    backgroundColor: "#fff",
    fontSize: 15,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#eff6ff",
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e40af",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: "#1e40af",
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6b7280",
  },
  confirmButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  confirmButtonGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});

export default Reward;
