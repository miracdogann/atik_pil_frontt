// app/index.jsx
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Card, Text } from "react-native-paper";
import FooterOne from "../components/FooterOne";
import FooterText from "../components/FooterText";
import Header from "../components/Header";

export default function StartPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(tabs)/Map");
    }
  }, [isAuthenticated]);

  const handleStart = async () => {
    if (isAuthenticated) {
      router.replace("/(tabs)/Map");
    } else {
      router.replace("/(auth)/Login");
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.cont}>
      <Header />
      <Card style={styles.card_cont}>
        <Card.Content>
          <Text variant="titleLarge">
            Atık pilleri çöpe atma, geleceğe kazandır.
          </Text>
          <Text variant="bodyMedium">
            Atık Pillerin Geri Dönüşümüne Yönelik Akıllı Takip, Sınıflandırma ve
            Ödüllendirme Sistemi
          </Text>
        </Card.Content>
        <Button
          style={styles.Button}
          mode="contained-tonal"
          icon={require("../assets/icons/click.png")}
          buttonColor="#6200ee"
          textColor="white"
          onPress={handleStart}
        >
          Başla
        </Button>
      </Card>
      <FooterOne />
      <FooterText />
    </View>
  );
}

const styles = StyleSheet.create({
  cont: { backgroundColor: "#fff", height: "100%" },
  card_cont: { margin: 10, marginTop: 50, padding: 20 },
  Button: { marginTop: 50, width: "70%", alignSelf: "center" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
