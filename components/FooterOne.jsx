import { Image, StyleSheet, View } from "react-native";

const FooterOne = () => {
  return (
    <View style={styles.footerIcons}>
      <Image
        source={require("../assets/icons/battery-1.png")}
        style={styles.footerIcon}
      />
      <Image
        source={require("../assets/icons/battery-2.png")}
        style={styles.footerIcon}
      />
      <Image
        source={require("../assets/icons/battery-3.png")}
        style={styles.footerIcon}
      />
      <Image
        source={require("../assets/icons/battery-4.png")}
        style={styles.footerIcon}
      />
      <Image
        source={require("../assets/icons/battery-5.png")}
        style={styles.footerIcon}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  footerIcons: {
    alignItems: "center",
    borderColor: "grey",
    borderWidth: 0.1,
    borderRadius: 25,
    // paddingVertical: 5,
    flexDirection: "row",
    marginTop: 50,
    justifyContent: "space-around",
    width: "85%",
    alignSelf: "center",

    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,

    // Shadow for Android
    elevation: 5,
    backgroundColor: "white", // Android için zorunlu
  },

  footerIcon: {
    margin: 5,
    width: 35,
    height: 35,
    marginHorizontal: 5,
  },
});

export default FooterOne;
