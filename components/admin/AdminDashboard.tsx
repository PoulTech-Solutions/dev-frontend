import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAdminDemoStore, type AdminDemoFarm, type AdminDemoRate } from "../../store/useAdminDemoStore";
import { useAppLayout } from "../../hooks/useAppLayout";
import { useLanguage } from "../../utils/i18n";

const COLORS = {
  cream: "#FAF7F0",
  white: "#FFFFFF",
  primary: "#0B2A5B",
  forest: "#14532D",
  accent: "#16A34A",
  ink: "#0F172A",
  muted: "#64748B",
  line: "#E2E8F0",
};
const REGULAR = "Poppins_400Regular";
const MEDIUM = "Poppins_500Medium";
const SEMIBOLD = "Poppins_600SemiBold";
const BOLD = "Poppins_700Bold";

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function DemoNotice() {
  const { t } = useLanguage();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        borderWidth: 1,
        borderColor: "#FDE68A",
        borderRadius: 14,
        backgroundColor: "#FFFBEB",
        padding: 12,
      }}
    >
      <Ionicons color="#A16207" name="information-circle-outline" size={18} />
      <Text style={{ flex: 1, marginLeft: 8, color: "#854D0E", fontFamily: REGULAR, fontSize: 11, lineHeight: 17 }}>
        {t("Demo workspace: farm reports and rates below are sample data. Rate edits are temporary and are not sent to a backend.")}
      </Text>
    </View>
  );
}

function MetricCard({
  label,
  value,
  icon,
  color,
  background,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  background: string;
}) {
  const { t } = useLanguage();
  return (
    <View
      style={{
        flexGrow: 1,
        flexBasis: 145,
        minHeight: 112,
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: COLORS.line,
        borderRadius: 18,
        backgroundColor: COLORS.white,
        padding: 14,
      }}
    >
      <View style={{ width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: background }}>
        <Ionicons color={color} name={icon} size={18} />
      </View>
      <View>
        <Text style={{ color: COLORS.primary, fontFamily: BOLD, fontSize: 20 }}>{value}</Text>
        <Text style={{ marginTop: 1, color: COLORS.muted, fontFamily: REGULAR, fontSize: 10 }}>{t(label)}</Text>
      </View>
    </View>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  const { t } = useLanguage();
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: COLORS.primary, fontFamily: BOLD, fontSize: 17 }}>{t(title)}</Text>
      <Text style={{ marginTop: 3, color: COLORS.muted, fontFamily: REGULAR, fontSize: 11 }}>{t(subtitle)}</Text>
    </View>
  );
}

function RateEditor({
  rate,
  onSave,
}: {
  rate: AdminDemoRate;
  onSave: (id: string, value: string) => void;
}) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState(rate.value);
  const [saved, setSaved] = useState(false);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: COLORS.line,
        borderRadius: 15,
        backgroundColor: COLORS.white,
        padding: 12,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: COLORS.ink, fontFamily: SEMIBOLD, fontSize: 12 }}>{t(rate.title)}</Text>
        <Text style={{ marginTop: 2, color: COLORS.muted, fontFamily: REGULAR, fontSize: 10 }}>
          {t(rate.unit)} · {t("Previous")} ₹{rate.previousValue}
        </Text>
      </View>
      <Text style={{ marginRight: 5, color: COLORS.ink, fontFamily: MEDIUM, fontSize: 13 }}>₹</Text>
      <TextInput
        accessibilityLabel={`${t(rate.title)} ${t("demo rate in rupees")}`}
        keyboardType="decimal-pad"
        onChangeText={(value) => {
          setDraft(value.replace(/[^\d.]/g, ""));
          setSaved(false);
        }}
        style={{
          width: 78,
          height: 42,
          borderWidth: 1,
          borderColor: "#CBD5E1",
          borderRadius: 11,
          backgroundColor: "#F8FAFC",
          paddingHorizontal: 10,
          color: COLORS.ink,
          fontFamily: SEMIBOLD,
          fontSize: 13,
        }}
        value={draft}
      />
      <Pressable
        accessibilityLabel={`${t("Save")} ${t(rate.title)} ${t("demo rate")}`}
        accessibilityRole="button"
        className="cursor-pointer hover:bg-green-700"
        disabled={!draft.trim() || !Number.isFinite(Number(draft))}
        onPress={() => {
          onSave(rate.id, draft);
          setSaved(true);
        }}
        style={{
          minWidth: 56,
          height: 40,
          alignItems: "center",
          justifyContent: "center",
          marginLeft: 8,
          borderRadius: 11,
          backgroundColor: !draft.trim() || !Number.isFinite(Number(draft)) ? "#86EFAC" : COLORS.accent,
          paddingHorizontal: 9,
        }}
      >
        <Text style={{ color: COLORS.white, fontFamily: SEMIBOLD, fontSize: 10 }}>
          {t(saved ? "Saved" : "Save")}
        </Text>
      </Pressable>
    </View>
  );
}

