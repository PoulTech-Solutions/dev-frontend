import { Ionicons } from "@expo/vector-icons";
import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAdminDemoStore, type AdminDemoFarm, type AdminDemoRate } from "../../store/useAdminDemoStore";
import { useAuthStore } from "../../store/useAuthStore";
import {
  canListDirectory,
  canManageMarketRates,
  canManageStaff,
  canReadAdminMitraDashboard,
} from "../../utils/permissions";
import { InternalUsersPanel } from "./InternalUsersPanel";
import { PoultryRateAdminPanel } from "./PoultryRateAdminPanel";
import { useAdminMitraDashboard } from "../../hooks/useAdminDashboard";
import { useAppLayout } from "../../hooks/useAppLayout";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useLanguage } from "../../utils/i18n";
import { getApiErrorMessage } from "../../utils/apiErrors";
import type { AdminDashboardFarmCard } from "../../services/adminService";

const REGULAR = "Poppins_400Regular";
const MEDIUM = "Poppins_500Medium";
const SEMIBOLD = "Poppins_600SemiBold";
const BOLD = "Poppins_700Bold";

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function moneyValue(value: number | string | null | undefined) {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function DemoNotice() {
  const { t } = useLanguage();
  const { isDark } = useAppTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        borderWidth: 1,
        borderColor: isDark ? "#92400E" : "#FDE68A",
        borderRadius: 14,
        backgroundColor: isDark ? "#422006" : "#FFFBEB",
        padding: 12,
      }}
    >
      <Ionicons color={isDark ? "#FCD34D" : "#A16207"} name="information-circle-outline" size={18} />
      <Text style={{ flex: 1, marginLeft: 8, color: isDark ? "#FDE68A" : "#854D0E", fontFamily: REGULAR, fontSize: 11, lineHeight: 17 }}>
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
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  return (
    <View
      style={{
        flexGrow: 1,
        flexBasis: 145,
        minHeight: 112,
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: 18,
        backgroundColor: colors.card,
        padding: 14,
      }}
    >
      <View style={{ width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: background }}>
        <Ionicons color={color} name={icon} size={18} />
      </View>
      <View>
        <Text style={{ color: colors.primary, fontFamily: BOLD, fontSize: 20 }}>{value}</Text>
        <Text style={{ marginTop: 1, color: colors.muted, fontFamily: REGULAR, fontSize: 10 }}>{t(label)}</Text>
      </View>
    </View>
  );
}

function SectionTitle({
  title,
  subtitle,
  trailing,
}: {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
}) {
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: colors.primary, fontFamily: BOLD, fontSize: 18 }}>{t(title)}</Text>
          {subtitle ? (
            <Text style={{ marginTop: 4, color: colors.muted, fontFamily: REGULAR, fontSize: 12, lineHeight: 18 }}>
              {t(subtitle)}
            </Text>
          ) : null}
        </View>
        {trailing ?? null}
      </View>
    </View>
  );
}

