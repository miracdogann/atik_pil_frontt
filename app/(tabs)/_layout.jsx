import { Tabs } from "expo-router";
import React, { useEffect } from "react";
import { Dimensions, Image, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Import local icons
import { useAuth } from "@/context/AuthContext";
import MapIcon from "../../assets/icons/map4.png";
import RewardIcon from "../../assets/icons/shopping-cart.png";
import ProfileIcon from "../../assets/icons/user.png";

const { width } = Dimensions.get("window");

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { loadUser, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadUser();
    }
  }, [isAuthenticated]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#6200EA",
        tabBarInactiveTintColor: "#000000ff",
        tabBarShowLabel: true, // Yazıların görünmesini istiyorsan true, istemiyorsan false yap
        tabBarLabelStyle: {
          fontSize: 10,
          marginBottom: 5, // İkon ile yazı arası boşluk (Android/iOS dengesi için)
          fontWeight: "600",
        },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "#ffffffd0",
          borderRadius: 30, // Daha yumuşak yuvarlak köşeler
          borderTopWidth: 0, // Üstteki ince çizgiyi kaldırır (iOS default)

          // Yükseklik Ayarı
          height: 70, // Yüzen bar için biraz daha geniş alan iyidir

          // Konumlandırma (Hem iOS hem Android uyumlu)
          bottom: Platform.OS === "ios" ? insets.bottom : 40, // iOS'te safe area, Android'de 20px boşluk
          left: 20,
          right: 20,

          // Gölgelendirme (Cross-Platform)
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1, // Daha modern, hafif gölge
          shadowRadius: 10,
          elevation: 10, // Android gölgesi
        },
        // İkonların ortalanması ve taşmaması için item stili
        tabBarItemStyle: {
          paddingTop: 10,
          height: 60,
        },
      }}
    >
      <Tabs.Screen
        name="Map"
        options={{
          title: "Harita",
          tabBarIcon: ({ focused, size }) => (
            <Image
              source={MapIcon}
              style={{
                width: 24, // Sabit boyut vermek kaymayı önler
                height: 24,
                tintColor: focused ? "#6200EA" : "#757575", // Opacity yerine renk değişimi daha net görünür
                resizeMode: "contain",
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="PilTeslimNoktalari"
        options={{
          title: "Pil Teslimi",
          tabBarIcon: ({ focused, size }) => (
            <Image
              source={require("../../assets/icons/battery.png")}
              style={{
                width: 24,
                height: 24,
                tintColor: focused ? "#6200EA" : "#757575",
                resizeMode: "contain",
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="Reward"
        options={{
          title: "Sepet",
          tabBarIcon: ({ focused, size }) => (
            <Image
              source={RewardIcon}
              style={{
                width: 24,
                height: 24,
                tintColor: focused ? "#6200EA" : "#757575",
                resizeMode: "contain",
              }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="Profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ focused, size }) => (
            <Image
              source={ProfileIcon}
              style={{
                width: 24,
                height: 24,
                tintColor: focused ? "#6200EA" : "#757575",
                resizeMode: "contain",
              }}
            />
          ),
        }}
      />
    </Tabs>
  );
}
