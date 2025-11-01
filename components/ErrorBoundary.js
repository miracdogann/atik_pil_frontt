import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Hata yakala, state'i güncelle
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Hata log'la (sadece dev modda)
    if (__DEV__) {
      console.warn('ErrorBoundary yakaladı:', error, errorInfo);
    }
    // Toast göster
    Toast.show({
      type: 'error',
      text1: 'Uygulamada bir hata oluştu',
      text2: 'Sayfayı yenileyin',
    });
  }

  render() {
    if (this.state.hasError) {
      // Hata durumunda basit ekran göster (red screen yerine)
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Bir hata oluştu!</Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false })}  // Yenile
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Yeniden Dene</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;  // Normal app
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#6200ee',
    padding: 15,
    borderRadius: 5,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ErrorBoundary;