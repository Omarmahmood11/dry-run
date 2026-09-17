'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Ruleset, PolicyCheckName, VendorExceptionKind } from '@/lib/types';
import { corpus } from '@/lib/corpus';

type PendingChange =
  | { type: 'threshold'; field: 'amountThreshold' | 'extractionConfidenceThreshold'; value: number }
  | { type: 'policy'; field: PolicyCheckName; value: boolean }
  | { type: 'vendor'; vendorId: string; vendorName: string; exception: VendorExceptionKind | null };

interface ChangeProposalFormProps {
  liveRuleset: Ruleset;
  onChange?: (proposedRuleset: Ruleset | null, summary?: string) => void;
}

const POLICY_CHECK_NAMES: PolicyCheckName[] = [
  'duplicate_hash_match',
  'bank_details_changed',
  'new_vendor',
  'amount_anomaly',
  'po_missing',
  'po_quantity_mismatch',
  'po_price_variance',
  'tax_miscalculation',
  'currency_mismatch',
  'vendor_unverified',
];

export function deriveProposedRuleset(base: Ruleset, change: PendingChange | null): Ruleset {
  if (!change) return base;
  if (change.type === 'threshold') {
    return { ...base, thresholds: { ...base.thresholds, [change.field]: change.value } };
  }
  if (change.type === 'policy') {
    return { ...base, policyChecks: { ...base.policyChecks, [change.field]: change.value } };
  }
  if (change.type === 'vendor') {
    const without = base.vendorExceptions.filter(e => e.vendorId !== change.vendorId);
    if (change.exception === null) {
      return { ...base, vendorExceptions: without };
    }
    return {
      ...base,
      vendorExceptions: [
        ...without,
        { vendorId: change.vendorId, vendorName: change.vendorName, exception: change.exception }
      ]
    };
  }
  return base;
}

export function generateEnglishSummary(base: Ruleset, change: PendingChange): string {
  if (change.type === 'threshold') {
    const oldVal = base.thresholds[change.field];
    const name = change.field === 'amountThreshold' ? 'Auto-approve amount limit' : 'Extraction confidence minimum';
    return `Changed ${name} from ${oldVal} to ${change.value}.`;
  } else if (change.type === 'policy') {
    const oldVal = base.policyChecks[change.field];
    return `Turned ${oldVal ? 'off' : 'on'} the ${change.field} check.`;
  } else if (change.type === 'vendor') {
    const oldExc = base.vendorExceptions.find(e => e.vendorId === change.vendorId);
    let oldText = 'no exception';
    if (oldExc) {
      oldText = oldExc.exception.kind === 'always_escalate' ? 'always escalate' : `auto-approve below ₹${oldExc.exception.amount}`;
    }
    let newText = 'no exception';
    if (change.exception) {
      newText = change.exception.kind === 'always_escalate' ? 'always escalate' : `auto-approve below ₹${change.exception.amount}`;
    }
    return `Changed exception for ${change.vendorName} (${change.vendorId}) from ${oldText} to ${newText}.`;
  }
  return '';
}

