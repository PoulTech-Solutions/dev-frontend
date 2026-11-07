import { Asset } from "expo-asset";

export async function loadInvoiceLogo(): Promise<string> {
  const asset = Asset.fromModule(require("../assets/images/logo.png"));
  const response = await fetch(asset.uri);
  if (!response.ok) throw new Error("The Poultech logo could not be loaded.");

  const image = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("The Poultech logo could not be converted."));
    };
    reader.onerror = () => reject(new Error("The Poultech logo could not be read."));
    reader.readAsDataURL(image);
  });
}
