import { Image, Pressable, Text, View } from "react-native";
import { useLanguage } from "../../utils/i18n";

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
}

interface ProductCardProps {
  product: Product;
  onPress?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

export function ProductCard({
  product,
  onPress,
  onAddToCart,
}: ProductCardProps) {
  const { t } = useLanguage();
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
      onPress={() => onPress?.(product)}
    >
      <Image
        accessibilityLabel={t(product.name)}
        className="h-40 w-full bg-slate-100"
        resizeMode="cover"
        source={{ uri: product.imageUrl }}
      />
      <View className="p-4">
        <Text className="text-xs font-semibold uppercase tracking-wide text-brand-blue">
          {t(product.category)}
        </Text>
        <Text
          className="mt-1 text-base font-semibold text-brand-navy"
          numberOfLines={1}
        >
          {t(product.name)}
        </Text>
        <View className="mt-3 flex-row items-center justify-between">
          <Text className="text-lg font-bold text-brand-navy">
            ₹{product.price.toFixed(2)}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t("Add")} ${t(product.name)} ${t("to cart")}`}
            className="rounded-xl bg-brand-green px-4 py-2"
            onPress={(event) => {
              event.stopPropagation();
              onAddToCart?.(product);
            }}
          >
            <Text className="font-semibold text-white">{t("Add")}</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}
