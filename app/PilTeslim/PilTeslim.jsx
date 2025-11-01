import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { createDelivery } from "@/services/api"; // YENİ EK: Backend POST
import { uploadImage } from "@/services/uploadimage";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router"; // YENİ EK: Router for navigation
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, Card, Text, TextInput } from "react-native-paper";
import Toast from "react-native-toast-message";

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);
  const [adet, setAdet] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // YENİ EK: Loading state
  const cameraRef = useRef(null);
  const router = useRouter(); // YENİ EK: Success navigation

  const params = useLocalSearchParams();
  const { user } = useAuth();

  console.log("pil teslim etme ", user.e_posta); // Production'da kaldır
  if (!permission)
    return (
      <View>
        <Text>İzin Yok</Text>
      </View>
    );
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          Kamera izni gerekiyor, lütfen izin verin.
        </Text>
        <Button mode="contained" onPress={requestPermission}>
          İzin Ver
        </Button>
      </View>
    );
  }

  const handleTakePhoto = async () => {
    if (cameraRef.current) {
      const photoData = await cameraRef.current.takePictureAsync();
      setPhoto(photoData.uri);
    }
  };

  const handleRetakePhoto = () => {
    setPhoto(null);
  };

  // YENİ EK: Submit handler - Upload + Backend POST
  const handleSubmit = async () => {
    if (!photo || !adet || !aciklama) {
      setError("Lütfen tüm alanları doldurun!");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // 1. Cloudinary upload
      const imageUrl = await uploadImage(photo, user.e_posta);
      if (!imageUrl) throw new Error("Fotoğraf yüklenemedi.");

      // 2. Backend POST
      const deliveryData = {
        image_url: imageUrl,
        quantity: parseInt(adet),
        description: aciklama,
        kurum_id: parseInt(params.kurum_id), // Params'tan ID
      };

      const response = await createDelivery(deliveryData);
      console.log("Teslim başarı:", response);

      Toast.show({
        type: "success",
        text1: "Teslim Etme Başarılı!",
        text2: "Puanınız yakında eklenecek",
      });
      router.push("/(tabs)/PilTeslimNoktalari"); // Örnek navigation
    } catch (err) {
      console.log("Teslim hatası:", err);
      Toast.show({
        type: "error",
        text1: "Başarısız İşlem!",
        text2: `Hata: ${err.message || "Teslim edilemedi."}`,
      });
      setError(`Hata: ${err.message || "Teslim edilemedi."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.mainContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <Header />
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.infoTitle}>
              Kurum Bilgileri
            </Text>
            <View style={styles.infoRow}>
              <Image
                source={require("../../assets/icons/phone.png")}
                style={styles.infoIcon}
              />
              <Text variant="bodyLarge" style={styles.infoText}>
                {params.kurum_name || "Kurum Adı"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Image
                source={require("../../assets/icons/phone.png")}
                style={styles.infoIcon}
              />
              <Text variant="bodyMedium" style={styles.infoText}>
                {params.kurum_adress || "Adres Bilgisi Yok"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Image
                source={require("../../assets/icons/phone.png")}
                style={styles.infoIcon}
              />
              <Text variant="bodyMedium" style={styles.infoText}>
                {params.kurum_telefon || "Telefon Bilgisi Yok"}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.topIcon}>
          <Image
            source={require("../../assets/icons/battery.png")}
            style={styles.batteryIcon}
          />
        </View>

        <Card style={styles.card}>
          <Card.Content>
            {!photo && (
              <>
                <Button
                  icon="camera"
                  mode="outlined"
                  onPress={handleTakePhoto}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                >
                  Fotoğraf Çek
                </Button>
                <CameraView
                  ref={cameraRef}
                  style={styles.camera}
                  facing="back"
                />
              </>
            )}

            {photo && (
              <>
                <Image source={{ uri: photo }} style={styles.previewImage} />
                <Button
                  icon="camera-retake"
                  mode="outlined"
                  onPress={handleRetakePhoto}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                >
                  Tekrar Çek
                </Button>
              </>
            )}

            <TextInput
              label="Adet"
              value={adet}
              keyboardType="numeric"
              mode="outlined"
              activeOutlineColor="#6200ee"
              outlineColor="#6200ee"
              placeholder="Adet giriniz"
              left={
                <TextInput.Icon
                  icon={require("../../assets/icons/quantity.png")}
                  color="#6200ee"
                />
              }
              onChangeText={(text) => setAdet(text)}
              style={styles.input}
            />

            <TextInput
              label="Açıklama"
              value={aciklama}
              mode="outlined"
              multiline
              numberOfLines={3}
              activeOutlineColor="#6200ee"
              outlineColor="#6200ee"
              placeholder="Açıklama giriniz"
              left={
                <TextInput.Icon
                  icon={require("../../assets/icons/description.png")}
                  color="#6200ee"
                />
              }
              onChangeText={(text) => setAciklama(text)}
              style={styles.input}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              icon={loading ? "loading" : "check"} // YENİ EK: Loading icon
              mode="contained"
              onPress={handleSubmit}
              disabled={loading} // YENİ EK: Disable during loading
              style={styles.submitButton}
              buttonColor="#6200ee"
              contentStyle={styles.buttonContent}
            >
              {loading ? "Kaydediliyor..." : "Teslim Et"}
            </Button>

            {/* YENİ EK: Global loading overlay (opsiyonel, card içinde) */}
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#6200ee" />
                <Text style={styles.loadingText}>Teslim kaydediliyor...</Text>
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  infoCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    elevation: 4,
  },
  infoTitle: {
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoIcon: {
    width: 24,
    height: 24,
    tintColor: "#6200ee",
    marginRight: 12,
  },
  infoText: {
    color: "#333",
    flex: 1,
  },
  topIcon: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 48,
    backgroundColor: "#6200ee",
    borderRadius: 24,
    marginBottom: -24,
    zIndex: 1,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  batteryIcon: {
    width: 32,
    height: 32,
    tintColor: "#fff",
  },
  card: {
    borderRadius: 12,
    padding: 16,
    elevation: 4,
    backgroundColor: "#fff",
  },
  loadingOverlay: {
    // YENİ EK
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 12,
  },
  loadingText: {
    // YENİ EK
    marginTop: 8,
    color: "#6200ee",
    fontSize: 16,
  },
  button: {
    marginBottom: 16,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 4,
  },
  camera: {
    width: "100%",
    height: 240,
    marginBottom: 16,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  previewImage: {
    width: "100%",
    height: 240,
    marginBottom: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  error: {
    color: "#d32f2f",
    marginBottom: 8,
    textAlign: "center",
    fontSize: 14,
  },
  message: {
    textAlign: "center",
    marginBottom: 12,
    color: "#333",
    fontSize: 16,
  },
});
