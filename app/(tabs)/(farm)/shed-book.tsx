import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, BackHandler, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DateField } from "../../../components/ui/DateField";
import { FormModal } from "../../../components/ui/FormModal";
import { ModuleHeader } from "../../../components/ui/ModuleHeader";
import { pageToneColor } from "../../../components/ui/SectionTitle";
import { useAppLayout } from "../../../hooks/useAppLayout";
import { useAppTheme } from "../../../hooks/useAppTheme";
import { loadFarmShed, updateShedInFarm, type SavedFarm, type SavedShed } from "../../../services/localRecords";
import { useAuthStore } from "../../../store/useAuthStore";
import {
  buildDailyRecord,
  calcEggNumbers,
  calcFeedPerBirdG,
  calcLayPercent,
  dayNumberFromHatch,
  formatNumber,
  latestFlockSize,
  nextEntryDate,
  sortRecords,
} from "../../../utils/farmRecordCalc";
import {
  LAYER_PHASES,
  monthKeyFromDate,
  monthLabel,
  resolvePhase,
  weekFromDayNumber,
  type LayerPhaseId,
} from "../../../utils/farmRecordPhases";
import { generateFarmRecordPdf, shareFarmRecordOnWhatsApp, shareFarmRecordPdf } from "../../../utils/farmRecordPdf";
import {
  SHEET_COLORS,
  columnsForSheet,
  displayCell,
  formatMetaCell,
  phaseBannerTitle,
  phaseMetaItems,
  weekRangeLabel,
  type SheetColumn,
} from "../../../utils/farmRecordSheet";
import { emptyFlockBook, type LayerPeriod, type ShedDailyRecord } from "../../../utils/farmRecordTypes";
import { useLanguage } from "../../../utils/i18n";

type CollapseMode = "week" | "month";

function Field({
  label,
  value,
  onChangeText,
  keyboardType = "default",
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  placeholder?: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ marginBottom: 6, color: colors.muted, fontFamily: "Poppins_500Medium", fontSize: 11, textTransform: "uppercase" }}>
        {label}
      </Text>
      <TextInput
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={{
          minHeight: 44,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 10,
          backgroundColor: colors.card,
          paddingHorizontal: 12,
          color: colors.ink,
          fontFamily: "Poppins_500Medium",
          fontSize: 13,
        }}
        value={value}
      />
    </View>
  );
}

function GridCell({
  children,
  width,
  header = false,
  align = "left",
  background,
  color,
  flex,
}: {
  children: string;
  width?: number;
  header?: boolean;
  align?: "left" | "right" | "center";
  background: string;
  color?: string;
  flex?: number;
}) {
  return (
    <View
      style={{
        width,
        flex,
        borderRightWidth: 1,
        borderRightColor: SHEET_COLORS.grid,
        backgroundColor: background,
        paddingHorizontal: 5,
        paddingVertical: 7,
        justifyContent: "center",
        minHeight: header ? 40 : 34,
      }}
    >
      <Text
        numberOfLines={header ? 2 : 3}
        style={{
          color: color ?? (header ? SHEET_COLORS.headerText : SHEET_COLORS.ink),
          fontFamily: header ? "Poppins_700Bold" : "Poppins_500Medium",
          fontSize: header ? 9 : 10,
          textAlign: align,
        }}
      >
        {children}
      </Text>
    </View>
  );
}

