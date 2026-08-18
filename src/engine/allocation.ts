import type { Order, InventoryBin, AllocationLog } from '../types';
import { scoreOrder } from './scoring';

export interface AllocationResult {
  orderId: string;
  sku: string;
  qtyRequested: number;
  qtyAllocated: number;
  fullyAllocated: boolean;
  bins: { binId: string; qty: number }[];
  logs: AllocationLog[];
}

export function allocateStockForSku(
  sku: string,
  competingOrders: Order[],
  bins: InventoryBin[],
  now: Date = new Date()
): AllocationResult[] {
  const skuBins = bins
    .filter(b => b.sku === sku && b.quantityAvailable > 0)
    .sort((a, b) => Number(a.isOverflow) - Number(b.isOverflow));

  const ranked = [...competingOrders]
    .map(o => ({ order: o, score: scoreOrder(o, now).totalScore }))
    .sort((a, b) => b.score - a.score);

  const results: AllocationResult[] = [];
  let binCursor = 0;

  for (const { order } of ranked) {
    const line = order.lineItems.find(l => l.sku === sku)!;
    let remaining = line.qtyRequested - line.qtyAllocated;
    const binsUsed: { binId: string; qty: number }[] = [];
    const logs: AllocationLog[] = [];

    while (remaining > 0 && binCursor < skuBins.length) {
      const bin = skuBins[binCursor];
      if (bin.quantityAvailable <= 0) { binCursor++; continue; }

      const take = Math.min(remaining, bin.quantityAvailable);
      bin.quantityAvailable -= take;
      bin.quantityReserved += take;
      remaining -= take;
      binsUsed.push({ binId: bin.binId, qty: take });

      logs.push({
        logId: crypto.randomUUID(),
        timestamp: now.toISOString(),
        orderId: order.orderId,
        sku,
        action: binsUsed.length === 1 && remaining === 0 ? 'ALLOCATE' : 'PARTIAL_ALLOCATE',
        qty: take,
        fromBinId: bin.binId,
        reason: `Priority score ${scoreOrder(order, now).totalScore.toFixed(1)} — allocated ${take} from ${bin.isOverflow ? 'overflow' : 'primary'} bin ${bin.binId}`,
      });

      if (bin.quantityAvailable === 0) binCursor++;
    }

    const qtyAllocated = line.qtyRequested - remaining;
    results.push({
      orderId: order.orderId,
      sku,
      qtyRequested: line.qtyRequested,
      qtyAllocated,
      fullyAllocated: remaining === 0,
      bins: binsUsed,
      logs,
    });
  }

  return rebalanceShortfalls(results, ranked, now);
}

function rebalanceShortfalls(
  results: AllocationResult[],
  ranked: { order: Order; score: number }[],
  now: Date
): AllocationResult[] {
  const shortfalls = results.filter(r => !r.fullyAllocated);

  for (const shortfall of shortfalls) {
    const shortfallOrder = ranked.find(r => r.order.orderId === shortfall.orderId)!.order;
    const breakdown = scoreOrder(shortfallOrder, now);
    if (breakdown.riskLevel !== 'CRITICAL') continue;

    const need = shortfall.qtyRequested - shortfall.qtyAllocated;

    const donorCandidate = results.find(r => {
      if (r.orderId === shortfall.orderId || !r.fullyAllocated) return false;
      const donorOrder = ranked.find(x => x.order.orderId === r.orderId)!.order;
      return (
        donorOrder.status !== 'WAVE_PICKING' &&
        donorOrder.status !== 'PACKING' &&
        new Date(donorOrder.dispatchCutoff) > new Date(shortfallOrder.dispatchCutoff)
      );
    });

    if (donorCandidate && donorCandidate.bins.length > 0) {
      const donorBin = donorCandidate.bins[donorCandidate.bins.length - 1];
      const borrowQty = Math.min(need, donorBin.qty);

      donorBin.qty -= borrowQty;
      donorCandidate.qtyAllocated -= borrowQty;
      donorCandidate.fullyAllocated = false;

      shortfall.bins.push({ binId: donorBin.binId, qty: borrowQty });
      shortfall.qtyAllocated += borrowQty;
      shortfall.fullyAllocated = shortfall.qtyAllocated === shortfall.qtyRequested;

      shortfall.logs.push({
        logId: crypto.randomUUID(),
        timestamp: now.toISOString(),
        orderId: shortfall.orderId,
        sku: shortfall.sku,
        action: 'REBALANCE_BORROW',
        qty: borrowQty,
        fromBinId: donorBin.binId,
        toOrderId: donorCandidate.orderId,
        reason: `CRITICAL SLA risk — borrowed ${borrowQty} units from order ${donorCandidate.orderId} (later dispatch cutoff, not yet picking)`,
      });
    }
  }

  return results;
}