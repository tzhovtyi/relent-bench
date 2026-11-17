import { Form, ScenarioId } from "../types";
import type { Scenario } from "../types";
import { mulberry32 } from "../runner/random";

export interface Order {
  region: string;
  customer: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export type RegionTotals = Map<string, number>;

const REGIONS = ["north", "south", "east", "west", "central"];
const CUSTOMERS = [
  "lorem",
  "ipsum",
  "dolot",
  "sit",
  "amet",
  "itmo",
  "itemo",
  "bare",
];
const CUSTOMER_QUERY = "e";
const DISPLAYED_FRACTION_DIGITS = 2;
const MAX_QUANTITY = 100;
const MAX_UNIT_PRICE = 1000;
const MAX_DISCOUNT = 0.5;
const THRESHOLD = 14_000;
const VOLUME = 2_000_000;
const FNV_OFFSET_BASIS = 0x811c9dc5 | 0;
const FNV_PRIME = 0x01000193;
const DIGEST_LENGTH = 8;

function fnv1a(text: string): string {
  let state = FNV_OFFSET_BASIS;
  for (let i = 0; i < text.length; i += 1) {
    state ^= text.charCodeAt(i);
    state = Math.imul(state, FNV_PRIME);
  }
  return (state >>> 0).toString(16).padStart(DIGEST_LENGTH, "0");
}

function pick(pool: readonly string[], random: () => number): string {
  const value = pool[Math.floor(random() * pool.length)];
  if (value === undefined) throw new Error("empty pool");
  return value;
}

function makeInput(seed: number, volume: number): Order[] {
  const random = mulberry32(seed);
  const orders: Order[] = new Array(volume);
  for (let i = 0; i < volume; i += 1) {
    orders[i] = {
      region: pick(REGIONS, random),
      customer: pick(CUSTOMERS, random),
      quantity: 1 + Math.floor(random() * MAX_QUANTITY),
      unitPrice: random() * MAX_UNIT_PRICE,
      discount: random() * MAX_DISCOUNT,
    };
  }
  return orders;
}

function accumulate(totals: RegionTotals, order: Order): void {
  const displayed = (
    order.quantity *
    order.unitPrice *
    (1 - order.discount)
  ).toFixed(DISPLAYED_FRACTION_DIGITS);
  const displayedValue = Number(displayed);
  if (displayedValue >= THRESHOLD && order.customer.includes(CUSTOMER_QUERY)) {
    totals.set(order.region, (totals.get(order.region) ?? 0) + displayedValue);
  }
}

function plain(orders: Order[]): RegionTotals {
  const totals: RegionTotals = new Map();
  for (const order of orders) {
    accumulate(totals, order);
  }
  return totals;
}

function* generator(orders: Order[]): Generator<void, RegionTotals, void> {
  const totals: RegionTotals = new Map();
  for (const order of orders) {
    accumulate(totals, order);
    yield;
  }
  return totals;
}

export const s2Summary: Scenario<Order[], RegionTotals> = {
  id: ScenarioId.S2,
  volume: VOLUME,
  makeInput,
  hash: (totals) =>
    fnv1a(
      [...totals]
        .sort(([left], [right]) => (left < right ? -1 : 1))
        .map(
          ([region, total]) =>
            `${region}:${total.toFixed(DISPLAYED_FRACTION_DIGITS)}`,
        )
        .join("|"),
    ),
  forms: {
    [Form.Plain]: plain,
    [Form.Generator]: generator,
  },
};
