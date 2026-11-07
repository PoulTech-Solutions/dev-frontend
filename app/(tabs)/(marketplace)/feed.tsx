import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ModuleHeader } from "../../../components/ui/ModuleHeader";
import { useAuthStore } from "../../../store/useAuthStore";
import { DEMO_PRODUCTS, DEMO_SELLER_LISTINGS } from "../../../utils/demoData";
import { useAppLayout } from "../../../hooks/useAppLayout";
import { useLanguage } from "../../../utils/i18n";

const CATEGORIES = ["All", "Chicks", "Feed", "Equipment"] as const;
type Category = (typeof CATEGORIES)[number];

export default function MarketplaceFeedScreen() {
  const { width } = useAppLayout();
  const { t } = useLanguage();
  const { mode: requestedMode } = useLocalSearchParams<{ mode?: string }>();
  const demoUser = useAuthStore((state) => state.user);
  const isDemoSession = Boolean(demoUser?.id.startsWith("mock-"));
  const [mode, setMode] = useState<"purchase" | "sell">(
    requestedMode === "sell" ? "sell" : "purchase",
  );
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const contentWidth = Math.min(width - 36, 1080);
  const visibleProducts = DEMO_PRODUCTS.filter((product) => {
    const matchesCategory = category === "All" || product.category === category;
    const searchText = `${t(product.name)} ${t(product.category)} ${t(product.description)}`.toLowerCase();
    return matchesCategory && searchText.includes(query.toLowerCase().trim());
  });

  useEffect(() => {
    setMode(requestedMode === "sell" ? "sell" : "purchase");
  }, [requestedMode]);

  return (
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1, backgroundColor: "#FAF7F0" }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 28 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: "100%", maxWidth: contentWidth, alignSelf: "center" }}>
          <ModuleHeader
            title="Marketplace"
            subtitle={mode === "purchase"
              ? t("Explore poultry supplies in one convenient place.")
              : t("Manage products you would like to offer to the community.")}
          />

          <View
            style={{
              flexDirection: "row",
              alignSelf: "flex-start",
              marginBottom: 16,
              borderRadius: 14,
              backgroundColor: "#E2E8F0",
              padding: 4,
            }}
          >
            {(["purchase", "sell"] as const).map((item) => {
              const selected = mode === item;
              return (
                <Pressable
                  key={item}
                  accessibilityLabel={t(item === "purchase" ? "Purchase products" : "Sell products")}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  className="cursor-pointer"
                  onPress={() => {
                    setMode(item);
                    setQuery("");
                    setCategory("All");
                  }}
                  style={{
                    minWidth: 112,
                    minHeight: 40,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 11,
                    backgroundColor: selected ? "#FFFFFF" : "transparent",
                  }}
                >
                  <Text
                    style={{
                      color: selected ? "#14532D" : "#64748B",
                      fontFamily: selected ? "Poppins_600SemiBold" : "Poppins_500Medium",
                      fontSize: 12,
                      textTransform: "capitalize",
                    }}
                  >
                    {t(item)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {mode === "purchase" ? (
            <>
          <View
            style={{
              height: 52,
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#E2E8F0",
              borderRadius: 16,
              backgroundColor: "#FFFFFF",
              paddingHorizontal: 15,
            }}
          >
            <Ionicons color="#64748B" name="search-outline" size={19} />
            <TextInput
              accessibilityLabel={t("Search marketplace")}
              autoCapitalize="none"
              onChangeText={setQuery}
              placeholder={t("Search products")}
              placeholderTextColor="#94A3B8"
              returnKeyType="search"
              style={{
                flex: 1,
                marginLeft: 10,
                color: "#0F172A",
                fontFamily: "Poppins_400Regular",
                fontSize: 13,
              }}
              value={query}
            />
            {query ? (
              <Pressable
                accessibilityLabel={t("Clear search")}
                accessibilityRole="button"
                onPress={() => setQuery("")}
                style={{ padding: 5 }}
              >
                <Ionicons color="#64748B" name="close-circle" size={18} />
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            horizontal
            contentContainerStyle={{ gap: 9, paddingVertical: 18 }}
            showsHorizontalScrollIndicator={false}
          >
            {CATEGORIES.map((item) => {
              const selected = item === category;
              return (
                <Pressable
                  key={item}
                  accessibilityLabel={`${t("Filter by")} ${t(item)}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  className="cursor-pointer"
                  onPress={() => setCategory(item)}
                  style={{
                    minHeight: 38,
                    justifyContent: "center",
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: selected ? "#14532D" : "#E2E8F0",
                    backgroundColor: selected ? "#14532D" : "#FFFFFF",
                    paddingHorizontal: 16,
                  }}
                >
                  <Text
                    style={{
                      color: selected ? "#FFFFFF" : "#475569",
                      fontFamily: selected ? "Poppins_600SemiBold" : "Poppins_500Medium",
                      fontSize: 12,
                    }}
                  >
                    {t(item)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
            </>
          ) : null}

          {isDemoSession && mode === "sell" && demoUser?.role === "poultry_owner" ? (
            <>
              <View style={{ marginBottom: 11, flexDirection: "row", alignItems: "center", borderRadius: 13, backgroundColor: "#FFFBEB", padding: 11 }}>
                <Ionicons color="#A16207" name="information-circle-outline" size={17} />
                <Text style={{ flex: 1, marginLeft: 7, color: "#854D0E", fontFamily: "Poppins_400Regular", fontSize: 10, lineHeight: 16 }}>
                  {t("Demo seller listings · sample quantities and rates for preview only")}
                </Text>
              </View>
              <View style={{ gap: 12 }}>
                {DEMO_SELLER_LISTINGS.map((listing) => (
                  <View key={listing.name} style={{ borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 18, backgroundColor: "#FFFFFF", padding: 16 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <View style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#EAF8EC" }}>
                        <Ionicons color="#14532D" name={listing.category === "Eggs" ? "egg-outline" : "paw-outline"} size={21} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 11 }}>
                        <Text style={{ color: "#0B2A5B", fontFamily: "Poppins_600SemiBold", fontSize: 13 }}>{t(listing.name)}</Text>
                        <Text style={{ marginTop: 2, color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 10 }}>{t(listing.category)} · {t(listing.status)}</Text>
                      </View>
                      <Text style={{ color: "#15803D", fontFamily: "Poppins_600SemiBold", fontSize: 9 }}>{t(listing.status)}</Text>
                    </View>
                    <View style={{ marginTop: 13, flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                      <View>
                        <Text style={{ color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 9 }}>{t("Asking rate")}</Text>
                        <Text style={{ marginTop: 3, color: "#0F172A", fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>₹{listing.price} {t(listing.unit)}</Text>
                      </View>
                      <View>
                        <Text style={{ color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 9 }}>{t("Available")}</Text>
                        <Text style={{ marginTop: 3, color: "#0F172A", fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>{t(listing.available)}</Text>
                      </View>
                      <View>
                        <Text style={{ color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 9 }}>{t("Recent sales")}</Text>
                        <Text style={{ marginTop: 3, color: "#0F172A", fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>{t(listing.sold)}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : isDemoSession && mode === "purchase" ? (
            <>
              <View style={{ marginBottom: 11, flexDirection: "row", alignItems: "center", borderRadius: 13, backgroundColor: "#FFFBEB", padding: 11 }}>
                <Ionicons color="#A16207" name="information-circle-outline" size={17} />
                <Text style={{ flex: 1, marginLeft: 7, color: "#854D0E", fontFamily: "Poppins_400Regular", fontSize: 10, lineHeight: 16 }}>
                  {t("Demo marketplace · sample products and prices for preview only")}
                </Text>
              </View>
              {visibleProducts.length ? (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                  {visibleProducts.map((product) => (
                    <View key={product.id} style={{ width: width >= 760 ? "48.8%" : "100%", overflow: "hidden", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 20, backgroundColor: "#FFFFFF" }}>
                      <View style={{ height: 118, alignItems: "center", justifyContent: "center", backgroundColor: product.background }}>
                        <View style={{ width: 62, height: 62, alignItems: "center", justifyContent: "center", borderRadius: 22, backgroundColor: "rgba(255,255,255,0.78)" }}>
                          <Ionicons color={product.color} name={product.icon} size={30} />
                        </View>
                        <View style={{ position: "absolute", top: 12, right: 12, borderRadius: 999, backgroundColor: "#FFFFFF", paddingHorizontal: 9, paddingVertical: 5 }}>
                          <Text style={{ color: "#166534", fontFamily: "Poppins_600SemiBold", fontSize: 9 }}>{t(product.stock)}</Text>
                        </View>
                      </View>
                      <View style={{ padding: 15 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                          <Text style={{ color: product.color, fontFamily: "Poppins_600SemiBold", fontSize: 10 }}>{t(product.category).toUpperCase()}</Text>
                          <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Ionicons color="#E5A100" name="star" size={13} />
                            <Text style={{ marginLeft: 3, color: "#475569", fontFamily: "Poppins_500Medium", fontSize: 10 }}>{product.rating}</Text>
                          </View>
                        </View>
                        <Text numberOfLines={1} style={{ marginTop: 6, color: "#0B2A5B", fontFamily: "Poppins_600SemiBold", fontSize: 14 }}>{t(product.name)}</Text>
                        <Text numberOfLines={2} style={{ minHeight: 34, marginTop: 4, color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 10, lineHeight: 16 }}>{t(product.description)}</Text>
                        <View style={{ marginTop: 12, flexDirection: "row", alignItems: "baseline" }}>
                          <Text style={{ color: "#0F172A", fontFamily: "Poppins_700Bold", fontSize: 18 }}>₹{product.price.toLocaleString("en-IN")}</Text>
                          <Text style={{ marginLeft: 5, color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 10 }}>{t(product.unit)}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <EmptyState icon="search-outline" title="No matching products" description="Try another search or category." />
              )}
            </>
          ) : (
            <EmptyState
              icon={mode === "sell" ? "storefront-outline" : query ? "search-outline" : "basket-outline"}
              title={
                mode === "sell"
                  ? "Seller listings are not available yet"
                  : query
                    ? "No matching products yet"
                    : "The marketplace is getting ready"
              }
              description={
                mode === "sell"
                  ? "Product listing and seller tools will be available when marketplace services are connected."
                  : query
                    ? "Products matching your search will appear here when the catalog is available."
                    : "Products, prices, and availability will appear here once the marketplace catalog is connected."
              }
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
