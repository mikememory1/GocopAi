export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price: number;
  description: string;
  popular?: boolean;
}

export const creditPacks: CreditPack[] = [
  {
    id: "boost",
    name: "Boost Pack",
    credits: 100,
    price: 900,
    description: "Perfect for a quick top-up",
  },
  {
    id: "growth",
    name: "Growth Pack",
    credits: 500,
    price: 3900,
    description: "Best value for regular use",
    popular: true,
  },
  {
    id: "scale",
    name: "Scale Pack",
    credits: 1000,
    price: 6900,
    description: "Maximum firepower",
  },
];
