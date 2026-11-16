import { Image, type ImageSource } from "expo-image";

export type PictureName =
  | "phone"
  | "barn"
  | "sun"
  | "egg"
  | "bird"
  | "chicken"
  | "seed"
  | "corn"
  | "rice"
  | "grain"
  | "peanut"
  | "flower"
  | "sprout"
  | "sack"
  | "syringe"
  | "pill"
  | "water"
  | "wheat"
  | "stethoscope"
  | "shop"
  | "cart";

const PICTURES: Record<PictureName, ImageSource> = {
  phone: require("../../assets/symbols/phone.jpg"),
  barn: require("../../assets/symbols/barn.jpg"),
  sun: require("../../assets/symbols/sun.jpg"),
  egg: require("../../assets/symbols/egg.jpg"),
  bird: require("../../assets/symbols/bird.jpg"),
  chicken: require("../../assets/symbols/chicken.jpg"),
  seed: require("../../assets/symbols/seed.jpg"),
  corn: require("../../assets/symbols/corn.jpg"),
  rice: require("../../assets/symbols/rice.jpg"),
  grain: require("../../assets/symbols/grain.jpg"),
  peanut: require("../../assets/symbols/peanut.jpg"),
  flower: require("../../assets/symbols/flower.jpg"),
  sprout: require("../../assets/symbols/sprout.jpg"),
  sack: require("../../assets/symbols/sack.jpg"),
  syringe: require("../../assets/symbols/syringe.jpg"),
  pill: require("../../assets/symbols/pill.jpg"),
  water: require("../../assets/symbols/water.jpg"),
  wheat: require("../../assets/symbols/wheat.jpg"),
  stethoscope: require("../../assets/symbols/stethoscope.jpg"),
  shop: require("../../assets/symbols/shop.jpg"),
  cart: require("../../assets/symbols/cart.jpg"),
};

export function PictureSymbol({ name, size = 48 }: { name: PictureName; size?: number }) {
  return (
    <Image
      accessibilityLabel={name}
      contentFit="cover"
      source={PICTURES[name]}
      style={{ width: size, height: size, borderRadius: size * 0.28 }}
    />
  );
}
