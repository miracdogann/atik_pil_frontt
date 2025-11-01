import FooterOne from "@/components/FooterOne";
import FooterText from "@/components/FooterText";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { Redirect, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, Card, HelperText, TextInput } from "react-native-paper"; // <-- EKLE: HelperText import
import Toast from "react-native-toast-message";

const Login = () => {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({}); // <-- EKLE: Form hataları için state
  const [eposta, setEposta] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(tabs)/map");
    }
  }, [isAuthenticated]);

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/map" />;
  }

  // <-- EKLE: Real-time validation
  const validateField = (field, value) => {
    let error = "";
    switch (field) {
      case "eposta":
        const emailRegex = /^[^\s@]+@(gmail|outlook|hotmail|icloud)\.com$/i;
        if (value && !emailRegex.test(value))
          error = "Sadece Gmail, Outlook, Hotmail, iCloud (.com) desteklenir";
        break;
      case "password":
        if (value && value.length < 8) error = "Şifre en az 8 karakter olmalı";
        break;
      default:
        break;
    }
    setFormErrors((prev) => ({ ...prev, [field]: error }));
  };

  const HandleLogin = async () => {
    // Submit öncesi son kontrol
    validateField("eposta", eposta);
    validateField("password", password);

    if (!eposta || !password) {
      Toast.show({ type: "error", text1: "Alanları doldurun" });
      return;
    }
    const hasErrors = Object.values(formErrors).some((err) => err);
    if (hasErrors) {
      Toast.show({
        type: "error",
        text1: "Form hatalarını düzeltin",
        text2: "Kırmızı alanları kontrol edin",
      });
      return;
    }

    setLoading(true);
    try {
      await login(eposta, password);
      Toast.show({
        type: "success",
        text1: "Giriş Başarılı!",
        text2: "Hoş geldiniz 👋",
      });
    } catch (error) {
      // Log gizlendi (red screen önlendi)
      let errorMessage = "Giriş başarısız";
      const responseData = error.response?.data || {};
      console.log("loginnnn", responseData);
      if (responseData.non_field_errors) {
        errorMessage = responseData.non_field_errors[0] =
          "E-posta veya şifre yanlış";
      } else if (responseData.detail) {
        errorMessage = responseData.detail;
      } else {
        errorMessage = error.message || "Sunucu hatası";
      }

      Toast.show({
        type: "error",
        text1: errorMessage,
        text2: "E-posta veya şifreyi kontrol edin",
        visibilityTime: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Header />

        <Card style={styles.formLogin}>
          <Card.Content>
            {/* E-Posta */}
            <View style={styles.inputRow}>
              <Image
                style={styles.iconSize}
                source={require("../../assets/icons/email.png")}
              />
              <TextInput
                mode="outlined"
                label="E-posta"
                placeholder="example@gmail.com"
                value={eposta}
                onChangeText={(text) => {
                  setEposta(text);
                  validateField("eposta", text); // Real-time validation
                }}
                keyboardType="email-address"
                style={styles.inputField}
                error={!!formErrors.eposta} // <-- EKLE: Error border
                disabled={loading || authLoading}
              />
            </View>
            <HelperText type="error" visible={!!formErrors.eposta}>
              {formErrors.eposta}
            </HelperText>

            {/* Şifre */}
            <View style={styles.inputRow}>
              <Image
                style={styles.iconSize}
                source={require("../../assets/icons/padlock.png")}
              />
              <TextInput
                mode="outlined"
                label="Şifre"
                placeholder="**************"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  validateField("password", text); // Real-time
                }}
                secureTextEntry
                style={styles.inputField}
                error={!!formErrors.password}
                disabled={loading || authLoading}
              />
            </View>
            <HelperText type="error" visible={!!formErrors.password}>
              {formErrors.password}
            </HelperText>

            <Button
              mode="contained-tonal"
              icon={require("../../assets/icons/user.png")}
              onPress={HandleLogin}
              buttonColor="#6200ee"
              style={styles.paperButton}
              contentStyle={{ paddingVertical: 2 }}
              loading={loading || authLoading}
              disabled={loading || authLoading}
              textColor="white"
            >
              Giriş Yap
            </Button>

            <Text style={styles.loginText}>
              Hesabın yok mu?
              <Text
                style={{ color: "#6200ee" }}
                onPress={() => router.push("/(auth)/Register")}
              >
                Kayıt Ol
              </Text>
            </Text>
          </Card.Content>
        </Card>

        <FooterOne />
        <FooterText />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
  },
  formLogin: {
    width: "95%",
    alignSelf: "center",
    marginVertical: 20,
    borderRadius: 12,
    elevation: 4,
    backgroundColor: "#ffff",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  iconSize: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    backgroundColor: "transparent",
  },
  paperButton: {
    marginTop: 10,
  },
  loginText: {
    textAlign: "center",
    marginTop: 7,
    color: "#666",
  },
});

export default Login;
