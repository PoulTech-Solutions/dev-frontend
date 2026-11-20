import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CartSheet } from "../../../components/marketplace/CartSheet";
import { MarketProductCard } from "../../../components/marketplace/MarketProductCard";
import { EmptyState } from "../../../components/ui/EmptyState";
import { FormModal } from "../../../components/ui/FormModal";
import { ModuleHeader } from "../../../components/ui/ModuleHeader";
import { PictureSymbol, type PictureName } from "../../../components/ui/PictureSymbol";
import { pageToneColor } from "../../../components/ui/SectionTitle";
import { useAppLayout } from "../../../hooks/useAppLayout";
import { useAppTheme } from "../../../hooks/useAppTheme";
import { addProduct, loadProducts, type SavedProduct } from "../../../services/localRecords";
import { pickImage } from "../../../services/pickImage";
import { useAuthStore } from "../../../store/useAuthStore";
import {
  cartItemCount,
  useCartStore,
  type MarketProduct,
} from "../../../store/useCartStore";
import { useSubscriptionStore } from "../../../store/useSubscriptionStore";
import { DEMO_PRODUCTS } from "../../../utils/demoData";
import { useLanguage } from "../../../utils/i18n";

const CATEGORIES = ["All", "Chicks", "Feed", "Equipment"] as const;
type Category = (typeof CATEGORIES)[number];

