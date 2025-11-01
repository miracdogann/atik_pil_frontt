import { useAuth } from "@/context/AuthContext"; // <-- Mevcut puanı ve güncelleme için eklendi
import { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Divider,
  Modal,
  Portal,
  Text,
  TextInput,
} from "react-native-paper";
import Header from "../../components/Header";
import { createUserReward, getRewards } from "../../services/api"; // <-- Backend POST için eklendi

const { width } = Dimensions.get("window");
const CARD_MARGIN = 10;
const CARD_WIDTH = (width - CARD_MARGIN * 6) / 2; // 2 kart + marginlar

const Reward = () => {
  const [visible, setVisible] = useState(false);
  const showModal = (reward) => {
    // <-- Orijinal yapıyı bozmadan güncellendi: reward parametresi eklendi
    setSelectedReward(reward);
    setFormData({
      // <-- Form verilerini sıfırla (sadece address)
      address: "",
    });
    setVisible(true);
  };
  const hideModal = () => setVisible(false);
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState([]);

  // <-- Backend entegrasyonu için minimal ek state'ler (hooks kuralına uyumlu, orijinal yapıyı bozmaz)
  const [selectedReward, setSelectedReward] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({
    address: "",
  });

  const { user, updateUser } = useAuth(); // <-- Mevcut puan için (updateUser puan güncellemesi için)

  // <-- Sipariş onayı (backend entegrasyonu – orijinal yapıyı bozmaz)
  const handleConfirmOrder = () => {
    if (!formData.address.trim()) {
      alert("Lütfen adresi doldurun.");
      return;
    }

    if (user.point < selectedReward.point) {
      alert(`Yetersiz puan. Gerekli: ${selectedReward.point}`);
      return;
    }

    setModalLoading(true);
    createUserReward({
      reward: selectedReward.reward_id,
      adress: formData.address.trim(),
    })
      .then((response) => {
        // <-- Güncel puanı yaz (response'tan veya local hesaplama)
        const newPoint =
          response.updated_point || user.point - selectedReward.point;
        updateUser({ ...user, point: newPoint }); // <-- Context güncellemesi
        alert(`Sipariş başarıyla alındı! Kalan puan: ${newPoint}`);
        hideModal();
      })
      .catch((error) => {
        console.error("Sipariş hatası:", error);
        alert("Sipariş oluşturulamadı.");
      })
      .finally(() => setModalLoading(false));
  };

  useEffect(() => {
    getRewards()
      .then((response) => {
        setRewards(response.data);
      })
      .catch((error) => {
        console.error("Ödüller alınırken hata oluştu:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <Card style={styles.card} mode="elevated">
      <Card.Cover
        source={{ uri: item.image_url }}
        style={styles.cardImage}
        resizeMode="cover" // Resim oranını koruyarak kartı doldurur
      />
      <Card.Content>
        <Text variant="titleMedium" style={styles.productName}>
          {item.reward_name}
        </Text>
        <Text variant="bodyMedium" style={styles.points}>
          Gerekli Puan: <Text style={{ fontWeight: "bold" }}>{item.point}</Text>
        </Text>
      </Card.Content>
      <Card.Actions style={styles.actions}>
        <Button
          mode="contained"
          onPress={() => showModal(item)} // <-- Orijinal yapıyı bozmadan güncellendi: item geçir
          buttonColor="#6200ee"
          style={styles.button}
        >
          Sipariş Ver
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Header />
      {/* <-- Mevcut puanı göster (basit, orijinal yapıyı bozmaz) */}
      <View style={styles.pointDisplay}>
        <Text style={styles.pointText}>
          Mevcut Puan: <Text style={styles.pointBold}>{user.point}</Text>
        </Text>
      </View>
      <FlatList
        data={rewards}
        keyExtractor={(item) => item.reward_id}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={styles.flatList}
        showsVerticalScrollIndicator={false}
      />
      <Portal>
        <Modal visible={visible} contentContainerStyle={styles.modalStyle}>
          <View style={styles.modalHeader}>
            <Text variant="headlineSmall">Sipariş Bilgileri</Text>
            {selectedReward && (
              <Text variant="bodyMedium" style={styles.selectedReward}>
                {selectedReward.reward_name} - {selectedReward.point} Puan
              </Text>
            )}
          </View>
          <Divider style={styles.divider} />
          <ScrollView
            style={styles.modalForm}
            keyboardShouldPersistTaps="handled"
          >
            {/* <-- Sadece address alanı – diğerleri kaldırıldı */}
            <TextInput
              label="Adres"
              value={formData.address}
              onChangeText={(text) =>
                setFormData({ ...formData, address: text })
              }
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={3}
            />
          </ScrollView>
          <Divider style={styles.divider} />
          <View style={styles.modalFooter}>
            <Button
              mode="outlined"
              onPress={hideModal}
              style={styles.cancelButton}
              disabled={modalLoading}
            >
              İptal
            </Button>
            <Button
              mode="contained"
              onPress={handleConfirmOrder}
              style={styles.confirmButton}
              loading={modalLoading}
              disabled={modalLoading}
            >
              Onayla
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  // <-- Mevcut puanı gösteren yeni style (minimal ek)
  pointDisplay: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  pointText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
  pointBold: {
    fontWeight: "bold",
    color: "#6200ee",
  },
  flatList: {
    padding: CARD_MARGIN,
  },
  card: {
    width: CARD_WIDTH,
    margin: CARD_MARGIN,
    borderRadius: 16,
    backgroundColor: "#fff",
    overflow: "hidden",
    elevation: 4,
  },
  cardImage: {
    width: "100%",
    height: CARD_WIDTH * 0.75,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: "#f0f0f0",
  },
  productName: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  points: {
    marginTop: 4,
    color: "#666",
    fontSize: 13,
    textAlign: "center",
  },
  actions: {
    justifyContent: "center",
    paddingBottom: 8,
  },
  button: {
    borderRadius: 24,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  selectedReward: {
    color: "#6200ee",
    marginTop: 5,
    fontWeight: "500",
  },
  modalForm: {
    flex: 1,
  },
  input: {
    marginBottom: 15,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
  },
  confirmButton: {
    flex: 1,
    marginLeft: 10,
  },
  modalStyle: {
    backgroundColor: "#fff",
    width: "90%",
    height: "75%",
    alignSelf: "center",
    borderRadius: 25,
    padding: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
  },
});

export default Reward;
