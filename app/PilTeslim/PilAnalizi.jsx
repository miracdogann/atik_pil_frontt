import { analyzeBatteryImage } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");
const FRAME_SIZE = width * 0.7;

export default function PilAnalizi() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("camera");
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  if (!permission || !permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text>Kamera izni gerekiyor.</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.btnPerm}>
          <Text style={styles.btnText}>İzin Ver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- DÜZELTİLMİŞ CROP MANTĞI ---
  const handleCapture = async () => {
    if (!cameraRef.current || capturedPhotos.length >= 3) return;

    try {
      console.log("📸 Fotoğraf çekiliyor...");

      // 1. Fotoğraf çek
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        skipProcessing: false, // Processing'i açık bırak
        shutterSound: false,
      });

      console.log("✅ Fotoğraf çekildi");
      console.log("📐 Orijinal boyutlar:", {
        width: photo.width,
        height: photo.height,
      });

      // 2. Önce fotoğrafı yükle ve boyutlarını al
      const imageInfo = await ImageManipulator.manipulateAsync(photo.uri, [], {
        format: ImageManipulator.SaveFormat.JPEG,
      });

      const imageWidth = imageInfo.width;
      const imageHeight = imageInfo.height;

      console.log("📏 Gerçek boyutlar:", { imageWidth, imageHeight });

      // 3. Ekran ve görüntü aspect ratio'larını hesapla
      const screenAspect = width / height;
      const imageAspect = imageWidth / imageHeight;

      console.log("📊 Aspect ratios:", { screenAspect, imageAspect });

      // 4. Çerçevenin gerçek görüntü üzerindeki konumunu hesapla
      let scale;
      let visibleWidth, visibleHeight;
      let offsetX = 0,
        offsetY = 0;

      if (imageAspect > screenAspect) {
        // Görüntü daha geniş - kenarlarda crop var
        scale = imageHeight / height;
        visibleWidth = width * scale;
        visibleHeight = imageHeight;
        offsetX = (imageWidth - visibleWidth) / 2;
      } else {
        // Görüntü daha dar - üst/altta crop var
        scale = imageWidth / width;
        visibleWidth = imageWidth;
        visibleHeight = height * scale;
        offsetY = (imageHeight - visibleHeight) / 2;
      }

      console.log("🔍 Crop hesaplamaları:", {
        scale,
        visibleWidth,
        visibleHeight,
        offsetX,
        offsetY,
      });

      // 5. Çerçevenin merkez konumu
      const frameCenterX = width / 2;
      const frameCenterY = height / 2;

      // 6. Çerçeve boyutunu scale ile çarp
      const cropSize = FRAME_SIZE * scale;

      // 7. Çerçevenin görüntü üzerindeki konumu
      const cropOriginX = offsetX + (frameCenterX - FRAME_SIZE / 2) * scale;
      const cropOriginY = offsetY + (frameCenterY - FRAME_SIZE / 2) * scale;

      console.log("✂️ Crop parametreleri:", {
        originX: Math.round(cropOriginX),
        originY: Math.round(cropOriginY),
        size: Math.round(cropSize),
      });

      // 8. Güvenli sınırlar içinde tut
      const safeCropX = Math.max(
        0,
        Math.min(cropOriginX, imageWidth - cropSize)
      );
      const safeCropY = Math.max(
        0,
        Math.min(cropOriginY, imageHeight - cropSize)
      );
      const safeCropSize = Math.min(
        cropSize,
        imageWidth - safeCropX,
        imageHeight - safeCropY
      );

      // 9. Kırp ve yeniden boyutlandır
      const manipResult = await ImageManipulator.manipulateAsync(
        photo.uri,
        [
          {
            crop: {
              originX: Math.round(safeCropX),
              originY: Math.round(safeCropY),
              width: Math.round(safeCropSize),
              height: Math.round(safeCropSize),
            },
          },
          { resize: { width: 800 } },
        ],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
      );

      console.log("✅ Crop tamamlandı:", manipResult.uri);

      // Listeye ekle
      const newPhotos = [...capturedPhotos, manipResult.uri];
      setCapturedPhotos(newPhotos);
      setSelectedPhotoIndex(newPhotos.length - 1);

      Alert.alert("Başarılı", `Fotoğraf ${newPhotos.length}/3 eklendi!`, [
        { text: "Tamam" },
      ]);
    } catch (error) {
      console.error("❌ Çekim hatası:", error);
      Alert.alert("Hata", "Fotoğraf işlenirken bir sorun oluştu.");
    }
  };

  // --- ANALİZ FONKSİYONU ---
  const handleAnalyze = async () => {
    if (capturedPhotos.length === 0) return;
    setLoading(true);

    try {
      const targetUri = capturedPhotos[selectedPhotoIndex];
      console.log("🔬 Analiz başlıyor:", targetUri);

      const analyzeRes = await analyzeBatteryImage(targetUri);

      if (analyzeRes.success) {
        setAnalysisResult(analyzeRes.data);
        setProcessedImage(analyzeRes.processed_image);
        setStep("result");
      } else {
        Alert.alert("Hata", analyzeRes.message || "Analiz yapılamadı.");
      }
    } catch (error) {
      console.error("❌ Analiz hatası:", error);
      Alert.alert("Hata", "Sunucu bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setCapturedPhotos([]);
    setAnalysisResult(null);
    setProcessedImage(null);
    setSelectedPhotoIndex(0);
    setStep("camera");
  };

  // --- SONUÇ EKRANI ---
  if (step === "result" && analysisResult) {
    const { type, size, gemini_analysis } = analysisResult;

    const isSafe =
      type &&
      (type.includes("Alkalin") ||
        type.includes("Tek") ||
        type.includes("Çinko"));
    const isLithium = type && type.includes("Lityum");

    let badgeColor = "#f39c12";
    if (isSafe) badgeColor = "#2ecc71";
    else if (isLithium) badgeColor = "#e74c3c";

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.resultContainer}
      >
        <Text style={styles.header}>✅ Analiz Tamamlandı</Text>

        {/* İşlenmiş Görsel */}
        {processedImage && (
          <Image
            source={{ uri: `data:image/jpeg;base64,${processedImage}` }}
            style={styles.resultImage}
            resizeMode="contain"
          />
        )}

        <View style={styles.card}>
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Text style={styles.badgeText}>{type || "Bilinmiyor"}</Text>
          </View>

          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={styles.label}>Boyut:</Text>
              <Text style={styles.value}>{size || "Bilinmiyor"}</Text>
            </View>

            {gemini_analysis && (
              <>
                <View style={styles.row}>
                  <Text style={styles.label}>Kimya:</Text>
                  <Text style={styles.value}>
                    {gemini_analysis.chemistry || "-"}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Şarj Edilebilir:</Text>
                  <Text style={styles.value}>
                    {gemini_analysis.rechargeable === true
                      ? "Evet"
                      : gemini_analysis.rechargeable === false
                      ? "Hayır"
                      : "Belirsiz"}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Risk Seviyesi:</Text>
                  <Text style={[styles.value, { color: badgeColor }]}>
                    {gemini_analysis.risk_level || "-"}
                  </Text>
                </View>
              </>
            )}
          </View>

          <Text style={styles.note}>
            * Gemini AI tarafından analiz edilmiştir.
          </Text>
        </View>

        <TouchableOpacity style={styles.btnRetake} onPress={resetFlow}>
          <Ionicons
            name="refresh"
            size={20}
            color="#fff"
            style={{ marginRight: 10 }}
          />
          <Text style={styles.btnText}>Yeni İşlem</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // --- KAMERA EKRANI ---
  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" ref={cameraRef}>
        {/* Overlay */}
        <View style={styles.overlayContainer}>
          <View style={styles.overlayTop} />
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            <View
              style={[
                styles.focusFrame,
                { width: FRAME_SIZE, height: FRAME_SIZE },
              ]}
            >
              <View style={[styles.corner, styles.tl]} />
              <View style={[styles.corner, styles.tr]} />
              <View style={[styles.corner, styles.bl]} />
              <View style={[styles.corner, styles.br]} />
              <Text style={styles.guideText}>Pili buraya hizalayın</Text>
            </View>
            <View style={styles.overlaySide} />
          </View>
          <View style={styles.overlayBottom} />
        </View>

        {/* Kontroller */}
        <View style={styles.controlsArea}>
          {/* Galeri */}
          {capturedPhotos.length > 0 && (
            <View style={styles.galleryContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {capturedPhotos.map((uri, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setSelectedPhotoIndex(index)}
                    style={[
                      styles.thumbWrapper,
                      selectedPhotoIndex === index && styles.thumbSelected,
                    ]}
                  >
                    <Image source={{ uri }} style={styles.thumbnail} />
                    {selectedPhotoIndex === index && (
                      <View style={styles.checkIcon}>
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color="#3498db"
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.galleryHint}>
                Seçili: {selectedPhotoIndex + 1}/{capturedPhotos.length}
              </Text>
            </View>
          )}

          {/* Butonlar */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[
                styles.captureBtn,
                capturedPhotos.length >= 3 && styles.disabledBtn,
              ]}
              onPress={handleCapture}
              disabled={capturedPhotos.length >= 3 || loading}
            >
              <View style={styles.captureInner} />
            </TouchableOpacity>

            {capturedPhotos.length > 0 && (
              <TouchableOpacity
                style={styles.analyzeBtn}
                onPress={handleAnalyze}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.analyzeText}>Analiz Et</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.counterText}>
            {capturedPhotos.length} / 3 Fotoğraf
          </Text>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  camera: { flex: 1 },

  // Overlay
  overlayContainer: { flex: 1 },
  overlayTop: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)" },
  overlayMiddle: { flexDirection: "row" },
  overlaySide: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)" },
  overlayBottom: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)" },

  focusFrame: {
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  guideText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowRadius: 3,
  },

  corner: {
    position: "absolute",
    width: 25,
    height: 25,
    borderColor: "#00E676",
    borderWidth: 4,
  },
  tl: { top: -3, left: -3, borderRightWidth: 0, borderBottomWidth: 0 },
  tr: { top: -3, right: -3, borderLeftWidth: 0, borderBottomWidth: 0 },
  bl: { bottom: -3, left: -3, borderRightWidth: 0, borderTopWidth: 0 },
  br: { bottom: -3, right: -3, borderLeftWidth: 0, borderTopWidth: 0 },

  // Kontroller
  controlsArea: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.9)",
    paddingBottom: 30,
    paddingTop: 15,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    alignItems: "center",
  },

  galleryContainer: { height: 80, marginBottom: 15, alignItems: "center" },
  thumbWrapper: {
    marginHorizontal: 6,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  thumbSelected: { borderColor: "#3498db", borderWidth: 3 },
  thumbnail: { width: 60, height: 60 },
  checkIcon: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  galleryHint: { color: "#aaa", fontSize: 12, marginTop: 5 },

  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    paddingHorizontal: 30,
    marginTop: 5,
  },

  captureBtn: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.5)",
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
  },
  disabledBtn: { opacity: 0.3 },

  analyzeBtn: {
    flexDirection: "row",
    backgroundColor: "#3498db",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: "center",
    elevation: 3,
  },
  analyzeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginRight: 8,
  },
  counterText: { color: "#888", marginTop: 12, fontSize: 13 },

  // Sonuç Ekranı
  resultContainer: {
    backgroundColor: "#f0f2f5",
    padding: 20,
    paddingTop: 60,
    alignItems: "center",
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 25,
    color: "#2c3e50",
  },
  resultImage: {
    width: "100%",
    height: 300,
    borderRadius: 16,
    backgroundColor: "#e1e4e8",
    marginBottom: 25,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  badge: {
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 25,
    marginBottom: 25,
  },
  badgeText: { color: "#fff", fontWeight: "bold", fontSize: 20 },
  table: { width: "100%" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingBottom: 10,
  },
  label: { color: "#7f8c8d", fontSize: 16 },
  value: { fontWeight: "bold", color: "#2c3e50", fontSize: 17 },
  note: {
    fontSize: 12,
    color: "#95a5a6",
    marginTop: 15,
    fontStyle: "italic",
    textAlign: "center",
  },
  btnRetake: {
    flexDirection: "row",
    backgroundColor: "#34495e",
    paddingVertical: 15,
    paddingHorizontal: 35,
    borderRadius: 30,
    marginTop: 35,
    alignItems: "center",
    elevation: 2,
  },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  btnPerm: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#3498db",
    borderRadius: 5,
  },
});
