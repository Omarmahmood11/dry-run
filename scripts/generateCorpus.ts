/**
 * Corpus generator for Dry Run.
 *
 * Produces 400 deterministic, seeded cases following dataset.md §6:
 *   1. Decide ground truth
 *   2. Construct content from it
 *   3. Compute intake flags mechanically
 *   4. Assign extractionConfidence
 *   5. Apply baseline ruleset → recorded decision
 *
 * Imports evaluateCase from lib/ruleEngine — contains no copy of eval logic.
 * No LLM calls. No Math.random(). Every value comes from the seeded PRNG.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { evaluateCase } from '../lib/ruleEngine';
import type {
  Case,
  Decision,
  GroundTruth,
  IntakeFlags,
  LineItem,
  ProblemType,
  Ruleset,
} from '../lib/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================
// Constants
// ============================================================

const SEED = 42;
const TOTAL_CASES = 400;
const CLEAN_COUNT = 280;
const UNUSUAL_COUNT = 80;
const PROBLEM_COUNT = 40;
const TAX_RATE = 0.18; // 18% GST
const TAX_TOLERANCE = 1; // ₹1 tolerance for tax_miscalculation flag

// ============================================================
// Seeded PRNG — mulberry32
// ============================================================

interface Rng {
  next(): number;
  nextInt(min: number, max: number): number;
  nextFloat(min: number, max: number): number;
  pick<T>(array: readonly T[]): T;
  pickIndex(length: number): number;
  shuffle<T>(array: readonly T[]): T[];
}

function createRng(seed: number): Rng {
  let state = seed;

  function next(): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function nextInt(min: number, max: number): number {
    return Math.floor(next() * (max - min + 1)) + min;
  }

  function nextFloat(min: number, max: number): number {
    return next() * (max - min) + min;
  }

  function pick<T>(array: readonly T[]): T {
    const item = array[nextInt(0, array.length - 1)];
    if (item === undefined) {
      throw new Error('pick() called on empty array');
    }
    return item;
  }

  function pickIndex(length: number): number {
    return nextInt(0, length - 1);
  }

  function shuffle<T>(array: readonly T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = nextInt(0, i);
      [result[i], result[j]] = [result[j]!, result[i]!];
    }
    return result;
  }

  return { next, nextInt, nextFloat, pick, pickIndex, shuffle };
}

// ============================================================
// Vendor pool
// ============================================================

interface VendorTemplate {
  readonly name: string;
  readonly id: string;
  readonly category: string;
  readonly typicalMin: number;
  readonly typicalMax: number;
  readonly isPhantom: boolean;
  readonly defaultAccountNumber: string;
  readonly defaultIfscCode: string;
}

const REAL_VENDORS: readonly VendorTemplate[] = [
  { name: 'Vertex Solutions Pvt Ltd', id: 'V001', category: 'IT', typicalMin: 20000, typicalMax: 150000, isPhantom: false, defaultAccountNumber: '1001234567', defaultIfscCode: 'SBIN0001234' },
  { name: 'Pinnacle Office Supplies', id: 'V002', category: 'Office', typicalMin: 2000, typicalMax: 25000, isPhantom: false, defaultAccountNumber: '2001234567', defaultIfscCode: 'HDFC0002345' },
  { name: 'Rajesh Trading Co', id: 'V003', category: 'Trading', typicalMin: 5000, typicalMax: 60000, isPhantom: false, defaultAccountNumber: '3001234567', defaultIfscCode: 'ICIC0003456' },
  { name: 'AeroTech Components Ltd', id: 'V004', category: 'Manufacturing', typicalMin: 10000, typicalMax: 200000, isPhantom: false, defaultAccountNumber: '4001234567', defaultIfscCode: 'UTIB0004567' },
  { name: 'Greenfield Facilities Mgmt', id: 'V005', category: 'Facilities', typicalMin: 15000, typicalMax: 80000, isPhantom: false, defaultAccountNumber: '5001234567', defaultIfscCode: 'KKBK0005678' },
  { name: 'Bharat Consulting Group', id: 'V006', category: 'Consulting', typicalMin: 30000, typicalMax: 300000, isPhantom: false, defaultAccountNumber: '6001234567', defaultIfscCode: 'PUNB0006789' },
  { name: 'NexGen IT Services', id: 'V007', category: 'IT', typicalMin: 15000, typicalMax: 120000, isPhantom: false, defaultAccountNumber: '7001234567', defaultIfscCode: 'BARB0007890' },
  { name: 'Priya Electronics Ltd', id: 'V008', category: 'Electronics', typicalMin: 8000, typicalMax: 90000, isPhantom: false, defaultAccountNumber: '8001234567', defaultIfscCode: 'CNRB0008901' },
  { name: 'Sunrise Logistics Pvt Ltd', id: 'V009', category: 'Logistics', typicalMin: 5000, typicalMax: 60000, isPhantom: false, defaultAccountNumber: '9001234567', defaultIfscCode: 'SBIN0009012' },
  { name: 'Mahalakshmi Enterprises', id: 'V010', category: 'Trading', typicalMin: 3000, typicalMax: 45000, isPhantom: false, defaultAccountNumber: '1101234567', defaultIfscCode: 'HDFC0010123' },
  { name: 'TechPro Solutions', id: 'V011', category: 'IT', typicalMin: 25000, typicalMax: 180000, isPhantom: false, defaultAccountNumber: '1201234567', defaultIfscCode: 'ICIC0011234' },
  { name: 'Kiran Stationery Mart', id: 'V012', category: 'Office', typicalMin: 1000, typicalMax: 12000, isPhantom: false, defaultAccountNumber: '1301234567', defaultIfscCode: 'UTIB0012345' },
  { name: 'IndoSteel Corporation', id: 'V013', category: 'Manufacturing', typicalMin: 20000, typicalMax: 250000, isPhantom: false, defaultAccountNumber: '1401234567', defaultIfscCode: 'KKBK0013456' },
  { name: 'Clearview Security Systems', id: 'V014', category: 'Security', typicalMin: 10000, typicalMax: 50000, isPhantom: false, defaultAccountNumber: '1501234567', defaultIfscCode: 'PUNB0014567' },
  { name: 'Sharma & Associates', id: 'V015', category: 'Legal', typicalMin: 20000, typicalMax: 100000, isPhantom: false, defaultAccountNumber: '1601234567', defaultIfscCode: 'BARB0015678' },
  { name: 'Patel Hardware Traders', id: 'V016', category: 'Hardware', typicalMin: 3000, typicalMax: 40000, isPhantom: false, defaultAccountNumber: '1701234567', defaultIfscCode: 'CNRB0016789' },
  { name: 'Digital Wave Technologies', id: 'V017', category: 'IT', typicalMin: 18000, typicalMax: 130000, isPhantom: false, defaultAccountNumber: '1801234567', defaultIfscCode: 'SBIN0017890' },
  { name: 'Fresh Foods Supply Co', id: 'V018', category: 'Catering', typicalMin: 5000, typicalMax: 40000, isPhantom: false, defaultAccountNumber: '1901234567', defaultIfscCode: 'HDFC0018901' },
  { name: 'Metro Cleaning Services', id: 'V019', category: 'Facilities', typicalMin: 8000, typicalMax: 45000, isPhantom: false, defaultAccountNumber: '2011234567', defaultIfscCode: 'ICIC0019012' },
  { name: 'Anand Electrical Works', id: 'V020', category: 'Electrical', typicalMin: 5000, typicalMax: 55000, isPhantom: false, defaultAccountNumber: '2111234567', defaultIfscCode: 'UTIB0020123' },
  { name: 'Premier Staffing Solutions', id: 'V021', category: 'HR', typicalMin: 25000, typicalMax: 150000, isPhantom: false, defaultAccountNumber: '2211234567', defaultIfscCode: 'KKBK0021234' },
  { name: 'Lakshmi Paper Industries', id: 'V022', category: 'Office', typicalMin: 2000, typicalMax: 20000, isPhantom: false, defaultAccountNumber: '2311234567', defaultIfscCode: 'PUNB0022345' },
  { name: 'Global Travel Services', id: 'V023', category: 'Travel', typicalMin: 10000, typicalMax: 80000, isPhantom: false, defaultAccountNumber: '2411234567', defaultIfscCode: 'BARB0023456' },
  { name: 'Ravi Construction Materials', id: 'V024', category: 'Construction', typicalMin: 15000, typicalMax: 200000, isPhantom: false, defaultAccountNumber: '2511234567', defaultIfscCode: 'CNRB0024567' },
  { name: 'DataSync Technologies', id: 'V025', category: 'IT', typicalMin: 20000, typicalMax: 160000, isPhantom: false, defaultAccountNumber: '2611234567', defaultIfscCode: 'SBIN0025678' },
];

const PHANTOM_VENDORS: readonly VendorTemplate[] = [
  { name: 'QuickServe Enterprises', id: 'V026', category: 'Services', typicalMin: 10000, typicalMax: 80000, isPhantom: true, defaultAccountNumber: '9901234567', defaultIfscCode: 'HDFC0099012' },
  { name: 'Zenith Procurement Services', id: 'V027', category: 'Procurement', typicalMin: 15000, typicalMax: 100000, isPhantom: true, defaultAccountNumber: '9801234567', defaultIfscCode: 'ICIC0098901' },
  { name: 'Alpha Trading Corp', id: 'V028', category: 'Trading', typicalMin: 8000, typicalMax: 70000, isPhantom: true, defaultAccountNumber: '9701234567', defaultIfscCode: 'UTIB0097890' },
  { name: 'Reliable Supply Chain Pvt Ltd', id: 'V029', category: 'Logistics', typicalMin: 12000, typicalMax: 90000, isPhantom: true, defaultAccountNumber: '9601234567', defaultIfscCode: 'KKBK0096789' },
  { name: 'Prime Solutions India', id: 'V030', category: 'IT', typicalMin: 20000, typicalMax: 120000, isPhantom: true, defaultAccountNumber: '9501234567', defaultIfscCode: 'PUNB0095678' },
];

const ALL_VENDORS: readonly VendorTemplate[] = [...REAL_VENDORS, ...PHANTOM_VENDORS];

const VERIFIED_VENDOR_IDS = new Set(REAL_VENDORS.map((v) => v.id));

// ============================================================
// Line item templates by category
// ============================================================

const LINE_ITEM_TEMPLATES: Record<string, readonly { description: string; typicalPrice: number }[]> = {
  IT: [
    { description: 'Monthly Cloud Hosting - Standard Plan', typicalPrice: 15000 },
    { description: 'Software License Renewal - Annual', typicalPrice: 45000 },
    { description: 'IT Support Services - Quarterly', typicalPrice: 30000 },
    { description: 'Network Maintenance - Monthly', typicalPrice: 12000 },
    { description: 'Data Backup and Recovery Service', typicalPrice: 8000 },
    { description: 'Cybersecurity Assessment', typicalPrice: 25000 },
    { description: 'Web Application Development', typicalPrice: 50000 },
    { description: 'Server Migration Services', typicalPrice: 35000 },
  ],
  Office: [
    { description: 'A4 Copy Paper - Box of 10 Reams', typicalPrice: 350 },
    { description: 'Toner Cartridge - HP LaserJet', typicalPrice: 3500 },
    { description: 'Ballpoint Pens - Box of 50', typicalPrice: 450 },
    { description: 'Sticky Notes - Pack of 12', typicalPrice: 200 },
    { description: 'Whiteboard Markers - Pack of 24', typicalPrice: 800 },
    { description: 'Desk Organiser Set', typicalPrice: 1200 },
    { description: 'Filing Cabinets - 4 Drawer', typicalPrice: 4500 },
    { description: 'Printer Paper - A3 Ream of 500', typicalPrice: 550 },
  ],
  Trading: [
    { description: 'Industrial Solvents - 20L Drum', typicalPrice: 4500 },
    { description: 'Packaging Material - Bulk Order', typicalPrice: 8000 },
    { description: 'Adhesive Tape - Carton of 48', typicalPrice: 2400 },
    { description: 'Cleaning Supplies - Monthly', typicalPrice: 3500 },
    { description: 'Safety Equipment - PPE Kit', typicalPrice: 1800 },
  ],
  Manufacturing: [
    { description: 'Precision Bearings - Lot of 100', typicalPrice: 25000 },
    { description: 'Hydraulic Cylinders - Set of 4', typicalPrice: 45000 },
    { description: 'Steel Plate - Grade 304 - 10 Sheets', typicalPrice: 35000 },
    { description: 'Industrial Fasteners - Assorted Box', typicalPrice: 8000 },
    { description: 'CNC Machining Components', typicalPrice: 60000 },
  ],
  Facilities: [
    { description: 'HVAC Maintenance - Quarterly', typicalPrice: 18000 },
    { description: 'Plumbing Repair Services', typicalPrice: 8000 },
    { description: 'Fire Safety Equipment Inspection', typicalPrice: 12000 },
    { description: 'Janitorial Supplies - Monthly', typicalPrice: 6000 },
    { description: 'Pest Control - Quarterly Treatment', typicalPrice: 5000 },
  ],
  Consulting: [
    { description: 'Strategy Consulting - Phase 1', typicalPrice: 75000 },
    { description: 'Process Optimization Review', typicalPrice: 50000 },
    { description: 'Market Research Report', typicalPrice: 40000 },
    { description: 'Compliance Audit Services', typicalPrice: 60000 },
    { description: 'Training Workshop - 2 Day', typicalPrice: 35000 },
  ],
  Electronics: [
    { description: 'LED Display Panels - 55 inch', typicalPrice: 28000 },
    { description: 'Network Switches - 24 Port', typicalPrice: 12000 },
    { description: 'UPS Battery Replacement', typicalPrice: 8500 },
    { description: 'CCTV Camera System - 8 Channel', typicalPrice: 22000 },
    { description: 'Intercom System Installation', typicalPrice: 15000 },
  ],
  Logistics: [
    { description: 'Freight Charges - Domestic', typicalPrice: 8000 },
    { description: 'Warehouse Storage - Monthly', typicalPrice: 15000 },
    { description: 'Courier Services - Bulk', typicalPrice: 5000 },
    { description: 'Packaging and Dispatch', typicalPrice: 3500 },
    { description: 'Cold Chain Transport', typicalPrice: 12000 },
  ],
  Security: [
    { description: 'Security Guard Services - Monthly', typicalPrice: 18000 },
    { description: 'Access Control System Maintenance', typicalPrice: 8000 },
    { description: 'CCTV Monitoring - Monthly', typicalPrice: 12000 },
    { description: 'Security Audit Services', typicalPrice: 15000 },
  ],
  Legal: [
    { description: 'Legal Consultation - Retainer', typicalPrice: 25000 },
    { description: 'Contract Drafting Services', typicalPrice: 15000 },
    { description: 'Regulatory Compliance Review', typicalPrice: 30000 },
    { description: 'Intellectual Property Filing', typicalPrice: 20000 },
  ],
  Hardware: [
    { description: 'Power Tools - Drill Set', typicalPrice: 5500 },
    { description: 'Plumbing Fittings - Assorted', typicalPrice: 3000 },
    { description: 'Electrical Wiring - 100m Roll', typicalPrice: 2500 },
    { description: 'Paint and Coating Supplies', typicalPrice: 4000 },
    { description: 'Hand Tools - Workshop Kit', typicalPrice: 7500 },
  ],
  Catering: [
    { description: 'Corporate Lunch Catering - Daily', typicalPrice: 8000 },
    { description: 'Event Catering Services', typicalPrice: 15000 },
    { description: 'Tea and Coffee Supplies - Monthly', typicalPrice: 4000 },
    { description: 'Snack Vending Machine Refill', typicalPrice: 3500 },
  ],
  Electrical: [
    { description: 'Wiring and Cabling - Per Floor', typicalPrice: 12000 },
    { description: 'Switchgear Maintenance', typicalPrice: 8000 },
    { description: 'Generator Servicing - Annual', typicalPrice: 15000 },
    { description: 'Transformer Oil Replacement', typicalPrice: 10000 },
  ],
  HR: [
    { description: 'Contract Staff Services - Monthly', typicalPrice: 35000 },
    { description: 'Recruitment Fee - Mid Level', typicalPrice: 25000 },
    { description: 'Background Verification Services', typicalPrice: 3000 },
    { description: 'Payroll Processing - Monthly', typicalPrice: 15000 },
  ],
  Travel: [
    { description: 'Domestic Flight Booking - Bulk', typicalPrice: 18000 },
    { description: 'Hotel Accommodation - Corporate', typicalPrice: 12000 },
    { description: 'Airport Transfer Services', typicalPrice: 5000 },
    { description: 'Travel Insurance - Annual', typicalPrice: 8000 },
  ],
  Construction: [
    { description: 'Cement - 50kg Bags (x100)', typicalPrice: 35000 },
    { description: 'TMT Steel Bars - Per Tonne', typicalPrice: 55000 },
    { description: 'Sand and Gravel - Truckload', typicalPrice: 15000 },
    { description: 'Scaffolding Rental - Monthly', typicalPrice: 25000 },
  ],
  Services: [
    { description: 'Professional Services - Monthly', typicalPrice: 20000 },
    { description: 'Technical Support - Quarterly', typicalPrice: 15000 },
    { description: 'Document Processing Services', typicalPrice: 8000 },
  ],
  Procurement: [
    { description: 'Procurement Advisory - Monthly', typicalPrice: 25000 },
    { description: 'Vendor Management Services', typicalPrice: 18000 },
    { description: 'Supply Chain Consulting', typicalPrice: 30000 },
  ],
};

// ============================================================
// Date generation
// ============================================================

/** Generate a date in Q1 2026, deterministically from the RNG. */
function generateDate(rng: Rng): string {
  // Jan 2 to Mar 31 = 89 days
  const dayOffset = rng.nextInt(0, 88);
  const date = new Date(Date.UTC(2026, 0, 2 + dayOffset));
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Generate a sorted array of dates for the corpus. */
function generateAllDates(rng: Rng, count: number): string[] {
  const dates: string[] = [];
  for (let i = 0; i < count; i++) {
    dates.push(generateDate(rng));
  }
  dates.sort();
  return dates;
}

// ============================================================
// Content helpers
// ============================================================

function generateLineItems(
  rng: Rng,
  category: string,
  targetSubtotal: number,
): LineItem[] {
  const templates = LINE_ITEM_TEMPLATES[category as keyof typeof LINE_ITEM_TEMPLATES] ?? LINE_ITEM_TEMPLATES['Services']!;
  const numItems = Math.min(templates.length, rng.nextInt(1, 4));
  
  // Shuffle templates to ensure random selection and uniqueness
  const shuffled = rng.shuffle([...templates]);
  const selectedTemplates = shuffled.slice(0, numItems);

  const chunks = [];
  let remaining = targetSubtotal;
  for (let i = 0; i < numItems - 1; i++) {
    const chunk = Math.round((targetSubtotal / numItems) * rng.nextFloat(0.8, 1.2));
    chunks.push(chunk);
    remaining -= chunk;
  }
  chunks.push(remaining > 0 ? remaining : 1);

  const lineItems: LineItem[] = [];

  for (let i = 0; i < numItems; i++) {
    const template = selectedTemplates[i]!;
    const chunkTarget = chunks[i]!;

    const unitPrice = Math.round(template.typicalPrice * rng.nextFloat(0.9, 1.1));
    const quantity = Math.max(1, Math.round(chunkTarget / unitPrice));
    const lineTotal = quantity * unitPrice;
    
    lineItems.push({
      description: template.description,
      quantity,
      unitPrice,
      lineTotal,
    });
  }

  return lineItems;
}

function convertToForeignCurrency(c: MutableCase, currency: 'USD' | 'EUR' | 'GBP'): void {
  const rates = { USD: 83.5, EUR: 90.2, GBP: 105.4 };
  const rate = rates[currency];
  
  c.invoice.currency = currency;
  c.invoice.lineItems = c.invoice.lineItems.map(li => {
    const unitPrice = roundToTwo(li.unitPrice / rate);
    const lineTotal = roundToTwo(unitPrice * li.quantity);
    return { ...li, unitPrice, lineTotal };
  });
  
  c.invoice.subtotal = c.invoice.lineItems.reduce((sum, li) => sum + li.lineTotal, 0);
  c.invoice.taxAmount = roundToTwo(c.invoice.subtotal * TAX_RATE);
  c.invoice.totalAmount = roundToTwo(c.invoice.subtotal + c.invoice.taxAmount);
  
  c._poExpectedPrices = c._poExpectedPrices.map(p => roundToTwo(p / rate));
}

function generatePoReference(rng: Rng, caseIndex: number): string {
  const num = String(caseIndex + 1000).padStart(5, '0');
  return `PO-2026-${num}`;
}

function generateSource(rng: Rng): 'email' | 'portal' | 'edi' {
  const roll = rng.next();
  if (roll < 0.5) return 'email';
  if (roll < 0.85) return 'portal';
  return 'edi';
}

function roundToTwo(n: number): number {
  return Math.round(n * 100) / 100;
}

// ============================================================
// Mutable case type used during generation
// ============================================================

interface MutableCase {
  id: string;
  submissionDate: string;
  source: 'email' | 'portal' | 'edi';
  vendor: {
    name: string;
    id: string;
    relationshipAgeDays: number;
    historicalInvoiceCount: number;
    typicalAmountRange: { min: number; max: number };
  };
  invoice: {
    totalAmount: number;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    currency: string;
    lineItems: LineItem[];
    purchaseOrderReference: string | null;
    paymentBankDetails: {
      accountNumber: string;
      ifscCode: string;
    };
  };
  intakeFlags: {
    duplicate_hash_match: boolean;
    bank_details_changed: boolean;
    new_vendor: boolean;
    amount_anomaly: boolean;
    po_missing: boolean;
    po_quantity_mismatch: boolean;
    po_price_variance: number;
    tax_miscalculation: boolean;
    currency_mismatch: boolean;
    vendor_unverified: boolean;
  };
  extractionConfidence: number;
  recordedDecision: {
    decision: Decision;
    rulesetVersion: number;
    humanAction?: Decision;
  };
  groundTruth: {
    truth: GroundTruth;
    problemType?: ProblemType;
    resolutionNote: string;
  };
  // Internal tracking fields (stripped before output)
  _segment: 'clean' | 'unusual' | 'problem';
  _isNonObvious: boolean;
  _poExpectedPrices: number[]; // PO expected unit prices per line item
  _poExpectedQuantities: number[]; // PO expected quantities per line item
  _duplicateSource?: MutableCase;
}

// ============================================================
// Case construction
// ============================================================

function createBaseCase(
  rng: Rng,
  index: number,
  date: string,
  vendor: VendorTemplate,
  segment: 'clean' | 'unusual' | 'problem',
): MutableCase {
  let targetSubtotal = rng.nextInt(vendor.typicalMin, vendor.typicalMax);
  // Force some clean cases to be in the 250k-300k totalAmount range (subtotal 212k-254k) for Check 3 threshold testing
  if (segment === 'clean' && vendor.typicalMax >= 200000 && rng.nextFloat(0, 1) < 0.25) {
    targetSubtotal = rng.nextInt(215000, 250000);
  }

  const lineItems = generateLineItems(rng, vendor.category, targetSubtotal);
  const actualSubtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const taxAmount = Math.round(actualSubtotal * TAX_RATE);
  const totalAmount = actualSubtotal + taxAmount;

  return {
    id: '__PLACEHOLDER__',
    submissionDate: date,
    source: generateSource(rng),
    vendor: {
      name: vendor.name,
      id: vendor.id,
      relationshipAgeDays: rng.nextInt(90, 1500),
      historicalInvoiceCount: rng.nextInt(10, 200),
      typicalAmountRange: { min: vendor.typicalMin, max: vendor.typicalMax },
    },
    invoice: {
      totalAmount,
      subtotal: actualSubtotal,
      taxRate: TAX_RATE,
      taxAmount,
      currency: 'INR',
      lineItems,
      purchaseOrderReference: generatePoReference(rng, index),
      paymentBankDetails: {
        accountNumber: vendor.defaultAccountNumber,
        ifscCode: vendor.defaultIfscCode,
      },
    },
    intakeFlags: {
      duplicate_hash_match: false,
      bank_details_changed: false,
      new_vendor: false,
      amount_anomaly: false,
      po_missing: false,
      po_quantity_mismatch: false,
      po_price_variance: 0,
      tax_miscalculation: false,
      currency_mismatch: false,
      vendor_unverified: false,
    },
    extractionConfidence: 0,
    recordedDecision: {
      decision: 'ESCALATE',
      rulesetVersion: 1,
    },
    groundTruth: {
      truth: 'LEGITIMATE',
      resolutionNote: '',
    },
    _segment: segment,
    _isNonObvious: false,
    _poExpectedPrices: lineItems.map((item) => item.unitPrice),
    _poExpectedQuantities: lineItems.map((item) => item.quantity),
  };
}

// ============================================================
// Resolution notes
// ============================================================

const CLEAN_NOTES = [
  'Routine invoice processed without incident',
  'Standard vendor payment, all documentation verified',
  'Regular periodic billing, matched to purchase order',
  'Confirmed delivery receipt, standard payment terms',
  'Verified against contract, processed on schedule',
  'All items received as invoiced, approved in normal course',
  'Monthly service fee, consistent with agreement',
  'Standard procurement, no issues noted during review',
];

const UNUSUAL_LEGITIMATE_NOTES: Record<string, string[]> = {
  duplicate_hash_match: [
    'Re-submission after documentation correction; original invoice was rejected for missing PO reference',
    'Vendor resubmitted after correcting bank details on the original; legitimate second filing',
    'System flagged as duplicate but investigation confirmed separate purchase orders',
    'Same vendor and amount coincidence across different departments; each invoice is for a distinct delivery',
  ],
  bank_details_changed: [
    'Vendor notified bank change via registered letter two weeks prior; change verified',
    'Scheduled bank migration; vendor confirmed via signed letter and company stamp',
    'Vendor changed primary bank due to branch closure; pre-announced',
    'Updated bank details match the vendor\'s new GST registration certificate',
    'Bank merger resulted in new account number; vendor provided official notice',
    'Vendor switched to a bank offering better settlement times; confirmed by procurement',
  ],
  po_price_variance: [
    'Price increase per contract amendment dated 15 Jan 2026; documented',
    'Negotiated rate revision for Q1 2026; approved by procurement head',
    'Exchange rate adjustment clause triggered; variance within contractual bounds',
    'Bulk discount reversal per minimum order clause; PO amendment on file',
    'Annual price escalation per contract Section 4.2; within agreed ceiling',
    'One-time surcharge approved by management for expedited delivery',
    'Raw material cost pass-through per contract terms; supporting documents attached',
    'Volume tier change from Gold to Silver per quarterly review; approved',
  ],
  vendor_unverified: [
    'New supplier onboarding in progress; invoice pre-approved by procurement',
    'Vendor registry update pending; company verified through trade references',
    'Recently added supplier; KYC documents submitted, awaiting system update',
    'Emergency procurement from unregistered vendor; approved by VP Operations',
    'Vendor verification delayed due to system migration; manual approval granted',
  ],
  tax_miscalculation: [
    'Rounding difference of ₹2 in GST calculation; within acceptable tolerance',
    'Vendor applied inter-state rate; corrected during reconciliation, amount valid',
    'Composition scheme vendor; lower rate is correct per their GST registration',
    'Reverse charge mechanism applied; vendor not liable for GST on this service',
  ],
  amount_anomaly: [
    'Annual contract renewal; higher than typical monthly invoices but within annual budget',
    'Bulk order for Q1 inventory; pre-approved by department head',
    'One-time capital equipment purchase; approved via separate capex process',
    'Project-based billing higher than routine; matches project cost estimate',
    'Seasonal peak order; consistent with prior year Q1 volumes',
  ],
  po_missing: [
    'Emergency repair service; verbal approval by Plant Manager, documented post-facto',
    'Subscription renewal; standing order, no individual PO required per policy',
    'Government fee payment; no PO applicable per company procurement policy',
    'Petty cash reimbursement submitted as invoice; below PO threshold',
  ],
  new_vendor: [
    'Recently onboarded vendor; all documentation verified during registration',
    'New supplier replacing discontinued vendor; approved by sourcing team',
    'First invoice from this vendor; contract signed 2 weeks ago',
  ],
  currency_mismatch: [
    'International vendor invoicing in USD as per contract terms; FX conversion applied',
    'Cross-border service billed in EUR; approved under international procurement policy',
    'Software license from overseas vendor; standard practice for this category',
  ],
  po_quantity_mismatch: [
    'Additional units delivered per verbal agreement; PO amendment pending',
    'Vendor shipped overage within tolerance per contract Section 3.1',
    'Partial delivery billed separately; combined quantity matches PO',
  ],
};

function getCleanNote(rng: Rng): string {
  return rng.pick(CLEAN_NOTES);
}

function getUnusualNote(rng: Rng, flagType: string): string {
  const notes = UNUSUAL_LEGITIMATE_NOTES[flagType];
  if (!notes || notes.length === 0) return 'Investigated and confirmed legitimate';
  return rng.pick(notes);
}

// ============================================================
// Problem case construction helpers
// ============================================================

function getProblemNote(rng: Rng, problemType: ProblemType, c: MutableCase): string {
  switch (problemType) {
    case 'quantity_inflation': {
      const badItemIndex = c.invoice.lineItems.findIndex((li, idx) => li.quantity > c._poExpectedQuantities[idx]!);
      if (badItemIndex >= 0) {
        const item = c.invoice.lineItems[badItemIndex]!;
        const expected = c._poExpectedQuantities[badItemIndex]!;
        return `Billed for ${item.quantity} ${item.quantity === 1 ? 'unit' : 'units'} of "${item.description}" but only ${expected} received per delivery receipt`;
      }
      // Non-obvious: PO qty matches invoice, but physical receipt differs
      const firstItem = c.invoice.lineItems[0]!;
      const receivedQty = Math.max(1, firstItem.quantity - rng.nextInt(2, 4));
      return `Goods receipt for "${firstItem.description}" records ${receivedQty} ${receivedQty === 1 ? 'unit' : 'units'} delivered; invoice bills ${firstItem.quantity}`;
    }
    case 'price_inflation': {
      const firstItem = c.invoice.lineItems[0]!;
      if (c.intakeFlags && c.intakeFlags.po_price_variance > 0) {
        const poPrice = c._poExpectedPrices[0]!;
        return `"${firstItem.description}" invoiced at ₹${firstItem.unitPrice.toLocaleString('en-IN')}/unit; PO contracted rate is ₹${poPrice.toLocaleString('en-IN')}/unit (${c.intakeFlags.po_price_variance.toFixed(1)}% variance)`;
      }
      // Non-obvious: PO itself was inflated, so no variance flag fires
      return `Market rate audit found "${firstItem.description}" at ₹${firstItem.unitPrice.toLocaleString('en-IN')}/unit exceeds comparable vendor quotes by 30-50%; PO was raised at the inflated rate`;
    }
    case 'duplicate_submission': {
      if (c._duplicateSource) {
        return `Duplicate of invoice from ${c._duplicateSource.submissionDate}; same vendor (${c.vendor.name}), same amount (₹${c.invoice.totalAmount.toLocaleString('en-IN')})`;
      }
      return `Duplicate charge identified; ${c.vendor.name} submitted identical ₹${c.invoice.totalAmount.toLocaleString('en-IN')} invoice on a different date`;
    }
    case 'duplicate_across_formats': {
      const otherChannel = c.source === 'email' ? 'portal' : 'email';
      return `Same ₹${c.invoice.totalAmount.toLocaleString('en-IN')} charge from ${c.vendor.name} submitted via ${c.source} and ${otherChannel}; reconciliation confirmed single underlying transaction`;
    }
    case 'fraudulent_bank_details':
      return `Payment details altered to redirect funds to unauthorized account ending in ${c.invoice.paymentBankDetails.accountNumber.slice(-4)}`;
    case 'phantom_vendor': {
      return `"${c.vendor.name}" (${c.vendor.id}) could not be verified; registered address is a vacant lot, phone numbers route to voicemail, no GST filings found`;
    }
    case 'tax_miscalculation': {
      const correctTax = Math.round(c.invoice.subtotal * TAX_RATE);
      const overcharge = c.invoice.taxAmount - correctTax;
      return `Tax stated as ₹${c.invoice.taxAmount.toLocaleString('en-IN')} on subtotal ₹${c.invoice.subtotal.toLocaleString('en-IN')}; correct 18% GST is ₹${correctTax.toLocaleString('en-IN')} — overbilled by ₹${overcharge.toLocaleString('en-IN')}`;
    }
    case 'contract_violation': {
      const item = c.invoice.lineItems[0]!;
      return `"${item.description}" (${item.quantity} ${item.quantity === 1 ? 'unit' : 'units'} at ₹${item.unitPrice.toLocaleString('en-IN')}) not covered under master service agreement with ${c.vendor.name}; no amendment on file`;
    }
    default:
      return 'Investigation confirmed problem';
  }
}

// ============================================================
// Generation
// ============================================================

function generateCorpus(): Case[] {
  const rng = createRng(SEED);

  // Load baseline ruleset
  const baselineRaw = readFileSync(
    resolve(__dirname, '..', 'data', 'baselineRuleset.json'),
    'utf-8',
  );
  const baseline: Ruleset = JSON.parse(baselineRaw) as Ruleset;

  // Generate sorted dates for all 400 cases
  const allDates = generateAllDates(rng, TOTAL_CASES);

  // ── Step 1: Allocate ground truth ───────────────────────────────────
  const cases: MutableCase[] = [];

  // -- Clean cases (0..279) --
  for (let i = 0; i < CLEAN_COUNT; i++) {
    const vendor = REAL_VENDORS[i % REAL_VENDORS.length]!;
    const c = createBaseCase(rng, i, allDates[i]!, vendor, 'clean');
    c.groundTruth = {
      truth: 'LEGITIMATE',
      resolutionNote: getCleanNote(rng),
    };
    cases.push(c);
  }

  // -- Unusual cases (280..359) --
  // Pre-allocated by flag type per named collision requirements:
  //   280-283: duplicate_hash_match (4)
  //   284-287: tax_miscalculation (4)
  //   288-293: bank_details_changed (6)
  //   294-301: po_price_variance (8)
  //   302-306: vendor_unverified (5)
  //   307-316: amount_anomaly (10)
  //   317-324: po_missing (8)
  //   325-332: new_vendor (8)
  //   333-336: currency_mismatch (4)
  //   337-341: po_quantity_mismatch (5)
  //   342-359: combinations / misc (18)

  // Helper: create an unusual case at given index
  function createUnusualCase(
    index: number,
    vendor: VendorTemplate,
    flagType: string,
  ): MutableCase {
    const c = createBaseCase(rng, index, allDates[index]!, vendor, 'unusual');
    c.groundTruth = {
      truth: 'LEGITIMATE',
      resolutionNote: getUnusualNote(rng, flagType),
    };
    return c;
  }

  // 280-283: duplicate_hash_match legitimate (4 cases)
  // Each paired with a clean case — same vendor, amount, date
  for (let i = 0; i < 4; i++) {
    const caseIndex = CLEAN_COUNT + i; // 280-283
    const sourceIndex = i; // clean cases 0-3
    const sourceCase = cases[sourceIndex]!;
    const c = createUnusualCase(caseIndex, REAL_VENDORS[sourceIndex % REAL_VENDORS.length]!, 'duplicate_hash_match');
    // Copy vendor, amount, and date to create a matching hash
    c.vendor = { ...sourceCase.vendor };
    c.submissionDate = sourceCase.submissionDate;
    // Generate fresh line items but keep the same total
    const targetSubtotal = sourceCase.invoice.subtotal;
    const lineItems = generateLineItems(rng, c.vendor.name === sourceCase.vendor.name ? 
      (REAL_VENDORS.find(v => v.id === c.vendor.id)?.category ?? 'Services') : 'Services', targetSubtotal);
    const actualSubtotal = lineItems.reduce((sum, li) => sum + li.lineTotal, 0);
    const taxAmount = Math.round(actualSubtotal * TAX_RATE);
    c.invoice = {
      ...c.invoice,
      totalAmount: sourceCase.invoice.totalAmount,
      subtotal: actualSubtotal,
      taxAmount,
      lineItems,
      purchaseOrderReference: generatePoReference(rng, caseIndex),
      paymentBankDetails: { ...sourceCase.invoice.paymentBankDetails },
    };
    // Adjust total to exactly match source for hash computation
    c.invoice.totalAmount = sourceCase.invoice.totalAmount;
    c._poExpectedPrices = lineItems.map(li => li.unitPrice);
    c._poExpectedQuantities = lineItems.map(li => li.quantity);
    cases.push(c);
  }

  // 284-287: tax_miscalculation legitimate (4 cases)
  for (let i = 0; i < 4; i++) {
    const caseIndex = CLEAN_COUNT + 4 + i;
    const vendor = REAL_VENDORS[(caseIndex + 5) % REAL_VENDORS.length]!;
    const c = createUnusualCase(caseIndex, vendor, 'tax_miscalculation');
    // Introduce a small tax discrepancy (rounding, within tolerance of a human)
    const correctTax = Math.round(c.invoice.subtotal * TAX_RATE);
    const offset = rng.pick([-3, -2, 2, 3, 5, -5]);
    c.invoice = {
      ...c.invoice,
      taxAmount: correctTax + offset,
      totalAmount: c.invoice.subtotal + correctTax + offset,
    };
    cases.push(c);
  }

  // 288-293: bank_details_changed legitimate (6 cases)
  // Each from a vendor that has prior clean cases with different (old) bank details
  for (let i = 0; i < 6; i++) {
    const caseIndex = CLEAN_COUNT + 8 + i;
    const vendorIdx = (10 + i) % REAL_VENDORS.length;
    const vendor = REAL_VENDORS[vendorIdx]!;
    const c = createUnusualCase(caseIndex, vendor, 'bank_details_changed');
    // Use alternate bank details
    const suffix = rng.nextInt(1000, 9999);
    c.invoice = {
      ...c.invoice,
      paymentBankDetails: {
        accountNumber: `${vendor.id}ALT${suffix}`,
        ifscCode: `ICIC0008${rng.nextInt(100, 999)}`,
      },
    };
    cases.push(c);
  }

  // 294-301: po_price_variance legitimate (8 cases)
  for (let i = 0; i < 8; i++) {
    const caseIndex = CLEAN_COUNT + 14 + i;
    const vendor = REAL_VENDORS[(caseIndex + 3) % REAL_VENDORS.length]!;
    const c = createUnusualCase(caseIndex, vendor, 'po_price_variance');
    // PO had different prices; invoice reflects amended contract
    const variance = rng.nextFloat(5, 25); // 5-25% variance
    c._poExpectedPrices = c.invoice.lineItems.map((li) =>
      Math.round(li.unitPrice / (1 + variance / 100)),
    );
    cases.push(c);
  }

  // 302-306: vendor_unverified legitimate (5 cases)
  // Use specific unverified vendor IDs (not in the verified registry)
  for (let i = 0; i < 5; i++) {
    const caseIndex = CLEAN_COUNT + 22 + i;
    // Create "new real vendors" that aren't yet in the verified registry
    const unverifiedVendors: VendorTemplate[] = [
      { name: 'Naveen Tech Services', id: 'V031', category: 'IT', typicalMin: 15000, typicalMax: 90000, isPhantom: false, defaultAccountNumber: '3101234567', defaultIfscCode: 'SBIN0031234' },
      { name: 'Shree Ganesh Traders', id: 'V032', category: 'Trading', typicalMin: 5000, typicalMax: 50000, isPhantom: false, defaultAccountNumber: '3201234567', defaultIfscCode: 'HDFC0032345' },
      { name: 'BlueStar Facilities', id: 'V033', category: 'Facilities', typicalMin: 10000, typicalMax: 70000, isPhantom: false, defaultAccountNumber: '3301234567', defaultIfscCode: 'ICIC0033456' },
      { name: 'Kavitha Enterprises', id: 'V034', category: 'Office', typicalMin: 3000, typicalMax: 30000, isPhantom: false, defaultAccountNumber: '3401234567', defaultIfscCode: 'UTIB0034567' },
      { name: 'Sundar Consulting', id: 'V035', category: 'Consulting', typicalMin: 20000, typicalMax: 100000, isPhantom: false, defaultAccountNumber: '3501234567', defaultIfscCode: 'KKBK0035678' },
    ];
    const vendor = unverifiedVendors[i]!;
    const c = createUnusualCase(caseIndex, vendor, 'vendor_unverified');
    c.vendor.relationshipAgeDays = rng.nextInt(5, 45);
    c.vendor.historicalInvoiceCount = rng.nextInt(0, 3);
    cases.push(c);
  }

  // 307-316: amount_anomaly legitimate (10 cases)
  for (let i = 0; i < 10; i++) {
    const caseIndex = CLEAN_COUNT + 27 + i;
    const vendor = REAL_VENDORS[(caseIndex + 7) % REAL_VENDORS.length]!;
    const c = createUnusualCase(caseIndex, vendor, 'amount_anomaly');
    // Make amount > 3x typical max
    const targetSubtotal = rng.nextInt(
      vendor.typicalMax * 3 + 1000,
      vendor.typicalMax * 5,
    );
    const lineItems = generateLineItems(rng, vendor.category, targetSubtotal);
    const actualSubtotal = lineItems.reduce((sum, li) => sum + li.lineTotal, 0);
    const taxAmount = Math.round(actualSubtotal * TAX_RATE);
    c.invoice = {
      ...c.invoice,
      totalAmount: actualSubtotal + taxAmount,
      subtotal: actualSubtotal,
      taxAmount,
      lineItems,
    };
    c._poExpectedPrices = lineItems.map(li => li.unitPrice);
    c._poExpectedQuantities = lineItems.map(li => li.quantity);
    cases.push(c);
  }

  // 317-324: po_missing legitimate (8 cases)
  for (let i = 0; i < 8; i++) {
    const caseIndex = CLEAN_COUNT + 37 + i;
    const vendor = REAL_VENDORS[(caseIndex + 11) % REAL_VENDORS.length]!;
    const c = createUnusualCase(caseIndex, vendor, 'po_missing');
    c.invoice = { ...c.invoice, purchaseOrderReference: null };
    cases.push(c);
  }

  // 325-332: new_vendor legitimate (8 cases)
  for (let i = 0; i < 8; i++) {
    const caseIndex = CLEAN_COUNT + 45 + i;
    const vendor = REAL_VENDORS[(caseIndex + 13) % REAL_VENDORS.length]!;
    const c = createUnusualCase(caseIndex, vendor, 'new_vendor');
    c.vendor.relationshipAgeDays = rng.nextInt(1, 29);
    c.vendor.historicalInvoiceCount = rng.nextInt(0, 2);
    cases.push(c);
  }

  // 333-336: currency_mismatch legitimate (4 cases)
  for (let i = 0; i < 4; i++) {
    const caseIndex = CLEAN_COUNT + 53 + i;
    const vendor = REAL_VENDORS[(caseIndex + 17) % REAL_VENDORS.length]!;
    const c = createUnusualCase(caseIndex, vendor, 'currency_mismatch');
    convertToForeignCurrency(c, rng.pick(['USD', 'EUR', 'GBP']));
    cases.push(c);
  }

  // 337-341: po_quantity_mismatch legitimate (5 cases)
  for (let i = 0; i < 5; i++) {
    const caseIndex = CLEAN_COUNT + 57 + i;
    const vendor = REAL_VENDORS[(caseIndex + 19) % REAL_VENDORS.length]!;
    const c = createUnusualCase(caseIndex, vendor, 'po_quantity_mismatch');
    // PO had different quantities
    c._poExpectedQuantities = c.invoice.lineItems.map((li) =>
      Math.max(1, li.quantity - rng.nextInt(1, 3)),
    );
    cases.push(c);
  }

  // 342-359: misc unusual (18 cases) — combinations or other flags
  for (let i = 0; i < 18; i++) {
    const caseIndex = CLEAN_COUNT + 62 + i;
    const vendor = REAL_VENDORS[(caseIndex + 23) % REAL_VENDORS.length]!;
    const flagType = rng.pick([
      'amount_anomaly', 'po_missing', 'new_vendor', 'po_price_variance',
      'bank_details_changed', 'po_quantity_mismatch',
    ]);
    const c = createUnusualCase(caseIndex, vendor, flagType);

    // Apply the chosen flag's content modification
    switch (flagType) {
      case 'amount_anomaly': {
        const targetSub = rng.nextInt(vendor.typicalMax * 3 + 500, vendor.typicalMax * 4);
        const lis = generateLineItems(rng, vendor.category, targetSub);
        const sub = lis.reduce((s, li) => s + li.lineTotal, 0);
        const tax = Math.round(sub * TAX_RATE);
        c.invoice = { ...c.invoice, totalAmount: sub + tax, subtotal: sub, taxAmount: tax, lineItems: lis };
        c._poExpectedPrices = lis.map(li => li.unitPrice);
        c._poExpectedQuantities = lis.map(li => li.quantity);
        break;
      }
      case 'po_missing':
        c.invoice = { ...c.invoice, purchaseOrderReference: null };
        break;
      case 'new_vendor':
        c.vendor.relationshipAgeDays = rng.nextInt(1, 29);
        c.vendor.historicalInvoiceCount = rng.nextInt(0, 2);
        break;
      case 'po_price_variance':
        c._poExpectedPrices = c.invoice.lineItems.map(li =>
          Math.round(li.unitPrice / (1 + rng.nextFloat(3, 15) / 100)),
        );
        break;
      case 'bank_details_changed': {
        const sfx = rng.nextInt(1000, 9999);
        c.invoice = {
          ...c.invoice,
          paymentBankDetails: {
            accountNumber: `${vendor.id}ALT${sfx}`,
            ifscCode: `ICIC0009${rng.nextInt(100, 999)}`,
          },
        };
        break;
      }
      case 'po_quantity_mismatch':
        c._poExpectedQuantities = c.invoice.lineItems.map(li =>
          Math.max(1, li.quantity - rng.nextInt(1, 2)),
        );
        break;
      case 'currency_mismatch':
        convertToForeignCurrency(c, rng.pick(['USD', 'EUR', 'GBP']));
        break;
      case 'tax_miscalculation': {
        const correctTax = Math.round(c.invoice.subtotal * TAX_RATE);
        c.invoice.taxAmount = correctTax + rng.pick([-150, 200, 300]);
        c.invoice.totalAmount = c.invoice.subtotal + c.invoice.taxAmount;
        break;
      }
    }
    cases.push(c);
  }

  // -- Problem cases (360..399) --
  // Distribution per dataset.md §5:
  //   360-367: duplicate_submission (8)
  //   368-373: fraudulent_bank_details (6)
  //   374-379: price_inflation (6)
  //   380-384: quantity_inflation (5)
  //   385-389: phantom_vendor (5)
  //   390-393: tax_miscalculation (4)
  //   394-396: duplicate_across_formats (3)
  //   397-399: contract_violation (3)

  // Helper for problem cases
  function createProblemCase(
    index: number,
    vendor: VendorTemplate,
    problemType: ProblemType,
    isNonObvious: boolean,
  ): MutableCase {
    const c = createBaseCase(rng, index, allDates[index]!, vendor, 'problem');
    c._isNonObvious = isNonObvious;
    c.groundTruth = {
      truth: 'PROBLEM',
      problemType,
      resolutionNote: '', // will be set at the end when data is finalized!
    };
    return c;
  }

  // 360-363: duplicate_submission, obvious (4) — duplicate_hash_match = true
  for (let i = 0; i < 4; i++) {
    const caseIndex = CLEAN_COUNT + UNUSUAL_COUNT + i;
    const sourceIndex = i; // clean cases 0-3 as sources
    const sourceCase = cases[sourceIndex]!;
    const vendorTemplate = REAL_VENDORS.find(v => v.id === sourceCase.vendor.id) ?? rng.pick(REAL_VENDORS);
    const c = createProblemCase(caseIndex, vendorTemplate, 'duplicate_submission', false);
    c._duplicateSource = sourceCase;
    // Copy vendor, date, and total to trigger duplicate_hash_match
    c.vendor = { ...sourceCase.vendor };
    c.submissionDate = sourceCase.submissionDate;
    c.invoice = {
      ...c.invoice,
      totalAmount: sourceCase.invoice.totalAmount,
      subtotal: sourceCase.invoice.subtotal,
      taxAmount: sourceCase.invoice.taxAmount,
      lineItems: [...sourceCase.invoice.lineItems],
      paymentBankDetails: { ...sourceCase.invoice.paymentBankDetails },
    };
    c._poExpectedPrices = [...sourceCase._poExpectedPrices];
    c._poExpectedQuantities = [...sourceCase._poExpectedQuantities];
    cases.push(c);
  }

  // 364-367: duplicate_submission, non-obvious (4) — dates differ so no hash match
  for (let i = 0; i < 4; i++) {
    const caseIndex = CLEAN_COUNT + UNUSUAL_COUNT + 4 + i;
    const sourceIndex = 4 + i; // clean cases 4-7
    const sourceCase = cases[sourceIndex]!;
    const vendorTemplate = REAL_VENDORS.find(v => v.id === sourceCase.vendor.id) ?? rng.pick(REAL_VENDORS);
    const c = createProblemCase(caseIndex, vendorTemplate, 'duplicate_submission', true);
    // DO NOT set c._duplicateSource, so it gets a DIFFERENT date randomly from the dates list!
    c.vendor = { ...sourceCase.vendor };
    // Same vendor and amount but DIFFERENT date → no hash match
    c.invoice = {
      ...c.invoice,
      totalAmount: sourceCase.invoice.totalAmount,
      subtotal: sourceCase.invoice.subtotal,
      taxAmount: sourceCase.invoice.taxAmount,
      lineItems: [...sourceCase.invoice.lineItems],
      paymentBankDetails: { ...sourceCase.invoice.paymentBankDetails },
    };
    c._poExpectedPrices = [...sourceCase._poExpectedPrices];
    c._poExpectedQuantities = [...sourceCase._poExpectedQuantities];
    
    // Non-obvious: set amount below threshold for APPROVE
    // Duplicates are genuine mistakes, not deliberate fraud — no minimum floor
    if (c.invoice.totalAmount >= 100000) {
      const targetSub = rng.nextInt(25000, 70000);
      const lis = generateLineItems(rng, vendorTemplate.category, targetSub);
      const sub = lis.reduce((s, li) => s + li.lineTotal, 0);
      const tax = Math.round(sub * TAX_RATE);
      c.invoice = { ...c.invoice, totalAmount: sub + tax, subtotal: sub, taxAmount: tax, lineItems: lis };
      c._poExpectedPrices = lis.map(li => li.unitPrice);
      c._poExpectedQuantities = lis.map(li => li.quantity);
    }
    cases.push(c);
  }

  // 368-371: fraudulent_bank_details, obvious (4) — bank_details_changed = true
  for (let i = 0; i < 4; i++) {
    const caseIndex = CLEAN_COUNT + UNUSUAL_COUNT + 8 + i;
    const validVendors = REAL_VENDORS.filter(v => v.typicalMax >= 40000);
    const vendor = rng.pick(validVendors);
    // Enforce fraud floor natively
    const vendorForCase = { ...vendor, typicalMin: Math.max(40000, vendor.typicalMin) };
    const c = createProblemCase(caseIndex, vendorForCase, 'fraudulent_bank_details', false);
    // Fraudulent bank details (different from vendor's default)
    c.invoice = {
      ...c.invoice,
      paymentBankDetails: {
        accountNumber: `FRAUD${rng.nextInt(10000, 99999)}`,
        ifscCode: `UTIB0099${rng.nextInt(100, 999)}`,
      },
    };
    cases.push(c);
  }

  // 372-373: fraudulent_bank_details, non-obvious (2)
  // First invoice from this "vendor identity" → no prior bank details to compare
  for (let i = 0; i < 2; i++) {
    const caseIndex = CLEAN_COUNT + UNUSUAL_COUNT + 12 + i;
    // Use a vendor ID that has NO prior invoices in the corpus
    const uniqueVendors: VendorTemplate[] = [
      { name: 'Reliable Office Solutions', id: 'V036', category: 'Office', typicalMin: 5000, typicalMax: 40000, isPhantom: false, defaultAccountNumber: '3601234567', defaultIfscCode: 'SBIN0036234' },
      { name: 'Akash IT Infra', id: 'V037', category: 'IT', typicalMin: 15000, typicalMax: 80000, isPhantom: false, defaultAccountNumber: '3701234567', defaultIfscCode: 'HDFC0037345' },
    ];
    const vendor = uniqueVendors[i]!;
    const c = createProblemCase(caseIndex, vendor, 'fraudulent_bank_details', true);
    // Non-obvious: amount below threshold, high confidence → APPROVE (missed)
    // Deliberate fraud — minimum ₹40K subtotal
    const targetSub = rng.nextInt(40000, 70000);
    const lis = generateLineItems(rng, vendor.category, targetSub);
    const sub = lis.reduce((s, li) => s + li.lineTotal, 0);
    const tax = Math.round(sub * TAX_RATE);
    c.invoice = { ...c.invoice, totalAmount: sub + tax, subtotal: sub, taxAmount: tax, lineItems: lis };
    c._poExpectedPrices = lis.map(li => li.unitPrice);
    c._poExpectedQuantities = lis.map(li => li.quantity);
    // Mark vendor as verified (to avoid vendor_unverified flag)
    VERIFIED_VENDOR_IDS.add(vendor.id);
    c.vendor.relationshipAgeDays = rng.nextInt(60, 300);
    c.vendor.historicalInvoiceCount = 0; // first invoice
    cases.push(c);
  }

  const highVendors = REAL_VENDORS.filter(v => v.typicalMax >= 95000);

  // Deliberate fraud clusters below the approval threshold.
  // Minimum ₹40K subtotal — nobody commits deliberate fraud for less.
  function getClusteredSubtotal(): number {
    return rng.nextInt(120000, 248000);
  }

  // 374-377: price_inflation, obvious (4) — po_price_variance > 0
  for (let i = 0; i < 4; i++) {
    const caseIndex = CLEAN_COUNT + UNUSUAL_COUNT + 14 + i;
    const vendor = rng.pick(highVendors);
    const c = createProblemCase(caseIndex, vendor, 'price_inflation', false);
    // Invoice prices inflated vs PO (30-60% higher)
    const inflationPct = rng.nextFloat(30, 60);
    const targetSub = getClusteredSubtotal();
    const lis = generateLineItems(rng, vendor.category, targetSub);
    const sub = lis.reduce((s, li) => s + li.lineTotal, 0);
    const tax = Math.round(sub * TAX_RATE);
    c.invoice = { ...c.invoice, totalAmount: sub + tax, subtotal: sub, taxAmount: tax, lineItems: lis };
    c._poExpectedPrices = lis.map(li => Math.round(li.unitPrice / (1 + inflationPct / 100)));
    c._poExpectedQuantities = lis.map(li => li.quantity);
    cases.push(c);
  }

  // 378-379: price_inflation, non-obvious (2) — PO itself was inflated
  for (let i = 0; i < 2; i++) {
    const caseIndex = CLEAN_COUNT + UNUSUAL_COUNT + 18 + i;
    const vendor = rng.pick(highVendors);
    const c = createProblemCase(caseIndex, vendor, 'price_inflation', true);
    // Invoice matches inflated PO, so po_price_variance = 0
    const targetSub = getClusteredSubtotal();
    const lis = generateLineItems(rng, vendor.category, targetSub);
    const sub = lis.reduce((s, li) => s + li.lineTotal, 0);
    const tax = Math.round(sub * TAX_RATE);
    c.invoice = { ...c.invoice, totalAmount: sub + tax, subtotal: sub, taxAmount: tax, lineItems: lis };
    c._poExpectedPrices = lis.map(li => li.unitPrice);
    c._poExpectedQuantities = lis.map(li => li.quantity);
    cases.push(c);
  }

  // 380-382: quantity_inflation, obvious (3) — po_quantity_mismatch
  for (let i = 0; i < 3; i++) {
    const caseIndex = CLEAN_COUNT + UNUSUAL_COUNT + 20 + i;
    const vendor = rng.pick(highVendors);
    const c = createProblemCase(caseIndex, vendor, 'quantity_inflation', false);
    // Invoice quantities exceed PO quantities
    const targetSub = getClusteredSubtotal();
    const lis = generateLineItems(rng, vendor.category, targetSub);
    const sub = lis.reduce((s, li) => s + li.lineTotal, 0);
    const tax = Math.round(sub * TAX_RATE);
    c.invoice = { ...c.invoice, totalAmount: sub + tax, subtotal: sub, taxAmount: tax, lineItems: lis };
    c._poExpectedPrices = lis.map(li => li.unitPrice);
    c._poExpectedQuantities = lis.map(li => Math.max(1, li.quantity - rng.nextInt(2, 5)));
    cases.push(c);
  }

  // 383-384: quantity_inflation, non-obvious (2) — qty matches PO
  for (let i = 0; i < 2; i++) {
    const caseIndex = CLEAN_COUNT + UNUSUAL_COUNT + 23 + i;
    const vendor = rng.pick(highVendors);
    const c = createProblemCase(caseIndex, vendor, 'quantity_inflation', true);
    // Invoice qty matches PO (but received less — not detectable by flags)
    const targetSub = getClusteredSubtotal();
    const lis = generateLineItems(rng, vendor.category, targetSub);
    // Ensure first item has enough quantity to express inflation
    if (lis[0] && lis[0].quantity <= 2) {
      lis[0].quantity = 4;
      lis[0].lineTotal = lis[0].quantity * lis[0].unitPrice;
    }
    const sub = lis.reduce((s, li) => s + li.lineTotal, 0);
    const tax = Math.round(sub * TAX_RATE);
    c.invoice = { ...c.invoice, totalAmount: sub + tax, subtotal: sub, taxAmount: tax, lineItems: lis };
    c._poExpectedPrices = lis.map(li => li.unitPrice);
    c._poExpectedQuantities = lis.map(li => li.quantity);
    cases.push(c);
  }

  // 385-389: phantom_vendor (5) — all obvious (vendor_unverified)
  // Deliberate fraud — enforce minimum ₹40K subtotal
  for (let i = 0; i < 5; i++) {
    const caseIndex = CLEAN_COUNT + UNUSUAL_COUNT + 25 + i;
    const vendor = rng.pick(PHANTOM_VENDORS);
    // Enforce fraud floor natively
    const vendorForCase = { ...vendor, typicalMin: Math.max(40000, vendor.typicalMin) };
    const c = createProblemCase(caseIndex, vendorForCase, 'phantom_vendor', false);
    c.vendor.relationshipAgeDays = rng.nextInt(5, 60);
    c.vendor.historicalInvoiceCount = rng.nextInt(0, 3);
    cases.push(c);
  }

  // 390-393: tax_miscalculation, obvious (4)
  // Tax miscalculation always overbills — the error is in the vendor's favour.
  // Tax errors can be genuine mistakes, so no fraud-amount floor applies.
  for (let i = 0; i < 4; i++) {
    const caseIndex = CLEAN_COUNT + UNUSUAL_COUNT + 30 + i;
    const c = createProblemCase(caseIndex, rng.pick(REAL_VENDORS), 'tax_miscalculation', false);
    // Positive offset only: vendor charges more tax than correct
    const offset = rng.pick([1500, 2000, 3000, 4000]);
    c.invoice = {
      ...c.invoice,
      taxAmount: Math.round(c.invoice.subtotal * TAX_RATE) + offset,
      totalAmount: c.invoice.subtotal + Math.round(c.invoice.subtotal * TAX_RATE) + offset,
    };
    cases.push(c);
  }

  // 394-396: duplicate_across_formats, non-obvious (3) — hash doesn't match
  for (let i = 0; i < 3; i++) {
    const caseIndex = CLEAN_COUNT + UNUSUAL_COUNT + 34 + i;
    const sourceIndex = 20 + i; // clean cases as sources
    const sourceCase = cases[sourceIndex]!;
    const vendorTemplate = REAL_VENDORS.find(v => v.id === sourceCase.vendor.id) ?? rng.pick(REAL_VENDORS);
    const c = createProblemCase(caseIndex, vendorTemplate, 'duplicate_across_formats', true);
    c.vendor = { ...sourceCase.vendor };
    // Same vendor and amount but different source format and different date → no hash match
    c.source = sourceCase.source === 'email' ? 'portal' : 'email';
    c.invoice = {
      ...c.invoice,
      totalAmount: sourceCase.invoice.totalAmount,
      subtotal: sourceCase.invoice.subtotal,
      taxAmount: sourceCase.invoice.taxAmount,
      lineItems: [...sourceCase.invoice.lineItems],
      paymentBankDetails: { ...sourceCase.invoice.paymentBankDetails },
    };
    c._poExpectedPrices = [...sourceCase._poExpectedPrices];
    c._poExpectedQuantities = [...sourceCase._poExpectedQuantities];

    // Ensure amounts are in the right ranges for desired decisions
    if (i === 0) {
      // Below threshold → APPROVE (missed)
      if (c.invoice.totalAmount >= 100000) {
        const targetSub = rng.nextInt(35000, 65000);
        const lis = generateLineItems(rng, vendorTemplate.category, targetSub);
        const sub = lis.reduce((s, li) => s + li.lineTotal, 0);
        const tax = Math.round(sub * TAX_RATE);
        c.invoice = { ...c.invoice, totalAmount: sub + tax, subtotal: sub, taxAmount: tax, lineItems: lis };
        c._poExpectedPrices = lis.map(li => li.unitPrice);
        c._poExpectedQuantities = lis.map(li => li.quantity);
      }
    } else {
      // Above threshold → ESCALATE (Force amount between 102k and 118k for regression test for at least one)
      if (c.invoice.totalAmount < 100000 || i === 1) {
        const targetSub = i === 1 ? rng.nextInt(86000, 99000) : rng.nextInt(100000, 150000);
        const lis = generateLineItems(rng, vendorTemplate.category, targetSub);
        const sub = lis.reduce((s, li) => s + li.lineTotal, 0);
        const tax = Math.round(sub * TAX_RATE);
        c.invoice = { ...c.invoice, totalAmount: sub + tax, subtotal: sub, taxAmount: tax, lineItems: lis };
        c._poExpectedPrices = lis.map(li => li.unitPrice);
        c._poExpectedQuantities = lis.map(li => li.quantity);
      }
    }
    cases.push(c);
  }

  // 397-399: contract_violation, non-obvious (3) — no flags exist for this
  for (let i = 0; i < 3; i++) {
    const caseIndex = CLEAN_COUNT + UNUSUAL_COUNT + 37 + i;
    const vendor = rng.pick(highVendors);
    const c = createProblemCase(caseIndex, vendor, 'contract_violation', true);
    // Submitter prices correctly under threshold, confident it won't be checked
    const targetSub = getClusteredSubtotal();
    const lis = generateLineItems(rng, vendor.category, targetSub);
    const sub = lis.reduce((s, li) => s + li.lineTotal, 0);
    const tax = Math.round(sub * TAX_RATE);
    c.invoice = { ...c.invoice, totalAmount: sub + tax, subtotal: sub, taxAmount: tax, lineItems: lis };
    c._poExpectedPrices = lis.map(li => li.unitPrice);
    c._poExpectedQuantities = lis.map(li => li.quantity);
    cases.push(c);
  }

  // ── Shuffle then assign sequential IDs ──────────────────────────────
  // All 400 case objects exist; shuffle so problem cases are distributed
  // throughout the corpus rather than clustered at the end.
  const shuffledCases = rng.shuffle(cases);
  for (let i = 0; i < shuffledCases.length; i++) {
    shuffledCases[i]!.id = `INV-2026-${String(i + 1).padStart(4, '0')}`;
  }

  // ── Step 3: Compute intake flags mechanically ──────────────────────
  computeFlags(shuffledCases);

  // ── Step 4: Assign extractionConfidence ────────────────────────────
  assignConfidence(rng, shuffledCases);

  // ── Step 5: Assign Problem Resolution Notes ────────────────────────
  for (const c of shuffledCases) {
    if (c.groundTruth.truth === 'PROBLEM') {
      c.groundTruth.resolutionNote = getProblemNote(rng, c.groundTruth.problemType, c);
    }
  }

  // ── Step 6: Apply baseline → recorded decisions ────────────────────
  for (const c of shuffledCases) {
    const result = evaluateCase(baseline, c as Case);
    c.recordedDecision = {
      decision: result.decision,
      rulesetVersion: baseline.version,
    };
    if (result.decision === 'ESCALATE') {
      c.recordedDecision = {
        ...c.recordedDecision,
        humanAction: c.groundTruth.truth === 'PROBLEM' ? 'BLOCK' : 'APPROVE',
      };
    }
  }

  // Strip internal fields and return
  return shuffledCases.map(stripInternalFields);
}

// ============================================================
// Flag computation
// ============================================================

function computeFlags(cases: MutableCase[]): void {
  // Build vendor bank history for bank_details_changed detection
  // Track (vendorId → last seen bank details) in submission-date order
  const vendorBankHistory = new Map<string, { accountNumber: string; ifscCode: string }>();

  // Build hash set for duplicate_hash_match detection
  // Key: "vendorId|totalAmount|date"
  const invoiceHashes = new Set<string>();

  // Sort indices by submission date for chronological processing
  const sortedIndices = cases
    .map((_, idx) => idx)
    .sort((a, b) => {
      const dateA = cases[a]!.submissionDate;
      const dateB = cases[b]!.submissionDate;
      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
      return a - b; // stable sort by index
    });

  for (const idx of sortedIndices) {
    const c = cases[idx]!;
    const flags = c.intakeFlags;

    // duplicate_hash_match: identical vendor, amount, and date
    const hashKey = `${c.vendor.id}|${c.invoice.totalAmount}|${c.submissionDate}`;
    if (invoiceHashes.has(hashKey)) {
      flags.duplicate_hash_match = true;
    }
    invoiceHashes.add(hashKey);

    // bank_details_changed: payment details differ from vendor's last invoice
    const lastBank = vendorBankHistory.get(c.vendor.id);
    if (lastBank !== undefined) {
      if (
        lastBank.accountNumber !== c.invoice.paymentBankDetails.accountNumber ||
        lastBank.ifscCode !== c.invoice.paymentBankDetails.ifscCode
      ) {
        flags.bank_details_changed = true;
      }
    }
    vendorBankHistory.set(c.vendor.id, { ...c.invoice.paymentBankDetails });

    // new_vendor: relationship under 30 days
    flags.new_vendor = c.vendor.relationshipAgeDays < 30;

    // amount_anomaly: amount > 3x typical max
    flags.amount_anomaly =
      c.invoice.totalAmount > 3 * c.vendor.typicalAmountRange.max;

    // po_missing: no purchase order reference
    flags.po_missing = c.invoice.purchaseOrderReference === null;

    // po_quantity_mismatch: invoice qty differs from PO qty
    if (c.invoice.purchaseOrderReference !== null && c._poExpectedQuantities.length > 0) {
      flags.po_quantity_mismatch = c.invoice.lineItems.some(
        (li, liIdx) => {
          const expected = c._poExpectedQuantities[liIdx];
          return expected !== undefined && li.quantity !== expected;
        },
      );
    }

    // po_price_variance: percentage difference between invoice and PO prices
    if (c.invoice.purchaseOrderReference !== null && c._poExpectedPrices.length > 0) {
      let maxVariance = 0;
      for (let liIdx = 0; liIdx < c.invoice.lineItems.length; liIdx++) {
        const invoicePrice = c.invoice.lineItems[liIdx]!.unitPrice;
        const poPrice = c._poExpectedPrices[liIdx];
        if (poPrice !== undefined && poPrice > 0) {
          const variance = Math.abs(invoicePrice - poPrice) / poPrice * 100;
          maxVariance = Math.max(maxVariance, variance);
        }
      }
      flags.po_price_variance = roundToTwo(maxVariance);
    }

    // tax_miscalculation: stated tax differs from computed
    const expectedTax = Math.round(c.invoice.subtotal * c.invoice.taxRate);
    flags.tax_miscalculation =
      Math.abs(c.invoice.taxAmount - expectedTax) > TAX_TOLERANCE;

    // currency_mismatch: not INR
    flags.currency_mismatch = c.invoice.currency !== 'INR';

    // vendor_unverified: not in verified registry
    flags.vendor_unverified = !VERIFIED_VENDOR_IDS.has(c.vendor.id);
  }
}

// ============================================================
// Confidence assignment
// ============================================================

function assignConfidence(rng: Rng, cases: MutableCase[]): void {
  for (const c of cases) {
    switch (c._segment) {
      case 'clean': {
        const roll = rng.nextFloat(0, 1);
        if (roll < 0.10) {
          // ~28 cases in [0.80, 0.84] — these move when lowering threshold to 0.80
          c.extractionConfidence = roundToTwo(rng.nextFloat(0.80, 0.84));
        } else if (roll < 0.20) {
          // ~28 cases in [0.85, 0.89] — these move when raising threshold to 0.90
          c.extractionConfidence = roundToTwo(rng.nextFloat(0.85, 0.89));
        } else {
          // ~224 cases in [0.90, 0.99] — these are stable
          c.extractionConfidence = roundToTwo(rng.nextFloat(0.90, 0.99));
        }
        break;
      }
      case 'unusual':
        // Slightly lower, more varied
        c.extractionConfidence = roundToTwo(rng.nextFloat(0.78, 0.95));
        break;
      case 'problem':
        if (c._isNonObvious) {
          // Non-obvious problems should have high confidence (to pass threshold)
          c.extractionConfidence = roundToTwo(rng.nextFloat(0.88, 0.96));
        } else {
          // Obvious problems: varied confidence
          c.extractionConfidence = roundToTwo(rng.nextFloat(0.80, 0.95));
        }
        break;
    }
  }
}

// ============================================================
// Output
// ============================================================

function stripInternalFields(c: MutableCase): Case {
  const {
    _segment: _s,
    _isNonObvious: _n,
    _poExpectedPrices: _pp,
    _poExpectedQuantities: _pq,
    ...rest
  } = c;
  return rest as Case;
}

// ============================================================
// Main
// ============================================================

const corpus = generateCorpus();

// Validate counts before writing
const legitimateCount = corpus.filter((c) => c.groundTruth.truth === 'LEGITIMATE').length;
const problemCount = corpus.filter((c) => c.groundTruth.truth === 'PROBLEM').length;

console.log(`Generated ${corpus.length} cases`);
console.log(`  LEGITIMATE: ${legitimateCount}`);
console.log(`  PROBLEM: ${problemCount}`);

if (corpus.length !== TOTAL_CASES) {
  console.error(`ERROR: Expected ${TOTAL_CASES} cases, got ${corpus.length}`);
  process.exit(1);
}
if (legitimateCount !== 360) {
  console.error(`ERROR: Expected 360 LEGITIMATE, got ${legitimateCount}`);
  process.exit(1);
}
if (problemCount !== 40) {
  console.error(`ERROR: Expected 40 PROBLEM, got ${problemCount}`);
  process.exit(1);
}

// Count decisions
const decisions = { APPROVE: 0, ESCALATE: 0, BLOCK: 0 };
for (const c of corpus) {
  decisions[c.recordedDecision.decision]++;
}
console.log(`  Decisions: APPROVE=${decisions.APPROVE}, ESCALATE=${decisions.ESCALATE}, BLOCK=${decisions.BLOCK}`);

// Count missed problems (APPROVE + PROBLEM)
const missedProblems = corpus.filter(
  (c) => c.groundTruth.truth === 'PROBLEM' && c.recordedDecision.decision === 'APPROVE',
).length;
console.log(`  Missed problems (baseline): ${missedProblems}`);

// Print problem case IDs and vendor IDs
console.log(`\nProblem cases (ID → Vendor ID):`);
for (const c of corpus) {
  if (c.groundTruth.truth === 'PROBLEM') {
    console.log(`  ${c.id}  ${c.vendor.id}  (${c.groundTruth.problemType})`);
  }
}

// Write output
const dataDir = resolve(__dirname, '..', 'data');
mkdirSync(dataDir, { recursive: true });
writeFileSync(
  resolve(dataDir, 'corpus.json'),
  JSON.stringify(corpus, null, 2),
);
console.log(`\nCorpus written to data/corpus.json`);
