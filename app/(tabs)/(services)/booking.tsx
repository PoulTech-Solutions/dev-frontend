import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ModuleHeader } from "../../../components/ui/ModuleHeader";
import { useAuthStore } from "../../../store/useAuthStore";
import { DEMO_BOOKINGS } from "../../../utils/demoData";
import { useAppLayout } from "../../../hooks/useAppLayout";
import { useLanguage } from "../../../utils/i18n";

const SERVICES = [
  {
    id: "vaccination",
    title: "Vaccination",
    subtitle: "Schedule a vaccination team",
    icon: "shield-checkmark-outline",
    color: "#A16207",
    background: "#FEF3C7",
  },
  {
    id: "medicine",
    title: "Medicine Delivery",
    subtitle: "Medicine delivery for your farm",
    icon: "medical-outline",
    color: "#7E22CE",
    background: "#F3E8FF",
  },
  {
    id: "health",
    title: "Flock Health Checkup",
    subtitle: "Health assessment and lab reports",
    icon: "medkit-outline",
    color: "#14532D",
    background: "#EAF8EC",
  },
  {
    id: "water",
    title: "Water Testing",
    subtitle: "Test water quality for your farm",
    icon: "water-outline",
    color: "#1D4ED8",
    background: "#EFF6FF",
  },
  {
    id: "feed",
    title: "Feed Testing",
    subtitle: "Laboratory feed analysis",
    icon: "flask-outline",
    color: "#0E7490",
    background: "#CFFAFE",
  },
] as const;

const TIME_SLOTS = ["10:30 AM", "12:00 PM", "2:30 PM"];
const REGULAR = "Poppins_400Regular";
const MEDIUM = "Poppins_500Medium";
const SEMIBOLD = "Poppins_600SemiBold";
const BOLD = "Poppins_700Bold";