function FarmReportCard({ farm }: { farm: AdminDemoFarm }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const totalSales = farm.sales.reduce((sum, sale) => sum + sale.total, 0);

  return (
    <View style={{ overflow: "hidden", borderWidth: 1, borderColor: COLORS.line, borderRadius: 18, backgroundColor: COLORS.white }}>
      <Pressable
        accessibilityLabel={`${t(expanded ? "Collapse" : "View")} ${t("sales report for")} ${farm.name}`}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        className="cursor-pointer hover:bg-slate-50"
        onPress={() => setExpanded((value) => !value)}
        style={{ flexDirection: "row", alignItems: "center", padding: 14, backgroundColor: COLORS.white }}
      >
        <View style={{ width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#E0F2FE" }}>
          <Ionicons color="#0369A1" name="business-outline" size={20} />
        </View>
        <View style={{ flex: 1, marginLeft: 11 }}>
          <Text style={{ color: COLORS.primary, fontFamily: SEMIBOLD, fontSize: 12 }}>{farm.name}</Text>
          <Text style={{ marginTop: 2, color: COLORS.muted, fontFamily: REGULAR, fontSize: 10 }}>
            {farm.owner} · {farm.location}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", marginRight: 8 }}>
          <Text style={{ color: COLORS.forest, fontFamily: BOLD, fontSize: 13 }}>{formatCurrency(totalSales)}</Text>
          <Text style={{ color: COLORS.muted, fontFamily: REGULAR, fontSize: 9 }}>{t("sample sales")}</Text>
        </View>
        <Ionicons color={COLORS.muted} name={expanded ? "chevron-up" : "chevron-down"} size={17} />
      </Pressable>
      {expanded ? (
        <View style={{ borderTopWidth: 1, borderTopColor: COLORS.line, paddingHorizontal: 14, paddingVertical: 10 }}>
          <View style={{ flexDirection: "row", paddingBottom: 8 }}>
            <Text style={{ flex: 1.1, color: COLORS.muted, fontFamily: SEMIBOLD, fontSize: 9 }}>{t("PRODUCT")}</Text>
            <Text style={{ flex: 1, color: COLORS.muted, fontFamily: SEMIBOLD, fontSize: 9 }}>{t("SOLD")}</Text>
            <Text style={{ flex: 1, color: COLORS.muted, fontFamily: SEMIBOLD, fontSize: 9, textAlign: "right" }}>{t("TOTAL")}</Text>
          </View>
          {farm.sales.map((sale) => (
            <View key={sale.category} style={{ flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingVertical: 9 }}>
              <Text style={{ flex: 1.1, color: COLORS.ink, fontFamily: MEDIUM, fontSize: 10 }}>{t(sale.category)}</Text>
              <Text style={{ flex: 1, color: COLORS.muted, fontFamily: REGULAR, fontSize: 10 }}>
                {sale.quantity} {sale.unit}
              </Text>
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <Text style={{ color: COLORS.ink, fontFamily: SEMIBOLD, fontSize: 10 }}>{formatCurrency(sale.total)}</Text>
                <Text style={{ color: COLORS.muted, fontFamily: REGULAR, fontSize: 9 }}>
                  ₹{sale.unitPrice} / {sale.unit === "trays" ? "tray" : sale.unit === "birds" ? "bird" : "kg"}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function AdminDashboard({
  demoMode,
}: {
  demoMode: boolean;
}) {
  const { width } = useAppLayout();
  const { t } = useLanguage();
  const farms = useAdminDemoStore((state) => state.farms);
  const rates = useAdminDemoStore((state) => state.rates);
  const updateRate = useAdminDemoStore((state) => state.updateRate);
  const contentWidth = Math.min(width - 36, 1180);
  const totalDemoSales = farms.reduce(
    (sum, farm) => sum + farm.sales.reduce((farmSum, sale) => farmSum + sale.total, 0),
    0,
  );

  return (
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1, backgroundColor: COLORS.cream }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: "100%", maxWidth: contentWidth, alignSelf: "center" }}>
          <View style={{ marginTop: 12, marginBottom: 16 }}>
            <Text style={{ color: COLORS.primary, fontFamily: BOLD, fontSize: 25 }}>{t("Admin dashboard")}</Text>
            <Text style={{ marginTop: 4, color: COLORS.muted, fontFamily: REGULAR, fontSize: 12 }}>
              {t("Platform overview and farm performance reports.")}
            </Text>
          </View>

          {demoMode ? (
            <>
              <DemoNotice />
              <View style={{ marginTop: 16, flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                <MetricCard label={t("Registered farms (demo)")} value={String(farms.length)} icon="business-outline" color="#0369A1" background="#E0F2FE" />
                <MetricCard label={t("Sales in sample reports")} value={formatCurrency(totalDemoSales)} icon="cash-outline" color={COLORS.forest} background="#DCFCE7" />
                <MetricCard label={t("Rate categories")} value={String(rates.length)} icon="pricetag-outline" color="#B45309" background="#FEF3C7" />
              </View>
            </>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "flex-start", borderWidth: 1, borderColor: "#BFDBFE", borderRadius: 14, backgroundColor: "#EFF6FF", padding: 12 }}>
              <Ionicons color="#1D4ED8" name="information-circle-outline" size={18} />
              <Text style={{ flex: 1, marginLeft: 8, color: "#1E3A8A", fontFamily: REGULAR, fontSize: 11, lineHeight: 17 }}>
                {t("Live admin data is not connected yet. Farm counts, sales reports, and rate updates will appear after admin API endpoints are available.")}
              </Text>
            </View>
          )}

          <View style={{ marginTop: 26 }}>
            <SectionTitle title="Manage market rates" subtitle="Edit the demo rates shown for each poultry category." />
            {demoMode ? (
              <View style={{ gap: 9 }}>
                {rates.map((rate) => (
                  <RateEditor key={rate.id} rate={rate} onSave={updateRate} />
                ))}
              </View>
            ) : (
              <Text style={{ color: COLORS.muted, fontFamily: REGULAR, fontSize: 11 }}>
                {t("Rate controls will be enabled when rate-management endpoints are connected.")}
              </Text>
            )}
          </View>

          <View style={{ marginTop: 26 }}>
            <SectionTitle title="Poultry farm reports" subtitle="Expand a farm to review sample sold quantities and amounts." />
            {demoMode ? (
              <View style={{ gap: 10 }}>
                {farms.map((farm) => <FarmReportCard key={farm.id} farm={farm} />)}
              </View>
            ) : (
              <Text style={{ color: COLORS.muted, fontFamily: REGULAR, fontSize: 11 }}>
                {t("Farm-level sales details will appear here when the reporting API is connected.")}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
