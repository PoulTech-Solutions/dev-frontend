export type SubscriptionPlanId = "basic" | "advance";

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  price: number;
  period: string;
  summary: string;
  features: string[];
  color: string;
  background: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "basic",
    name: "Basic",
    price: 499,
    period: "per month",
    summary: "Rates, one farm, and marketplace buying",
    features: [
      "Egg, culls and broiler rates",
      "One farm with sheds",
      "Buy on marketplace",
      "Book farm services",
    ],
    color: "#0369A1",
    background: "#E0F2FE",
  },
  {
    id: "advance",
    name: "Advance",
    price: 999,
    period: "per month",
    summary: "Multi-farm, selling, and full market tools",
    features: [
      "Everything in Basic",
      "Multiple farms and sheds",
      "Sell products on marketplace",
      "Full rate trends and history",
      "Priority service booking",
    ],
    color: "#15803D",
    background: "#DCFCE7",
  },
];

export function planById(id: SubscriptionPlanId) {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === id) ?? SUBSCRIPTION_PLANS[0];
}
