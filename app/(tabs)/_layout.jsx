import { Tabs } from "expo-router";
import React from "react";
import { Dimensions, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Import local icons from the assets folder
import MapIcon from "../../assets/icons/map4.png";
import RewardIcon from "../../assets/icons/shopping-cart.png";
import ProfileIcon from "../../assets/icons/user.png";

const { width } = Dimensions.get("window");

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabHeight = 60; // Base height in pixels, can be adjusted
  const tabMargin = width * 0.05; // 5% of screen width for margin
  const tabBorderRadius = width * 0.1; // 10% of screen width for border radius
  const tabBottomOffset = -25; // Increased to lower the tab bar, adjust as needed

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#6200EA",
        tabBarInactiveTintColor: "#757575",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderRadius: tabBorderRadius,
          position: "absolute",
          bottom: tabBottomOffset + insets.bottom, // Adjust for safe area
          left: tabMargin,
          right: tabMargin,
          elevation: 5,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          height: tabHeight,
          paddingHorizontal: width * 0.02, // 2% of screen width for padding
          margin: 20,
        },
      }}
    >
      <Tabs.Screen
        name="Map"
        options={{
          title: "Harita",
          tabBarIcon: ({ focused, color, size }) => (
            <Image
              source={MapIcon}
              style={{
                width: size, // icon’u biraz küçült
                height: size,
                tintColor: focused ? "#6200EA" : "#6200ea25",
                resizeMode: "contain", // Görsel orantılı daralsın
                alignSelf: "center", // Yatay ortala
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="PilTeslimNoktalari"
        options={{
          title: "Pil Teslimi",
          tabBarIcon: ({ focused, color, size }) => (
            <Image
              source={require("../../assets/icons/battery.png")}
              style={{
                width: size,
                height: size,
                tintColor: focused ? "#6200EA" : "#6200ea25",
                resizeMode: "contain", // Görsel orantılı daralsın
                alignSelf: "center", // Yatay ortala
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="Reward"
        options={{
          title: "Sepet",
          tabBarIcon: ({ focused, color, size }) => (
            <Image
              source={RewardIcon}
              style={{
                width: size,
                height: size,
                tintColor: focused ? "#6200EA" : "#6200ea25",
                resizeMode: "contain", // Görsel orantılı daralsın
                alignSelf: "center", // Yatay ortala
              }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="Profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ focused, color, size }) => (
            <Image
              source={ProfileIcon}
              style={{
                width: size,
                height: size,
                tintColor: focused ? "#6200EA" : "#6200ea25",
                resizeMode: "contain", // Görsel orantılı daralsın
                alignSelf: "center", // Yatay ortala
              }}
            />
          ),
        }}
      />
    </Tabs>
  );
}
