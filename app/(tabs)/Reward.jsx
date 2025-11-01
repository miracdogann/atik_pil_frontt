import { useEffect, useState } from "react";
import { Dimensions, FlatList, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Modal,
  Portal,
  Text,
  TextInput,
} from "react-native-paper";
import Header from "../../components/Header";
import { getRewards } from "../../services/api";

const { width } = Dimensions.get("window");
const CARD_MARGIN = 10;
const CARD_WIDTH = (width - CARD_MARGIN * 6) / 2; // 2 kart + marginlar

const Reward = () => {
  const [visible, setVisible] = useState(false);
  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState([]);

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
          onPress={showModal}
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
          </View>
          <View style={styles.modalForm}>
            <TextInput label="Ad Soyad" mode="outlined" style={styles.input} />
            <TextInput label="Telefon" mode="outlined" style={styles.input} />
            <TextInput
              label="Adres"
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={3}
            />
          </View>
          <View style={styles.modalFooter}>
            <Button
              mode="outlined"
              onPress={hideModal}
              style={styles.cancelButton}
            >
              İptal
            </Button>
            <Button
              mode="contained"
              onPress={() => {}}
              style={styles.confirmButton}
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
  flatList: {
    padding: CARD_MARGIN,
  },
  card: {
    width: CARD_WIDTH,
    margin: CARD_MARGIN,
    borderRadius: 16,
    backgroundColor: "#fff",
    overflow: "hidden",
    elevation: 4, // Gölge efekti için
  },
  cardImage: {
    width: "100%", // Kart genişliğine tam oturur
    height: CARD_WIDTH * 0.75, // Resim yüksekliği kart genişliğinin %75'i (oranı korur)
    borderTopLeftRadius: 16, // Kartın yuvarlak köşelerine uyum
    borderTopRightRadius: 16,
    backgroundColor: "#f0f0f0", // Resim yüklenirken gri arka plan
  },
  productName: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center", // Ürün adını ortalar
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
  modalForm: {
    flex: 1,
    justifyContent: "center",
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
});

export default Reward;
