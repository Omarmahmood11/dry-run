import * as fs from 'fs';
import * as path from 'path';

import type { Case, PolicyCheckName } from '../lib/types';

const dataPath = path.join(process.cwd(), 'data', 'corpus.json');
const rawData = fs.readFileSync(dataPath, 'utf-8');
const corpus: Case[] = JSON.parse(rawData);

const problems = corpus.filter(c => c.groundTruth.truth === 'PROBLEM');
const legitimate = corpus.filter(c => c.groundTruth.truth === 'LEGITIMATE');

// Randomly pick 10 legitimate cases
// We'll use a simple randomizer here since it's just for export
const shuffledLegitimate = [...legitimate].sort(() => 0.5 - Math.random());
const selectedLegitimate = shuffledLegitimate.slice(0, 10);

const selectedCases = [...problems, ...selectedLegitimate];

// Sort to group them by ground truth, or leave as is? The user just said "40 PROBLEM cases plus 10 random LEGITIMATE cases".
// Let's sort by ID to be neat.
selectedCases.sort((a, b) => a.id.localeCompare(b.id));

let md = '# Dry Run Case Review\n\n';
md += 'This document contains all 40 PROBLEM cases and 10 random LEGITIMATE cases for manual review.\n\n';

for (const c of selectedCases) {
  md += `## Case: ${c.id}\n\n`;
  
  md += `**Ground Truth**: ${c.groundTruth.truth}\n`;
  if (c.groundTruth.truth === 'PROBLEM') {
    md += `**Problem Type**: ${c.groundTruth.problemType}\n`;
  }
  md += `**Resolution Note**: ${c.groundTruth.resolutionNote}\n\n`;

  md += `### Recorded Decision\n`;
  md += `- Decision: **${c.recordedDecision.decision}**\n`;
  md += `- Ruleset Version: ${c.recordedDecision.rulesetVersion}\n\n`;

  md += `### Vendor\n`;
  md += `- ID: ${c.vendor.id}\n`;
  md += `- Name: ${c.vendor.name}\n\n`;

  md += `### Invoice\n`;
  md += `- Amount: ${c.invoice.totalAmount} ${c.invoice.currency}\n`;
  if (c.invoice.lineItems.length > 0) {
    md += `- Line Items:\n`;
    for (const item of c.invoice.lineItems) {
      md += `  - ${item.quantity}x "${item.description}" @ ${item.unitPrice} = ${item.lineTotal}\n`;
    }
  }
  md += `- Extraction Confidence: ${c.extractionConfidence.toFixed(2)}\n\n`;

  md += `### Intake Flags\n`;
  const activeFlags = (Object.keys(c.intakeFlags) as PolicyCheckName[]).filter(flag => {
    const val = c.intakeFlags[flag];
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val > 0;
    return false;
  });
  
  if (activeFlags.length === 0) {
    md += `- *No active flags*\n\n`;
  } else {
    for (const flag of activeFlags) {
      if (flag === 'po_price_variance') {
        md += `- ${flag}: ${c.intakeFlags[flag]}%\n`;
      } else {
        md += `- ${flag}: true\n`;
      }
    }
    md += '\n';
  }
  
  md += '---\n\n';
}

const outDir = path.join(process.cwd(), 'docs', 'review');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const outPath = path.join(outDir, 'cases.md');
fs.writeFileSync(outPath, md, 'utf-8');

console.log(`Exported ${selectedCases.length} cases to ${outPath}`);
