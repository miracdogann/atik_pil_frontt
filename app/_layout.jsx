import ErrorBoundary from "@/components/ErrorBoundary"; // <-- EKLE: Import
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Stack } from "expo-router";
import { Text, View } from "react-native";
import { PaperProvider } from "react-native-paper";
import Toast from "react-native-toast-message";

export default function RootLayout() {
  return (
    <PaperProvider>
      <AuthProvider>
        <ErrorBoundary>
          <RootNavigator />
          <Toast
            position="top"
            visibilityTime={5000}
            autoHide={true}
            topOffset={60}
            config={{
              success: (props) => (
                <View
                  style={{
                    height: 60,
                    width: "90%",
                    backgroundColor: "#4CAF50",
                    marginHorizontal: 20,
                    borderRadius: 10,
                    padding: 15,
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{ color: "white", fontSize: 16, fontWeight: "bold" }}
                  >
                    {props.text1}
                  </Text>
                  <Text style={{ color: "white", fontSize: 14 }}>
                    {props.text2}
                  </Text>
                </View>
              ),
              error: (props) => (
                <View
                  style={{
                    height: 60,
                    width: "90%",
                    backgroundColor: "#F44336",
                    marginHorizontal: 20,
                    borderRadius: 10,
                    padding: 15,
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{ color: "white", fontSize: 16, fontWeight: "bold" }}
                  >
                    {props.text1}
                  </Text>
                  <Text style={{ color: "white", fontSize: 14 }}>
                    {props.text2}
                  </Text>
                </View>
              ),
            }}
          />
        </ErrorBoundary>
      </AuthProvider>
    </PaperProvider>
  );
}

function RootNavigator() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
