import { useAuth } from "@/context/AuthContext";
import { fetchUser } from "@/services/api";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Avatar, Button, IconButton, Surface, Text } from "react-native-paper";
import Toast from "react-native-toast-message";
import Header from "../../components/Header";

const Profile = () => {
  const router = useRouter();
  const { user, logout, updateUser, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/(auth)/Login");
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && user?.token) {
        const loadUserData = async () => {
          setLoading(true);
          try {
            const userData = await fetchUser();
            updateUser(userData);
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
                text2: "Bağlantınızı kontrol edin",
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
      return () => {};
    }, [isAuthenticated, user?.token])
  );

  const onRefresh = useCallback(async () => {
    if (isAuthenticated && user?.token) {
      setRefreshing(true);
      try {
        const userData = await fetchUser();
        updateUser(userData);
        Toast.show({
          type: "success",
          text1: "Profil yenilendi",
          text2: "Güncel bilgiler yüklendi",
        });
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Yenileme başarısız",
          text2: "Bağlantınızı kontrol edin",
        });
      } finally {
        setRefreshing(false);
      }
    }
  }, [isAuthenticated, user?.token]);

  const handleLogout = async () => {
    await logout();
  };

  // Yükleme Ekranı
  if (loading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  if (!isAuthenticated) return null;

  // Yardımcı Bileşen: Menü Öğesi (Kod tekrarını önlemek için)
  const MenuItem = ({
    title,
    subtitle,
    iconSource,
    onPress,
    isLast,
    iconType = "image",
  }) => (
    <TouchableOpacity
      style={[styles.menuItem, isLast && styles.menuItemLast]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuIconContainer}>
        {iconType === "image" ? (
          <Image
            source={iconSource}
            style={styles.menuIconImage}
            resizeMode="contain"
          />
        ) : (
          <IconButton
            icon={iconSource}
            size={24}
            iconColor="#6200ee"
            style={{ margin: 0 }}
          />
        )}
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <IconButton icon="chevron-right" size={20} iconColor="#ccc" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#6200ee"]}
            tintColor="#6200ee"
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Üst Profil Kartı */}
        <View style={styles.headerBackground}>
          <Surface style={styles.profileCard} elevation={2}>
            <View style={styles.avatarSection}>
              <Avatar.Image
                size={80}
                style={styles.avatar}
                source={require("../../assets/icons/man.png")}
              />
              <View style={styles.userInfo}>
                <Text variant="titleMedium" style={styles.name}>
                  {user.full_name || "İsimsiz Kullanıcı"}
                </Text>
                <Text style={styles.email}>{user.e_posta}</Text>

                <View style={styles.pointsBadge}>
                  <Image
                    source={require("../../assets/icons/analitik.png")}
                    style={styles.pointsIcon}
                  />
                  <Text style={styles.pointsText}>{user.point || 0} Puan</Text>
                </View>
              </View>
            </View>
          </Surface>
        </View>

        {/* Menü Bölümü */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>HESAP AYARLARI</Text>
          <Surface style={styles.menuGroup} elevation={1}>
            <MenuItem
              title="Kişisel Bilgiler"
              subtitle="Profil düzenle, şifre değiştir"
              iconSource={require("../../assets/icons/notebook-of-contacts.png")}
              onPress={() => router.navigate("/screens/EditProfil")}
              isLast={true}
            />
          </Surface>

          <Text style={styles.sectionHeader}>İŞLEMLERİM</Text>
          <Surface style={styles.menuGroup} elevation={1}>
            <MenuItem
              title="Pil Teslimlerim"
              subtitle="Geçmiş teslimatlarınız"
              iconSource={require("../../assets/icons/battery.png")}
              onPress={() => router.navigate("/PilTeslim/PilTeslimlerim")}
            />
            <View style={styles.divider} />
            <MenuItem
              title="Pil Analizi"
              subtitle="Durum ve analiz raporları"
              iconSource={require("../../assets/icons/battery.png")}
              onPress={() => router.navigate("/PilTeslim/PilAnalizi")}
            />
            <View style={styles.divider} />
            <MenuItem
              title="Siparişlerim"
              subtitle="Market sipariş durumları"
              iconSource={require("../../assets/icons/order_status.png")}
              onPress={() => router.navigate("/screens/MyOrder")}
              isLast={true}
            />
          </Surface>

          <Text style={styles.sectionHeader}>TOPLULUK & DESTEK</Text>
          <Surface style={styles.menuGroup} elevation={1}>
            <MenuItem
              title="Topluluk Sıralaması"
              subtitle="En çok katkı sağlayanlar"
              iconSource={require("../../assets/icons/analitik.png")}
              onPress={() => router.navigate("/screens/CommunityRank")}
            />
            <View style={styles.divider} />
            <MenuItem
              title="İletişim"
              subtitle="Bize ulaşın"
              iconSource="phone"
              iconType="paper"
              onPress={() => {}} // Fonksiyon eklenebilir
              isLast={true}
            />
          </Surface>

          <Button
            mode="outlined"
            textColor="#e53935"
            style={styles.logoutButton}
            contentStyle={{ height: 48 }}
            icon="logout"
            onPress={handleLogout}
          >
            Güvenli Çıkış Yap
          </Button>

          <Text style={styles.versionText}>v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA", // Daha modern, hafif gri arka plan
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingBottom: 70,
  },
  headerBackground: {
    paddingHorizontal: 16,
    paddingTop: 10,
    marginBottom: 20,
  },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
  },
  avatarSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    backgroundColor: "#F0E4FF",
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  email: {
    color: "#757575",
    fontSize: 13,
    marginBottom: 8,
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3E5F5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  pointsIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
    tintColor: "#6200ee",
  },
  pointsText: {
    color: "#6200ee",
    fontWeight: "700",
    fontSize: 12,
  },
  sectionContainer: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#9aa0a6",
    marginBottom: 8,
    marginTop: 16,
    paddingLeft: 4,
    letterSpacing: 0.5,
  },
  menuGroup: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden", // Köşelerin düzgün görünmesi için
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
  },
  menuItemLast: {
    // Son eleman için özel stil gerekirse
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginLeft: 60, // İkonun hizasından başlasın
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f4f6f9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuIconImage: {
    width: 22,
    height: 22,
    tintColor: "#6200ee",
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  menuSubtitle: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  logoutButton: {
    marginTop: 10,
    borderColor: "#e53935",
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  versionText: {
    textAlign: "center",
    color: "#ccc",
    fontSize: 11,
    marginTop: 20,
    marginBottom: 10,
  },
});

export default Profile;
