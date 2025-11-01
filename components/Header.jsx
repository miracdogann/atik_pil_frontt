import { Image, StyleSheet, Text, View } from "react-native";

const Header = () => {
  return (
    <View style={styles.container}>
      {/* Üst: İki yan ikon + ortada başlık */}
      <View style={styles.topRow}>
        <Image
          style={styles.headIcon}
          source={require("../assets/icons/recycling.png")}
        />
        <Image
          style={styles.headIcon}
          source={require("../assets/icons/recycling.png")}
        />
      </View>
      <Text style={styles.title}>RecycAI</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 25,
    alignItems: "center",
    // backgroundColor: 'red',
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
  },
  headIcon: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: 38,
    fontWeight: "bold",
    fontFamily: "serif",
    color: "black",
  },
});

export default Header;
