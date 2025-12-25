import { useAuth } from "@/context/AuthContext";
import { changePassword, forgotPassword, updateUser } from "@/services/api";
import { Formik } from "formik";
import React, { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  Button,
  Card,
  Chip,
  IconButton,
  Portal,
  Surface,
  Text,
  TextInput,
} from "react-native-paper";
import Toast from "react-native-toast-message";
import * as Yup from "yup";

const EditProfil = () => {
  const { user, updateUser: authUpdateUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  // Şifre bölümü toggle ve modal state'leri
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [emailStep, setEmailStep] = useState(true);
  const [resetEmail, setResetEmail] = useState("");

  // Şifre görünürlük state'i
  const [secureTextEntry, setSecureTextEntry] = useState({
    old: true,
    new: true,
    confirm: true,
    forgot_new: true,
    forgot_confirm: true,
  });

  // Validasyon Şemaları
  const validationSchema = Yup.object({
    full_name: Yup.string().required("Ad soyad zorunlu."),
    e_posta: Yup.string()
      .email("Geçersiz e-posta")
      .required("E-posta zorunlu."),
    phone: Yup.string()
      .matches(/^\+?[\d\s-()]{10,}$/, "Geçersiz telefon.")
      .required("Telefon zorunlu."),
    adress: Yup.string().notRequired(),
  });

  const changePasswordValidation = Yup.object({
    old_password: Yup.string().required("Eski şifre zorunlu."),
    new_password: Yup.string()
      .min(8, "En az 8 karakter.")
      .required("Yeni şifre zorunlu."),
    repassword: Yup.string()
      .oneOf([Yup.ref("new_password")], "Şifreler eşleşmiyor.")
      .required("Tekrar zorunlu."),
  });

  const emailValidation = Yup.object({
    e_posta: Yup.string()
      .email("Geçersiz e-posta")
      .required("E-posta zorunlu."),
  });

  const passwordValidation = Yup.object({
    new_password: Yup.string().min(8, "En az 8 karakter.").required(),
    repassword: Yup.string()
      .oneOf([Yup.ref("new_password")], "Şifreler eşleşmeli.")
      .required(),
  });

  // API İstek Fonksiyonları
  const handleUpdate = async (values) => {
    setLoading(true);
    try {
      const data = await updateUser(values);
      authUpdateUser(data);
      Toast.show({ type: "success", text1: "✓ Bilgiler güncellendi" });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Güncelleme hatası",
        text2: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values) => {
    setLoading(true);
    try {
      await changePassword(values);
      Toast.show({ type: "success", text1: "✓ Şifre değiştirildi" });
      setShowPasswordSection(false);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Şifre Hatası",
        text2: error.message || "Bilinmeyen hata",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (values) => {
    setLoading(true);
    try {
      const fullData = { e_posta: resetEmail, ...values };
      await forgotPassword(fullData);
      Toast.show({
        type: "success",
        text1: "✓ Şifre sıfırlandı",
        text2: "Lütfen giriş yapın.",
      });
      setShowForgotModal(false);
      setEmailStep(true);
      logout();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Sıfırlama hatası",
        text2: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <Surface style={styles.header} elevation={1}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
              </Text>
            </View>
          </View>
          <Text style={styles.headerTitle}>
            {user?.full_name || "Kullanıcı"}
          </Text>
          <Text style={styles.headerSubtitle}>{user?.e_posta}</Text>
        </Surface>

        {/* Profile Information Card */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Profil Bilgileri</Text>
            <Chip icon="account" mode="outlined" style={styles.chip}>
              Genel
            </Chip>
          </View>

          <Formik
            initialValues={{
              full_name: user?.full_name || "",
              e_posta: user?.e_posta || "",
              phone: user?.phone || "",
              adress: user?.adress || "",
            }}
            validationSchema={validationSchema}
            onSubmit={handleUpdate}
          >
            {({ handleChange, handleSubmit, values, errors, touched }) => (
              <Card style={styles.card}>
                <Card.Content>
                  <TextInput
                    label="Ad Soyad"
                    value={values.full_name}
                    onChangeText={handleChange("full_name")}
                    error={touched.full_name && !!errors.full_name}
                    mode="outlined"
                    left={<TextInput.Icon icon="account" />}
                    style={styles.input}
                  />
                  {touched.full_name && errors.full_name && (
                    <Text style={styles.errorText}>{errors.full_name}</Text>
                  )}

                  <TextInput
                    label="E-posta"
                    value={values.e_posta}
                    onChangeText={handleChange("e_posta")}
                    error={touched.e_posta && !!errors.e_posta}
                    mode="outlined"
                    left={<TextInput.Icon icon="email" />}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                  />
                  {touched.e_posta && errors.e_posta && (
                    <Text style={styles.errorText}>{errors.e_posta}</Text>
                  )}

                  <TextInput
                    label="Telefon"
                    value={values.phone}
                    onChangeText={handleChange("phone")}
                    error={touched.phone && !!errors.phone}
                    mode="outlined"
                    left={<TextInput.Icon icon="phone" />}
                    keyboardType="phone-pad"
                    style={styles.input}
                  />
                  {touched.phone && errors.phone && (
                    <Text style={styles.errorText}>{errors.phone}</Text>
                  )}

                  <TextInput
                    label="Adres"
                    value={values.adress}
                    onChangeText={handleChange("adress")}
                    multiline
                    numberOfLines={3}
                    mode="outlined"
                    left={<TextInput.Icon icon="map-marker" />}
                    style={styles.input}
                  />

                  <Button
                    loading={loading}
                    mode="contained"
                    onPress={handleSubmit}
                    style={styles.primaryButton}
                    icon="content-save"
                    contentStyle={styles.buttonContent}
                  >
                    Değişiklikleri Kaydet
                  </Button>
                </Card.Content>
              </Card>
            )}
          </Formik>
        </View>

        {/* Password Management Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Güvenlik</Text>
            <Chip icon="shield-lock" mode="outlined" style={styles.chip}>
              Şifre
            </Chip>
          </View>

          <Card style={styles.card}>
            <Card.Content>
              <TouchableOpacity
                onPress={() => setShowPasswordSection(!showPasswordSection)}
                style={styles.passwordToggle}
              >
                <View style={styles.passwordToggleLeft}>
                  <IconButton icon="lock-reset" size={24} />
                  <View>
                    <Text style={styles.passwordToggleTitle}>
                      Şifre Değiştir
                    </Text>
                    <Text style={styles.passwordToggleSubtitle}>
                      Hesap güvenliğinizi koruyun
                    </Text>
                  </View>
                </View>
                <IconButton
                  icon={showPasswordSection ? "chevron-up" : "chevron-down"}
                  size={24}
                />
              </TouchableOpacity>

              {showPasswordSection && (
                <View style={styles.passwordForm}>
                  <Formik
                    initialValues={{
                      old_password: "",
                      new_password: "",
                      repassword: "",
                    }}
                    validationSchema={changePasswordValidation}
                    onSubmit={handleChangePassword}
                  >
                    {({
                      values,
                      errors,
                      touched,
                      setFieldValue,
                      handleSubmit,
                    }) => (
                      <>
                        <TextInput
                          label="Mevcut Şifre"
                          secureTextEntry={secureTextEntry.old}
                          value={values.old_password}
                          onChangeText={(text) =>
                            setFieldValue("old_password", text)
                          }
                          error={touched.old_password && !!errors.old_password}
                          mode="outlined"
                          autoCapitalize="none"
                          left={<TextInput.Icon icon="lock" />}
                          right={
                            <TextInput.Icon
                              icon={secureTextEntry.old ? "eye" : "eye-off"}
                              onPress={() =>
                                setSecureTextEntry((p) => ({
                                  ...p,
                                  old: !p.old,
                                }))
                              }
                            />
                          }
                          style={styles.input}
                        />
                        {touched.old_password && errors.old_password && (
                          <Text style={styles.errorText}>
                            {errors.old_password}
                          </Text>
                        )}

                        <TextInput
                          label="Yeni Şifre"
                          secureTextEntry={secureTextEntry.new}
                          value={values.new_password}
                          onChangeText={(text) =>
                            setFieldValue("new_password", text)
                          }
                          error={touched.new_password && !!errors.new_password}
                          mode="outlined"
                          autoCapitalize="none"
                          left={<TextInput.Icon icon="lock-plus" />}
                          right={
                            <TextInput.Icon
                              icon={secureTextEntry.new ? "eye" : "eye-off"}
                              onPress={() =>
                                setSecureTextEntry((p) => ({
                                  ...p,
                                  new: !p.new,
                                }))
                              }
                            />
                          }
                          style={styles.input}
                        />
                        {touched.new_password && errors.new_password && (
                          <Text style={styles.errorText}>
                            {errors.new_password}
                          </Text>
                        )}

                        <TextInput
                          label="Yeni Şifre Tekrar"
                          secureTextEntry={secureTextEntry.confirm}
                          value={values.repassword}
                          onChangeText={(text) =>
                            setFieldValue("repassword", text)
                          }
                          error={touched.repassword && !!errors.repassword}
                          mode="outlined"
                          autoCapitalize="none"
                          left={<TextInput.Icon icon="lock-check" />}
                          right={
                            <TextInput.Icon
                              icon={secureTextEntry.confirm ? "eye" : "eye-off"}
                              onPress={() =>
                                setSecureTextEntry((p) => ({
                                  ...p,
                                  confirm: !p.confirm,
                                }))
                              }
                            />
                          }
                          style={styles.input}
                        />
                        {touched.repassword && errors.repassword && (
                          <Text style={styles.errorText}>
                            {errors.repassword}
                          </Text>
                        )}

                        <Button
                          loading={loading}
                          mode="contained"
                          onPress={handleSubmit}
                          style={styles.primaryButton}
                          icon="shield-check"
                          contentStyle={styles.buttonContent}
                        >
                          Şifreyi Güncelle
                        </Button>

                        {/* <Button
                          mode="text"
                          onPress={() => setShowForgotModal(true)}
                          style={styles.textButton}
                          icon="help-circle"
                        >
                          Şifremi Unuttum
                        </Button> */}
                      </>
                    )}
                  </Formik>
                </View>
              )}
            </Card.Content>
          </Card>
        </View>

        {/* Alt kısımda extra boşluk (Scroll için) */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Forgot Password Modal */}
      <Portal>
        <Modal
          visible={showForgotModal}
          animationType="fade"
          transparent={true}
          onRequestClose={() => {
            setShowForgotModal(false);
            setEmailStep(true);
          }}
        >
          {/* Modal içeriğinde klavye kapatma desteği */}
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
              >
                <Surface style={styles.modalContainer} elevation={5}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      {emailStep ? "Şifre Sıfırlama" : "Yeni Şifre Oluştur"}
                    </Text>
                    <IconButton
                      icon="close"
                      size={24}
                      onPress={() => {
                        setShowForgotModal(false);
                        setEmailStep(true);
                      }}
                    />
                  </View>

                  <View style={styles.modalContent}>
                    {emailStep ? (
                      <Formik
                        initialValues={{ e_posta: user?.e_posta || "" }}
                        validationSchema={emailValidation}
                        onSubmit={(values) => {
                          setResetEmail(values.e_posta);
                          setEmailStep(false);
                        }}
                      >
                        {({
                          values,
                          handleChange,
                          handleSubmit,
                          errors,
                          touched,
                          setFieldValue,
                        }) => (
                          <>
                            <Text style={styles.modalDescription}>
                              Hesabınıza kayıtlı e-posta adresini girin
                            </Text>
                            <TextInput
                              label="E-posta Adresi"
                              value={values.e_posta}
                              onChangeText={(text) =>
                                setFieldValue("e_posta", text)
                              }
                              error={touched.e_posta && !!errors.e_posta}
                              mode="outlined"
                              autoCapitalize="none"
                              keyboardType="email-address"
                              left={<TextInput.Icon icon="email" />}
                              style={styles.input}
                            />
                            {touched.e_posta && errors.e_posta && (
                              <Text style={styles.errorText}>
                                {errors.e_posta}
                              </Text>
                            )}
                            <Button
                              mode="contained"
                              onPress={handleSubmit}
                              style={styles.primaryButton}
                              icon="arrow-right"
                            >
                              Devam Et
                            </Button>
                          </>
                        )}
                      </Formik>
                    ) : (
                      <Formik
                        initialValues={{ new_password: "", repassword: "" }}
                        validationSchema={passwordValidation}
                        onSubmit={(values) => handleForgotPassword(values)}
                      >
                        {({
                          values,
                          handleChange,
                          handleSubmit,
                          errors,
                          touched,
                          setFieldValue,
                        }) => (
                          <>
                            <Text style={styles.modalDescription}>
                              Yeni şifrenizi oluşturun (en az 8 karakter)
                            </Text>
                            <TextInput
                              label="Yeni Şifre"
                              secureTextEntry={secureTextEntry.forgot_new}
                              value={values.new_password}
                              onChangeText={(text) =>
                                setFieldValue("new_password", text)
                              }
                              error={
                                touched.new_password && !!errors.new_password
                              }
                              mode="outlined"
                              autoCapitalize="none"
                              left={<TextInput.Icon icon="lock-plus" />}
                              right={
                                <TextInput.Icon
                                  icon={
                                    secureTextEntry.forgot_new
                                      ? "eye"
                                      : "eye-off"
                                  }
                                  onPress={() =>
                                    setSecureTextEntry((p) => ({
                                      ...p,
                                      forgot_new: !p.forgot_new,
                                    }))
                                  }
                                />
                              }
                              style={styles.input}
                            />
                            {touched.new_password && errors.new_password && (
                              <Text style={styles.errorText}>
                                {errors.new_password}
                              </Text>
                            )}

                            <TextInput
                              label="Şifre Tekrar"
                              secureTextEntry={secureTextEntry.forgot_confirm}
                              value={values.repassword}
                              onChangeText={(text) =>
                                setFieldValue("repassword", text)
                              }
                              error={touched.repassword && !!errors.repassword}
                              mode="outlined"
                              autoCapitalize="none"
                              left={<TextInput.Icon icon="lock-check" />}
                              right={
                                <TextInput.Icon
                                  icon={
                                    secureTextEntry.forgot_confirm
                                      ? "eye"
                                      : "eye-off"
                                  }
                                  onPress={() =>
                                    setSecureTextEntry((p) => ({
                                      ...p,
                                      forgot_confirm: !p.forgot_confirm,
                                    }))
                                  }
                                />
                              }
                              style={styles.input}
                            />
                            {touched.repassword && errors.repassword && (
                              <Text style={styles.errorText}>
                                {errors.repassword}
                              </Text>
                            )}

                            <Button
                              loading={loading}
                              mode="contained"
                              onPress={handleSubmit}
                              style={styles.primaryButton}
                              icon="check"
                            >
                              Şifreyi Sıfırla
                            </Button>
                            <Button
                              mode="text"
                              onPress={() => setEmailStep(true)}
                              style={styles.textButton}
                              icon="arrow-left"
                            >
                              Geri Dön
                            </Button>
                          </>
                        )}
                      </Formik>
                    )}
                  </View>
                </Surface>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </Portal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20, // Klavye açıldığında en alttaki içeriğin sıkışmaması için
  },
  header: {
    padding: 24,
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#6200ee",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
  avatarText: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  chip: {
    height: 28,
    backgroundColor: "transparent",
  },
  card: {
    borderRadius: 16,
    elevation: 2,
    backgroundColor: "#fff",
  },
  input: {
    marginBottom: 10,
    backgroundColor: "#fff",
    fontSize: 15,
  },
  errorText: {
    color: "#B00020",
    fontSize: 12,
    marginTop: -6,
    marginBottom: 8,
    marginLeft: 4,
  },
  primaryButton: {
    marginTop: 12,
    borderRadius: 10,
    paddingVertical: 2,
  },
  buttonContent: {
    height: 48,
  },
  textButton: {
    marginTop: 8,
  },
  passwordToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  passwordToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  passwordToggleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  passwordToggleSubtitle: {
    fontSize: 12,
    color: "#777",
    marginLeft: 8,
    marginTop: 2,
  },
  passwordForm: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 24,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalContent: {
    padding: 24,
  },
  modalDescription: {
    fontSize: 15,
    color: "#555",
    marginBottom: 20,
    lineHeight: 22,
    textAlign: "center",
  },
  bottomSpacer: {
    height: 60, // ScrollView en alta indiğinde klavye payı
  },
});

export default EditProfil;