function CollapsibleSection({
  title,
  subtitle,
  trailing,
  defaultOpen = true,
  children,
}: {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View
      style={{
        marginTop: 26,
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: 16,
        backgroundColor: colors.cardSoft,
        padding: 16,
      }}
    >
      <View style={{ marginBottom: open ? 14 : 0, flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={`${t(open ? "Collapse" : "Expand")} ${t(title)}`}
          onPress={() => setOpen((current) => !current)}
          style={{ flex: 1, minWidth: 0 }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingRight: 4 }}>
            <Text style={{ flexShrink: 1, color: colors.primary, fontFamily: BOLD, fontSize: 18 }}>{t(title)}</Text>
            <Ionicons color={colors.muted} name={open ? "chevron-up" : "chevron-down"} size={18} />
          </View>
          {subtitle ? (
            <Text style={{ marginTop: 4, color: colors.muted, fontFamily: REGULAR, fontSize: 12, lineHeight: 18 }}>
              {t(subtitle)}
            </Text>
          ) : null}
        </Pressable>
        {trailing ?? null}
      </View>
      {open ? children : null}
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
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const [draft, setDraft] = useState(rate.value);
  const [saved, setSaved] = useState(false);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: 15,
        backgroundColor: colors.card,
        padding: 12,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.ink, fontFamily: SEMIBOLD, fontSize: 12 }}>{t(rate.title)}</Text>
        <Text style={{ marginTop: 2, color: colors.muted, fontFamily: REGULAR, fontSize: 10 }}>
          {t(rate.unit)} · {t("Previous")} ₹{rate.previousValue}
        </Text>
      </View>
      <Text style={{ marginRight: 5, color: colors.ink, fontFamily: MEDIUM, fontSize: 13 }}>₹</Text>
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
          borderColor: colors.line,
          borderRadius: 11,
          backgroundColor: colors.cardSoft,
          paddingHorizontal: 10,
          color: colors.ink,
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
          backgroundColor: !draft.trim() || !Number.isFinite(Number(draft)) ? "#86EFAC" : colors.accent,
          paddingHorizontal: 9,
        }}
      >
        <Text style={{ color: "#FFFFFF", fontFamily: SEMIBOLD, fontSize: 10 }}>
          {t(saved ? "Saved" : "Save")}
        </Text>
      </Pressable>
    </View>
  );
}

