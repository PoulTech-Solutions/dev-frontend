import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "../../../components/ui/EmptyState";
import { FormModal } from "../../../components/ui/FormModal";
import { ModuleHeader } from "../../../components/ui/ModuleHeader";
import { PictureSymbol, type PictureName } from "../../../components/ui/PictureSymbol";
import { useAppLayout } from "../../../hooks/useAppLayout";
import { useAppTheme } from "../../../hooks/useAppTheme";
import { addProduct, loadProducts, type SavedProduct } from "../../../services/localRecords";
import { pickImage } from "../../../services/pickImage";
import { useAuthStore } from "../../../store/useAuthStore";
import { useSubscriptionStore } from "../../../store/useSubscriptionStore";
import { DEMO_PRODUCTS } from "../../../utils/demoData";
import { useLanguage } from "../../../utils/i18n";

const CATEGORIES = ["All", "Chicks", "Feed", "Equipment"] as const;
type Category = (typeof CATEGORIES)[number];

export default function MarketplaceFeedScreen() {
  const router = useRouter();
  const { width } = useAppLayout();
  const { colors } = useAppTheme();
  const { t, n } = useLanguage();
  const { mode: requestedMode } = useLocalSearchParams<{ mode?: string }>();
  const demoUser = useAuthStore((state) => state.user);
  const planId = useSubscriptionStore((state) => state.planId);
  const hydratePlan = useSubscriptionStore((state) => state.hydrate);
  const canSell = planId === "advance";
  const [listings, setListings] = useState<SavedProduct[]>([]);
  const [productOpen, setProductOpen] = useState(false);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [dealerName, setDealerName] = useState("");
  const [dealerPhone, setDealerPhone] = useState("");
  const [productImage, setProductImage] = useState("");
  const [note, setNote] = useState("");
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

  useEffect(() => {
    if (!demoUser?.id) return;
    void hydratePlan(demoUser.id);
    void loadProducts(demoUser.id).then(setListings).catch(() => setNote("Could not load products."));
  }, [demoUser?.id, hydratePlan]);

  const saveProduct = async () => {
    if (!demoUser?.id) return;
    const price = Number(productPrice);
    if (!productName.trim() || !Number.isFinite(price) || price <= 0) {
      setNote("Enter a product name and price.");
      return;
    }
    if (!productImage) {
      setNote("Choose a product photo.");
      return;
    }
    const product: SavedProduct = {
      id: `product-${Date.now()}`,
      userId: demoUser.id,
      name: productName.trim(),
      price,
      imageUri: productImage,
      dealerName: dealerName.trim(),
      dealerPhone: dealerPhone.trim(),
      source: "user",
    };
    await addProduct(product);
    setListings((current) => [...current, product]);
    setProductName("");
    setProductPrice("");
    setDealerName("");
    setDealerPhone("");
    setProductImage("");
    setNote("");
    setProductOpen(false);
  };

  return (
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1, backgroundColor: colors.page }}>
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
              borderColor: colors.line,
              borderRadius: 16,
              backgroundColor: colors.card,
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

          {mode === "sell" && demoUser ? (
            canSell ? (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                  <Text style={{ flex: 1, color: "#0B2A5B", fontFamily: "Poppins_700Bold", fontSize: 18 }}>{t("Your listings")}</Text>
                  <Pressable accessibilityLabel={t("Add a product")} onPress={() => setProductOpen(true)} style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: "#15803D" }}>
                    <Ionicons color="#FFFFFF" name="add" size={28} />
                  </Pressable>
                </View>
                <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 }}>
                  {listings.map((listing) => (
                    <View key={listing.id} style={{ width: width >= 720 ? "50%" : "100%", padding: 6 }}>
                      <View style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 18, backgroundColor: colors.card, overflow: "hidden" }}>
                        {listing.imageUri ? (
                          <Image contentFit="cover" source={{ uri: listing.imageUri }} style={{ width: "100%", height: 140 }} />
                        ) : (
                          <View style={{ height: 140, alignItems: "center", justifyContent: "center", backgroundColor: colors.cardSoft }}>
                            <PictureSymbol name={listing.name.includes("Broiler") ? "chicken" : "egg"} size={84} />
                          </View>
                        )}
                        <View style={{ padding: 12 }}>
                          <Text style={{ color: "#0B2A5B", fontFamily: "Poppins_700Bold", fontSize: 16 }}>{t(listing.name)}</Text>
                          <Text style={{ marginTop: 4, color: "#0F172A", fontFamily: "Poppins_700Bold", fontSize: 18 }}>₹{n(listing.price)}</Text>
                          <Text style={{ marginTop: 6, color: "#64748B", fontFamily: "Poppins_500Medium", fontSize: 13 }}>{listing.dealerName}</Text>
                          <Text style={{ marginTop: 2, color: "#0369A1", fontFamily: "Poppins_600SemiBold", fontSize: 13 }}>{n(listing.dealerPhone)}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <View style={{ borderRadius: 18, backgroundColor: "#DCFCE7", padding: 18 }}>
                <Text style={{ color: "#14532D", fontFamily: "Poppins_700Bold", fontSize: 18 }}>{t("Advance plan needed")}</Text>
                <Text style={{ marginTop: 6, color: "#166534", fontFamily: "Poppins_400Regular", fontSize: 14, lineHeight: 21 }}>
                  {t("Selling on the marketplace is included in the Advance plan. Upgrade from your profile.")}
                </Text>
                <Pressable
                  accessibilityLabel={t("Upgrade to Advance")}
                  accessibilityRole="button"
                  className="cursor-pointer"
                  onPress={() => router.push("/(tabs)/profile")}
                  style={{
                    minHeight: 46,
                    marginTop: 14,
                    alignSelf: "flex-start",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 12,
                    backgroundColor: "#15803D",
                    paddingHorizontal: 16,
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontFamily: "Poppins_600SemiBold", fontSize: 14 }}>{t("Upgrade to Advance")}</Text>
                </Pressable>
              </View>
            )
          ) : mode === "purchase" ? (
            <>
              {visibleProducts.length ? (
                <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 }}>
                  {visibleProducts.map((product) => (
                    <View key={product.id} style={{ width: width >= 720 ? "50%" : "100%", padding: 6 }}>
                      <View style={{ overflow: "hidden", borderWidth: 1, borderColor: colors.line, borderRadius: 20, backgroundColor: colors.card }}>
                        <View style={{ height: 150, alignItems: "center", justifyContent: "center", backgroundColor: colors.cardSoft }}>
                          <PictureSymbol name={product.picture as PictureName} size={96} />
                        </View>
                        <View style={{ padding: 14 }}>
                          <Text style={{ color: "#64748B", fontFamily: "Poppins_500Medium", fontSize: 12 }}>{t(product.category)}</Text>
                          <Text style={{ marginTop: 4, color: "#0B2A5B", fontFamily: "Poppins_700Bold", fontSize: 16 }}>{t(product.name)}</Text>
                          <Text style={{ marginTop: 6, color: "#0F172A", fontFamily: "Poppins_700Bold", fontSize: 18 }}>₹{n(product.price)} <Text style={{ color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 12 }}>{t(product.unit)}</Text></Text>
                          <Text style={{ marginTop: 8, color: "#0F172A", fontFamily: "Poppins_600SemiBold", fontSize: 14 }}>{product.dealerName}</Text>
                          <Pressable onPress={() => void Linking.openURL(`tel:${product.dealerPhone}`)}>
                            <Text style={{ marginTop: 2, color: "#0369A1", fontFamily: "Poppins_600SemiBold", fontSize: 14 }}>{n(product.dealerPhone)}</Text>
                          </Pressable>
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
      <FormModal onClose={() => setProductOpen(false)} title="Add a product" visible={productOpen}>
        <View style={{ gap: 10 }}>
          <Pressable
            accessibilityLabel={t("Add photo")}
            onPress={() => void pickImage().then((uri) => uri && setProductImage(uri)).catch((error: unknown) => setNote(error instanceof Error ? error.message : "Choose a product photo."))}
            style={{ minHeight: 120, alignItems: "center", justifyContent: "center", borderRadius: 16, borderWidth: 1, borderStyle: "dashed", borderColor: "#94A3B8", backgroundColor: colors.cardSoft }}
          >
            {productImage ? (
              <Image contentFit="cover" source={{ uri: productImage }} style={{ width: "100%", height: 140, borderRadius: 16 }} />
            ) : (
              <>
                <Ionicons color="#15803D" name="camera" size={28} />
                <Text style={{ marginTop: 6, color: "#15803D", fontFamily: "Poppins_600SemiBold", fontSize: 14 }}>{t("Add photo")}</Text>
              </>
            )}
          </Pressable>
          <TextInput onChangeText={setProductName} placeholder={t("Product name")} placeholderTextColor="#94A3B8" style={{ minHeight: 48, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 12 }} value={productName} />
          <TextInput keyboardType="decimal-pad" onChangeText={setProductPrice} placeholder={t("Price")} placeholderTextColor="#94A3B8" style={{ minHeight: 48, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 12 }} value={productPrice} />
          <TextInput onChangeText={setDealerName} placeholder={t("Dealer name")} placeholderTextColor="#94A3B8" style={{ minHeight: 48, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 12 }} value={dealerName} />
          <TextInput keyboardType="phone-pad" onChangeText={setDealerPhone} placeholder={t("Dealer phone")} placeholderTextColor="#94A3B8" style={{ minHeight: 48, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 12 }} value={dealerPhone} />
          {note ? <Text style={{ color: "#B91C1C", fontFamily: "Poppins_400Regular", fontSize: 12 }}>{t(note)}</Text> : null}
          <Pressable onPress={() => void saveProduct()} style={{ minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#15803D" }}>
            <Text style={{ color: "#FFFFFF", fontFamily: "Poppins_600SemiBold", fontSize: 15 }}>{t("Save product")}</Text>
          </Pressable>
        </View>
      </FormModal>
    </SafeAreaView>
  );
}
