import { getUsers } from "@/services/api";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const CommunityRank = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef([]).current;

  useEffect(() => {
    getUsers()
      .then((res) => {
        // Sadece role "user" olan kullanıcıları filtrele
        const userRoleOnly = res.data.filter((u) => u.role === "user");

        // Filtrelenmiş kullanıcıları puana göre sırala
        const sorted = userRoleOnly.sort(
          (a, b) => b.topluluk_Puani - a.topluluk_Puani
        );
        setUsers(sorted);
        setLoading(false);

        // Fade-in animasyonu
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();

        // Kart animasyonlarını başlat
        sorted.forEach((_, index) => {
          if (!cardAnims[index]) {
            cardAnims[index] = new Animated.Value(0);
          }
          Animated.timing(cardAnims[index], {
            toValue: 1,
            duration: 400,
            delay: index * 100,
            useNativeDriver: true,
          }).start();
        });
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  const getMedalEmoji = (index) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}`;
  };

  const getCardColor = (index) => {
    if (index === 0) return ["#FFD700", "#FFA500"];
    if (index === 1) return ["#C0C0C0", "#A8A8A8"];
    if (index === 2) return ["#CD7F32", "#8B4513"];
    return ["#667eea", "#764ba2"];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Sıralama yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Topluluk Sıralaması</Text>
        <Text style={styles.subtitle}>En aktif topluluk üyeleri</Text>
      </View>

      <Animated.View style={{ opacity: fadeAnim }}>
        {users.map((user, index) => {
          // Her kart için animasyon değeri oluştur
          if (!cardAnims[index]) {
            cardAnims[index] = new Animated.Value(1);
          }

          return (
            <Animated.View
              key={user.user_id}
              style={[
                styles.cardWrapper,
                {
                  opacity: cardAnims[index],
                  transform: [
                    {
                      translateY: cardAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={getCardColor(index)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.card, index < 3 && styles.topThreeCard]}
              >
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{getMedalEmoji(index)}</Text>
                </View>

                <View style={styles.userInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {user.full_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.details}>
                    <Text style={styles.userName}>{user.full_name}</Text>
                    <View style={styles.pointsContainer}>
                      <Text style={styles.points}>{user.topluluk_Puani}</Text>
                      <Text style={styles.pointsLabel}>puan</Text>
                    </View>
                  </View>
                </View>

                {index < 3 && (
                  <View style={styles.crownContainer}>
                    <Text style={styles.crown}>👑</Text>
                  </View>
                )}
              </LinearGradient>
            </Animated.View>
          );
        })}
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Toplam {users.length} üye</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#667eea",
    fontWeight: "600",
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#2d3748",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#718096",
    textAlign: "center",
    fontWeight: "500",
  },
  cardWrapper: {
    marginHorizontal: 20,
    marginTop: 16,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  topThreeCard: {
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  rankBadge: {
    position: "absolute",
    top: -10,
    left: 20,
    backgroundColor: "#fff",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  rankText: {
    fontSize: 20,
    fontWeight: "700",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  details: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  pointsContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  points: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginRight: 6,
  },
  pointsLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
  },
  crownContainer: {
    position: "absolute",
    top: -8,
    right: 20,
  },
  crown: {
    fontSize: 28,
  },
  footer: {
    paddingVertical: 30,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#a0aec0",
    fontWeight: "600",
  },
});

export default CommunityRank;
