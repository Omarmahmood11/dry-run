import fs from 'fs';
import { replay } from '../lib/replayEngine';
import { evaluateCase } from '../lib/ruleEngine';

const corpus = JSON.parse(fs.readFileSync('./data/corpus.json', 'utf8'));
const baselineRuleset = JSON.parse(fs.readFileSync('./data/baselineRuleset.json', 'utf8'));

const proposedRuleset = {
  ...baselineRuleset,
  thresholds: {
    ...baselineRuleset.thresholds,
    amountThreshold: 300000
  }
};

const caseIds = [
  'INV-2026-0004',
  'INV-2026-0011',
  'INV-2026-0012',
  'INV-2026-0022',
  'INV-2026-0089',
  'INV-2026-0093',
  'INV-2026-0126',
  'INV-2026-0146',
  'INV-2026-0185',
  'INV-2026-0192'
];

const selected = corpus.filter((c: any) => caseIds.includes(c.id));

selected.forEach((c: any) => {
  const diff = replay(proposedRuleset as any, [c]);
  const newDecision = diff.changedCases.length > 0 ? diff.changedCases[0].newDecision : c.recordedDecision.decision;
  const classification = diff.changedCases.length > 0 ? diff.changedCases[0].classification : 'UNCHANGED';
  const reason = diff.changedCases.length > 0 ? diff.changedCases[0].responsibleRule.type + (diff.changedCases[0].responsibleRule.flag ? '/' + diff.changedCases[0].responsibleRule.flag : '') : 'UNCHANGED';

  console.log(`ID: ${c.id}`);
  console.log(`  Amount: ${c.invoice.totalAmount}`);
  console.log(`  Vendor: ${c.vendor.id}`);
  console.log(`  Truth: ${c.groundTruth.truth}`);
  console.log(`  Flags: ${Object.keys(c.intakeFlags).filter(k => c.intakeFlags[k]).join(', ')}`);
  console.log(`  Old Decision: ${c.recordedDecision.decision}`);
  console.log(`  New Decision: ${newDecision}`);
  console.log(`  Classification: ${classification}`);
  console.log(`  Rule: ${JSON.stringify(diff.changedCases[0]?.responsibleRule)}`);
  console.log('---');
});
