import type { Order, CustomerTier, DeliveryMethod, PriorityBreakdown } from '../types';

const TIER_WEIGHTS: Record<CustomerTier, number> = {
  VIP: 40,
  ENTERPRISE: 25,
  STANDARD: 10,
};

const DELIVERY_WEIGHTS: Record<DeliveryMethod, number> = {
  SAME_DAY: 25,
  NEXT_DAY: 15,
  GROUND: 5,
};

function computeSlaUrgencyScore(dispatchCutoff: string, now: Date): number {
  const minutesRemaining = (new Date(dispatchCutoff).getTime() - now.getTime()) / 60000;
  if (minutesRemaining <= 0) return 30;
  if (minutesRemaining <= 30) return 28;
  if (minutesRemaining <= 60) return 22;
  if (minutesRemaining <= 120) return 15;
  if (minutesRemaining <= 240) return 8;
  return 3;
}

function computeOrderValueScore(orderValue: number): number {
  return Math.min(5, Math.log10(orderValue + 1) * 2);
}

export function scoreOrder(order: Order, now: Date = new Date()): PriorityBreakdown {
  const tierScore = TIER_WEIGHTS[order.customerTier];
  const deliveryMethodScore = DELIVERY_WEIGHTS[order.deliveryMethod];
  const slaUrgencyScore = computeSlaUrgencyScore(order.dispatchCutoff, now);
  const orderValueScore = computeOrderValueScore(order.orderValue);

  const totalScore = tierScore + deliveryMethodScore + slaUrgencyScore + orderValueScore;

  const minutesToBreach = (new Date(order.dispatchCutoff).getTime() - now.getTime()) / 60000;
  const riskLevel: PriorityBreakdown['riskLevel'] =
    minutesToBreach <= 30 ? 'CRITICAL' : minutesToBreach <= 90 ? 'AT_RISK' : 'ON_TRACK';

  return { tierScore, slaUrgencyScore, deliveryMethodScore, orderValueScore, totalScore, riskLevel };
}