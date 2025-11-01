import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Dimensions, FlatList, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Divider,
  Text,
} from "react-native-paper";
import Header from "../../components/Header";
import { getPoints } from "../../services/api";

const { width } = Dimensions.get("window");
const CARD_MARGIN = 10;
const CARD_WIDTH = width - CARD_MARGIN * 2;

const PilTeslimNoktalari = () => {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getPoints()
      .then((response) => {
        setPoints(response.data);
        // console.log(response.data);
      })
      .catch((error) => {
        console.error("Pil Teslim Noktaları çağrısında hata:", error);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <Card style={styles.card} mode="elevated">
      <Card.Content style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔋</Text>
          {/* Yerel ikon yerine emoji kullanıldı */}
        </View>
        <View style={styles.textContainer}>
          <Text variant="titleMedium" style={styles.title}>
            {item.kurum_name}
          </Text>
          <Text variant="bodyMedium" style={styles.description}>
            Adres: {item.kurum_adress}
          </Text>
          <Text variant="bodyMedium" style={styles.description}>
            Telefon: {item.kurum_telefon}
          </Text>
        </View>
        <Button
          mode="contained"
          onPress={() =>
            router.push({
              pathname: "/Pages/PilTeslim",
              params: {
                kurum_id: item.kurum_id,
                kurum_name: item.kurum_name,
                kurum_adress: item.kurum_adress,
                kurum_telefon: item.kurum_telefon,
              },
            })
          }
          buttonColor="#6200ee"
          style={styles.button}
        >
          Pil Teslimi Yap
        </Button>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Header />
      <Divider style={styles.divider} />
      <Text variant="headlineSmall" style={styles.headerText}>
        Pil Teslim Etme Noktaları
      </Text>
      <FlatList
        data={points}
        keyExtractor={(item) => item.kurum_id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.flatList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5", // Daha yumuşak bir arka plan rengi
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  headerText: {
    alignSelf: "center",
    marginVertical: 15,
    fontWeight: "bold",
    color: "#333",
  },
  divider: {
    backgroundColor: "#ddd",
    height: 1,
  },
  flatList: {
    padding: CARD_MARGIN,
  },
  card: {
    width: CARD_WIDTH,
    marginHorizontal: CARD_MARGIN,
    marginVertical: 8,
    borderRadius: 12,
    backgroundColor: "#fff",
    elevation: 4, // Gölge efekti
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    fontSize: 24, // Emoji veya ikon boyutu
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  description: {
    color: "#666",
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    borderRadius: 8,
    paddingHorizontal: 8,
  },
});

export default PilTeslimNoktalari;
