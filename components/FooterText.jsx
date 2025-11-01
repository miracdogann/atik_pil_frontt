import { StyleSheet, Text, View } from "react-native";

const FooterText = () => {
  return (
    <View style={styles.footerCont}>
      <Text style={styles.footerText}>www.recycai.com</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  footerCont: {
    backgroundColor: "white",
    borderRadius: 20,
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignSelf: "center",

    // iOS Shadow
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,

    // Android Elevation
    elevation: 5,
  },
  footerText: {
    fontSize: 14,
    color: "black",
    textAlign: "center",
  },
});

export default FooterText;
