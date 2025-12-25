import { useAuth } from "@/context/AuthContext";
import { createUserReward, getRewards } from "@/services/api";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  IconButton,
  Modal,
  Portal,
  ProgressBar,
  Surface,
  Text,
  TextInput,
} from "react-native-paper";
import Toast from "react-native-toast-message";
import Header from "../../components/Header";

const { width } = Dimensions.get("window");
const COLUMNS = 2;
const SPACING = 15;
const CARD_WIDTH = (width - SPACING * (COLUMNS + 1)) / COLUMNS;

const Reward = () => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState([]);
  const [selectedReward, setSelectedReward] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({ address: "" });

  const { user, updateUser } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getRewards()
      .then((response) => {
        setRewards(response.data);
        setLoading(false);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      })
      .catch((error) => {
        console.error("Ödül hatası:", error);
        setLoading(false);
        Toast.show({
          type: "error",
          text1: "Hata",
          text2: "Bağlantı sorunu oluştu.",
        });
      });
  }, []);

  const showModal = (reward) => {
    setSelectedReward(reward);
    setFormData({ address: user?.adress || "" });
    setVisible(true);
  };

  const hideModal = () => setVisible(false);

  const handleConfirmOrder = () => {
    if (!formData.address.trim()) {
      Toast.show({
        type: "error",
        text1: "Eksik Bilgi",
        text2: "Teslimat adresi gerekli.",
      });
      return;
    }

    setModalLoading(true);
    createUserReward({
      reward: selectedReward.reward_id,
      adress: formData.address.trim(),
    })
      .then((response) => {
        const newPoint =
          response.updated_point !== undefined
            ? response.updated_point
            : user.point - selectedReward.point;

        updateUser({ ...user, point: newPoint });

        Toast.show({
          type: "success",
          text1: "Tebrikler! 🎁",
          text2: "Ödül talebiniz alındı.",
        });
        hideModal();
      })
      .catch((error) => {
        Toast.show({
          type: "error",
          text1: "Hata",
          text2: "İşlem gerçekleştirilemedi.",
        });
      })
      .finally(() => setModalLoading(false));
  };

  const renderItem = ({ item }) => {
    const hasEnoughPoints = user?.point >= item.point;
    const progress = Math.min((user?.point || 0) / item.point, 1);

    const scaleAnim = fadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.9, 1],
    });

    return (
      <Animated.View
        style={{ transform: [{ scale: scaleAnim }], opacity: fadeAnim }}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => hasEnoughPoints && showModal(item)}
          disabled={!hasEnoughPoints}
          style={styles.cardContainer}
        >
          <Surface style={styles.card} elevation={3}>
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: item.image_url }}
                style={[styles.cardImage, !hasEnoughPoints && styles.grayscale]}
                resizeMode="cover"
              />
              <View style={styles.pointBadgeOverlay}>
                <Text style={styles.pointBadgeText}>{item.point}</Text>
                <Text style={styles.pointBadgeIcon}>⭐</Text>
              </View>

              {!hasEnoughPoints && (
                <View style={styles.lockedOverlay}>
                  <View style={styles.lockIconBg}>
                    <IconButton icon="lock" iconColor="#fff" size={20} />
                  </View>
                </View>
              )}
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.reward_name}
              </Text>

              {hasEnoughPoints ? (
                <LinearGradient
                  colors={["#667eea", "#764ba2"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionButtonText}>Hemen Al</Text>
                </LinearGradient>
              ) : (
                <View style={styles.progressContainer}>
                  <View style={styles.progressTextRow}>
                    <Text style={styles.progressLabel}>Hedef</Text>
                    <Text style={styles.progressPercent}>
                      {Math.floor(progress * 100)}%
                    </Text>
                  </View>
                  <ProgressBar
                    progress={progress}
                    color="#FF9800"
                    style={styles.progressBar}
                  />
                  <Text style={styles.missingPointsText}>
                    {item.point - user.point} puan gerekli
                  </Text>
                </View>
              )}
            </View>
          </Surface>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />

      <FlatList
        data={rewards}
        keyExtractor={(item) => item.reward_id.toString()}
        renderItem={renderItem}
        numColumns={COLUMNS}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerWrapper}>
            <LinearGradient
              colors={["#232526", "#414345"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.walletCard}
            >
              <View style={styles.decorativeCircle1} />
              <View style={styles.decorativeCircle2} />

              <View style={styles.walletTop}>
                <View>
                  <Text style={styles.walletLabel}>Toplam Puan</Text>
                  <Text style={styles.walletBalance}>{user?.point || 0}</Text>
                </View>
                <View style={styles.walletIconBg}>
                  <IconButton
                    icon="trophy-variant"
                    iconColor="#FFD700"
                    size={28}
                  />
                </View>
              </View>

              <View style={styles.walletBottom}>
                <Text style={styles.walletSubText}>Harcayarak ödül kazan</Text>
                <Text style={styles.walletId}>
                  ID: {user?.id?.toString().padStart(6, "0")}
                </Text>
              </View>
            </LinearGradient>
            <Text style={styles.sectionTitle}>Mevcut Ödüller</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🎁</Text>
            <Text style={styles.emptyText}>Şu an ödül bulunmuyor.</Text>
          </View>
        }
      />

      {/* MODAL VE KLAVYE DÜZELTMESİ */}
      <Portal>
        <Modal
          visible={visible}
          onDismiss={hideModal}
          contentContainerStyle={styles.modalOverlay} // Özel stil değişikliği
        >
          {/* KeyboardAvoidingView Tüm Modal'ı Kapsamalı */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          >
            {/* ScrollView ekleyerek içeriğin kaydırılabilir olmasını sağladık */}
            <Surface style={styles.modalCard}>
              <View style={styles.modalHandle} />

              {/* İçeriği ScrollView içine alıyoruz */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollableModalContent}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalTitle}>Sipariş Özeti</Text>
                  <IconButton
                    icon="close-circle-outline"
                    size={26}
                    onPress={hideModal}
                  />
                </View>

                {selectedReward && (
                  <View style={styles.productRow}>
                    <Image
                      source={{ uri: selectedReward.image_url }}
                      style={styles.productThumb}
                    />
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>
                        {selectedReward.reward_name}
                      </Text>
                      <Text style={styles.productPrice}>
                        {selectedReward.point} Puan
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.divider} />

                <Text style={styles.inputLabel}>Teslimat Adresi</Text>
                <TextInput
                  mode="outlined"
                  value={formData.address}
                  onChangeText={(text) =>
                    setFormData({ ...formData, address: text })
                  }
                  placeholder="Mahalle, Cadde, No, İlçe/İl"
                  multiline
                  numberOfLines={3}
                  style={styles.textInput}
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#6200ee"
                  theme={{ roundness: 12 }}
                />

                <View style={styles.newBalanceContainer}>
                  <Text style={styles.newBalanceLabel}>
                    İşlem Sonrası Bakiye:
                  </Text>
                  <Text style={styles.newBalanceValue}>
                    {(user?.point || 0) - (selectedReward?.point || 0)} P
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleConfirmOrder}
                  disabled={modalLoading}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={["#6200ee", "#7c4dff"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.confirmButton}
                  >
                    {modalLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.confirmButtonText}>
                        Onayla ve Bitir
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
                {/* Klavye açıldığında ekstra boşluk için */}
                <View style={{ height: 20 }} />
              </ScrollView>
            </Surface>
          </KeyboardAvoidingView>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6F8",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingBottom: 40,
  },
  columnWrapper: {
    paddingHorizontal: SPACING,
    justifyContent: "space-between",
  },

  // Wallet Styles
  headerWrapper: {
    padding: SPACING,
    marginBottom: 5,
  },
  walletCard: {
    borderRadius: 24,
    padding: 24,
    height: 180,
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
  },
  decorativeCircle1: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  decorativeCircle2: {
    position: "absolute",
    bottom: -80,
    left: -20,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  walletTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  walletLabel: {
    color: "#B0B0B0",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  walletBalance: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  walletIconBg: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 4,
  },
  walletBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  walletSubText: {
    color: "#E0E0E0",
    fontSize: 14,
  },
  walletId: {
    color: "#757575",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
    marginLeft: 4,
  },

  // Cards
  cardContainer: {
    width: CARD_WIDTH,
    marginBottom: SPACING,
  },
  card: {
    borderRadius: 20,
    backgroundColor: "#fff",
    overflow: "hidden",
    height: 250,
  },
  imageWrapper: {
    height: 140,
    backgroundColor: "#F0F0F0",
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  grayscale: {
    opacity: 0.6,
    tintColor: "gray",
  },
  pointBadgeOverlay: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  pointBadgeText: {
    color: "#FFD700",
    fontWeight: "bold",
    fontSize: 12,
    marginRight: 4,
  },
  pointBadgeIcon: {
    fontSize: 10,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  lockIconBg: {
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 30,
    padding: 4,
  },
  cardContent: {
    padding: 12,
    flex: 1,
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2D3436",
    marginBottom: 8,
  },
  actionButton: {
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 10,
    color: "#888",
  },
  progressPercent: {
    fontSize: 10,
    color: "#FF9800",
    fontWeight: "bold",
  },
  progressBar: {
    height: 6,
    borderRadius: 4,
    backgroundColor: "#F0F0F0",
  },
  missingPointsText: {
    fontSize: 10,
    color: "#E53935",
    marginTop: 4,
    textAlign: "right",
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 50,
  },
  emptyEmoji: {
    fontSize: 50,
    marginBottom: 10,
  },
  emptyText: {
    color: "#999",
    fontSize: 16,
  },

  // MODAL VE KLAVYE STYLES
  modalOverlay: {
    justifyContent: "flex-end", // Klavye kapalıyken altta dursun
    margin: 0,
    flex: 1, // Portal içinde tam ekranı kapsaması için
  },
  keyboardView: {
    flex: 1,
    justifyContent: "flex-end", // Klavye açılınca yukarı itmesini sağlar
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "90%", // Ekranın %90'ından fazla yer kaplamasın
  },
  scrollableModalContent: {
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 10,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2D3436",
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    borderRadius: 16,
    padding: 12,
  },
  productThumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#eee",
  },
  productInfo: {
    marginLeft: 16,
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  productPrice: {
    fontSize: 14,
    color: "#6200ee",
    fontWeight: "700",
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#fff",
    fontSize: 15,
  },
  newBalanceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 20,
    padding: 12,
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
  },
  newBalanceLabel: {
    fontSize: 14,
    color: "#FFA000",
    fontWeight: "600",
  },
  newBalanceValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF8F00",
  },
  confirmButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#6200ee",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});

export default Reward;