export default function MarketplaceFeedScreen() {
  const router = useRouter();
  const { width } = useAppLayout();
  const { colors, isDark } = useAppTheme();
  const pageBg = pageToneColor("blue", isDark, colors.page);
  const { t, n } = useLanguage();
  const { mode: requestedMode } = useLocalSearchParams<{ mode?: string }>();
  const demoUser = useAuthStore((state) => state.user);
  const planId = useSubscriptionStore((state) => state.planId);
  const hydratePlan = useSubscriptionStore((state) => state.hydrate);
  const canSell = planId === "advance";

  const hydrateCart = useCartStore((state) => state.hydrate);
  const lines = useCartStore((state) => state.lines);
  const orders = useCartStore((state) => state.orders);
  const addItem = useCartStore((state) => state.addItem);
  const setQuantity = useCartStore((state) => state.setQuantity);

  const [listings, setListings] = useState<SavedProduct[]>([]);
  const [productOpen, setProductOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [detail, setDetail] = useState<MarketProduct | null>(null);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [dealerName, setDealerName] = useState("");
  const [dealerPhone, setDealerPhone] = useState("");
  const [productImage, setProductImage] = useState("");
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<"purchase" | "sell">(requestedMode === "sell" ? "sell" : "purchase");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("All");

  const contentWidth = Math.min(width - 36, 1180);
  const isWide = width >= 900;
  const isTablet = width >= 640;
  const columns = isWide ? 4 : isTablet ? 3 : 2;
  const cardWidth = `${100 / columns}%` as const;

  const catalog = useMemo(
    () =>
      DEMO_PRODUCTS.map(
        (product): MarketProduct => ({
          id: product.id,
          name: product.name,
          category: product.category,
          description: product.description,
          price: product.price,
          unit: product.unit,
          rating: product.rating,
          stock: product.stock,
          picture: product.picture,
          dealerName: product.dealerName,
          dealerPhone: product.dealerPhone,
        }),
      ),
    [],
  );

  const visibleProducts = catalog.filter((product) => {
    const matchesCategory = category === "All" || product.category === category;
    const searchText = `${t(product.name)} ${t(product.category)} ${t(product.description)} ${product.dealerName}`.toLowerCase();
    return matchesCategory && searchText.includes(query.toLowerCase().trim());
  });

  const qtyById = useMemo(() => {
    const map: Record<string, number> = {};
    lines.forEach((line) => {
      map[line.productId] = line.quantity;
    });
    return map;
  }, [lines]);

  const itemCount = cartItemCount(lines);
  const showFloatingCart = mode === "purchase" && itemCount > 0;

  useEffect(() => {
    setMode(requestedMode === "sell" ? "sell" : "purchase");
  }, [requestedMode]);

  useEffect(() => {
    if (!demoUser?.id) return;
    void hydratePlan(demoUser.id);
    void hydrateCart(demoUser.id);
    void loadProducts(demoUser.id).then(setListings).catch(() => setNote("Could not load products."));
  }, [demoUser?.id, hydratePlan, hydrateCart]);

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
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1, backgroundColor: pageBg }}>
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 18,
            paddingTop: 18,
            paddingBottom: showFloatingCart ? 96 : 28,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ width: "100%", maxWidth: contentWidth, alignSelf: "center" }}>
            <ModuleHeader
              title="Marketplace"
              subtitle={
                mode === "purchase"
                  ? t("Order poultry supplies — add to cart and checkout.")
                  : t("Manage products you would like to offer to the community.")
              }
              tone="blue"
              trailing={
                mode === "purchase" ? (
                  <Pressable
                    accessibilityLabel={t("Open cart")}
                    onPress={() => setCartOpen(true)}
                    style={{
                      minHeight: 40,
                      flexDirection: "row",
                      alignItems: "center",
                      borderRadius: 12,
                      backgroundColor: itemCount ? colors.accent : colors.card,
                      borderWidth: 1,
                      borderColor: itemCount ? colors.accent : colors.line,
                      paddingHorizontal: 12,
                      gap: 6,
                    }}
                  >
                    <Ionicons color={itemCount ? "#FFFFFF" : colors.ink} name="cart-outline" size={18} />
                    <Text style={{ color: itemCount ? "#FFFFFF" : colors.ink, fontFamily: "Poppins_700Bold", fontSize: 12 }}>
                      {itemCount ? n(itemCount) : t("Cart")}
                    </Text>
                  </Pressable>
                ) : null
              }
            />

            <View
              style={{
                flexDirection: "row",
                alignSelf: "flex-start",
                marginBottom: 16,
                borderRadius: 14,
                backgroundColor: colors.line,
                padding: 4,
              }}
            >
              {(["purchase", "sell"] as const).map((item) => {
                const selected = mode === item;
                return (
                  <Pressable
                    key={item}
                    accessibilityLabel={t(item === "purchase" ? "Purchase products" : "Sell products")}
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
                      backgroundColor: selected ? colors.card : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        color: selected ? colors.accent : colors.muted,
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
                  <Ionicons color={colors.muted} name="search-outline" size={19} />
                  <TextInput
                    accessibilityLabel={t("Search marketplace")}
                    autoCapitalize="none"
                    onChangeText={setQuery}
                    placeholder={t("Search products, feed, chicks…")}
                    placeholderTextColor="#94A3B8"
                    returnKeyType="search"
                    style={{ flex: 1, marginLeft: 10, color: colors.ink, fontFamily: "Poppins_400Regular", fontSize: 13 }}
                    value={query}
                  />
                  {query ? (
                    <Pressable onPress={() => setQuery("")} style={{ padding: 5 }}>
                      <Ionicons color={colors.muted} name="close-circle" size={18} />
                    </Pressable>
                  ) : null}
                </View>

                <ScrollView horizontal contentContainerStyle={{ gap: 9, paddingVertical: 16 }} showsHorizontalScrollIndicator={false}>
                  {CATEGORIES.map((item) => {
                    const selected = item === category;
                    return (
                      <Pressable
                        key={item}
                        onPress={() => setCategory(item)}
                        style={{
                          minHeight: 38,
                          justifyContent: "center",
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: selected ? colors.accent : colors.line,
                          backgroundColor: selected ? colors.accent : colors.card,
                          paddingHorizontal: 16,
                        }}
                      >
                        <Text
                          style={{
                            color: selected ? "#FFFFFF" : colors.muted,
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

                {orders.length ? (
                  <Pressable
                    onPress={() => setCartOpen(true)}
                    style={{
                      marginBottom: 14,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: colors.line,
                      backgroundColor: colors.card,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons color={colors.accent} name="receipt-outline" size={18} />
                    <Text style={{ marginLeft: 8, flex: 1, color: colors.ink, fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>
                      {n(orders.length)} {t("recent orders")} · {t("Last")}: ₹{n(orders[0]?.total ?? 0)}
                    </Text>
                    <Ionicons color={colors.muted} name="chevron-forward" size={16} />
                  </Pressable>
                ) : null}

                {visibleProducts.length ? (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 }}>
                    {visibleProducts.map((product) => (
                      <View key={product.id} style={{ width: cardWidth, padding: 6 }}>
                        <MarketProductCard
                          compact={!isTablet}
                          product={product}
                          quantityInCart={qtyById[product.id] ?? 0}
                          onAdd={() => addItem(product, 1)}
                          onIncrease={() => setQuantity(product.id, (qtyById[product.id] ?? 0) + 1)}
                          onDecrease={() => setQuantity(product.id, (qtyById[product.id] ?? 0) - 1)}
                          onOpen={() => setDetail(product)}
                        />
                      </View>
                    ))}
                  </View>
                ) : (
                  <EmptyState icon="search-outline" title="No matching products" description="Try another search or category." />
                )}
              </>
            ) : demoUser ? (
              canSell ? (
                <>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                    <Text style={{ flex: 1, color: colors.primary, fontFamily: "Poppins_700Bold", fontSize: 18 }}>{t("Your listings")}</Text>
                    <Pressable
                      accessibilityLabel={t("Add a product")}
                      onPress={() => setProductOpen(true)}
                      style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: "#15803D" }}
                    >
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
                            <Text style={{ color: colors.primary, fontFamily: "Poppins_700Bold", fontSize: 16 }}>{t(listing.name)}</Text>
                            <Text style={{ marginTop: 4, color: colors.ink, fontFamily: "Poppins_700Bold", fontSize: 18 }}>₹{n(listing.price)}</Text>
                            <Text style={{ marginTop: 6, color: colors.muted, fontFamily: "Poppins_500Medium", fontSize: 13 }}>{listing.dealerName}</Text>
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
            ) : (
              <EmptyState icon="storefront-outline" title="Seller listings are not available yet" description="Sign in to manage seller listings." />
            )}
          </View>
        </ScrollView>

        {showFloatingCart ? (
          <Pressable
            accessibilityLabel={t("Open cart")}
            onPress={() => setCartOpen(true)}
            style={{
              position: "absolute",
              right: 20,
              bottom: Platform.OS === "web" ? 24 : 20,
              width: 58,
              height: 58,
              borderRadius: 29,
              backgroundColor: colors.accent,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#0F172A",
              shadowOpacity: 0.25,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 8,
            }}
          >
            <Ionicons color="#FFFFFF" name="cart" size={24} />
            <View
              style={{
                position: "absolute",
                top: -2,
                right: -2,
                minWidth: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: "#0F172A",
                borderWidth: 2,
                borderColor: "#FFFFFF",
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 4,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontFamily: "Poppins_700Bold", fontSize: 10 }}>{n(itemCount)}</Text>
            </View>
          </Pressable>
        ) : null}
      </View>

      <CartSheet defaultPhone={demoUser?.phone ?? ""} onClose={() => setCartOpen(false)} visible={cartOpen} />

      <FormModal onClose={() => setDetail(null)} size="large" title={detail ? detail.name : "Product"} visible={Boolean(detail)}>
        {detail ? (
          <View style={{ gap: 12 }}>
            <View style={{ height: 160, borderRadius: 16, backgroundColor: colors.cardSoft, alignItems: "center", justifyContent: "center" }}>
              <PictureSymbol name={detail.picture as PictureName} size={120} />
            </View>
            <Text style={{ color: colors.muted, fontFamily: "Poppins_500Medium", fontSize: 12 }}>{t(detail.category)}</Text>
            <Text style={{ color: colors.ink, fontFamily: "Poppins_400Regular", fontSize: 13, lineHeight: 20 }}>{t(detail.description)}</Text>
            <Text style={{ color: colors.ink, fontFamily: "Poppins_700Bold", fontSize: 22 }}>
              ₹{n(detail.price)} <Text style={{ color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 13 }}>{t(detail.unit)}</Text>
            </Text>
            <Text style={{ color: colors.ink, fontFamily: "Poppins_600SemiBold", fontSize: 14 }}>{detail.dealerName}</Text>
            <Pressable onPress={() => void Linking.openURL(`tel:${detail.dealerPhone}`)}>
              <Text style={{ color: "#0369A1", fontFamily: "Poppins_600SemiBold", fontSize: 14 }}>{n(detail.dealerPhone)}</Text>
            </Pressable>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
              <Pressable
                onPress={() => {
                  addItem(detail, 1);
                  setDetail(null);
                }}
                style={{ flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: colors.accent }}
              >
                <Text style={{ color: "#FFFFFF", fontFamily: "Poppins_700Bold", fontSize: 14 }}>{t("Add to cart")}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  addItem(detail, 1);
                  setDetail(null);
                  setCartOpen(true);
                }}
                style={{
                  flex: 1,
                  minHeight: 48,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.accent,
                  backgroundColor: "#F0FDF4",
                }}
              >
                <Text style={{ color: colors.accent, fontFamily: "Poppins_700Bold", fontSize: 14 }}>{t("Buy now")}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </FormModal>

      <FormModal onClose={() => setProductOpen(false)} title="Add a product" visible={productOpen}>
        <View style={{ gap: 10 }}>
          <Pressable
            accessibilityLabel={t("Add photo")}
            onPress={() =>
              void pickImage()
                .then((uri) => uri && setProductImage(uri))
                .catch((error: unknown) => setNote(error instanceof Error ? error.message : "Choose a product photo."))
            }
            style={{
              minHeight: 120,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 16,
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: "#94A3B8",
              backgroundColor: colors.cardSoft,
            }}
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
          <TextInput
            onChangeText={setProductName}
            placeholder={t("Product name")}
            placeholderTextColor="#94A3B8"
            style={{ minHeight: 48, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 12, color: colors.ink, backgroundColor: colors.cardSoft }}
            value={productName}
          />
          <TextInput
            keyboardType="decimal-pad"
            onChangeText={setProductPrice}
            placeholder={t("Price")}
            placeholderTextColor="#94A3B8"
            style={{ minHeight: 48, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 12, color: colors.ink, backgroundColor: colors.cardSoft }}
            value={productPrice}
          />
          <TextInput
            onChangeText={setDealerName}
            placeholder={t("Dealer name")}
            placeholderTextColor="#94A3B8"
            style={{ minHeight: 48, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 12, color: colors.ink, backgroundColor: colors.cardSoft }}
            value={dealerName}
          />
          <TextInput
            keyboardType="phone-pad"
            onChangeText={setDealerPhone}
            placeholder={t("Dealer phone")}
            placeholderTextColor="#94A3B8"
            style={{ minHeight: 48, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 12, color: colors.ink, backgroundColor: colors.cardSoft }}
            value={dealerPhone}
          />
          {note ? <Text style={{ color: "#B91C1C", fontFamily: "Poppins_400Regular", fontSize: 12 }}>{t(note)}</Text> : null}
          <Pressable onPress={() => void saveProduct()} style={{ minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#15803D" }}>
            <Text style={{ color: "#FFFFFF", fontFamily: "Poppins_600SemiBold", fontSize: 15 }}>{t("Save product")}</Text>
          </Pressable>
        </View>
      </FormModal>
    </SafeAreaView>
  );
}
