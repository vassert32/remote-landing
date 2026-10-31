/** Условия оплаты менторства. Постоплата — доля с каждой из первых двух зарплат. */
export const pricingPlans = [
  { id: '01', upfrontRub: 30_000, postpayPercent: 40 },
  { id: '02', upfrontRub: 60_000, postpayPercent: 25 },
  { id: '03', upfrontRub: 150_000, postpayPercent: 0 },
] as const;
