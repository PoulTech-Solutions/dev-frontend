import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { FormModal } from "../ui/FormModal";
import { PictureSymbol, type PictureName } from "../ui/PictureSymbol";
import { useAppTheme } from "../../hooks/useAppTheme";
import { cartItemCount, cartTotal, useCartStore } from "../../store/useCartStore";
import { useLanguage } from "../../utils/i18n";

type Props = {
  visible: boolean;
  onClose: () => void;
  defaultPhone?: string;
};

export function CartSheet({ visible, onClose, defaultPhone = "" }: Props) {
  const { colors } = useAppTheme();
  const { t, n } = useLanguage();
  const lines = useCartStore((state) => state.lines);
  const orders = useCartStore((state) => state.orders);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const placeOrder = useCartStore((state) => state.placeOrder);
  const [phone, setPhone] = useState(defaultPhone);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [placedId, setPlacedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const total = cartTotal(lines);
  const count = cartItemCount(lines);

  const handlePlace = async () => {
    if (!lines.length) return;
    if (phone.trim().length < 10) {
      setMessage(t("Enter a valid 10-digit phone for delivery updates."));
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const order = await placeOrder({ phone, deliveryNote: note });
      if (order) setPlacedId(order.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormModal
      onClose={() => {
        setPlacedId(null);
        setMessage("");
        onClose();
      }}
      size="large"
      title={placedId ? "Order placed" : "Your cart"}
      visible={visible}
    >
      {placedId ? (
        <View style={{ gap: 12, paddingVertical: 8 }}>
          <View style={{ alignItems: "center", paddingVertical: 12 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#DCFCE7", alignItems: "center", justifyContent: "center" }}>
              <Ionicons color="#15803D" name="checkmark-circle" size={36} />
            </View>
            <Text style={{ marginTop: 12, color: colors.primary, fontFamily: "Poppins_700Bold", fontSize: 18 }}>{t("Order confirmed")}</Text>
            <Text style={{ marginTop: 6, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 13, textAlign: "center" }}>
              {t("Your poultry supplies order is placed. The seller will contact you on")} {phone}.
            </Text>
            <Text style={{ marginTop: 8, color: colors.ink, fontFamily: "Poppins_600SemiBold", fontSize: 12 }}>
              {t("Order id")}: {placedId}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              setPlacedId(null);
              onClose();
            }}
            style={{ minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: colors.accent }}
          >
            <Text style={{ color: "#FFFFFF", fontFamily: "Poppins_700Bold", fontSize: 14 }}>{t("Continue shopping")}</Text>
          </Pressable>
        </View>
      ) : !lines.length ? (
        <View style={{ paddingVertical: 16, gap: 14 }}>
          <View style={{ alignItems: "center", paddingVertical: 12 }}>
            <Ionicons color={colors.muted} name="cart-outline" size={40} />
            <Text style={{ marginTop: 10, color: colors.ink, fontFamily: "Poppins_700Bold", fontSize: 16 }}>{t("Cart is empty")}</Text>
            <Text style={{ marginTop: 6, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 13, textAlign: "center" }}>
              {t("Add chicks, feed, or equipment to place an order.")}
            </Text>
          </View>
          {orders.length ? (
            <View style={{ gap: 8 }}>
              <Text style={{ color: colors.primary, fontFamily: "Poppins_700Bold", fontSize: 13, textTransform: "uppercase" }}>
                {t("Recent orders")}
              </Text>
              {orders.slice(0, 5).map((order) => (
                <View
                  key={order.id}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.line,
                    borderRadius: 12,
                    backgroundColor: colors.cardSoft,
                    padding: 12,
                  }}
                >
                  <Text style={{ color: colors.ink, fontFamily: "Poppins_700Bold", fontSize: 13 }}>
                    ₹{n(order.total)} · {n(order.itemCount)} {t("items")}
                  </Text>
                  <Text style={{ marginTop: 2, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 11 }}>
                    {order.createdAt.slice(0, 10)} · {t(order.status)} · {order.id}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : (
        <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: 10 }}>
            {lines.map((line) => (
              <View
                key={line.productId}
                style={{
                  flexDirection: "row",
                  gap: 10,
                  borderWidth: 1,
                  borderColor: colors.line,
                  borderRadius: 14,
                  backgroundColor: colors.cardSoft,
                  padding: 10,
                }}
              >
                <View style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" }}>
                  <PictureSymbol name={line.picture as PictureName} size={40} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ color: colors.primary, fontFamily: "Poppins_700Bold", fontSize: 13 }}>
                    {t(line.name)}
                  </Text>
                  <Text style={{ marginTop: 2, color: colors.muted, fontFamily: "Poppins_400Regular", fontSize: 11 }}>
                    {line.dealerName} · ₹{n(line.price)} {t(line.unit)}
                  </Text>
                  <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", borderRadius: 10, backgroundColor: colors.accent }}>
                      <Pressable onPress={() => setQuantity(line.productId, line.quantity - 1)} style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}>
                        <Ionicons color="#FFFFFF" name="remove" size={16} />
                      </Pressable>
                      <Text style={{ minWidth: 20, textAlign: "center", color: "#FFFFFF", fontFamily: "Poppins_700Bold", fontSize: 12 }}>{n(line.quantity)}</Text>
                      <Pressable onPress={() => setQuantity(line.productId, line.quantity + 1)} style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}>
                        <Ionicons color="#FFFFFF" name="add" size={16} />
                      </Pressable>
                    </View>
                    <Text style={{ color: colors.ink, fontFamily: "Poppins_700Bold", fontSize: 14 }}>₹{n(line.price * line.quantity)}</Text>
                  </View>
                </View>
                <Pressable onPress={() => removeItem(line.productId)} hitSlop={8} style={{ paddingTop: 2 }}>
                  <Ionicons color="#B91C1C" name="trash-outline" size={18} />
                </Pressable>
              </View>
            ))}

            <View style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 14, backgroundColor: colors.card, padding: 12, gap: 8 }}>
              <Text style={{ color: colors.primary, fontFamily: "Poppins_700Bold", fontSize: 13, textTransform: "uppercase" }}>{t("Delivery details")}</Text>
              <TextInput
                keyboardType="phone-pad"
                onChangeText={setPhone}
                placeholder={t("Phone number")}
                placeholderTextColor={colors.muted}
                style={{
                  minHeight: 44,
                  borderWidth: 1,
                  borderColor: colors.line,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  color: colors.ink,
                  fontFamily: "Poppins_500Medium",
                  backgroundColor: colors.cardSoft,
                }}
                value={phone}
              />
              <TextInput
                onChangeText={setNote}
                placeholder={t("Delivery note (farm address, landmark)")}
                placeholderTextColor={colors.muted}
                style={{
                  minHeight: 44,
                  borderWidth: 1,
                  borderColor: colors.line,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  color: colors.ink,
                  fontFamily: "Poppins_500Medium",
                  backgroundColor: colors.cardSoft,
                }}
                value={note}
              />
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 }}>
              <Text style={{ color: colors.muted, fontFamily: "Poppins_500Medium", fontSize: 13 }}>
                {n(count)} {t("items")}
              </Text>
              <Text style={{ color: colors.ink, fontFamily: "Poppins_700Bold", fontSize: 18 }}>₹{n(total)}</Text>
            </View>

            {message ? <Text style={{ color: "#B91C1C", fontFamily: "Poppins_400Regular", fontSize: 12 }}>{message}</Text> : null}

            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={clearCart}
                style={{
                  minHeight: 48,
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.line,
                }}
              >
                <Text style={{ color: colors.ink, fontFamily: "Poppins_600SemiBold", fontSize: 13 }}>{t("Clear")}</Text>
              </Pressable>
              <Pressable
                disabled={busy}
                onPress={() => void handlePlace()}
                style={{
                  minHeight: 48,
                  flex: 2,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 12,
                  backgroundColor: colors.accent,
                  opacity: busy ? 0.7 : 1,
                }}
              >
                <Text style={{ color: "#FFFFFF", fontFamily: "Poppins_700Bold", fontSize: 14 }}>{t("Place order")}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      )}
    </FormModal>
  );
}
