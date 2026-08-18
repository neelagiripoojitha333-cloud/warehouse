import { allocateStockForSku } from './allocation';
import type { Order, InventoryBin } from '../types';

const now = new Date();

function makeOrder(id: string, tier: Order['customerTier'], qty: number, minutesToCutoff: number): Order {
  return {
    orderId: id,
    customerId: `cust-${id}`,
    customerTier: tier,
    deliveryMethod: 'SAME_DAY',
    slaDeadline: new Date(now.getTime() + minutesToCutoff * 60000).toISOString(),
    dispatchCutoff: new Date(now.getTime() + minutesToCutoff * 60000).toISOString(),
    orderValue: 150,
    lineItems: [{
      lineId: `${id}-line1`,
      sku: 'SKU-001',
      qtyRequested: qty,
      qtyAllocated: 0,
      qtyPicked: 0,
      allowPartialFulfillment: true,
      sourceBinAllocations: [],
    }],
    status: 'PRIORITIZED',
    priorityScore: 0,
    priorityBreakdown: { tierScore: 0, slaUrgencyScore: 0, deliveryMethodScore: 0, orderValueScore: 0, totalScore: 0, riskLevel: 'ON_TRACK' },
    createdAt: now.toISOString(),
    exceptions: [],
  };
}

const orders: Order[] = [
  makeOrder('ORD-VIP-1', 'VIP', 10, 20),        // wants 10, 20 min to cutoff — CRITICAL
  makeOrder('ORD-STD-1', 'STANDARD', 5, 180),   // wants 5, 3 hrs to cutoff
  makeOrder('ORD-STD-2', 'STANDARD', 5, 180),   // wants 5, 3 hrs to cutoff
];

const bins: InventoryBin[] = [
  {
    binId: 'A-04', zone: 'A', aisle: '4', rack: '1', shelf: '1',
    sku: 'SKU-001', quantityOnHand: 7, quantityReserved: 0, quantityAvailable: 7,
    isOverflow: false, lastCycleCountAt: now.toISOString(), pickFrequencyScore: 0,
  },
];

console.log('=== SCENARIO: 7 units available, VIP wants 10, two Standard orders want 5 each ===\n');

const results = allocateStockForSku('SKU-001', orders, bins, now);

for (const r of results) {
  console.log(`Order ${r.orderId}: requested ${r.qtyRequested}, allocated ${r.qtyAllocated}, fully allocated: ${r.fullyAllocated}`);
  for (const log of r.logs) {
    console.log(`   → ${log.reason}`);
  }
}