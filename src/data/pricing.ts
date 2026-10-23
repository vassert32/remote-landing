/** Условия оплаты менторства. Постоплата — доля с каждой из первых двух зарплат. */
export const pricingPlans = [
  { id: '01', upfrontRub: 50_000, postpayPercent: 40 },
  { id: '02', upfrontRub: 100_000, postpayPercent: 25 },
  { id: '03', upfrontRub: 200_000, postpayPercent: 0 },
] as const;

/** Округлённый ориентир для примера, без запроса текущего курса. */
export const offerExample = { usdPerMonth: 5_000, rubPerMonth: 410_000 } as const;
export const postpaySalaryCount = 2;

export function calculatePlan(plan: (typeof pricingPlans)[number]) {
  const postpayRub = offerExample.rubPerMonth * plan.postpayPercent / 100 * postpaySalaryCount;
  const totalRub = plan.upfrontRub + postpayRub;
  return { postpayRub, totalRub, remainingRub: offerExample.rubPerMonth - totalRub };
}