type DemoRequest = {
  id: string;
  service: string;
  date: string;
  time: string;
  status: string;
};

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatBookingDate(date: Date, language: string) {
  const locale = `${language}-IN`;
  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ServiceBookingScreen() {
  const { width } = useAppLayout();
  const { language, t } = useLanguage();
  const isDemoSession = useAuthStore((state) => Boolean(state.user?.id.startsWith("mock-")));
  const { service: requestedService } = useLocalSearchParams<{ service?: string }>();
  const [selectedService, setSelectedService] = useState<string | null>(
    typeof requestedService === "string" ? requestedService : null,
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const [demoRequests, setDemoRequests] = useState<DemoRequest[]>([]);
  const contentWidth = Math.min(width - 36, 900);
  const weekdays = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(`${language}-IN`, { weekday: "short" }).format(
      new Date(2023, 0, index + 1),
    ),
  );
  const selected = SERVICES.find((service) => service.id === selectedService);
  const todayKey = dateKey(new Date());
  const currentMonth = new Date();
  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const leadingBlanks = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return [
      ...Array.from({ length: leadingBlanks }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1)),
    ];
  }, [visibleMonth]);
  const canGoToPreviousMonth =
    visibleMonth.getFullYear() > currentMonth.getFullYear() ||
    (visibleMonth.getFullYear() === currentMonth.getFullYear() &&
      visibleMonth.getMonth() > currentMonth.getMonth());

  useEffect(() => {
    setSelectedService(typeof requestedService === "string" ? requestedService : null);
  }, [requestedService]);

  const chooseService = (serviceId: string) => {
    setSelectedService((current) => current === serviceId ? null : serviceId);
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const addDemoRequest = () => {
    if (!selected || !selectedDate || !selectedTime) return;
    setDemoRequests((requests) => [
      {
        id: `${selected.id}-${dateKey(selectedDate)}-${selectedTime}`,
        service: selected.title,
        date: formatBookingDate(selectedDate, language),
        time: selectedTime,
        status: "Demo request",
      },
      ...requests,
    ]);
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedService(null);
  };

  const requests = [
    ...demoRequests,
    ...DEMO_BOOKINGS.map((booking) => ({
      id: `${booking.service}-${booking.date}`,
      ...booking,
    })),
  ];

  return (
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1, backgroundColor: "#FAF7F0" }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: "100%", maxWidth: contentWidth, alignSelf: "center" }}>
          <ModuleHeader
            title="Farm services"
            subtitle="Find the support your flock needs."
          />

          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start", columnGap: 12, rowGap: 12 }}>
            {SERVICES.map((service) => {
              const isSelected = selectedService === service.id;
              return (
                <Pressable
                  key={service.id}
                  accessibilityLabel={`${t("Select")} ${t(service.title)}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  className="cursor-pointer hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-accent"
                  onPress={() => chooseService(service.id)}
                  style={{
                    width: contentWidth >= 700 ? "31%" : "47%",
                    minHeight: 150,
                    justifyContent: "space-between",
                    borderWidth: isSelected ? 2 : 1,
                    borderColor: isSelected ? service.color : "#E2E8F0",
                    borderRadius: 20,
                    backgroundColor: "#FFFFFF",
                    padding: 14,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <View style={{ width: 46, height: 46, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: service.background }}>
                      <Ionicons color={service.color} name={service.icon} size={22} />
                    </View>
                    <Ionicons
                      color={isSelected ? service.color : "#CBD5E1"}
                      name={isSelected ? "checkmark-circle" : "chevron-forward"}
                      size={18}
                    />
                  </View>
                  <View style={{ marginTop: 14 }}>
                    <Text style={{ color: "#0B2A5B", fontFamily: SEMIBOLD, fontSize: 12, lineHeight: 18 }}>
                      {t(service.title)}
                    </Text>
                    <Text style={{ marginTop: 3, color: "#64748B", fontFamily: REGULAR, fontSize: 10, lineHeight: 15 }}>
                      {t(service.subtitle)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {isDemoSession ? (
            <View style={{ marginTop: 16, flexDirection: "row", alignItems: "flex-start", borderRadius: 13, backgroundColor: "#FFFBEB", padding: 11 }}>
              <Ionicons color="#A16207" name="information-circle-outline" size={17} />
              <Text style={{ flex: 1, marginLeft: 7, color: "#854D0E", fontFamily: REGULAR, fontSize: 10, lineHeight: 16 }}>
                {t("Demo schedule · choose a service, date, and time to preview a booking request. Nothing is sent to a service provider.")}
              </Text>
            </View>
          ) : null}

          <View style={{ marginTop: 20, flexDirection: contentWidth >= 900 ? "row" : "column", alignItems: "flex-start", gap: 16 }}>
            <View style={{ flex: 1, minWidth: 0, width: contentWidth >= 900 ? undefined : "100%" }}>
              {selected ? (
                <View style={{ borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 20, backgroundColor: "#FFFFFF", padding: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
                  <View style={{ width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: selected.background }}>
                    <Ionicons color={selected.color} name="calendar-outline" size={19} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={{ color: "#0B2A5B", fontFamily: SEMIBOLD, fontSize: 14 }}>
                      {t("Choose a date")}
                    </Text>
                    <Text style={{ marginTop: 2, color: "#64748B", fontFamily: REGULAR, fontSize: 10 }}>
                      {t(selected.title)} · {t("dates shown are for preview")}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <Pressable
                    accessibilityLabel={t("Previous month")}
                    accessibilityRole="button"
                    disabled={!canGoToPreviousMonth}
                    onPress={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                    style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: canGoToPreviousMonth ? "#F1F5F9" : "#F8FAFC" }}
                  >
                    <Ionicons color={canGoToPreviousMonth ? "#334155" : "#CBD5E1"} name="chevron-back" size={18} />
                  </Pressable>
                  <Text style={{ color: "#0B2A5B", fontFamily: SEMIBOLD, fontSize: 13 }}>
                    {visibleMonth.toLocaleDateString(`${language}-IN`, { month: "long", year: "numeric" })}
                  </Text>
                  <Pressable
                    accessibilityLabel={t("Next month")}
                    accessibilityRole="button"
                    onPress={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                    style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: "#F1F5F9" }}
                  >
                    <Ionicons color="#334155" name="chevron-forward" size={18} />
                  </Pressable>
                </View>

                <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 5 }}>
                  {weekdays.map((day) => (
                    <View key={day} style={{ width: "14.2857%", height: 32, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ color: "#64748B", fontFamily: MEDIUM, fontSize: 10 }}>{day}</Text>
                    </View>
                  ))}
                </View>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {calendarDays.map((date, index) => {
                    if (!date) return <View key={`blank-${index}`} style={{ width: "14.2857%", height: 42 }} />;
                    const key = dateKey(date);
                    const disabled = key < todayKey;
                    const isSelected = selectedDate ? key === dateKey(selectedDate) : false;
                    return (
                      <Pressable
                        key={key}
                        accessibilityLabel={date.toLocaleDateString(`${language}-IN`, { dateStyle: "full" })}
                        accessibilityRole="button"
                        accessibilityState={{ disabled, selected: isSelected }}
                        disabled={disabled}
                        onPress={() => {
                          setSelectedDate(date);
                          setSelectedTime(null);
                        }}
                        style={{
                          width: "14.2857%",
                          height: 42,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <View style={{ width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: isSelected ? "#14532D" : "transparent" }}>
                          <Text style={{ color: isSelected ? "#FFFFFF" : disabled ? "#CBD5E1" : "#334155", fontFamily: isSelected ? SEMIBOLD : REGULAR, fontSize: 12 }}>
                            {date.getDate()}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                {selectedDate ? (
                  <View style={{ marginTop: 14, borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingTop: 14 }}>
                    <Text style={{ marginBottom: 9, color: "#0B2A5B", fontFamily: SEMIBOLD, fontSize: 12 }}>
                      {t("Available sample times")} · {formatBookingDate(selectedDate, language)}
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                      {TIME_SLOTS.map((time) => {
                        const active = time === selectedTime;
                        return (
                          <Pressable
                            key={time}
                            accessibilityLabel={`${t("Select")} ${time}`}
                            accessibilityRole="button"
                            accessibilityState={{ selected: active }}
                            onPress={() => setSelectedTime(time)}
                            style={{ minHeight: 38, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: active ? "#14532D" : "#E2E8F0", borderRadius: 11, backgroundColor: active ? "#F0FDF4" : "#FFFFFF", paddingHorizontal: 12 }}
                          >
                            <Text style={{ color: active ? "#14532D" : "#475569", fontFamily: active ? SEMIBOLD : MEDIUM, fontSize: 11 }}>
                              {time}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    {isDemoSession ? (
                      <Pressable
                        accessibilityLabel={t("Add demo booking request")}
                        accessibilityRole="button"
                        accessibilityState={{ disabled: !selectedTime }}
                        className={selectedTime ? "cursor-pointer hover:bg-green-700" : ""}
                        disabled={!selectedTime}
                        onPress={addDemoRequest}
                        style={{ minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 14, borderRadius: 13, backgroundColor: selectedTime ? "#16A34A" : "#DCFCE7" }}
                      >
                        <Ionicons color={selectedTime ? "#FFFFFF" : "#64748B"} name="calendar-outline" size={17} />
                        <Text style={{ marginLeft: 8, color: selectedTime ? "#FFFFFF" : "#64748B", fontFamily: SEMIBOLD, fontSize: 12 }}>
                          {t("Add demo request")}
                        </Text>
                      </Pressable>
                    ) : (
                      <Text style={{ marginTop: 12, color: "#64748B", fontFamily: REGULAR, fontSize: 10, lineHeight: 16 }}>
                        {t("Booking isn’t connected yet. Your selected date and time are only a preview.")}
                      </Text>
                    )}
                  </View>
                ) : null}
                </View>
              ) : (
                <EmptyState
                  icon="calendar-outline"
                  title={t("Choose a service")}
                  description={t("Select a service above to preview available dates and times.")}
                />
              )}
            </View>

            {isDemoSession ? (
              <View style={{ flex: 1, minWidth: 0, width: contentWidth >= 900 ? undefined : "100%", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 20, backgroundColor: "#FFFFFF", padding: 16 }}>
                <Text style={{ marginBottom: 10, color: "#0B2A5B", fontFamily: BOLD, fontSize: 14 }}>
                  {t("Demo service requests")}
                </Text>
                {requests.map((booking) => (
                  <View key={booking.id} style={{ flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingVertical: 11 }}>
                    <View style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#EFF6FF" }}>
                      <Ionicons color="#1D4ED8" name="calendar-outline" size={17} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0, marginLeft: 10 }}>
                      <Text numberOfLines={1} style={{ color: "#0F172A", fontFamily: SEMIBOLD, fontSize: 11 }}>{t(booking.service)}</Text>
                      <Text numberOfLines={1} style={{ marginTop: 2, color: "#64748B", fontFamily: REGULAR, fontSize: 10 }}>{t(booking.date)} · {booking.time}</Text>
                    </View>
                    <Text style={{ marginLeft: 6, color: booking.status === "Confirmed" ? "#15803D" : "#A16207", fontFamily: SEMIBOLD, fontSize: 9 }}>{t(booking.status)}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <View style={{ marginTop: 14, flexDirection: "row", alignItems: "flex-start", borderRadius: 14, backgroundColor: "#EFF6FF", padding: 13 }}>
            <Ionicons color="#1D4ED8" name="information-circle-outline" size={18} />
            <Text style={{ flex: 1, marginLeft: 8, color: "#334155", fontFamily: REGULAR, fontSize: 11, lineHeight: 17 }}>
              {isDemoSession
                ? t("Demo selections are local previews only. No appointment is sent or saved to a backend.")
                : t("Service availability and appointment submission will be enabled when the booking service is connected.")}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