export default function ChangeProposalForm({ liveRuleset, onChange }: ChangeProposalFormProps) {
  const [activeTab, setActiveTab] = useState<'threshold' | 'policy' | 'vendor'>('threshold');
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);

  useEffect(() => {
    if (onChange) {
      if (pendingChange === null) {
        onChange(null);
      } else {
        onChange(deriveProposedRuleset(liveRuleset, pendingChange), generateEnglishSummary(liveRuleset, pendingChange));
      }
    }
  }, [pendingChange, liveRuleset, onChange]);

  // Form states
  const [thresholdField, setThresholdField] = useState<'amountThreshold' | 'extractionConfidenceThreshold'>('amountThreshold');
  const [thresholdInput, setThresholdInput] = useState('');
  const [thresholdError, setThresholdError] = useState('');

  const [policyField, setPolicyField] = useState<PolicyCheckName>('bank_details_changed');
  
  const uniqueVendors = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of corpus) {
      map.set(c.vendor.id, c.vendor.name);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, []);

  const [vendorId, setVendorId] = useState<string>(uniqueVendors[0]?.id ?? '');
  const [vendorExceptionType, setVendorExceptionType] = useState<'auto_approve_below' | 'always_escalate' | 'remove'>('auto_approve_below');
  const [vendorAmountInput, setVendorAmountInput] = useState('');
  const [vendorError, setVendorError] = useState('');

  const handleProposeThreshold = () => {
    const val = Number(thresholdInput);
    if (!thresholdInput || isNaN(val)) {
      setThresholdError('Please enter a valid number.');
      return;
    }
    if (val < 0) {
      setThresholdError('Threshold cannot be negative.');
      return;
    }
    setThresholdError('');
    setPendingChange({ type: 'threshold', field: thresholdField, value: val });
  };

  const handleProposePolicy = () => {
    const currentValue = liveRuleset.policyChecks[policyField];
    setPendingChange({ type: 'policy', field: policyField, value: !currentValue });
  };

  const handleProposeVendor = () => {
    const vendorName = uniqueVendors.find(v => v.id === vendorId)?.name || '';
    if (vendorExceptionType === 'remove') {
      setPendingChange({ type: 'vendor', vendorId, vendorName, exception: null });
      setVendorError('');
      return;
    }
    if (vendorExceptionType === 'always_escalate') {
      setPendingChange({ type: 'vendor', vendorId, vendorName, exception: { kind: 'always_escalate' } });
      setVendorError('');
      return;
    }
    const val = Number(vendorAmountInput);
    if (!vendorAmountInput || isNaN(val)) {
      setVendorError('Please enter a valid number.');
      return;
    }
    if (val < 0) {
      setVendorError('Amount cannot be negative.');
      return;
    }
    setVendorError('');
    setPendingChange({
      type: 'vendor',
      vendorId,
      vendorName,
      exception: { kind: 'auto_approve_below', amount: val }
    });
  };

  const renderEnglishSummary = () => {
    if (!pendingChange) return null;
    const text = generateEnglishSummary(liveRuleset, pendingChange);
    return (
      <div className="mt-6 border-t border-dr-border pt-4">
        <h3 className="text-sm font-medium text-dr-ink mb-2">Pending Change</h3>
        <p className="text-sm text-dr-ink bg-dr-paper-inset p-3 rounded-md border border-dr-border">
          {text}
        </p>
        <button
          onClick={() => setPendingChange(null)}
          className="mt-3 px-3 py-1.5 text-sm font-medium text-dr-warning bg-dr-warning-surface hover:bg-dr-warning-border rounded transition-colors"
        >
          Clear Change
        </button>
      </div>
    );
  };

  return (
    <div className="bg-dr-paper border border-dr-border rounded-lg p-5 mb-8 shadow-sm">
      <h2 className="text-base font-semibold text-dr-ink mb-4">Propose a Rule Change</h2>
      
      <div className="flex gap-2 border-b border-dr-border mb-5">
        {(['threshold', 'policy', 'vendor'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-dr-ink text-dr-ink'
                : 'border-transparent text-dr-ink-muted hover:text-dr-ink'
            }`}
          >
            {tab === 'threshold' ? 'Threshold' : tab === 'policy' ? 'Policy Check' : 'Vendor Exception'}
          </button>
        ))}
      </div>

      <div className="min-h-[120px]">
        {activeTab === 'threshold' && (
          <div className="flex flex-col gap-3 max-w-md">
            <label className="text-sm font-medium text-dr-ink">Select threshold to change</label>
            <select
              value={thresholdField}
              onChange={(e) => setThresholdField(e.target.value as any)}
              className="border border-dr-border rounded-md p-2 text-sm bg-dr-paper text-dr-ink"
            >
              <option value="amountThreshold">Amount Limit (currently {liveRuleset.thresholds.amountThreshold})</option>
              <option value="extractionConfidenceThreshold">Confidence Min (currently {liveRuleset.thresholds.extractionConfidenceThreshold})</option>
            </select>
            <div className="flex flex-col gap-1 mt-2">
              <label className="text-sm font-medium text-dr-ink">New value</label>
              <input
                type="text"
                value={thresholdInput}
                onChange={(e) => setThresholdInput(e.target.value)}
                placeholder="e.g. 300000"
                className="border border-dr-border rounded-md p-2 text-sm bg-dr-paper text-dr-ink"
              />
              {thresholdError && <span className="text-xs text-dr-warning mt-1">{thresholdError}</span>}
            </div>
            <button
              onClick={handleProposeThreshold}
              className="mt-2 self-start px-4 py-2 bg-dr-ink text-white rounded-md text-sm font-medium hover:opacity-90 transition-colors cursor-pointer"
            >
              Propose Change
            </button>
          </div>
        )}

        {activeTab === 'policy' && (
          <div className="flex flex-col gap-3 max-w-md">
            <label className="text-sm font-medium text-dr-ink">Select policy check to toggle</label>
            <select
              value={policyField}
              onChange={(e) => setPolicyField(e.target.value as PolicyCheckName)}
              className="border border-dr-border rounded-md p-2 text-sm bg-dr-paper text-dr-ink"
            >
              {POLICY_CHECK_NAMES.map(name => (
                <option key={name} value={name}>
                  {name} (currently {liveRuleset.policyChecks[name] ? 'ON' : 'OFF'})
                </option>
              ))}
            </select>
            <button
              onClick={handleProposePolicy}
              className="mt-2 self-start px-4 py-2 bg-dr-ink text-white rounded-md text-sm font-medium hover:opacity-90 transition-colors cursor-pointer"
            >
              Propose Toggle
            </button>
          </div>
        )}

        {activeTab === 'vendor' && (
          <div className="flex flex-col gap-3 max-w-md">
            <label className="text-sm font-medium text-dr-ink">Select vendor</label>
            <select
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="border border-dr-border rounded-md p-2 text-sm bg-dr-paper text-dr-ink"
            >
              {uniqueVendors.map(v => {
                const currentExc = liveRuleset.vendorExceptions.find(e => e.vendorId === v.id);
                const suffix = currentExc ? ' (has exception)' : '';
                return <option key={v.id} value={v.id}>{v.name} - {v.id}{suffix}</option>;
              })}
            </select>
            
            <label className="text-sm font-medium text-dr-ink mt-2">Exception type</label>
            <select
              value={vendorExceptionType}
              onChange={(e) => setVendorExceptionType(e.target.value as any)}
              className="border border-dr-border rounded-md p-2 text-sm bg-dr-paper text-dr-ink"
            >
              <option value="auto_approve_below">Auto-approve below limit</option>
              <option value="always_escalate">Always escalate</option>
              <option value="remove">Remove exception</option>
            </select>
            
            {vendorExceptionType === 'auto_approve_below' && (
              <div className="flex flex-col gap-1 mt-2">
                <label className="text-sm font-medium text-dr-ink">Limit amount</label>
                <input
                  type="text"
                  value={vendorAmountInput}
                  onChange={(e) => setVendorAmountInput(e.target.value)}
                  placeholder="e.g. 350000"
                  className="border border-dr-border rounded-md p-2 text-sm bg-dr-paper text-dr-ink"
                />
                {vendorError && <span className="text-xs text-dr-warning mt-1">{vendorError}</span>}
              </div>
            )}
            
            <button
              onClick={handleProposeVendor}
              className="mt-2 self-start px-4 py-2 bg-dr-ink text-white rounded-md text-sm font-medium hover:opacity-90 transition-colors cursor-pointer"
            >
              Propose Exception
            </button>
          </div>
        )}
      </div>

      {renderEnglishSummary()}
    </div>
  );
}