function FarmReportCard({ farm }: { farm: AdminDemoFarm }) {
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const totalSales = farm.sales.reduce((sum, sale) => sum + sale.total, 0);

  return (
    <View style={{ overflow: "hidden", borderWidth: 1, borderColor: colors.line, borderRadius: 18, backgroundColor: colors.card }}>
      <Pressable
        accessibilityLabel={`${t(expanded ? "Collapse" : "View")} ${t("sales report for")} ${farm.name}`}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        className="cursor-pointer hover:bg-slate-50"
        onPress={() => setExpanded((value) => !value)}
        style={{ flexDirection: "row", alignItems: "center", padding: 14, backgroundColor: colors.card }}
      >
        <View style={{ width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#E0F2FE" }}>
          <Ionicons color="#0369A1" name="business-outline" size={20} />
        </View>
        <View style={{ flex: 1, marginLeft: 11 }}>
          <Text style={{ color: colors.primary, fontFamily: SEMIBOLD, fontSize: 12 }}>{farm.name}</Text>
          <Text style={{ marginTop: 2, color: colors.muted, fontFamily: REGULAR, fontSize: 10 }}>
            {farm.owner} · {farm.location}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", marginRight: 8 }}>
          <Text style={{ color: colors.accent, fontFamily: BOLD, fontSize: 13 }}>{formatCurrency(totalSales)}</Text>
          <Text style={{ color: colors.muted, fontFamily: REGULAR, fontSize: 9 }}>{t("sample sales")}</Text>
        </View>
        <Ionicons color={colors.muted} name={expanded ? "chevron-up" : "chevron-down"} size={17} />
      </Pressable>
      {expanded ? (
        <View style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingHorizontal: 14, paddingVertical: 10 }}>
          <View style={{ flexDirection: "row", paddingBottom: 8 }}>
            <Text style={{ flex: 1.1, color: colors.muted, fontFamily: SEMIBOLD, fontSize: 9 }}>{t("PRODUCT")}</Text>
            <Text style={{ flex: 1, color: colors.muted, fontFamily: SEMIBOLD, fontSize: 9 }}>{t("SOLD")}</Text>
            <Text style={{ flex: 1, color: colors.muted, fontFamily: SEMIBOLD, fontSize: 9, textAlign: "right" }}>{t("TOTAL")}</Text>
          </View>
          {farm.sales.map((sale) => (
            <View key={sale.category} style={{ flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: 9 }}>
              <Text style={{ flex: 1.1, color: colors.ink, fontFamily: MEDIUM, fontSize: 10 }}>{t(sale.category)}</Text>
              <Text style={{ flex: 1, color: colors.muted, fontFamily: REGULAR, fontSize: 10 }}>
                {sale.quantity} {sale.unit}
              </Text>
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <Text style={{ color: colors.ink, fontFamily: SEMIBOLD, fontSize: 10 }}>{formatCurrency(sale.total)}</Text>
                <Text style={{ color: colors.muted, fontFamily: REGULAR, fontSize: 9 }}>
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

function LiveFarmReportCard({ farm }: { farm: AdminDashboardFarmCard }) {
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const location = [farm.district, farm.state].filter(Boolean).join(", ") || t("Farm");
  const income = moneyValue(farm.income_inr);

  return (
    <View style={{ overflow: "hidden", borderWidth: 1, borderColor: colors.line, borderRadius: 18, backgroundColor: colors.card }}>
      <Pressable
        accessibilityLabel={`${t(expanded ? "Collapse" : "View")} ${t("sales report for")} ${farm.unit_name}`}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        className="cursor-pointer hover:bg-slate-50"
        onPress={() => setExpanded((value) => !value)}
        style={{ flexDirection: "row", alignItems: "center", padding: 14, backgroundColor: colors.card }}
      >
        <View style={{ width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#E0F2FE" }}>
          <Ionicons color="#0369A1" name="business-outline" size={20} />
        </View>
        <View style={{ flex: 1, minWidth: 0, marginLeft: 11 }}>
          <Text numberOfLines={1} style={{ color: colors.primary, fontFamily: SEMIBOLD, fontSize: 12 }}>
            {farm.unit_name}
          </Text>
          <Text numberOfLines={1} style={{ marginTop: 2, color: colors.muted, fontFamily: REGULAR, fontSize: 10 }}>
            {farm.owner_email} · {location}
          </Text>
          <Text style={{ marginTop: 2, color: colors.muted, fontFamily: REGULAR, fontSize: 10 }}>
            {t(farm.farm_type)} · {farm.sale_count} {t("sales")}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", marginRight: 8 }}>
          <Text style={{ color: colors.accent, fontFamily: BOLD, fontSize: 13 }}>{formatCurrency(income)}</Text>
          <Text style={{ color: colors.muted, fontFamily: REGULAR, fontSize: 9 }}>{t("Income")}</Text>
        </View>
        <Ionicons color={colors.muted} name={expanded ? "chevron-up" : "chevron-down"} size={17} />
      </Pressable>
      {expanded ? (
        <View style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingHorizontal: 14, paddingVertical: 10, gap: 8 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {(
              [
                [t("Expenses"), formatCurrency(moneyValue(farm.expenses_inr))],
                [t("Profit"), formatCurrency(moneyValue(farm.profit_inr))],
                [t("To receive"), formatCurrency(moneyValue(farm.to_receive_inr))],
              ] as const
            ).map(([label, value]) => (
              <View
                key={label}
                style={{
                  flexGrow: 1,
                  flexBasis: 100,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.line,
                  backgroundColor: colors.cardSoft,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: colors.muted, fontFamily: SEMIBOLD, fontSize: 9 }}>{label}</Text>
                <Text style={{ marginTop: 2, color: colors.ink, fontFamily: BOLD, fontSize: 12 }}>{value}</Text>
              </View>
            ))}
          </View>

          <View style={{ flexDirection: "row", paddingBottom: 4, paddingTop: 4 }}>
            <Text style={{ flex: 1.2, color: colors.muted, fontFamily: SEMIBOLD, fontSize: 9 }}>{t("PRODUCT")}</Text>
            <Text style={{ flex: 1, color: colors.muted, fontFamily: SEMIBOLD, fontSize: 9 }}>{t("SOLD")}</Text>
            <Text style={{ flex: 1, color: colors.muted, fontFamily: SEMIBOLD, fontSize: 9, textAlign: "right" }}>{t("TOTAL")}</Text>
          </View>
          {farm.sales.length ? (
            farm.sales.map((sale) => (
              <View
                key={sale.id}
                style={{ flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: 9 }}
              >
                <View style={{ flex: 1.2 }}>
                  <Text style={{ color: colors.ink, fontFamily: MEDIUM, fontSize: 10 }}>{sale.item}</Text>
                  <Text style={{ marginTop: 2, color: colors.muted, fontFamily: REGULAR, fontSize: 9 }}>
                    {sale.buyer} · {sale.invoice_no}
                  </Text>
                </View>
                <Text style={{ flex: 1, color: colors.muted, fontFamily: REGULAR, fontSize: 10 }}>
                  {String(sale.quantity)} {sale.qty_unit}
                </Text>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={{ color: colors.ink, fontFamily: SEMIBOLD, fontSize: 10 }}>
                    {formatCurrency(moneyValue(sale.amount_inr))}
                  </Text>
                  <Text style={{ color: colors.muted, fontFamily: REGULAR, fontSize: 9 }}>{sale.sale_date}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={{ color: colors.muted, fontFamily: REGULAR, fontSize: 11 }}>{t("No sales in this period.")}</Text>
          )}
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
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const user = useAuthStore((state) => state.user);
  const farms = useAdminDemoStore((state) => state.farms);
  const rates = useAdminDemoStore((state) => state.rates);
  const updateRate = useAdminDemoStore((state) => state.updateRate);
  const canManageRates = canManageMarketRates(user?.backendRole);
  const canManagePeople = canManageStaff(user?.backendRole);
  const canSeeDirectory = canListDirectory(user?.backendRole);
  const canSeeFarmReports = canReadAdminMitraDashboard(user?.backendRole);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const farmReportsQuery = useAdminMitraDashboard(!demoMode && canSeeFarmReports, { sales_limit: 50 });
  const contentWidth = Math.min(width - 36, 1180);
  const totalDemoSales = farms.reduce(
    (sum, farm) => sum + farm.sales.reduce((farmSum, sale) => farmSum + sale.total, 0),
    0,
  );
  const liveTotals = farmReportsQuery.data?.totals;
  const liveFarms = farmReportsQuery.data?.farms ?? [];

  return (
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1, backgroundColor: colors.page }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: "100%", maxWidth: contentWidth, alignSelf: "center" }}>
          <View style={{ marginTop: 12, marginBottom: 16 }}>
            <Text style={{ color: colors.primary, fontFamily: BOLD, fontSize: 25 }}>{t("Admin dashboard")}</Text>
            <Text style={{ marginTop: 4, color: colors.muted, fontFamily: REGULAR, fontSize: 12 }}>
              {t("Platform overview and farm performance reports.")}
            </Text>
          </View>

          {demoMode ? (
            <>
              <DemoNotice />
              <View style={{ marginTop: 16, flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                <MetricCard label={t("Registered farms (demo)")} value={String(farms.length)} icon="business-outline" color="#0369A1" background="#E0F2FE" />
                <MetricCard label={t("Sales in sample reports")} value={formatCurrency(totalDemoSales)} icon="cash-outline" color={colors.accent} background="#DCFCE7" />
                <MetricCard label={t("Rate categories")} value={String(rates.length)} icon="pricetag-outline" color="#B45309" background="#FEF3C7" />
              </View>
            </>
          ) : canSeeFarmReports && liveTotals ? (
            <View style={{ marginTop: 16, flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              <MetricCard label="Registered farms" value={String(liveTotals.farm_count)} icon="business-outline" color="#0369A1" background="#E0F2FE" />
              <MetricCard label="Farm owners" value={String(liveTotals.owner_count)} icon="people-outline" color="#1D4ED8" background="#DBEAFE" />
              <MetricCard label="Income" value={formatCurrency(moneyValue(liveTotals.income_inr))} icon="cash-outline" color={colors.accent} background="#DCFCE7" />
              <MetricCard label="Profit" value={formatCurrency(moneyValue(liveTotals.profit_inr))} icon="trending-up-outline" color="#B45309" background="#FEF3C7" />
            </View>
          ) : null}

          {canSeeDirectory && !demoMode ? (
            <CollapsibleSection
              title={canManagePeople ? "People directory" : "Farmer contacts"}
              subtitle={
                canManagePeople
                  ? "Farmers and internal accounts. Use Add user to invite staff or admin."
                  : "Read-only farmer names and emails."
              }
              trailing={
                canManagePeople ? (
                  <Pressable
                    accessibilityLabel={t("Add user")}
                    accessibilityRole="button"
                    onPress={() => setAddUserOpen(true)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      borderRadius: 10,
                      backgroundColor: "#15803D",
                      paddingHorizontal: 12,
                      paddingVertical: 9,
                    }}
                  >
                    <Ionicons color="#fff" name="person-add-outline" size={16} />
                    <Text style={{ color: "#fff", fontFamily: SEMIBOLD, fontSize: 12 }}>{t("Add user")}</Text>
                  </Pressable>
                ) : null
              }
            >
              <InternalUsersPanel createOpen={addUserOpen} onCreateOpenChange={setAddUserOpen} />
            </CollapsibleSection>
          ) : null}

          <CollapsibleSection
            title="Market rates"
            subtitle={
              demoMode
                ? "Edit the demo rates shown for each poultry category."
                : "View live hub rates and publish culls or broiler updates."
            }
          >
            {demoMode ? (
              <View style={{ gap: 9 }}>
                {rates.map((rate) => (
                  <RateEditor key={rate.id} rate={rate} onSave={updateRate} />
                ))}
              </View>
            ) : canManageRates ? (
              <PoultryRateAdminPanel />
            ) : (
              <Text style={{ color: colors.muted, fontFamily: REGULAR, fontSize: 12 }}>
                {t("You need staff permission to publish hub rates.")}
              </Text>
            )}
          </CollapsibleSection>

          <View style={{ marginTop: 26 }}>
            <SectionTitle
              title="Poultry farm reports"
              subtitle={
                demoMode
                  ? "Expand a farm to review sample sold quantities and amounts."
                  : "Expand a farm to review owner sales across the platform."
              }
            />
            {demoMode ? (
              <View style={{ gap: 10 }}>
                {farms.map((farm) => (
                  <FarmReportCard key={farm.id} farm={farm} />
                ))}
              </View>
            ) : !canSeeFarmReports ? (
              <Text style={{ color: colors.muted, fontFamily: REGULAR, fontSize: 12 }}>
                {t("You need admin permission to view farm reports.")}
              </Text>
            ) : farmReportsQuery.isLoading ? (
              <ActivityIndicator color={colors.accent} style={{ marginTop: 8 }} />
            ) : farmReportsQuery.isError ? (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: "#FECACA",
                  borderRadius: 14,
                  backgroundColor: "#FEF2F2",
                  padding: 14,
                  gap: 6,
                }}
              >
                <Text style={{ color: "#B91C1C", fontFamily: SEMIBOLD, fontSize: 13 }}>
                  {t("Could not load farm reports.")}
                </Text>
                <Text style={{ color: "#B91C1C", fontFamily: REGULAR, fontSize: 11, lineHeight: 17 }}>
                  {getApiErrorMessage(farmReportsQuery.error) ?? t("Please try again.")}
                </Text>
              </View>
            ) : liveFarms.length ? (
              <View style={{ gap: 10 }}>
                {liveFarms.map((farm) => (
                  <LiveFarmReportCard key={farm.unit_id} farm={farm} />
                ))}
              </View>
            ) : (
              <Text style={{ color: colors.muted, fontFamily: REGULAR, fontSize: 12 }}>
                {t("No farm units reported yet.")}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
