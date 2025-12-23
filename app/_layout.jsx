import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/context/AuthContext"; // Path düzelt: context mi AuthContext?
import { Stack, useRouter } from "expo-router"; // useRouter'ı EKLE
import { useEffect } from "react"; // useEffect'i EKLE
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
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter(); // EKLE

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("Not authenticated – Redirect to Login");
      router.replace("/(auth)/Login");
    }
  }, [isAuthenticated, isLoading, router]); // Dependency'leri ekle

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Yükleniyor...</Text>
      </View>
    );
  }

  // Ek: Authenticated ise tabs'e force git (opsiyonel, index route handle etsin)
  if (isAuthenticated && router.pathname?.startsWith("/(auth)")) {
    router.replace("/(tabs)/index");
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
