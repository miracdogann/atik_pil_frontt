import { useAuth } from "@/context/AuthContext";
import { Redirect, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, HelperText, IconButton, TextInput } from "react-native-paper"; // <-- EKLE: HelperText import (error mesajı için)
import Toast from "react-native-toast-message";
import FooterOne from "../../components/FooterOne";
import FooterText from "../../components/FooterText";
import Header from "../../components/Header";

const Register = () => {
  const router = useRouter();
  const { register, isAuthenticated, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({}); // Her field için error state
  const [fullName, setFullName] = useState("");
  const [eposta, setEposta] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");

  const iconSize = 20;

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(tabs)/map");
    }
  }, [isAuthenticated]);

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/map" />;
  }

  // <-- YENİ: Real-time validation (onChange ile anlık feedback)
  const validateField = (field, value) => {
    let error = "";
    switch (field) {
      case "fullName":
        if (value.trim().length < 2) error = "Ad-Soyad en az 2 karakter olmalı";
        break;
      case "eposta":
        const emailRegex = /^[^\s@]+@(gmail|outlook|hotmail|icloud)\.com$/i;
        if (value && !emailRegex.test(value))
          error = "Sadece Gmail, Outlook, Hotmail, iCloud (.com) desteklenir";
        break;
      case "phone":
        const phoneRegex = /^0[0-9]{10}$/;
        if (value && !phoneRegex.test(value))
          error = "0 ile başlamalı, 11 haneli rakam (örn: 05551234567)";
        break;
      case "password":
        const passwordRegex =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (value && !passwordRegex.test(value))
          error =
            "Min 8 karakter: Büyük/küçük harf, rakam, özel karakter (@$!%*?&)";
        break;
      default:
        break;
    }
    setFormErrors((prev) => ({ ...prev, [field]: error }));
  };

  const HandleRegister = async () => {
    // Submit öncesi son kontrol (gerçek zamanlı zaten var)
    validateField("fullName", fullName);
    validateField("eposta", eposta);
    validateField("phone", phone);
    validateField("password", password);

    if (!fullName || !eposta || !phone || !password || !rePassword) {
      Toast.show({ type: "error", text1: "Tüm alanları doldurun" });
      return;
    }
    if (password !== rePassword) {
      Toast.show({ type: "error", text1: "Şifreler uyuşmuyor" });
      return;
    }
    const hasErrors = Object.values(formErrors).some((err) => err);
    if (hasErrors) {
      Toast.show({
        type: "error",
        text1: "Form hatalarını düzeltin",
        text2: "Kırmızı alanları kontrol edin", // <-- EKLE: Ek açıklama
      });
      return;
    }

    setLoading(true);
    try {
      await register(fullName, eposta, phone, password, rePassword);
      Toast.show({
        type: "success",
        text1: "Kayıt Başarılı!",
        text2: "Giriş yapılıyor...",
      });
      // Form reset
      setFullName("");
      setEposta("");
      setPhone("");
      setPassword("");
      setRePassword("");
      setFormErrors({});
    } catch (error) {
      let errorMessage = "Kayıt hatası oluştu. Lütfen kontrol edin.";
      const responseData = error.response?.data || {};
      const errors = [];

      if (responseData.non_field_errors) {
        const msg = (responseData.non_field_errors[0] || "")
          .trim()
          .toLowerCase();
        if (msg.includes("şifre") || msg.includes("parola")) {
          errors.push(
            "Şifre çok genel veya zayıf – daha güçlü bir şifre deneyin."
          );
        } else if (msg.includes("eşleşmiyor")) {
          errors.push("Şifreler eşleşmiyor.");
        } else {
          errors.push(msg);
        }
      } else {
        if (responseData.e_posta) {
          const emailMsg = (responseData.e_posta[0] || "").trim().toLowerCase();
          errors.push(
            emailMsg.includes("mevcut") ? "Bu e-posta zaten kayıtlı." : emailMsg
          );
        }
        if (responseData.phone) {
          const phoneMsg = (responseData.phone[0] || "").trim().toLowerCase();
          errors.push(
            phoneMsg.includes("mevcut")
              ? "Bu telefon numarası zaten kayıtlı."
              : phoneMsg
          );
        }
        if (responseData.full_name) {
          errors.push(responseData.full_name[0] || "İsim hatası");
        }
        if (responseData.password) {
          const passMsg = (responseData.password[0] || "").trim().toLowerCase();
          errors.push(
            passMsg.includes("eşleşmiyor")
              ? "Şifreler eşleşmiyor."
              : "Şifre gereksinimleri karşılanmıyor"
          );
        }
      }

      errorMessage =
        errors.length > 0
          ? errors.join(" ")
          : error.message || "Sunucu bağlantı hatası";

      Toast.show({
        type: "error",
        text1: errorMessage,
        text2: "Farklı bilgilerle tekrar deneyin",
        visibilityTime: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Header />

        <View style={styles.formContainer}>
          {/* Ad-Soyad */}
          <View style={styles.inputRow}>
            <IconButton
              mode="default"
              iconColor="black"
              size={iconSize}
              icon={require("../../assets/icons/user.png")}
            />
            <TextInput
              style={styles.input}
              mode="outlined"
              label="Ad-Soyad"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                validateField("fullName", text); // <-- DEĞİŞ: onChange ile real-time
              }}
              error={!!formErrors.fullName}
              disabled={loading || authLoading}
            />
          </View>
          {formErrors.fullName ? (
            <HelperText type="error" visible>
              {formErrors.fullName}
            </HelperText>
          ) : null}

          {/* E-Posta */}
          <View style={styles.inputRow}>
            <IconButton
              mode="default"
              iconColor="black"
              size={iconSize}
              icon={require("../../assets/icons/email.png")}
            />
            <TextInput
              mode="outlined"
              label="E-Posta"
              style={styles.input}
              value={eposta}
              onChangeText={(text) => {
                setEposta(text);
                validateField("eposta", text); // Real-time
              }}
              error={!!formErrors.eposta}
              placeholder="ornek@gmail.com"
              keyboardType="email-address"
              disabled={loading || authLoading}
            />
          </View>
          {formErrors.eposta ? (
            <HelperText type="error" visible>
              {formErrors.eposta}
            </HelperText>
          ) : null}

          {/* Telefon */}
          <View style={styles.inputRow}>
            <IconButton
              mode="default"
              iconColor="black"
              size={iconSize}
              icon={require("../../assets/icons/phone.png")}
            />
            <TextInput
              mode="outlined"
              label="Telefon numarası"
              style={styles.input}
              value={phone}
              maxLength={11}
              onChangeText={(text) => {
                const numericText = text.replace(/[^0-9]/g, ""); // Sadece rakam
                setPhone(numericText);
                validateField("phone", numericText); // Real-time
              }}
              error={!!formErrors.phone}
              placeholder="05551234567"
              keyboardType="phone-pad"
              disabled={loading || authLoading}
            />
          </View>
          {formErrors.phone ? (
            <HelperText type="error" visible>
              {formErrors.phone}
            </HelperText>
          ) : null}

          {/* Şifre */}
          <View style={styles.inputRow}>
            <IconButton
              mode="default"
              iconColor="black"
              size={iconSize}
              icon={require("../../assets/icons/padlock.png")}
            />
            <TextInput
              mode="outlined"
              label="Şifre"
              style={styles.input}
              placeholder="**************"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                validateField("password", text); // Real-time
              }}
              error={!!formErrors.password}
              secureTextEntry
              disabled={loading || authLoading}
            />
          </View>
          {formErrors.password ? (
            <HelperText type="error" visible>
              {formErrors.password}
            </HelperText>
          ) : null}

          {/* Şifre Tekrarı */}
          <View style={styles.inputRow}>
            <IconButton
              mode="default"
              iconColor="black"
              size={iconSize}
              icon={require("../../assets/icons/padlock.png")}
            />
            <TextInput
              mode="outlined"
              label="Şifre Tekrarı"
              style={styles.input}
              placeholder="**************"
              value={rePassword}
              onChangeText={setRePassword}
              secureTextEntry
              disabled={loading || authLoading}
            />
          </View>
          {password !== rePassword && rePassword ? ( // <-- EKLE: Şifre tekrarı için real-time error
            <HelperText type="error" visible>
              Şifreler uyuşmuyor
            </HelperText>
          ) : null}

          <Button
            mode="contained-tonal"
            icon={require("../../assets/icons/user.png")}
            onPress={HandleRegister}
            buttonColor="#6200ee"
            style={styles.paperButton}
            contentStyle={{ paddingVertical: 1.5 }}
            loading={loading || authLoading}
            disabled={loading || authLoading}
            textColor="white"
          >
            Kayıt Ol
          </Button>

          <Text style={styles.loginText}>
            Hesabın zaten var mı?{" "}
            <Text
              style={{ color: "#6200ee" }}
              onPress={() => router.push("/(auth)/Login")}
            >
              Giriş Yap
            </Text>
          </Text>
        </View>

        <FooterOne />
        <FooterText />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#ffff",
    flex: 1,
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 25,
    borderWidth: 0,
    borderColor: "black",
    padding: 10,
    width: "90%",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    marginTop: 25,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
    backgroundColor: "#ffff",
    padding: 2,
  },
  input: {
    flex: 1,
    backgroundColor: "transparent",
    fontSize: 15,
  },
  paperButton: {
    alignSelf: "center",
    marginTop: 15,
    width: "80%",
  },
  loginText: {
    marginTop: 10,
    textAlign: "center",
  },
});

export default Register;
