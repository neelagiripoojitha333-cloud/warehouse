export type CustomerTier = 'VIP' | 'ENTERPRISE' | 'STANDARD';
export type DeliveryMethod = 'SAME_DAY' | 'NEXT_DAY' | 'GROUND';
export type OrderStatus =
  | 'INGESTED'
  | 'PRIORITIZED'
  | 'ALLOCATED'
  | 'WAVE_PICKING'
  | 'PACKING'
  | 'QC_EXCEPTION'
  | 'DISPATCHED'
  | 'BACKORDERED'
  | 'PARTIALLY_FULFILLED';

export type ExceptionType =
  | 'ITEM_DAMAGED'
  | 'BIN_COUNT_DISCREPANCY'
  | 'MISSING_SKU'
  | 'CARRIER_DELAY';

export type ExceptionStatus = 'OPEN' | 'RESOLVING' | 'RESOLVED' | 'ESCALATED';

export type ZoneId = 'A' | 'B' | 'C' | 'OVERFLOW';

export interface Product {
  sku: string;
  name: string;
  category: string;
  unitValue: number;
  weightKg: number;
  dimensions: { l: number; w: number; h: number };
  safetyStockThreshold: number;
  reorderPoint: number;
  reorderQty: number;
}

export interface InventoryBin {
  binId: string;
  zone: ZoneId;
  aisle: string;
  rack: string;
  shelf: string;
  sku: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  isOverflow: boolean;
  lastCycleCountAt: string;
  pickFrequencyScore: number;
}

export interface OrderLineItem {
  lineId: string;
  sku: string;
  qtyRequested: number;
  qtyAllocated: number;
  qtyPicked: number;
  allowPartialFulfillment: boolean;
  sourceBinAllocations: { binId: string; qty: number }[];
}

export interface PriorityBreakdown {
  tierScore: number;
  slaUrgencyScore: number;
  deliveryMethodScore: number;
  orderValueScore: number;
  totalScore: number;
  riskLevel: 'CRITICAL' | 'AT_RISK' | 'ON_TRACK';
}

export interface Order {
  orderId: string;
  customerId: string;
  customerTier: CustomerTier;
  deliveryMethod: DeliveryMethod;
  slaDeadline: string;
  dispatchCutoff: string;
  orderValue: number;
  lineItems: OrderLineItem[];
  status: OrderStatus;
  priorityScore: number;
  priorityBreakdown: PriorityBreakdown;
  createdAt: string;
  waveId?: string;
  exceptions: string[];
}

export interface PickWaveStop {
  binId: string;
  zone: ZoneId;
  aisle: string;
  sku: string;
  qty: number;
  orderId: string;
  sequence: number;
}

export interface PickWave {
  waveId: string;
  orderIds: string[];
  stops: PickWaveStop[];
  estimatedTravelDistanceM: number;
  estimatedDurationSec: number;
  assignedPicker?: string;
  status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETE';
  createdAt: string;
}

export interface ResolutionOption {
  id: string;
  label: string;
  type: 'REALLOCATE' | 'SPLIT_SHIPMENT' | 'BACKORDER' | 'CROSS_ORDER_BORROW';
  etaImpactSec: number;
  sourceBinId?: string;
  affectedOrderIds?: string[];
}

export interface ExceptionEvent {
  exceptionId: string;
  type: ExceptionType;
  orderId: string;
  sku: string;
  binId: string;
  qtyAffected: number;
  reportedAt: string;
  status: ExceptionStatus;
  resolutionOptions: ResolutionOption[];
  chosenResolution?: string;
  resolvedAt?: string;
}

export interface AllocationLog {
  logId: string;
  timestamp: string;
  orderId: string;
  sku: string;
  action: 'ALLOCATE' | 'REALLOCATE' | 'PARTIAL_ALLOCATE' | 'REBALANCE_BORROW' | 'RELEASE';
  qty: number;
  fromBinId?: string;
  toOrderId?: string;
  reason: string;
}