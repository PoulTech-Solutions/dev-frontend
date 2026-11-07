import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ModuleHeader } from "../../../components/ui/ModuleHeader";
import { useAppLayout } from "../../../hooks/useAppLayout";
import { useLanguage } from "../../../utils/i18n";
import { useAuthStore } from "../../../store/useAuthStore";
import {
  loadInvoices,
  saveInvoice,
  type InvoiceRecord,
} from "../../../services/invoiceStorage";
import {
  generateInvoicePdf,
  openInvoicePdf,
  shareInvoicePdf,
} from "../../../utils/pdfGenerator";

function formatCurrency(value: number, language: string) {
  return `₹${value.toLocaleString(`${language}-IN`, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatInvoiceDate(value: string, language: string) {
  return new Intl.DateTimeFormat(`${language}-IN`, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function BillingScreen() {
  const router = useRouter();
  const { width } = useAppLayout();
  const { language, t } = useLanguage();
  const user = useAuthStore((state) => state.user);
  const demoMode = Boolean(user?.id.startsWith("mock-"));
  const [customerName, setCustomerName] = useState(demoMode ? "Aarav Poultry Traders" : "");
  const [itemName, setItemName] = useState(demoMode ? "Layer eggs · 30 trays" : "");
  const [quantity, setQuantity] = useState(demoMode ? "30" : "1");
  const [unitPrice, setUnitPrice] = useState(demoMode ? "180" : "");
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [sharingInvoiceId, setSharingInvoiceId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const contentWidth = Math.min(width - 36, 1120);
  const isWideLayout = width >= 900;
  const isCustomer = user?.role === "customer";
  const invoiceTotal = (Number(quantity) || 0) * (Number(unitPrice) || 0);

  useEffect(() => {
    if (!user?.id) {
      setInvoices([]);
      setIsLoadingInvoices(false);
      return;
    }

    let active = true;
    setIsLoadingInvoices(true);
    void loadInvoices(user.id)
      .then((savedInvoices) => {
        if (active) setInvoices(savedInvoices);
      })
      .catch((error: unknown) => {
        console.error("Could not load saved invoices.", error);
        if (active) {
          setMessage(t("Could not load your saved invoices. Please try again."));
          setMessageIsError(true);
        }
      })
      .finally(() => {
        if (active) setIsLoadingInvoices(false);
      });

    return () => {
      active = false;
    };
  }, [t, user?.id]);

  const createInvoice = async () => {
    const parsedQuantity = Number(quantity);
    const parsedPrice = Number(unitPrice);
    if (
      !user ||
      !customerName.trim() ||
      !itemName.trim() ||
      !Number.isFinite(parsedQuantity) ||
      !Number.isFinite(parsedPrice) ||
      parsedQuantity <= 0 ||
      parsedPrice <= 0
    ) {
      setMessage("Enter a customer, item, quantity, and valid unit price.");
      setMessageIsError(true);
      return;
    }

    setMessage("");
    setIsCreating(true);
    const now = new Date();
    const invoiceNumber = `PT-${now.getTime()}`;
    const total = parsedQuantity * parsedPrice;
    try {
      const invoiceDetails = {
        invoiceNumber,
        invoiceDate: formatInvoiceDate(now.toISOString(), language),
        sellerName: user.farmName?.trim() || user.name || t("Poultry Farm"),
        sellerPhone: user.phone,
        sellerEmail: user.email,
        customerName: customerName.trim(),
        items: [
          {
            description: itemName.trim(),
            quantity: parsedQuantity,
            unitPrice: parsedPrice,
          },
        ],
      };
      const pdfUri = await generateInvoicePdf(invoiceDetails);
      const invoice: InvoiceRecord = {
        ...invoiceDetails,
        id: invoiceNumber,
        userId: user.id,
        createdAt: now.toISOString(),
        total,
        pdfUri,
      };
      await saveInvoice(invoice);
      setInvoices((current) => [invoice, ...current]);
      setCustomerName("");
      setItemName("");
      setQuantity("1");
      setUnitPrice("");
      setMessage(t("Invoice created and saved."));
      setMessageIsError(false);
    } catch (error) {
      console.error("Could not generate and save invoice.", error);
      setMessage(
        error instanceof Error
          ? error.message
          : t("Could not create the invoice. Please try again."),
      );
      setMessageIsError(true);
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenInvoice = async (invoice: InvoiceRecord) => {
    setMessage("");
    try {
      await openInvoicePdf(invoice);
    } catch (error) {
      console.error("Could not open invoice PDF.", error);
      setMessage(
        error instanceof Error
          ? error.message
          : t("Could not open the invoice PDF. Please try sharing it instead."),
      );
      setMessageIsError(true);
    }
  };

  const handleShareInvoice = async (invoice: InvoiceRecord) => {
    setMessage("");
    setSharingInvoiceId(invoice.id);
    try {
      await shareInvoicePdf(invoice);
    } catch (error) {
      console.error("Could not share invoice PDF.", error);
      setMessage(
        error instanceof Error
          ? error.message
          : t("Could not share the invoice. Please try again."),
      );
      setMessageIsError(true);
    } finally {
      setSharingInvoiceId(null);
    }
  };

  const fieldStyle = {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    color: "#0F172A",
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
  } as const;

  return (
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1, backgroundColor: "#FAF7F0" }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 28 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
      >
        <View style={{ width: "100%", maxWidth: contentWidth, alignSelf: "center" }}>
          <Pressable
            accessibilityLabel={t("Back to My Farm")}
            accessibilityRole="button"
            className="mb-4 self-start cursor-pointer"
            onPress={() => router.replace("/(tabs)/(farm)/records")}
            style={{ minHeight: 40, flexDirection: "row", alignItems: "center", paddingRight: 12 }}
          >
            <Ionicons color="#14532D" name="arrow-back" size={18} />
            <Text style={{ marginLeft: 7, color: "#14532D", fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>
              {t("Back to My Farm")}
            </Text>
          </Pressable>

          <ModuleHeader
            title="Billing software"
            subtitle="Prepare an invoice and share a PDF with your customer."
          />

          {isCustomer ? (
            <EmptyState
              icon="information-circle-outline"
              title="Billing is for Poultry Owner accounts"
              description="Use the marketplace or services sections to explore customer options."
            />
          ) : (
            <>
              <View
                style={{
                  flexDirection: isWideLayout ? "row" : "column",
                  alignItems: isWideLayout ? "flex-start" : "stretch",
                  gap: 18,
                }}
              >
              <View style={{ flex: isWideLayout ? 0.9 : undefined, width: isWideLayout ? undefined : "100%", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 22, backgroundColor: "#FFFFFF", padding: 20 }}>
                <View style={{ marginBottom: 16, flexDirection: "row", alignItems: "center" }}>
                  <View style={{ width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#EFF6FF" }}>
                    <Ionicons color="#1D4ED8" name="receipt-outline" size={20} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 11 }}>
                    <Text style={{ color: "#0B2A5B", fontFamily: "Poppins_600SemiBold", fontSize: 14 }}>
                      {t("Create a bill")}
                    </Text>
                    <Text style={{ marginTop: 2, color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 11 }}>
                      {t("Enter the customer and item details, then save a PDF invoice.")}
                    </Text>
                  </View>
                </View>
                {demoMode ? (
                  <View style={{ marginBottom: 15, flexDirection: "row", alignItems: "flex-start", borderRadius: 13, backgroundColor: "#FFFBEB", padding: 11 }}>
                    <Ionicons color="#A16207" name="information-circle-outline" size={17} />
                    <Text style={{ flex: 1, marginLeft: 7, color: "#854D0E", fontFamily: "Poppins_400Regular", fontSize: 10, lineHeight: 16 }}>
                      {t("Sample invoice values are prefilled for preview. Review or edit them before sharing.")}
                    </Text>
                  </View>
                ) : null}

                <View style={{ gap: 14 }}>
                  {[
                    { label: "Customer name", value: customerName, onChangeText: setCustomerName, placeholder: "Enter customer name", keyboardType: "default" as const },
                    { label: "Item or product", value: itemName, onChangeText: setItemName, placeholder: "Enter item description", keyboardType: "default" as const },
                    { label: "Quantity", value: quantity, onChangeText: (value: string) => setQuantity(value.replace(/[^\d]/g, "")), placeholder: "1", keyboardType: "number-pad" as const },
                    { label: "Unit price (INR)", value: unitPrice, onChangeText: (value: string) => setUnitPrice(value.replace(/[^\d.]/g, "")), placeholder: "Enter unit price", keyboardType: "decimal-pad" as const },
                  ].map((field) => (
                    <View key={field.label}>
                      <Text style={{ marginBottom: 7, color: "#0F172A", fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>
                        {t(field.label)}
                      </Text>
                      <TextInput
                        accessibilityLabel={t(field.label)}
                        keyboardType={field.keyboardType}
                        onChangeText={field.onChangeText}
                        placeholder={t(field.placeholder)}
                        placeholderTextColor="#94A3B8"
                        style={fieldStyle}
                        value={field.value}
                      />
                    </View>
                  ))}
                </View>

                <View style={{ marginTop: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 14, backgroundColor: "#F8FAFC", padding: 14 }}>
                  <Text style={{ color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 11 }}>
                    {t("Invoice total")}
                  </Text>
                  <Text style={{ color: "#0B2A5B", fontFamily: "Poppins_700Bold", fontSize: 20 }}>
                    {formatCurrency(invoiceTotal, language)}
                  </Text>
                </View>

                {message ? (
                  <Text
                    accessibilityLiveRegion="polite"
                    style={{ marginTop: 12, color: messageIsError ? "#B91C1C" : "#166534", fontFamily: "Poppins_400Regular", fontSize: 12 }}
                  >
                    {t(message)}
                  </Text>
                ) : null}
                <View style={{ marginTop: 18 }}>
                  <Button
                    accessibilityLabel={t("Create and save invoice")}
                    label={t("Create invoice")}
                    loading={isCreating}
                    onPress={() => void createInvoice()}
                  />
                </View>
              </View>

              <View style={{ flex: isWideLayout ? 1.1 : undefined, width: isWideLayout ? undefined : "100%", minWidth: 0, marginTop: isWideLayout ? 0 : 28 }}>
                <Text style={{ marginBottom: 12, color: "#0B2A5B", fontFamily: "Poppins_700Bold", fontSize: 18 }}>
                  {t("Saved invoices")}
                </Text>
                {isLoadingInvoices ? (
                  <View style={{ alignItems: "center", padding: 24 }}>
                    <Text style={{ color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 12 }}>
                      {t("Loading invoices")}
                    </Text>
                  </View>
                ) : invoices.length ? (
                  <View style={{ gap: 10 }}>
                    {invoices.map((invoice) => (
                      <View
                        key={invoice.id}
                        style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 18, backgroundColor: "#FFFFFF", padding: 14 }}
                      >
                        <Pressable
                          accessibilityLabel={`${t("Open invoice PDF")} ${invoice.invoiceNumber}`}
                          accessibilityRole="button"
                          className="flex-1 cursor-pointer"
                          onPress={() => void handleOpenInvoice(invoice)}
                          style={{ minHeight: 52, flexDirection: "row", alignItems: "center" }}
                        >
                          <View style={{ width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: "#EAF8EC" }}>
                            <Ionicons color="#14532D" name="document-text-outline" size={21} />
                          </View>
                          <View style={{ flex: 1, minWidth: 0, marginLeft: 11 }}>
                            <Text numberOfLines={1} style={{ color: "#0B2A5B", fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>
                              {invoice.invoiceNumber} · {invoice.customerName}
                            </Text>
                            <Text style={{ marginTop: 3, color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 10 }}>
                              {formatInvoiceDate(invoice.createdAt, language)} · {formatCurrency(invoice.total, language)}
                            </Text>
                          </View>
                          <Text style={{ marginRight: 8, color: "#16A34A", fontFamily: "Poppins_600SemiBold", fontSize: 10 }}>
                            {t("Open PDF")}
                          </Text>
                        </Pressable>
                        <Pressable
                          accessibilityLabel={`${t("Share invoice")} ${invoice.invoiceNumber}`}
                          accessibilityRole="button"
                          accessibilityState={{ busy: sharingInvoiceId === invoice.id }}
                          className="cursor-pointer"
                          disabled={sharingInvoiceId !== null}
                          onPress={() => void handleShareInvoice(invoice)}
                          style={{ width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: "#EFF6FF", opacity: sharingInvoiceId === invoice.id ? 0.55 : 1 }}
                        >
                          <Ionicons color="#1D4ED8" name="share-outline" size={19} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                ) : (
                  <EmptyState
                    icon="receipt-outline"
                    title="No invoices yet"
                    description="Created invoices will be saved here so you can open or share them later."
                  />
                )}
              </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
