import type { Order, InventoryBin, Product } from '../types';

const now = new Date();

function minutesFromNow(mins: number): string {
  return new Date(now.getTime() + mins * 60000).toISOString();
}

export const mockProducts: Product[] = [
  {
    sku: 'SKU-001', name: 'Wireless Earbuds Pro', category: 'Electronics',
    unitValue: 89.99, weightKg: 0.2, dimensions: { l: 10, w: 8, h: 4 },
    safetyStockThreshold: 15, reorderPoint: 20, reorderQty: 100,
  },
  {
    sku: 'SKU-002', name: 'Stainless Steel Water Bottle', category: 'Home',
    unitValue: 24.99, weightKg: 0.4, dimensions: { l: 25, w: 8, h: 8 },
    safetyStockThreshold: 30, reorderPoint: 40, reorderQty: 200,
  },
  {
    sku: 'SKU-003', name: 'Yoga Mat Premium', category: 'Fitness',
    unitValue: 45.00, weightKg: 1.2, dimensions: { l: 60, w: 15, h: 15 },
    safetyStockThreshold: 10, reorderPoint: 15, reorderQty: 50,
  },
];

export const mockBins: InventoryBin[] = [
  { binId: 'A-04', zone: 'A', aisle: '4', rack: '1', shelf: '1', sku: 'SKU-001', quantityOnHand: 7, quantityReserved: 0, quantityAvailable: 7, isOverflow: false, lastCycleCountAt: now.toISOString(), pickFrequencyScore: 82 },
  { binId: 'B-12', zone: 'B', aisle: '12', rack: '2', shelf: '3', sku: 'SKU-002', quantityOnHand: 45, quantityReserved: 5, quantityAvailable: 40, isOverflow: false, lastCycleCountAt: now.toISOString(), pickFrequencyScore: 55 },
  { binId: 'C-02', zone: 'C', aisle: '2', rack: '1', shelf: '1', sku: 'SKU-001', quantityOnHand: 20, quantityReserved: 0, quantityAvailable: 20, isOverflow: true, lastCycleCountAt: now.toISOString(), pickFrequencyScore: 12 },
  { binId: 'A-09', zone: 'A', aisle: '9', rack: '1', shelf: '2', sku: 'SKU-003', quantityOnHand: 8, quantityReserved: 0, quantityAvailable: 8, isOverflow: false, lastCycleCountAt: now.toISOString(), pickFrequencyScore: 33 },
];

function emptyBreakdown() {
  return { tierScore: 0, slaUrgencyScore: 0, deliveryMethodScore: 0, orderValueScore: 0, totalScore: 0, riskLevel: 'ON_TRACK' as const };
}

export const mockOrders: Order[] = [
  {
    orderId: 'ORD-1001', customerId: 'CUST-VIP-88', customerTier: 'VIP',
    deliveryMethod: 'SAME_DAY', slaDeadline: minutesFromNow(25), dispatchCutoff: minutesFromNow(25),
    orderValue: 249.98,
    lineItems: [{ lineId: 'L1', sku: 'SKU-001', qtyRequested: 10, qtyAllocated: 0, qtyPicked: 0, allowPartialFulfillment: true, sourceBinAllocations: [] }],
    status: 'INGESTED', priorityScore: 0, priorityBreakdown: emptyBreakdown(), createdAt: now.toISOString(), exceptions: [],
  },
  {
    orderId: 'ORD-1002', customerId: 'CUST-STD-12', customerTier: 'STANDARD',
    deliveryMethod: 'GROUND', slaDeadline: minutesFromNow(180), dispatchCutoff: minutesFromNow(180),
    orderValue: 89.99,
    lineItems: [{ lineId: 'L1', sku: 'SKU-001', qtyRequested: 5, qtyAllocated: 0, qtyPicked: 0, allowPartialFulfillment: true, sourceBinAllocations: [] }],
    status: 'INGESTED', priorityScore: 0, priorityBreakdown: emptyBreakdown(), createdAt: now.toISOString(), exceptions: [],
  },
  {
    orderId: 'ORD-1003', customerId: 'CUST-STD-45', customerTier: 'STANDARD',
    deliveryMethod: 'NEXT_DAY', slaDeadline: minutesFromNow(180), dispatchCutoff: minutesFromNow(180),
    orderValue: 89.99,
    lineItems: [{ lineId: 'L1', sku: 'SKU-001', qtyRequested: 5, qtyAllocated: 0, qtyPicked: 0, allowPartialFulfillment: true, sourceBinAllocations: [] }],
    status: 'INGESTED', priorityScore: 0, priorityBreakdown: emptyBreakdown(), createdAt: now.toISOString(), exceptions: [],
  },
  {
    orderId: 'ORD-1004', customerId: 'CUST-ENT-03', customerTier: 'ENTERPRISE',
    deliveryMethod: 'NEXT_DAY', slaDeadline: minutesFromNow(300), dispatchCutoff: minutesFromNow(300),
    orderValue: 450.00,
    lineItems: [{ lineId: 'L1', sku: 'SKU-002', qtyRequested: 12, qtyAllocated: 0, qtyPicked: 0, allowPartialFulfillment: false, sourceBinAllocations: [] }],
    status: 'INGESTED', priorityScore: 0, priorityBreakdown: emptyBreakdown(), createdAt: now.toISOString(), exceptions: [],
  },
];
export interface MockException {
  exceptionId: string;
  type: 'ITEM_DAMAGED' | 'BIN_COUNT_DISCREPANCY' | 'MISSING_SKU' | 'CARRIER_DELAY';
  orderId: string;
  sku: string;
  binId: string;
  qtyAffected: number;
  status: 'OPEN' | 'RESOLVED';
  resolutionOptions: {
    id: string;
    label: string;
    etaImpactSec: number;
  }[];
  chosenResolution?: string;
}

export const mockExceptions: MockException[] = [
  {
    exceptionId: 'EXC-001',
    type: 'MISSING_SKU',
    orderId: 'ORD-1003',
    sku: 'SKU-001',
    binId: 'B-12',
    qtyAffected: 2,
    status: 'OPEN',
    resolutionOptions: [
      { id: 'opt-1', label: 'Reallocate from Overflow Zone C-02', etaImpactSec: 180 },
      { id: 'opt-2', label: 'Split Shipment — dispatch available items now, backorder remaining', etaImpactSec: 0 },
    ],
  },
  {
    exceptionId: 'EXC-002',
    type: 'ITEM_DAMAGED',
    orderId: 'ORD-1002',
    sku: 'SKU-001',
    binId: 'A-04',
    qtyAffected: 1,
    status: 'OPEN',
    resolutionOptions: [
      { id: 'opt-1', label: 'Reallocate from Overflow Zone C-02', etaImpactSec: 180 },
      { id: 'opt-2', label: 'Trigger restock cycle — flag bin A-04 for recount', etaImpactSec: 0 },
    ],
  },
];