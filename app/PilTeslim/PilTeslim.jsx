import Header from "@/components/Header";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, Card, Text, TextInput } from "react-native-paper";
export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);
  const [adet, setAdet] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [error, setError] = useState("");
  const cameraRef = useRef(null);

  const params = useLocalSearchParams();

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

  const handleSubmit = () => {
    if (!photo || !adet || !aciklama) {
      setError("Lütfen tüm alanları doldurun!");
      return;
    }

    setError("");
    alert("Teslim edildi!");
    // Buraya backend'e gönderme işlemi eklenebilir
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
                {params.kurum_tel || "Telefon Bilgisi Yok"}
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
              icon="check"
              mode="contained"
              onPress={handleSubmit}
              style={styles.submitButton}
              buttonColor="#6200ee"
              contentStyle={styles.buttonContent}
            >
              Teslim Et
            </Button>
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