export default function ShedBookScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ farmId?: string; shedId?: string }>();
  const { width } = useAppLayout();
  const { colors, isDark } = useAppTheme();
  const pageBg = pageToneColor("green", isDark, colors.page);
  const { t, n } = useLanguage();
  const userId = useAuthStore((state) => state.user?.id);
  const [farm, setFarm] = useState<SavedFarm | null>(null);
  const [shed, setShed] = useState<SavedShed | null>(null);
  const [entryOpen, setEntryOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [editing, setEditing] = useState<ShedDailyRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [collapseMode, setCollapseMode] = useState<CollapseMode>("week");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [period, setPeriod] = useState<LayerPeriod>("growing");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [flockSize, setFlockSize] = useState("");
  const [mortality, setMortality] = useState("0");
  const [feedKg, setFeedKg] = useState("");
  const [eggTrays, setEggTrays] = useState("");
  const [eggNumbers, setEggNumbers] = useState("");
  const [ops, setOps] = useState("");
  const [medicine, setMedicine] = useState("");
  const [remark, setRemark] = useState("");

  const [hatchDate, setHatchDate] = useState("");
  const [chicksReceived, setChicksReceived] = useState("");
  const [proprietor, setProprietor] = useState("");
  const [henHoused, setHenHoused] = useState("");
  const [setupPeriod, setSetupPeriod] = useState<LayerPeriod>("growing");

  const contentWidth = Math.min(Math.max(0, width - 36), 1180);
  const book = shed?.flockBook ?? emptyFlockBook();
  const records = useMemo(() => sortRecords(book.dailyRecords), [book.dailyRecords]);

  const goFarmMitra = useCallback(() => {
    router.replace("/(tabs)/(farm)/records" as Href);
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        goFarmMitra();
        return true;
      };
      const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
      return () => sub.remove();
    }, [goFarmMitra]),
  );

  const refresh = async () => {
    if (!userId || !params.farmId || !params.shedId) return;
    const found = await loadFarmShed(userId, params.farmId, params.shedId);
    setFarm(found?.farm ?? null);
    setShed(found?.shed ?? null);
  };

  useEffect(() => {
    void refresh();
  }, [userId, params.farmId, params.shedId]);

  useEffect(() => {
    if (!records.length) return;
    const latest = records[records.length - 1];
    const week = weekFromDayNumber(latest.dayNumber);
    const key = collapseMode === "week" ? `week-${week}` : `month-${monthKeyFromDate(latest.date)}`;
    setExpanded((current) => ({ ...current, [key]: true }));
  }, [records.length, collapseMode]);

  const phaseGroups = useMemo(() => {
    return LAYER_PHASES.map((phase) => {
      const phaseRecords = records.filter((record) => resolvePhase(record.dayNumber).id === phase.id);
      const groups = new Map<string, ShedDailyRecord[]>();
      phaseRecords.forEach((record) => {
        const key =
          collapseMode === "week"
            ? `week-${weekFromDayNumber(record.dayNumber)}`
            : `month-${monthKeyFromDate(record.date)}`;
        const list = groups.get(key) ?? [];
        list.push(record);
        groups.set(key, list);
      });
      return {
        phase,
        groups: [...groups.entries()].map(([key, items]) => ({
          key,
          label:
            collapseMode === "week"
              ? `${t("Week")} ${key.replace("week-", "")}`
              : monthLabel(key.replace("month-", "")),
          items,
        })),
      };
    }).filter(
      (section) => section.groups.length > 0 || (records.length === 0 && section.phase.id === "growing"),
    );
  }, [records, collapseMode, t]);

  const syncPeriodFromDate = (nextDate: string, nextHatch = book.hatchDate) => {
    const day = dayNumberFromHatch(nextHatch || nextDate, nextDate);
    const phase = resolvePhase(day);
    setPeriod(phase.period);
  };

  const openAddEntry = () => {
    const opening = latestFlockSize(book);
    // First record uses hatch date (Day 1). Later records continue from the last saved day.
    const nextDate = nextEntryDate(book);
    setEditing(null);
    setDate(nextDate);
    syncPeriodFromDate(nextDate);
    setFlockSize(String(opening || book.chicksReceived || ""));
    setMortality("0");
    setFeedKg("");
    setEggTrays("");
    setEggNumbers("");
    setOps("");
    setMedicine("");
    setRemark("");
    setEntryOpen(true);
  };

  const openEditEntry = (record: ShedDailyRecord) => {
    setEditing(record);
    setPeriod(record.period);
    setDate(record.date);
    setFlockSize(String(record.flockSize));
    setMortality(String(record.mortality));
    setFeedKg(String(record.feedKg));
    setEggTrays(record.eggTrays != null ? String(record.eggTrays) : "");
    setEggNumbers(record.eggNumbers != null ? String(record.eggNumbers) : "");
    setOps(record.operationsVaccination ?? "");
    setMedicine(record.medication ?? "");
    setRemark(record.remark ?? "");
    setEntryOpen(true);
  };

  const openSetup = () => {
    setHatchDate(book.hatchDate || new Date().toISOString().slice(0, 10));
    setChicksReceived(String(book.chicksReceived || ""));
    setProprietor(book.proprietor || "");
    setHenHoused(String(book.henHoused || book.chicksReceived || ""));
    setSetupPeriod(book.period || "growing");
    setSetupOpen(true);
  };

  const saveSetup = async () => {
    if (!farm || !shed) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(hatchDate.trim())) {
      setMessage(t("Enter a full hatch date like 2026/11/20."));
      return;
    }
    const nextBook = emptyFlockBook({
      ...book,
      hatchDate: hatchDate.trim(),
      chicksReceived: Number(chicksReceived) || 0,
      proprietor: proprietor.trim(),
      henHoused: Number(henHoused) || Number(chicksReceived) || 0,
      period: setupPeriod,
      dailyRecords: book.dailyRecords,
    });
    const nextShed = { ...shed, flockBook: nextBook };
    const nextFarm = await updateShedInFarm(farm, nextShed);
    setFarm(nextFarm);
    setShed(nextFarm.sheds.find((item) => item.id === shed.id) ?? nextShed);
    setSetupOpen(false);
  };

  const saveEntry = async () => {
    if (!farm || !shed) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim()) || !flockSize.trim()) {
      setMessage(t("Enter a full date (YYYY/MM/DD) and flock size."));
      return;
    }
    const trays = Number(eggTrays) || 0;
    const eggs = eggNumbers.trim() ? Number(eggNumbers) : calcEggNumbers(trays);
    const record = buildDailyRecord({
      id: editing?.id,
      date: date.trim(),
      hatchDate: book.hatchDate || date.trim(),
      period,
      flockSize: Number(flockSize) || 0,
      mortality: Number(mortality) || 0,
      feedKg: Number(feedKg) || 0,
      eggTrays: period === "laying" ? trays : undefined,
      eggNumbers: period === "laying" ? eggs : undefined,
      operationsVaccination: ops,
      medication: medicine,
      remark,
    });

    const without = book.dailyRecords.filter((item) => item.id !== record.id);
    const phase = resolvePhase(record.dayNumber);
    const nextBook = { ...book, period: phase.period, dailyRecords: sortRecords([...without, record]) };
    const nextShed = { ...shed, flockBook: nextBook };
    const nextFarm = await updateShedInFarm(farm, nextShed);
    setFarm(nextFarm);
    setShed(nextFarm.sheds.find((item) => item.id === shed.id) ?? nextShed);
    setEntryOpen(false);
    setEditing(null);
    setMessage("");
    const groupKey = collapseMode === "week" ? `week-${weekFromDayNumber(record.dayNumber)}` : `month-${monthKeyFromDate(record.date)}`;
    setExpanded((current) => ({ ...current, [groupKey]: true }));
  };

  const deleteEntry = async (record: ShedDailyRecord) => {
    if (!farm || !shed) return;
    const nextBook = { ...book, dailyRecords: book.dailyRecords.filter((item) => item.id !== record.id) };
    const nextShed = { ...shed, flockBook: nextBook };
    const nextFarm = await updateShedInFarm(farm, nextShed);
    setFarm(nextFarm);
    setShed(nextFarm.sheds.find((item) => item.id === shed.id) ?? nextShed);
  };

  const handleShareWhatsApp = async () => {
    if (!farm || !shed) return;
    setBusy(true);
    try {
      const uri = await generateFarmRecordPdf({
        farmName: farm.name,
        shedName: shed.name,
        place: farm.place,
        book,
      });
      await shareFarmRecordOnWhatsApp(
        uri,
        `Farm Mitra record · ${farm.name} / ${shed.name}\nHatch: ${book.hatchDate} · Records: ${records.length}`,
      );
    } catch (error) {
      console.error("Could not share shed record PDF.", error);
      Alert.alert(t("Unable to share"), error instanceof Error ? error.message : t("Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const handleOpenPdf = async () => {
    if (!farm || !shed) return;
    setBusy(true);
    try {
      const uri = await generateFarmRecordPdf({
        farmName: farm.name,
        shedName: shed.name,
        place: farm.place,
        book,
      });
      await shareFarmRecordPdf(uri, `${shed.name} record book`);
    } catch (error) {
      console.error("Could not open shed record PDF.", error);
      Alert.alert(t("Unable to open PDF"), error instanceof Error ? error.message : t("Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const toggleGroup = (key: string) => {
    setExpanded((current) => ({ ...current, [key]: !current[key] }));
  };

  const collapseAll = () => setExpanded({});
  const expandAll = () => {
    const next: Record<string, boolean> = {};
    phaseGroups.forEach((section) => {
      section.groups.forEach((group) => {
        next[group.key] = true;
      });
    });
    setExpanded(next);
  };

  const previewDay = dayNumberFromHatch(book.hatchDate || date, date);
  const previewPhase = resolvePhase(previewDay);
  const previewFeedPerBird = calcFeedPerBirdG(Number(feedKg) || 0, Number(flockSize) || 0);
  const previewEggs = eggNumbers.trim() ? Number(eggNumbers) : calcEggNumbers(Number(eggTrays) || 0);
  const previewLay = calcLayPercent(previewEggs, Number(flockSize) || 0);
  const showLayingColumns = period === "laying";

  const renderRow = (record: ShedDailyRecord, cols: SheetColumn[], rowIndex: number) => {
    const bg = rowIndex % 2 === 0 ? SHEET_COLORS.rowA : SHEET_COLORS.rowB;
    return (
      <Pressable
        key={record.id}
        onPress={() => openEditEntry(record)}
        onLongPress={() => void deleteEntry(record)}
        style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: SHEET_COLORS.grid }}
      >
        {cols.map((col) => (
          <GridCell key={col.key} align={col.align} background={bg} width={col.width}>
            {displayCell(record, col.key)}
          </GridCell>
        ))}
      </Pressable>
    );
  };

  const renderPhaseSheet = (
    phaseId: LayerPhaseId,
    sheet: "growing" | "laying",
    farmTitle: string,
    phaseTitle: string,
    meta: { label: string; value: string }[],
    groups: { key: string; label: string; items: ShedDailyRecord[] }[],
  ) => {
    const cols = columnsForSheet(sheet);
    const tableWidth = Math.max(
      cols.reduce((sum, col) => sum + col.width, 0),
      contentWidth,
    );
    let rowIndex = 0;
    return (
      <View style={{ borderWidth: 1.5, borderColor: SHEET_COLORS.grid, borderRadius: 4, overflow: "hidden", backgroundColor: "#FFFFFF" }}>
        <View style={{ flexDirection: "row", borderBottomWidth: 1.5, borderBottomColor: SHEET_COLORS.grid, minHeight: 40 }}>
          <View style={{ flex: 1.1, backgroundColor: SHEET_COLORS.farmBlue, justifyContent: "center", paddingHorizontal: 10, paddingVertical: 8, borderRightWidth: 1.5, borderRightColor: SHEET_COLORS.grid }}>
            <Text style={{ color: SHEET_COLORS.farmBlueText, fontFamily: "Poppins_700Bold", fontSize: 11, textTransform: "uppercase" }} numberOfLines={2}>
              {farmTitle}
            </Text>
          </View>
          <View style={{ flex: 1, backgroundColor: SHEET_COLORS.phaseYellow, justifyContent: "center", alignItems: "center", paddingHorizontal: 8, paddingVertical: 8 }}>
            <Text style={{ color: SHEET_COLORS.phaseYellowText, fontFamily: "Poppins_700Bold", fontSize: 11, textAlign: "center" }} numberOfLines={2}>
              {phaseTitle}
            </Text>
          </View>
        </View>

        {/* Middle title row (Hatch Date / Hen-Housed / Proprietor) — between farm banner and Date|Days */}
        <View style={{ flexDirection: "row", borderBottomWidth: 1.5, borderBottomColor: SHEET_COLORS.grid, minHeight: 36 }}>
          {meta.map((item, index) => (
            <View
              key={item.label}
              style={{
                flex: 1,
                backgroundColor: SHEET_COLORS.metaBlue,
                borderRightWidth: index < meta.length - 1 ? 1 : 0,
                borderRightColor: SHEET_COLORS.grid,
                justifyContent: "center",
                paddingHorizontal: 8,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: SHEET_COLORS.metaText, fontFamily: "Poppins_700Bold", fontSize: 10 }} numberOfLines={2}>
                {formatMetaCell(item)}
              </Text>
            </View>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View style={{ minWidth: tableWidth }}>
            <View style={{ flexDirection: "row", borderBottomWidth: 1.5, borderBottomColor: SHEET_COLORS.grid }}>
              {cols.map((col) => (
                <GridCell
                  key={col.key}
                  align="center"
                  background={SHEET_COLORS.headerBg}
                  color={SHEET_COLORS.headerText}
                  header
                  width={col.width}
                >
                  {col.label}
                </GridCell>
              ))}
            </View>

            {groups.map((group) => {
              const open = Boolean(expanded[group.key]);
              return (
                <View key={`${phaseId}-${group.key}`}>
                  <Pressable
                    onPress={() => toggleGroup(group.key)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#FEF9C3",
                      borderBottomWidth: 1,
                      borderBottomColor: SHEET_COLORS.grid,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      width: tableWidth,
                    }}
                  >
                    <Ionicons color={SHEET_COLORS.ink} name={open ? "chevron-down" : "chevron-forward"} size={16} />
                    <Text style={{ marginLeft: 8, color: SHEET_COLORS.ink, fontFamily: "Poppins_700Bold", fontSize: 11 }}>
                      {group.label} · {n(group.items.length)} {t("days")}
                    </Text>
                  </Pressable>
                  {open
                    ? group.items.map((record) => {
                        const node = renderRow(record, cols, rowIndex);
                        rowIndex += 1;
                        return node;
                      })
                    : null}
                </View>
              );
            })}

            {!groups.length ? (
              <View style={{ padding: 14, width: tableWidth }}>
                <Text style={{ color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 12 }}>{t("No rows in this phase yet.")}</Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>
    );
  };

  if (!farm || !shed) {
    return (
      <SafeAreaView edges={["left", "right"]} style={{ flex: 1, backgroundColor: pageBg }}>
        <View style={{ padding: 18 }}>
          <Pressable onPress={goFarmMitra} style={{ minHeight: 40, flexDirection: "row", alignItems: "center" }}>
            <Ionicons color={colors.accent} name="arrow-back" size={18} />
            <Text style={{ marginLeft: 8, color: colors.accent, fontFamily: "Poppins_600SemiBold" }}>{t("Farm Mitra")}</Text>
          </Pressable>
          <Text style={{ marginTop: 20, color: colors.ink, fontFamily: "Poppins_700Bold", fontSize: 16 }}>{t("Shed record not found.")}</Text>
          <Text style={{ marginTop: 8, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 13 }}>
            {t("This shed may have been removed. Go back to Farm Mitra and open the shed again.")}
          </Text>
          <Pressable
            onPress={goFarmMitra}
            style={{ marginTop: 16, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: colors.accent, paddingHorizontal: 16 }}
          >
            <Text style={{ color: "#FFFFFF", fontFamily: "Poppins_700Bold", fontSize: 13 }}>{t("Back to Farm Mitra")}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1, backgroundColor: pageBg }}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 36 }}>
        <View style={{ width: "100%", maxWidth: contentWidth, alignSelf: "center" }}>
          <Pressable onPress={goFarmMitra} style={{ minHeight: 36, marginBottom: 8, flexDirection: "row", alignItems: "center", alignSelf: "flex-start" }}>
            <Ionicons color={colors.accent} name="arrow-back" size={18} />
            <Text style={{ marginLeft: 8, color: colors.accent, fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>{t("Farm Mitra")}</Text>
          </Pressable>

          <ModuleHeader
            title={shed.name}
            subtitle={`${farm.name}${farm.place ? ` · ${farm.place}` : ""} · ${t("Layer record book")}`}
            tone="green"
            trailing={
              <Pressable
                accessibilityLabel={t("Share on WhatsApp")}
                disabled={busy}
                onPress={() => void handleShareWhatsApp()}
                style={{ minHeight: 40, flexDirection: "row", alignItems: "center", borderRadius: 10, backgroundColor: "#16A34A", paddingHorizontal: 12 }}
              >
                <Ionicons color="#FFFFFF" name="logo-whatsapp" size={18} />
                <Text style={{ marginLeft: 6, color: "#FFFFFF", fontFamily: "Poppins_700Bold", fontSize: 11 }}>{t("WhatsApp")}</Text>
              </Pressable>
            }
          />

          <View style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 16, backgroundColor: colors.card, padding: 14, marginBottom: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <Text style={{ flex: 1, color: colors.primary, fontFamily: "Poppins_700Bold", fontSize: 14, textTransform: "uppercase" }}>
                {t("Flock setup")}
              </Text>
              <Pressable onPress={openSetup} style={{ minHeight: 34, justifyContent: "center", borderRadius: 8, borderWidth: 1, borderColor: colors.accent, paddingHorizontal: 10 }}>
                <Text style={{ color: colors.accent, fontFamily: "Poppins_700Bold", fontSize: 11, textTransform: "uppercase" }}>{t("Edit")}</Text>
              </Pressable>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {[
                ["Hatch date", book.hatchDate || "—"],
                ["Chicks received", n(book.chicksReceived)],
                ["Hen housed", n(book.henHoused)],
                ["Proprietor", book.proprietor || "—"],
                ["Live birds", n(latestFlockSize(book))],
              ].map(([label, value]) => (
                <View key={label} style={{ minWidth: "45%", flexGrow: 1 }}>
                  <Text style={{ color: colors.muted, fontFamily: "Poppins_500Medium", fontSize: 10, textTransform: "uppercase" }}>{t(label)}</Text>
                  <Text style={{ marginTop: 2, color: colors.ink, fontFamily: "Poppins_700Bold", fontSize: 13 }}>{value}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Text style={{ flex: 1, minWidth: 120, color: colors.primary, fontFamily: "Poppins_700Bold", fontSize: 16 }}>{t("Daily records")}</Text>
            <View style={{ flexDirection: "row", borderWidth: 1, borderColor: colors.line, borderRadius: 10, overflow: "hidden" }}>
              {(["week", "month"] as const).map((mode) => (
                <Pressable
                  key={mode}
                  onPress={() => setCollapseMode(mode)}
                  style={{
                    minHeight: 36,
                    paddingHorizontal: 12,
                    justifyContent: "center",
                    backgroundColor: collapseMode === mode ? colors.promoBg : colors.card,
                  }}
                >
                  <Text style={{ color: collapseMode === mode ? colors.accent : colors.ink, fontFamily: "Poppins_700Bold", fontSize: 11 }}>
                    {t(mode === "week" ? "By week" : "By month")}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={collapseAll} style={{ minHeight: 36, justifyContent: "center", borderRadius: 10, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 10 }}>
              <Text style={{ color: colors.ink, fontFamily: "Poppins_600SemiBold", fontSize: 11 }}>{t("Close all")}</Text>
            </Pressable>
            <Pressable onPress={expandAll} style={{ minHeight: 36, justifyContent: "center", borderRadius: 10, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 10 }}>
              <Text style={{ color: colors.ink, fontFamily: "Poppins_600SemiBold", fontSize: 11 }}>{t("Open all")}</Text>
            </Pressable>
            <Pressable onPress={() => void handleOpenPdf()} style={{ minHeight: 36, justifyContent: "center", borderRadius: 10, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, paddingHorizontal: 10 }}>
              <Text style={{ color: colors.ink, fontFamily: "Poppins_600SemiBold", fontSize: 11 }}>{t("Open PDF")}</Text>
            </Pressable>
            <Pressable onPress={openAddEntry} style={{ minHeight: 36, flexDirection: "row", alignItems: "center", borderRadius: 10, backgroundColor: colors.accent, paddingHorizontal: 12 }}>
              <Ionicons color="#FFFFFF" name="add" size={16} />
              <Text style={{ marginLeft: 4, color: "#FFFFFF", fontFamily: "Poppins_700Bold", fontSize: 11 }}>{t("Add record")}</Text>
            </Pressable>
          </View>

          {!records.length ? (
            <View
              style={{
                marginBottom: 14,
                borderWidth: 1,
                borderColor: colors.line,
                borderRadius: 14,
                backgroundColor: colors.card,
                padding: 16,
              }}
            >
              <Text style={{ color: colors.primary, fontFamily: "Poppins_700Bold", fontSize: 14 }}>{t("No daily records yet")}</Text>
              <Text style={{ marginTop: 6, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 12 }}>
                {book.hatchDate
                  ? t("Flock setup is ready. Add the first daily row — it starts from the hatch date (Day 1 / Growing).")
                  : t("Set hatch date and chicks in Flock setup, then add your first daily row.")}
              </Text>
              <View style={{ marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                <Pressable onPress={openSetup} style={{ minHeight: 40, justifyContent: "center", borderRadius: 10, borderWidth: 1, borderColor: colors.accent, paddingHorizontal: 12 }}>
                  <Text style={{ color: colors.accent, fontFamily: "Poppins_700Bold", fontSize: 12 }}>{t("Flock setup")}</Text>
                </Pressable>
                <Pressable onPress={openAddEntry} style={{ minHeight: 40, flexDirection: "row", alignItems: "center", borderRadius: 10, backgroundColor: colors.accent, paddingHorizontal: 12 }}>
                  <Ionicons color="#FFFFFF" name="add" size={16} />
                  <Text style={{ marginLeft: 4, color: "#FFFFFF", fontFamily: "Poppins_700Bold", fontSize: 12 }}>{t("Add record")}</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          <View style={{ gap: 18 }}>
            {phaseGroups.map(({ phase, groups }) => {
              const phaseRecords = groups.flatMap((group) => group.items);
              return (
                <View key={phase.id}>
                  {renderPhaseSheet(
                    phase.id,
                    phase.sheet,
                    farm.name,
                    phaseBannerTitle(phase),
                    phaseMetaItems(phase, book, phaseRecords),
                    groups,
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <FormModal onClose={() => setSetupOpen(false)} title="Flock setup" visible={setupOpen}>
        <DateField
          hint={t("Type 2026 then month and day — / is added automatically")}
          label={t("Hatch date (YYYY/MM/DD)")}
          onChangeIso={setHatchDate}
          placeholder="2026/11/20"
          value={hatchDate}
        />
        <Field keyboardType="numeric" label={t("Chicks received")} onChangeText={setChicksReceived} value={chicksReceived} />
        <Field keyboardType="numeric" label={t("Hen housed")} onChangeText={setHenHoused} value={henHoused} />
        <Field label={t("Proprietor")} onChangeText={setProprietor} value={proprietor} />
        <Text style={{ marginBottom: 8, color: colors.muted, fontFamily: "Poppins_500Medium", fontSize: 11, textTransform: "uppercase" }}>{t("Default period")}</Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          {(["growing", "laying"] as const).map((item) => (
            <Pressable
              key={item}
              onPress={() => setSetupPeriod(item)}
              style={{
                flex: 1,
                minHeight: 40,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 10,
                borderWidth: 1,
                borderColor: setupPeriod === item ? colors.accent : colors.line,
                backgroundColor: setupPeriod === item ? colors.promoBg : colors.cardSoft,
              }}
            >
              <Text style={{ color: setupPeriod === item ? colors.accent : colors.ink, fontFamily: "Poppins_700Bold", fontSize: 12 }}>
                {t(item === "growing" ? "Growing" : "Laying")}
              </Text>
            </Pressable>
          ))}
        </View>
        {message ? <Text style={{ marginBottom: 10, color: "#B91C1C", fontFamily: "Poppins_400Regular", fontSize: 12 }}>{message}</Text> : null}
        <Pressable
          onPress={() => {
            setMessage("");
            void saveSetup();
          }}
          style={{ minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: colors.accent }}
        >
          <Text style={{ color: "#FFFFFF", fontFamily: "Poppins_700Bold", fontSize: 14 }}>{t("Save setup")}</Text>
        </Pressable>
      </FormModal>

      <FormModal onClose={() => setEntryOpen(false)} size="large" title={editing ? "Edit daily record" : "Add daily record"} visible={entryOpen}>
        <View style={{ borderRadius: 4, overflow: "hidden", borderWidth: 1.5, borderColor: SHEET_COLORS.grid, marginBottom: 12 }}>
          <View style={{ backgroundColor: SHEET_COLORS.phaseYellow, paddingHorizontal: 10, paddingVertical: 8 }}>
            <Text style={{ color: SHEET_COLORS.phaseYellowText, fontFamily: "Poppins_700Bold", fontSize: 12 }}>{phaseBannerTitle(previewPhase)}</Text>
          </View>
          <View style={{ backgroundColor: SHEET_COLORS.metaBlue, paddingHorizontal: 10, paddingVertical: 8 }}>
            <Text style={{ color: SHEET_COLORS.metaText, fontFamily: "Poppins_400Regular", fontSize: 11 }}>
              {t("Day")} {n(previewDay)} · {t("Week")} {n(weekFromDayNumber(previewDay))} · {weekRangeLabel(previewPhase)}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          <View style={{ flex: 1, minWidth: 160 }}>
            <DateField
              hint={t("Type 2026 then month and day — / is added automatically")}
              label={t("Date (YYYY/MM/DD)")}
              onChangeIso={(iso) => {
                setDate(iso);
                if (iso) syncPeriodFromDate(iso);
              }}
              placeholder="2026/11/20"
              value={date}
            />
          </View>
          <View style={{ flex: 1, minWidth: 160 }}>
            <Field keyboardType="numeric" label={t("Flock size")} onChangeText={setFlockSize} value={flockSize} />
          </View>
          <View style={{ flex: 1, minWidth: 160 }}>
            <Field keyboardType="numeric" label={t("Mortality")} onChangeText={setMortality} value={mortality} />
          </View>
          <View style={{ flex: 1, minWidth: 160 }}>
            <Field keyboardType="decimal-pad" label={t("Feed (Kg)")} onChangeText={setFeedKg} value={feedKg} />
          </View>
          {showLayingColumns ? (
            <>
              <View style={{ flex: 1, minWidth: 160 }}>
                <Field keyboardType="decimal-pad" label={t("Eggs trays")} onChangeText={setEggTrays} value={eggTrays} />
              </View>
              <View style={{ flex: 1, minWidth: 160 }}>
                <Field keyboardType="numeric" label={t("Eggs numbers")} onChangeText={setEggNumbers} placeholder={t("Auto from trays if empty")} value={eggNumbers} />
              </View>
            </>
          ) : (
            <>
              <View style={{ flex: 1, minWidth: 160 }}>
                <Field label={t("Operations/Vaccination")} onChangeText={setOps} value={ops} />
              </View>
              <View style={{ flex: 1, minWidth: 160 }}>
                <Field label={t("Medication")} onChangeText={setMedicine} value={medicine} />
              </View>
            </>
          )}
        </View>

        {showLayingColumns ? (
          <>
            <Field label={t("Operations/Vaccination")} onChangeText={setOps} value={ops} />
            <Field label={t("Medication")} onChangeText={setMedicine} value={medicine} />
          </>
        ) : null}
        <Field label={t("Remark")} onChangeText={setRemark} value={remark} />

        <View style={{ borderRadius: 12, backgroundColor: colors.cardSoft, padding: 12, marginBottom: 12 }}>
          <Text style={{ color: colors.muted, fontFamily: "Poppins_500Medium", fontSize: 11, textTransform: "uppercase" }}>{t("Auto calculated")}</Text>
          <Text style={{ marginTop: 6, color: colors.ink, fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>
            {t("Feed/bird (gm)")} {formatNumber(previewFeedPerBird)}
            {showLayingColumns ? ` · ${t("Eggs numbers")} ${n(previewEggs)} · ${t("Percentage %")} ${formatNumber(previewLay)}` : ""}
          </Text>
        </View>

        {message ? <Text style={{ marginBottom: 10, color: "#B91C1C", fontFamily: "Poppins_400Regular", fontSize: 12 }}>{message}</Text> : null}

        <Pressable onPress={() => void saveEntry()} style={{ minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: colors.accent }}>
          <Text style={{ color: "#FFFFFF", fontFamily: "Poppins_700Bold", fontSize: 14 }}>{t("Save record")}</Text>
        </Pressable>
      </FormModal>
    </SafeAreaView>
  );
}
