import { useAuth } from "@/context/AuthContext";
import { changePassword, forgotPassword, updateUser } from "@/services/api";
import { Formik } from "formik";
import React, { useState } from "react";
import { Modal, ScrollView, View } from "react-native";
import { Button, Card, Divider, TextInput, Title } from "react-native-paper";
import Toast from "react-native-toast-message";
import * as Yup from "yup";

const EditProfil = () => {
  const { user, updateUser: authUpdateUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false); // DEĞİŞ: Modal aç
  const [emailStep, setEmailStep] = useState(true);
  const [resetEmail, setResetEmail] = useState("");

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

  const handleUpdate = async (values) => {
    setLoading(true);
    try {
      const data = await updateUser(values);
      authUpdateUser(data);
      Toast.show({ type: "success", text1: "Bilgiler güncellendi" });
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
      console.log("ChangePassword submitting:", values); // Debug
      await changePassword(values);
      Toast.show({ type: "success", text1: "Şifre değiştirildi" });
      setShowPasswordSection(false);
    } catch (error) {
      console.error("ChangePassword failed:", error.message); // EK: Full error log
      Toast.show({
        type: "error",
        text1: "Şifre Hatası",
        text2: error.message || "Bilinmeyen hata", // EK: Detaylı mesaj
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (values) => {
    // DEĞİŞ: values object bekle
    setLoading(true);
    try {
      const fullData = { e_posta: resetEmail, ...values }; // EK: e_posta ekle
      console.log("ForgotPassword submitting:", fullData); // EK: Debug log
      await forgotPassword(fullData);
      Toast.show({
        type: "success",
        text1: "Şifre sıfırlandı",
        text2: "Lütfen giriş yapın.",
      });
      setShowForgotModal(false);
      setEmailStep(true);
      logout();
    } catch (error) {
      console.error("ForgotPassword error:", error); // EK: Log
      Toast.show({
        type: "error",
        text1: "Sıfırlama hatası",
        text2: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <ScrollView style={{ padding: 16 }}>
      <Title>Profil Bilgileri</Title>
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
          <Card style={{ marginBottom: 16 }}>
            <Card.Content>
              <TextInput
                label="Ad Soyad"
                value={values.full_name} // DEĞİŞ: values.field kullan
                onChangeText={handleChange("full_name")}
                error={touched.full_name && errors.full_name}
                mode="outlined"
              />
              <TextInput
                label="E-posta"
                value={values.e_posta}
                onChangeText={handleChange("e_posta")}
                error={touched.e_posta && errors.e_posta}
                mode="outlined"
                keyboardType="email-address"
              />
              <TextInput
                label="Telefon"
                value={values.phone}
                onChangeText={handleChange("phone")}
                error={touched.phone && errors.phone}
                mode="outlined"
                keyboardType="phone-pad"
              />
              <TextInput
                label="Adres"
                value={values.adress}
                onChangeText={handleChange("adress")}
                multiline
                mode="outlined"
              />
              <Button
                loading={loading}
                mode="contained"
                onPress={handleSubmit}
                style={{ marginTop: 16 }}
              >
                Güncelle
              </Button>
            </Card.Content>
          </Card>
        )}
      </Formik>

      <Divider style={{ marginVertical: 16 }} />

      <Title>Şifre Yönetimi</Title>
      <Button
        mode="outlined"
        onPress={() => setShowPasswordSection(!showPasswordSection)}
      >
        {showPasswordSection ? "Kapat" : "Şifre Değiştir"}
      </Button>

      {showPasswordSection && (
        <Card style={{ marginTop: 16 }}>
          <Card.Content>
            <Formik
              initialValues={{
                old_password: "",
                new_password: "",
                repassword: "",
              }}
              validationSchema={Yup.object({
                old_password: Yup.string().required("Eski şifre zorunlu."),
                new_password: Yup.string()
                  .min(8, "En az 8 karakter.")
                  .required(),
                repassword: Yup.string()
                  .oneOf([Yup.ref("new_password")], "Şifreler eşleşmeli.")
                  .required(),
              })}
              onSubmit={handleChangePassword}
            >
              {(
                {
                  values,
                  errors,
                  touched,
                  setFieldValue,
                  handleSubmit,
                  isSubmitting,
                } // EK: touched, isSubmitting
              ) => (
                <>
                  <TextInput
                    label="Eski Şifre"
                    secureTextEntry
                    value={values.old_password}
                    onChangeText={(text) => setFieldValue("old_password", text)}
                    error={touched.old_password && errors.old_password} // EK: Touched ile submit sonrası göster
                    mode="outlined"
                  />
                  <TextInput
                    label="Yeni Şifre"
                    secureTextEntry
                    value={values.new_password}
                    onChangeText={(text) => setFieldValue("new_password", text)}
                    error={touched.new_password && errors.new_password}
                    mode="outlined"
                  />
                  <TextInput
                    label="Tekrar Yeni Şifre"
                    secureTextEntry
                    value={values.repassword}
                    onChangeText={(text) => setFieldValue("repassword", text)}
                    error={touched.repassword && errors.repassword}
                    mode="outlined"
                  />
                  <Button
                    loading={loading || isSubmitting} // EK: Formik loading
                    mode="contained"
                    onPress={handleSubmit}
                    style={{ marginTop: 16 }}
                  >
                    Değiştir
                  </Button>
                </>
              )}
            </Formik>
          </Card.Content>
        </Card>
      )}

      <Button
        mode="text"
        onPress={() => setShowForgotModal(true)} // DEĞİŞ: Modal aç, direkt çağırma
        style={{ marginTop: 16 }}
      >
        Şifremi Unuttum
      </Button>

      {/* Modal: İki Aşamalı Sıfırlama – Zaten düzeltilmiş, ama onSubmit'i güncelle */}
      <Modal
        visible={showForgotModal}
        animationType="slide"
        onRequestClose={() => setShowForgotModal(false)}
      >
        <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
          <Card>
            <Card.Content>
              <Title>
                {emailStep ? "E-posta Girin" : "Yeni Şifre Oluşturun"}
              </Title>

              {emailStep ? (
                <Formik
                  initialValues={{ e_posta: user?.e_posta || "" }}
                  validationSchema={emailValidation}
                  onSubmit={(values) => {
                    setResetEmail(values.e_posta);
                    setEmailStep(false);
                  }}
                >
                  {(
                    {
                      values,
                      handleChange,
                      handleSubmit,
                      errors,
                      touched,
                      setFieldValue,
                    } // EK: values, setFieldValue
                  ) => (
                    <>
                      <TextInput
                        label="E-posta"
                        value={values.e_posta} // DEĞİŞ: values kullan (zaten var)
                        onChangeText={(text) => setFieldValue("e_posta", text)} // DEĞİŞ: setFieldValue (güvenli)
                        error={touched.e_posta && errors.e_posta}
                        mode="outlined"
                        keyboardType="email-address"
                      />
                      <Button
                        mode="contained"
                        onPress={handleSubmit}
                        style={{ marginTop: 16 }}
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
                  onSubmit={(values) => handleForgotPassword(values)} // DEĞİŞ: Direkt values geç (handle içerde e_posta ekler)
                >
                  {(
                    {
                      values,
                      handleChange,
                      handleSubmit,
                      errors,
                      touched,
                      setFieldValue,
                    } // EK: values, setFieldValue
                  ) => (
                    <>
                      <TextInput
                        label="Yeni Şifre"
                        secureTextEntry
                        value={values.new_password}
                        onChangeText={(text) =>
                          setFieldValue("new_password", text)
                        }
                        error={touched.new_password && errors.new_password}
                        mode="outlined"
                      />
                      <TextInput
                        label="Tekrar Yeni Şifre"
                        secureTextEntry
                        value={values.repassword}
                        onChangeText={(text) =>
                          setFieldValue("repassword", text)
                        }
                        error={touched.repassword && errors.repassword}
                        mode="outlined"
                      />
                      <Button
                        loading={loading}
                        mode="contained"
                        onPress={handleSubmit}
                        style={{ marginTop: 16 }}
                      >
                        Sıfırla
                      </Button>
                    </>
                  )}
                </Formik>
              )}

              <Button
                mode="text"
                onPress={() => {
                  setShowForgotModal(false);
                  setEmailStep(true);
                }}
                style={{ marginTop: 16 }}
              >
                Geri Dön
              </Button>
            </Card.Content>
          </Card>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default EditProfil;
