import * as FileSystem from "expo-file-system/legacy";
import * as Linking from "expo-linking";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { createFarmRecordHtml } from "./farmRecordHtml";
import type { ShedFlockBook } from "./farmRecordTypes";

export async function generateFarmRecordPdf(input: {
  farmName: string;
  shedName: string;
  place?: string;
  book: ShedFlockBook;
}): Promise<string> {
  const html = createFarmRecordHtml(input);
  const { uri } = await Print.printToFileAsync({ html });
  if (Platform.OS === "web") return uri;

  const directory = FileSystem.documentDirectory;
  if (!directory) return uri;
  const targetDir = `${directory}farm-records/`;
  await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });
  const safeShed = input.shedName.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 40);
  const destination = `${targetDir}${safeShed}-${Date.now()}.pdf`;
  const existing = await FileSystem.getInfoAsync(destination);
  if (existing.exists) await FileSystem.deleteAsync(destination);
  await FileSystem.copyAsync({ from: uri, to: destination });
  return destination;
}

export async function shareFarmRecordPdf(uri: string, title: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    await Linking.openURL(uri);
    return;
  }
  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    UTI: "com.adobe.pdf",
    dialogTitle: title,
  });
}

export async function shareFarmRecordOnWhatsApp(uri: string, message: string): Promise<void> {
  const encoded = encodeURIComponent(message);
  const appUrl = `whatsapp://send?text=${encoded}`;
  const webUrl = `https://wa.me/?text=${encoded}`;

  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
        dialogTitle: "Share farm record on WhatsApp",
      });
      return;
    }
  } catch (error) {
    console.error("Could not share farm record PDF file.", error);
  }

  const canOpenApp = await Linking.canOpenURL(appUrl);
  await Linking.openURL(canOpenApp ? appUrl : webUrl);
}
