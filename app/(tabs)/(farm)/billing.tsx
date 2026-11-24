import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ModuleHeader } from "../../../components/ui/ModuleHeader";
import { useAppLayout } from "../../../hooks/useAppLayout";
import { pageToneColor } from "../../../components/ui/SectionTitle";
import { useAppTheme } from "../../../hooks/useAppTheme";
import { useLiveMarketApiEnabled } from "../../../hooks/useMarketDemoMode";
import {
  useCreateMitraBilling,
  useMitraBilling,
  useMitraProfit,
  useMitraUnits,
} from "../../../hooks/useMitra";
import { useLanguage } from "../../../utils/i18n";
import { useAuthStore } from "../../../store/useAuthStore";
import {
  loadInvoices,
  saveInvoice,
  type InvoiceRecord,
} from "../../../services/invoiceStorage";
import { getApiErrorMessage } from "../../../utils/apiErrors";
import type { InvoiceItem } from "../../../utils/invoiceTypes";
import {
  generateInvoicePdf,
  openInvoicePdf,
  shareInvoicePdf,
} from "../../../utils/pdfGenerator";

type DraftLine = {
  key: string;
  description: string;
  quantity: string;
  unitPrice: string;
};

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

function money(value: number | string | null | undefined): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function newDraftLine(seed?: Partial<DraftLine>): DraftLine {
  return {
    key: `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    description: seed?.description ?? "",
    quantity: seed?.quantity ?? "1",
    unitPrice: seed?.unitPrice ?? "",
  };
}

function parseDraftLines(lines: DraftLine[]): InvoiceItem[] | null {
  const items: InvoiceItem[] = [];
  for (const line of lines) {
    const description = line.description.trim();
    const quantity = Number(line.quantity);
    const unitPrice = Number(line.unitPrice);
    if (!description || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice <= 0) {
      return null;
    }
    items.push({ description, quantity, unitPrice });
  }
  return items.length ? items : null;
}

export default function BillingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ unitId?: string }>();
  const { width } = useAppLayout();
  const { colors, isDark } = useAppTheme();
  const pageBg = pageToneColor("navy", isDark, colors.page);
  const { language, t } = useLanguage();
  const user = useAuthStore((state) => state.user);
  const demoMode = Boolean(user?.id?.startsWith("mock-"));
  const liveApi = useLiveMarketApiEnabled(!demoMode && user?.role !== "customer");
  const [customerName, setCustomerName] = useState(demoMode ? "Aarav Poultry Traders" : "");
  const [lines, setLines] = useState<DraftLine[]>([
    newDraftLine(
      demoMode
        ? { description: "Layer eggs · trays", quantity: "30", unitPrice: "180" }
        : { description: "", quantity: "1", unitPrice: "" },
    ),
  ]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [sharingInvoiceId, setSharingInvoiceId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(params.unitId ?? null);
  const contentWidth = Math.min(width - 36, 1120);
  const isWideLayout = width >= 900;
  const isCustomer = user?.role === "customer";
  const invoiceTotal = lines.reduce((sum, line) => {
    const qty = Number(line.quantity) || 0;
    const price = Number(line.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  const unitsQuery = useMitraUnits(liveApi && !isCustomer);
  const billingQuery = useMitraBilling(selectedUnitId, liveApi && !isCustomer);
  const profitQuery = useMitraProfit(selectedUnitId, liveApi && !isCustomer);
  const createSale = useCreateMitraBilling(selectedUnitId);

  const units = unitsQuery.data?.items ?? [];

  useEffect(() => {
    if (!liveApi) return;
    if (selectedUnitId && units.some((unit) => unit.id === selectedUnitId)) return;
    const fromParam = params.unitId && units.find((unit) => unit.id === params.unitId)?.id;
    setSelectedUnitId(fromParam || units[0]?.id || null);
  }, [liveApi, units, params.unitId, selectedUnitId]);

  useEffect(() => {
    if (liveApi) {
      setIsLoadingInvoices(billingQuery.isLoading || unitsQuery.isLoading);
      return;
    }
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
  }, [t, user?.id, liveApi, billingQuery.isLoading, unitsQuery.isLoading]);

  const liveInvoices = useMemo((): InvoiceRecord[] => {
    if (!liveApi || !billingQuery.data) return [];
    const grouped = new Map<string, InvoiceRecord>();
    for (const sale of billingQuery.data.items) {
      const existing = grouped.get(sale.invoice_no);
      const line = {
        description: sale.item,
        quantity: money(sale.quantity),
        unitPrice: money(sale.rate_inr),
      };
      if (existing) {
        existing.items.push(line);
        existing.total += money(sale.amount_inr);
        continue;
      }
      grouped.set(sale.invoice_no, {
        id: sale.invoice_no,
        userId: user?.id ?? "",
        invoiceNumber: sale.invoice_no,
        invoiceDate: formatInvoiceDate(sale.sale_date, language),
        createdAt: sale.created_at,
        customerName: sale.buyer,
        sellerName: user?.name || t("Poultry Farm"),
        sellerPhone: user?.phone,
        sellerEmail: user?.email,
        total: money(sale.amount_inr),
        pdfUri: "",
        items: [line],
      });
    }
    return [...grouped.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [liveApi, billingQuery.data, language, t, user]);

  const displayedInvoices = liveApi ? liveInvoices : invoices;

  const updateLine = (key: string, patch: Partial<DraftLine>) => {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  };

  const addLine = () => {
    setLines((current) => [...current, newDraftLine()]);
  };

  const removeLine = (key: string) => {
    setLines((current) => (current.length <= 1 ? current : current.filter((line) => line.key !== key)));
  };

  const createInvoice = async () => {
    const items = parseDraftLines(lines);
    if (!user || !customerName.trim() || !items) {
      setMessage("Enter a customer and at least one valid item (name, quantity, price).");
      setMessageIsError(true);
      return;
    }

    if (liveApi && !selectedUnitId) {
      setMessage(t("Add a farm unit before creating invoices."));
      setMessageIsError(true);
      return;
    }

    setMessage("");
    setIsCreating(true);
    const now = new Date();
    const invoiceNumber = `PT-${now.getTime()}`;
    const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    try {
      const invoiceDetails = {
        invoiceNumber,
        invoiceDate: formatInvoiceDate(now.toISOString(), language),
        sellerName: user.name || t("Poultry Farm"),
        sellerPhone: user.phone,
        sellerEmail: user.email,
        customerName: customerName.trim(),
        items,
      };

      if (liveApi) {
        for (const item of items) {
          const lineTotal = item.quantity * item.unitPrice;
          await createSale.mutateAsync({
            invoice_no: invoiceNumber,
            sale_date: now.toISOString().slice(0, 10),
            buyer: customerName.trim(),
            item: item.description,
            quantity: item.quantity,
            qty_unit: "unit",
            rate_inr: item.unitPrice,
            amount_inr: lineTotal,
            received_inr: lineTotal,
            balance_inr: 0,
            pay_mode: "cash",
            invoice_kind: "receipt",
          });
        }
        try {
          await generateInvoicePdf(invoiceDetails);
        } catch {
          // PDF is optional when the sale is already stored on the server.
        }
      } else {
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
      }

      setCustomerName("");
      setLines([newDraftLine({ description: "", quantity: "1", unitPrice: "" })]);
      setMessage(t("Invoice created and saved."));
      setMessageIsError(false);
    } catch (error) {
      console.error("Could not generate and save invoice.", error);
      setMessage(getApiErrorMessage(error) ?? t("Could not create the invoice. Please try again."));
      setMessageIsError(true);
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenInvoice = async (invoice: InvoiceRecord) => {
    setMessage("");
    try {
      if (liveApi && !invoice.pdfUri) {
        const pdfUri = await generateInvoicePdf({
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate,
          sellerName: invoice.sellerName,
          sellerPhone: invoice.sellerPhone,
          sellerEmail: invoice.sellerEmail,
          customerName: invoice.customerName,
          items: invoice.items,
        });
        await openInvoicePdf({ ...invoice, pdfUri });
        return;
      }
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
      if (liveApi && !invoice.pdfUri) {
        const pdfUri = await generateInvoicePdf({
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate,
          sellerName: invoice.sellerName,
          sellerPhone: invoice.sellerPhone,
          sellerEmail: invoice.sellerEmail,
          customerName: invoice.customerName,
          items: invoice.items,
        });
        await shareInvoicePdf({ ...invoice, pdfUri });
        return;
      }
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
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: colors.cardSoft,
    paddingHorizontal: 14,
    color: colors.ink,
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
  } as const;

  const profit = profitQuery.data;

  return (
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1, backgroundColor: pageBg }}>
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
            subtitle="Add eggs, chicken, or other lines on one invoice, then share a watermarked PDF."
            tone="navy"
          />

          {isCustomer ? (
            <EmptyState
              icon="information-circle-outline"
              title="Billing is for Poultry Owner accounts"
              description="Use the marketplace or services sections to explore customer options."
            />
          ) : (
            <>
              {liveApi && units.length > 1 ? (
                <View style={{ marginBottom: 14 }}>
                  <Text
                    style={{
                      marginBottom: 8,
                      color: colors.muted,
                      fontFamily: "Poppins_500Medium",
                      fontSize: 11,
                      textTransform: "uppercase",
                    }}
                  >
                    {t("Farm unit for this bill")}
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      {units.map((unit) => {
                        const active = unit.id === selectedUnitId;
                        return (
                          <Pressable
                            key={unit.id}
                            onPress={() => setSelectedUnitId(unit.id)}
                            style={{
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: active ? "#1D4ED8" : colors.line,
                              backgroundColor: active ? "#EFF6FF" : colors.card,
                              paddingHorizontal: 14,
                              paddingVertical: 10,
                            }}
                          >
                            <Text
                              style={{
                                color: active ? "#1D4ED8" : colors.ink,
                                fontFamily: "Poppins_600SemiBold",
                                fontSize: 12,
                              }}
                            >
                              {unit.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              ) : null}

              {liveApi && profit ? (
                <View
                  style={{
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: colors.line,
                    borderRadius: 16,
                    backgroundColor: colors.card,
                    padding: 14,
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  {[
                    { label: t("Income"), value: money(profit.income_inr) },
                    { label: t("Expenses"), value: money(profit.expenses_inr) },
                    { label: t("Profit"), value: money(profit.profit_inr) },
                  ].map((item) => (
                    <View key={item.label} style={{ minWidth: 110, flexGrow: 1 }}>
                      <Text style={{ color: colors.muted, fontFamily: "Poppins_500Medium", fontSize: 11 }}>
                        {item.label}
                      </Text>
                      <Text style={{ marginTop: 2, color: colors.primary, fontFamily: "Poppins_700Bold", fontSize: 16 }}>
                        {formatCurrency(item.value, language)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              <View
                style={{
                  flexDirection: isWideLayout ? "row" : "column",
                  alignItems: isWideLayout ? "flex-start" : "stretch",
                  gap: 18,
                }}
              >
                <View
                  style={{
                    flex: isWideLayout ? 0.9 : undefined,
                    width: isWideLayout ? undefined : "100%",
                    borderWidth: 1,
                    borderColor: colors.line,
                    borderRadius: 22,
                    backgroundColor: colors.card,
                    padding: 20,
                  }}
                >
                  <View style={{ marginBottom: 16, flexDirection: "row", alignItems: "center" }}>
                    <View
                      style={{
                        width: 42,
                        height: 42,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 14,
                        backgroundColor: "#EFF6FF",
                      }}
                    >
                      <Ionicons color="#1D4ED8" name="receipt-outline" size={20} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 11 }}>
                      <Text style={{ color: colors.primary, fontFamily: "Poppins_600SemiBold", fontSize: 14 }}>
                        {t("Create a bill")}
                      </Text>
                      <Text style={{ marginTop: 2, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 11 }}>
                        {t("Add one or more items, then save a watermarked PDF invoice.")}
                      </Text>
                    </View>
                  </View>

                  <View style={{ gap: 14 }}>
                    <View>
                      <Text style={{ marginBottom: 7, color: colors.ink, fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>
                        {t("Customer name")}
                      </Text>
                      <TextInput
                        accessibilityLabel={t("Customer name")}
                        onChangeText={setCustomerName}
                        placeholder={t("Enter customer name")}
                        placeholderTextColor="#94A3B8"
                        style={fieldStyle}
                        value={customerName}
                      />
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <Text style={{ color: colors.ink, fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>
                        {t("Invoice items")}
                      </Text>
                      <Pressable
                        accessibilityLabel={t("Add item")}
                        onPress={addLine}
                        style={{
                          minHeight: 34,
                          flexDirection: "row",
                          alignItems: "center",
                          borderRadius: 10,
                          backgroundColor: "#EFF6FF",
                          paddingHorizontal: 10,
                          gap: 4,
                        }}
                      >
                        <Ionicons color="#1D4ED8" name="add" size={16} />
                        <Text style={{ color: "#1D4ED8", fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>
                          {t("Add item")}
                        </Text>
                      </Pressable>
                    </View>

                    {lines.map((line, index) => (
                      <View
                        key={line.key}
                        style={{
                          borderWidth: 1,
                          borderColor: colors.line,
                          borderRadius: 16,
                          backgroundColor: colors.cardSoft,
                          padding: 12,
                          gap: 10,
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Text style={{ flex: 1, color: colors.muted, fontFamily: "Poppins_500Medium", fontSize: 11 }}>
                            {t("Item")} {index + 1}
                          </Text>
                          {lines.length > 1 ? (
                            <Pressable accessibilityLabel={t("Remove item")} onPress={() => removeLine(line.key)}>
                              <Ionicons color="#B91C1C" name="trash-outline" size={18} />
                            </Pressable>
                          ) : null}
                        </View>
                        <TextInput
                          accessibilityLabel={`${t("Item")} ${index + 1}`}
                          onChangeText={(value) => updateLine(line.key, { description: value })}
                          placeholder={t("e.g. Eggs, chicken, feed")}
                          placeholderTextColor="#94A3B8"
                          style={fieldStyle}
                          value={line.description}
                        />
                        <View style={{ flexDirection: width < 420 ? "column" : "row", gap: 10 }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ marginBottom: 6, color: colors.muted, fontFamily: "Poppins_500Medium", fontSize: 11 }}>
                              {t("Quantity")}
                            </Text>
                            <TextInput
                              keyboardType="number-pad"
                              onChangeText={(value) =>
                                updateLine(line.key, { quantity: value.replace(/[^\d]/g, "") })
                              }
                              placeholder="1"
                              placeholderTextColor="#94A3B8"
                              style={fieldStyle}
                              value={line.quantity}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ marginBottom: 6, color: colors.muted, fontFamily: "Poppins_500Medium", fontSize: 11 }}>
                              {t("Unit price (INR)")}
                            </Text>
                            <TextInput
                              keyboardType="decimal-pad"
                              onChangeText={(value) =>
                                updateLine(line.key, { unitPrice: value.replace(/[^\d.]/g, "") })
                              }
                              placeholder={t("Enter unit price")}
                              placeholderTextColor="#94A3B8"
                              style={fieldStyle}
                              value={line.unitPrice}
                            />
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>

                  <View
                    style={{
                      marginTop: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderRadius: 14,
                      backgroundColor: colors.cardSoft,
                      padding: 14,
                    }}
                  >
                    <Text style={{ color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 11 }}>
                      {t("Invoice total")}
                    </Text>
                    <Text style={{ color: colors.primary, fontFamily: "Poppins_700Bold", fontSize: 20 }}>
                      {formatCurrency(invoiceTotal, language)}
                    </Text>
                  </View>

                  {message ? (
                    <Text
                      accessibilityLiveRegion="polite"
                      style={{
                        marginTop: 12,
                        color: messageIsError ? "#B91C1C" : "#166534",
                        fontFamily: "Poppins_400Regular",
                        fontSize: 12,
                      }}
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

                <View
                  style={{
                    flex: isWideLayout ? 1.1 : undefined,
                    width: isWideLayout ? undefined : "100%",
                    minWidth: 0,
                    marginTop: isWideLayout ? 0 : 28,
                  }}
                >
                  <Text style={{ marginBottom: 12, color: colors.primary, fontFamily: "Poppins_700Bold", fontSize: 18 }}>
                    {t("Saved invoices")}
                  </Text>
                  {isLoadingInvoices ? (
                    <View style={{ alignItems: "center", padding: 24 }}>
                      <Text style={{ color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 12 }}>
                        {t("Loading invoices")}
                      </Text>
                    </View>
                  ) : displayedInvoices.length ? (
                    <View style={{ gap: 10 }}>
                      {displayedInvoices.map((invoice) => (
                        <View
                          key={invoice.id}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            borderWidth: 1,
                            borderColor: colors.line,
                            borderRadius: 18,
                            backgroundColor: colors.card,
                            padding: 14,
                          }}
                        >
                          <Pressable
                            accessibilityLabel={`${t("Open invoice PDF")} ${invoice.invoiceNumber}`}
                            accessibilityRole="button"
                            className="flex-1 cursor-pointer"
                            onPress={() => void handleOpenInvoice(invoice)}
                            style={{ minHeight: 52, flexDirection: "row", alignItems: "center" }}
                          >
                            <View
                              style={{
                                width: 42,
                                height: 42,
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: 13,
                                backgroundColor: "#EAF8EC",
                              }}
                            >
                              <Ionicons color="#14532D" name="document-text-outline" size={21} />
                            </View>
                            <View style={{ flex: 1, minWidth: 0, marginLeft: 11 }}>
                              <Text
                                numberOfLines={1}
                                style={{ color: colors.primary, fontFamily: "Poppins_600SemiBold", fontSize: 12 }}
                              >
                                {invoice.invoiceNumber} · {invoice.customerName}
                              </Text>
                              <Text style={{ marginTop: 3, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 10 }}>
                                {formatInvoiceDate(invoice.createdAt, language)} ·{" "}
                                {formatCurrency(invoice.total, language)}
                                {invoice.items.length > 1 ? ` · ${invoice.items.length} ${t("items")}` : ""}
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
                            style={{
                              width: 42,
                              height: 42,
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: 13,
                              backgroundColor: "#EFF6FF",
                              opacity: sharingInvoiceId === invoice.id ? 0.55 : 1,
                            }}
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
