import { Platform } from "react-native";
import { CLOUDINARY_URL, UPLOAD_PRESET } from "./cloudinary";

export const uploadImage = async (uri, e_posta) => {
  try {
    const uriParts = uri.split("/");
    const fileName = uriParts[uriParts.length - 1];
    const fileType = fileName.split(".").pop();

    const formData = new FormData();
    formData.append("file", {
      uri: Platform.OS === "ios" ? uri.replace("file://", "") : uri,
      type: `image/${fileType}`,
      name: fileName,
    });
    formData.append("upload_preset", UPLOAD_PRESET);
    const folderPath = `atik_pil/${e_posta}`;
    formData.append("folder", folderPath);
    formData.append("public_id", fileName.replace(/\.[^/.]+$/, ""));

    const res = await fetch(`${CLOUDINARY_URL}`, {
      method: "POST",
      body: formData,
      headers: { "Content-Type": "multipart/form-data" },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || "Cloudinary yükleme hatası");
    }
    return data.secure_url;  // Emin return
  } catch (error) {
    console.error("Upload error:", error.message);
    return null;
  }
};