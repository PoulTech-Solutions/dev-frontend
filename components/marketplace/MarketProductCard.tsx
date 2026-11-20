import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { useAppTheme } from "../../hooks/useAppTheme";
import type { MarketProduct } from "../../store/useCartStore";
import { useLanguage } from "../../utils/i18n";
import { PictureSymbol, type PictureName } from "../ui/PictureSymbol";

type Props = {
  product: MarketProduct;
  quantityInCart: number;
  compact?: boolean;
  onAdd: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
  onOpen: () => void;
};

export function MarketProductCard({
  product,
  quantityInCart,
  compact = false,
  onAdd,
  onIncrease,
  onDecrease,
  onOpen,
}: Props) {
  const { colors } = useAppTheme();
  const { t, n } = useLanguage();
  const imageSize = compact ? 72 : 112;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onOpen}
      style={{
        flex: 1,
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: 18,
        backgroundColor: colors.card,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height: compact ? 108 : 148,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.cardSoft,
        }}
      >
        <PictureSymbol name={product.picture as PictureName} size={imageSize} />
        <View
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            borderRadius: 8,
            backgroundColor: "rgba(15,23,42,0.72)",
            paddingHorizontal: 8,
            paddingVertical: 4,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontFamily: "Poppins_600SemiBold", fontSize: 10 }}>{t(product.category)}</Text>
        </View>
      </View>

      <View style={{ padding: compact ? 10 : 12, gap: 4 }}>
        <Text numberOfLines={2} style={{ color: colors.primary, fontFamily: "Poppins_700Bold", fontSize: compact ? 13 : 15, minHeight: compact ? 36 : 42 }}>
          {t(product.name)}
        </Text>
        <Text numberOfLines={2} style={{ color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 11, lineHeight: 16 }}>
          {t(product.description)}
        </Text>

        <View style={{ marginTop: 4, flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons color="#CA8A04" name="star" size={12} />
          <Text style={{ color: colors.ink, fontFamily: "Poppins_600SemiBold", fontSize: 11 }}>{product.rating}</Text>
          <Text style={{ color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 11 }}>· {t(product.stock)}</Text>
        </View>

        <Text style={{ marginTop: 2, color: colors.muted, fontFamily: "Poppins_500Medium", fontSize: 11 }} numberOfLines={1}>
          {product.dealerName}
        </Text>

        <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: colors.ink, fontFamily: "Poppins_700Bold", fontSize: compact ? 15 : 17 }}>₹{n(product.price)}</Text>
            <Text style={{ color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 10 }}>{t(product.unit)}</Text>
          </View>

          {quantityInCart > 0 ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderRadius: 12,
                backgroundColor: colors.accent,
                overflow: "hidden",
              }}
            >
              <Pressable
                accessibilityLabel={t("Decrease quantity")}
                hitSlop={6}
                onPress={(event) => {
                  event.stopPropagation?.();
                  onDecrease();
                }}
                style={{ width: 34, height: 34, alignItems: "center", justifyContent: "center" }}
              >
                <Ionicons color="#FFFFFF" name="remove" size={18} />
              </Pressable>
              <Text style={{ minWidth: 22, textAlign: "center", color: "#FFFFFF", fontFamily: "Poppins_700Bold", fontSize: 13 }}>
                {n(quantityInCart)}
              </Text>
              <Pressable
                accessibilityLabel={t("Increase quantity")}
                hitSlop={6}
                onPress={(event) => {
                  event.stopPropagation?.();
                  onIncrease();
                }}
                style={{ width: 34, height: 34, alignItems: "center", justifyContent: "center" }}
              >
                <Ionicons color="#FFFFFF" name="add" size={18} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityLabel={`${t("Add")} ${t(product.name)}`}
              onPress={(event) => {
                event.stopPropagation?.();
                onAdd();
              }}
              style={{
                minHeight: 34,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: colors.accent,
                backgroundColor: "#F0FDF4",
                paddingHorizontal: 12,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: colors.accent, fontFamily: "Poppins_700Bold", fontSize: 12 }}>{t("ADD")}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}
