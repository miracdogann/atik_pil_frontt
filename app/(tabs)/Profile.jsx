import { useAuth } from "@/context/AuthContext";
import { fetchUser } from "@/services/api";
import { useFocusEffect, useRouter } from "expo-router"; // <-- EKLE: useFocusEffect for page focus
import { useCallback, useEffect, useState } from "react"; // <-- EKLE: useCallback for focus effect
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native"; // <-- EKLE: RefreshControl
import { Avatar, Button, Divider, List, Text } from "react-native-paper";
import Toast from "react-native-toast-message";
import Header from "../../components/Header";

const Profile = () => {
  const router = useRouter();
  const { user, logout, updateUser, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true); // Loading for initial/fetch
  const [refreshing, setRefreshing] = useState(false); // Separate for pull-to-refresh

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/(auth)/Login");
    }
  }, [isAuthenticated]);

  // <-- YENİ: Sayfa focus olduğunda (her girişte) user fetch et
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && user?.token) {
        const loadUserData = async () => {
          setLoading(true);
          try {
            const userData = await fetchUser();
            updateUser(userData); // Context güncelle
          } catch (error) {
            console.log("Profile user fetch error:", error);
            if (error.response?.status === 401) {
              Toast.show({
                type: "error",
                text1: "Oturum süreniz doldu",
                text2: "Yeniden giriş yapın",
              });
            } else {
              Toast.show({
                type: "error",
                text1: "Profil yüklenemedi",
                text2: "İnternet bağlantınızı kontrol edin",
              });
            }
          } finally {
            setLoading(false);
          }
        };
        loadUserData();
      } else {
        setLoading(false);
      }
      return () => {}; // Cleanup (opsiyonel)
    }, [isAuthenticated, user?.token]) // Dependency: Focus her seferinde tetiklenir
  );

  // <-- YENİ: Pull-to-refresh handler (manuel yenileme)
  const onRefresh = useCallback(async () => {
    if (isAuthenticated && user?.token) {
      setRefreshing(true);
      console.log(user);
      try {
        const userData = await fetchUser();
        updateUser(userData);
        // console.log("user data profil page", userData);
        Toast.show({
          type: "success",
          text1: "Profil yenilendi",
          text2: "Güncel bilgiler yüklendi",
        });
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Yenileme başarısız",
          text2: "İnternet bağlantınızı kontrol edin",
        });
      } finally {
        setRefreshing(false);
      }
    }
  }, [isAuthenticated, user?.token]);

  const handleLogout = async () => {
    await logout();
  };

  if (loading || !user) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Header />

      {/* Profil Bilgileri */}
      <View style={styles.profileContainer}>
        <Avatar.Image
          size={90}
          style={styles.avatar}
          source={require("../../assets/icons/man.png")}
        />
        <Text variant="titleLarge" style={styles.name}>
          {user.full_name || "İsim Yükleniyor..."}
        </Text>
        <Text style={styles.email}>
          {user.e_posta || "E-posta Yükleniyor..."}
        </Text>
        <Text style={styles.points}>Puan: {user.point || 0}</Text>
        {/* <Text>{user.role}</Text> */}
      </View>

      <Divider />

      {/* Liste Öğeleri */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#6200ee"]}
            tintColor="#6200ee"
          />
        }
      >
        <TouchableOpacity
          onPress={() => router.navigate("/screens/EditProfil")}
        >
          <List.Item
            title="Kişisel Bilgileri Düzenle"
            description="Ad Soyad, Telefon, E-posta, Şifre..."
            left={(props) => (
              <List.Icon
                {...props}
                icon={require("../../assets/icons/notebook-of-contacts.png")}
                color="#6200ee"
              />
            )}
          />
          <Divider />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.navigate("/PilTeslim/PilTeslimlerim")}
        >
          <List.Item
            on
            title="Pil Teslimlerim"
            description="Yapılan işlemler ve son durumları"
            left={(props) => (
              <List.Icon
                {...props}
                icon={require("../../assets/icons/battery.png")}
                color="#6200ee"
              />
            )}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.navigate("/PilTeslim/PilAnalizi")}
        >
          <List.Item
            on
            title="Pil Analizi"
            description="Yapılan işlemler ve son durumları"
            left={(props) => (
              <List.Icon
                {...props}
                icon={require("../../assets/icons/battery.png")}
                color="#6200ee"
              />
            )}
          />
        </TouchableOpacity>
        <Divider />
        <TouchableOpacity onPress={() => router.navigate("/screens/MyOrder")}>
          <List.Item
            on
            title="Siparişlerim"
            description="Verilen siparişler ve son durumları"
            left={(props) => (
              <List.Icon
                {...props}
                icon={require("../../assets/icons/order_status.png")}
                color="#6200ee"
              />
            )}
          />
        </TouchableOpacity>
        <Divider />
        <TouchableOpacity
          onPress={() => router.navigate("/screens/CommunityRank")}
        >
          <List.Item
            title="Topluluk Sıralaması"
            description="En çok pil toplayan kullanıcılarımız"
            left={(props) => (
              <List.Icon
                {...props}
                icon={require("../../assets/icons/analitik.png")}
                color="#6200ee"
              />
            )}
          />
          <Divider />
        </TouchableOpacity>

        <List.Item
          title="ReycAI İletişim"
          description="Nasıl yardımcı olabiliriz?"
          left={(props) => (
            <List.Icon {...props} icon="phone" color="#6200ee" />
          )}
        />

        <Divider />
        <View style={styles.footer}>
          <Button
            mode="contained"
            buttonColor="#e53935"
            style={styles.button}
            onPress={handleLogout}
          >
            Çıkış Yap
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileContainer: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "#f9f9f9",
  },
  avatar: {
    marginBottom: 10,
  },
  name: {
    fontWeight: "bold",
  },
  email: {
    color: "gray",
    marginBottom: 6,
  },
  points: {
    marginTop: 4,
    fontSize: 16,
    color: "#6200ee",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    backgroundColor: "#fff",
    marginBottom: 50,
  },
  button: {
    marginBottom: 10,
  },
});

export default Profile;
