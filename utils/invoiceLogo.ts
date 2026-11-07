import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";

export async function loadInvoiceLogo(): Promise<string> {
  const [asset] = await Asset.loadAsync(require("../assets/images/logo.png"));
  if (!asset.localUri) throw new Error("The Poultech logo could not be loaded.");

  const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:image/${asset.type};base64,${base64}`;
}
