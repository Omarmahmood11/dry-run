# Dry Run Case Review

This document contains all 40 PROBLEM cases and 10 random LEGITIMATE cases for manual review.

## Case: INV-2026-0106

**Ground Truth**: LEGITIMATE
**Resolution Note**: Verified against contract, processed on schedule

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V006
- Name: Bharat Consulting Group

### Invoice
- Amount: 203739 INR
- Line Items:
  - 1x "Strategy Consulting - Phase 1" @ 74660 = 74660
  - 2x "Process Optimization Review" @ 49000 = 98000
- Extraction Confidence: 0.91

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0113

**Ground Truth**: LEGITIMATE
**Resolution Note**: Standard procurement, no issues noted during review

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V013
- Name: IndoSteel Corporation

### Invoice
- Amount: 288869 INR
- Line Items:
  - 4x "CNC Machining Components" @ 61201 = 244804
- Extraction Confidence: 0.85

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0134

**Ground Truth**: LEGITIMATE
**Resolution Note**: Regular periodic billing, matched to purchase order

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V009
- Name: Sunrise Logistics Pvt Ltd

### Invoice
- Amount: 56777 INR
- Line Items:
  - 4x "Packaging and Dispatch" @ 3369 = 13476
  - 1x "Warehouse Storage - Monthly" @ 14376 = 14376
  - 4x "Courier Services - Bulk" @ 5066 = 20264
- Extraction Confidence: 0.96

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0154

**Ground Truth**: LEGITIMATE
**Resolution Note**: All items received as invoiced, approved in normal course

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V004
- Name: AeroTech Components Ltd

### Invoice
- Amount: 253663 INR
- Line Items:
  - 3x "Steel Plate - Grade 304 - 10 Sheets" @ 32903 = 98709
  - 2x "CNC Machining Components" @ 58130 = 116260
- Extraction Confidence: 0.98

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0160

**Ground Truth**: LEGITIMATE
**Resolution Note**: Regular periodic billing, matched to purchase order

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V010
- Name: Mahalakshmi Enterprises

### Invoice
- Amount: 30612 INR
- Line Items:
  - 4x "Safety Equipment - PPE Kit" @ 1846 = 7384
  - 4x "Adhesive Tape - Carton of 48" @ 2574 = 10296
  - 1x "Packaging Material - Bulk Order" @ 8262 = 8262
- Extraction Confidence: 0.98

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0166

**Ground Truth**: LEGITIMATE
**Resolution Note**: Verified against contract, processed on schedule

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V016
- Name: Patel Hardware Traders

### Invoice
- Amount: 31786 INR
- Line Items:
  - 6x "Electrical Wiring - 100m Roll" @ 2542 = 15252
  - 3x "Paint and Coating Supplies" @ 3895 = 11685
- Extraction Confidence: 0.94

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0170

**Ground Truth**: LEGITIMATE
**Resolution Note**: Standard procurement, no issues noted during review

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V020
- Name: Anand Electrical Works

### Invoice
- Amount: 53779 INR
- Line Items:
  - 5x "Transformer Oil Replacement" @ 9115 = 45575
- Extraction Confidence: 0.93

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0180

**Ground Truth**: LEGITIMATE
**Resolution Note**: Verified against contract, processed on schedule

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V005
- Name: Greenfield Facilities Mgmt

### Invoice
- Amount: 77851 INR
- Line Items:
  - 1x "HVAC Maintenance - Quarterly" @ 19258 = 19258
  - 2x "Plumbing Repair Services" @ 7886 = 15772
  - 1x "Fire Safety Equipment Inspection" @ 12545 = 12545
  - 4x "Pest Control - Quarterly Treatment" @ 4600 = 18400
- Extraction Confidence: 0.95

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0324

**Ground Truth**: LEGITIMATE
**Resolution Note**: Petty cash reimbursement submitted as invoice; below PO threshold

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V010
- Name: Mahalakshmi Enterprises

### Invoice
- Amount: 26344 INR
- Line Items:
  - 1x "Packaging Material - Bulk Order" @ 7826 = 7826
  - 1x "Cleaning Supplies - Monthly" @ 3592 = 3592
  - 2x "Adhesive Tape - Carton of 48" @ 2503 = 5006
  - 3x "Safety Equipment - PPE Kit" @ 1967 = 5901
- Extraction Confidence: 0.86

### Intake Flags
- po_missing: true

---

## Case: INV-2026-0348

**Ground Truth**: LEGITIMATE
**Resolution Note**: Annual contract renewal; higher than typical monthly invoices but within annual budget

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V018
- Name: Fresh Foods Supply Co

### Invoice
- Amount: 149001 INR
- Line Items:
  - 32x "Tea and Coffee Supplies - Monthly" @ 3946 = 126272
- Extraction Confidence: 0.82

### Intake Flags
- amount_anomaly: true

---

## Case: INV-2026-0361

**Ground Truth**: PROBLEM
**Problem Type**: duplicate_submission
**Resolution Note**: Confirmed duplicate; identical invoice submitted previously

### Recorded Decision
- Decision: **BLOCK**
- Ruleset Version: 1

### Vendor
- ID: V001
- Name: Vertex Solutions Pvt Ltd

### Invoice
- Amount: 144049 INR
- Line Items:
  - 1x "Cybersecurity Assessment" @ 25799 = 25799
  - 4x "Data Backup and Recovery Service" @ 8164 = 32656
  - 1x "Server Migration Services" @ 35388 = 35388
  - 1x "IT Support Services - Quarterly" @ 28232 = 28232
- Extraction Confidence: 0.90

### Intake Flags
- duplicate_hash_match: true

---

## Case: INV-2026-0362

**Ground Truth**: PROBLEM
**Problem Type**: duplicate_submission
**Resolution Note**: Confirmed duplicate; identical invoice submitted previously

### Recorded Decision
- Decision: **BLOCK**
- Ruleset Version: 1

### Vendor
- ID: V002
- Name: Pinnacle Office Supplies

### Invoice
- Amount: 27820 INR
- Line Items:
  - 14x "Printer Paper - A3 Ream of 500" @ 566 = 7924
  - 6x "Desk Organiser Set" @ 1202 = 7212
  - 2x "Filing Cabinets - 4 Drawer" @ 4220 = 8440
- Extraction Confidence: 0.92

### Intake Flags
- duplicate_hash_match: true

---

## Case: INV-2026-0363

**Ground Truth**: PROBLEM
**Problem Type**: duplicate_submission
**Resolution Note**: Confirmed duplicate; identical invoice submitted previously

### Recorded Decision
- Decision: **BLOCK**
- Ruleset Version: 1

### Vendor
- ID: V003
- Name: Rajesh Trading Co

### Invoice
- Amount: 19023 INR
- Line Items:
  - 1x "Industrial Solvents - 20L Drum" @ 4931 = 4931
  - 3x "Cleaning Supplies - Monthly" @ 3730 = 11190
- Extraction Confidence: 0.85

### Intake Flags
- duplicate_hash_match: true

---

## Case: INV-2026-0364

**Ground Truth**: PROBLEM
**Problem Type**: duplicate_submission
**Resolution Note**: Confirmed duplicate; identical invoice submitted previously

### Recorded Decision
- Decision: **BLOCK**
- Ruleset Version: 1

### Vendor
- ID: V004
- Name: AeroTech Components Ltd

### Invoice
- Amount: 107144 INR
- Line Items:
  - 1x "Hydraulic Cylinders - Set of 4" @ 42764 = 42764
  - 6x "Industrial Fasteners - Assorted Box" @ 8006 = 48036
- Extraction Confidence: 0.86

### Intake Flags
- duplicate_hash_match: true

---

## Case: INV-2026-0365

**Ground Truth**: PROBLEM
**Problem Type**: duplicate_submission
**Resolution Note**: Confirmed duplicate; identical invoice submitted previously

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V005
- Name: Greenfield Facilities Mgmt

### Invoice
- Amount: 84973 INR
- Line Items:
  - 4x "Janitorial Supplies - Monthly" @ 5970 = 23880
  - 2x "Fire Safety Equipment Inspection" @ 11881 = 23762
  - 3x "Plumbing Repair Services" @ 8123 = 24369
- Extraction Confidence: 0.93

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0366

**Ground Truth**: PROBLEM
**Problem Type**: duplicate_submission
**Resolution Note**: Confirmed duplicate; identical invoice submitted previously

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V006
- Name: Bharat Consulting Group

### Invoice
- Amount: 56242 INR
- Line Items:
  - 1x "Process Optimization Review" @ 47663 = 47663
- Extraction Confidence: 0.88

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0367

**Ground Truth**: PROBLEM
**Problem Type**: duplicate_submission
**Resolution Note**: Confirmed duplicate; identical invoice submitted previously

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V007
- Name: NexGen IT Services

### Invoice
- Amount: 108840 INR
- Line Items:
  - 1x "IT Support Services - Quarterly" @ 30986 = 30986
  - 1x "Monthly Cloud Hosting - Standard Plan" @ 15614 = 15614
  - 1x "Software License Renewal - Annual" @ 45637 = 45637
- Extraction Confidence: 0.89

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0368

**Ground Truth**: PROBLEM
**Problem Type**: duplicate_submission
**Resolution Note**: Confirmed duplicate; identical invoice submitted previously

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V008
- Name: Priya Electronics Ltd

### Invoice
- Amount: 26890 INR
- Line Items:
  - 1x "CCTV Camera System - 8 Channel" @ 22788 = 22788
- Extraction Confidence: 0.89

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0369

**Ground Truth**: PROBLEM
**Problem Type**: fraudulent_bank_details
**Resolution Note**: Payment details altered to redirect funds to unauthorized account ending in 8771

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V017
- Name: Digital Wave Technologies

### Invoice
- Amount: 45638 INR
- Line Items:
  - 1x "Cybersecurity Assessment" @ 22993 = 22993
  - 1x "Monthly Cloud Hosting - Standard Plan" @ 15683 = 15683
- Extraction Confidence: 0.83

### Intake Flags
- bank_details_changed: true

---

## Case: INV-2026-0370

**Ground Truth**: PROBLEM
**Problem Type**: fraudulent_bank_details
**Resolution Note**: Payment details altered to redirect funds to unauthorized account ending in 6478

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V018
- Name: Fresh Foods Supply Co

### Invoice
- Amount: 31035 INR
- Line Items:
  - 1x "Event Catering Services" @ 14082 = 14082
  - 3x "Tea and Coffee Supplies - Monthly" @ 4073 = 12219
- Extraction Confidence: 0.90

### Intake Flags
- bank_details_changed: true

---

## Case: INV-2026-0371

**Ground Truth**: PROBLEM
**Problem Type**: fraudulent_bank_details
**Resolution Note**: Payment details altered to redirect funds to unauthorized account ending in 0817

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V019
- Name: Metro Cleaning Services

### Invoice
- Amount: 29185 INR
- Line Items:
  - 1x "Plumbing Repair Services" @ 8443 = 8443
  - 1x "Janitorial Supplies - Monthly" @ 6174 = 6174
  - 2x "Pest Control - Quarterly Treatment" @ 5058 = 10116
- Extraction Confidence: 0.88

### Intake Flags
- bank_details_changed: true

---

## Case: INV-2026-0372

**Ground Truth**: PROBLEM
**Problem Type**: fraudulent_bank_details
**Resolution Note**: Payment details altered to redirect funds to unauthorized account ending in 7140

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V020
- Name: Anand Electrical Works

### Invoice
- Amount: 19307 INR
- Line Items:
  - 2x "Switchgear Maintenance" @ 8181 = 16362
- Extraction Confidence: 0.86

### Intake Flags
- bank_details_changed: true

---

## Case: INV-2026-0373

**Ground Truth**: PROBLEM
**Problem Type**: fraudulent_bank_details
**Resolution Note**: Payment details altered to redirect funds to unauthorized account ending in 4567

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V036
- Name: Reliable Office Solutions

### Invoice
- Amount: 67806 INR
- Line Items:
  - 37x "Ballpoint Pens - Box of 50" @ 458 = 16946
  - 16x "Whiteboard Markers - Pack of 24" @ 807 = 12912
  - 70x "Sticky Notes - Pack of 12" @ 218 = 15260
  - 3x "Filing Cabinets - 4 Drawer" @ 4115 = 12345
- Extraction Confidence: 0.90

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0374

**Ground Truth**: PROBLEM
**Problem Type**: fraudulent_bank_details
**Resolution Note**: Payment details altered to redirect funds to unauthorized account ending in 4567

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V037
- Name: Akash IT Infra

### Invoice
- Amount: 79720 INR
- Line Items:
  - 1x "Software License Renewal - Annual" @ 45311 = 45311
  - 3x "Data Backup and Recovery Service" @ 7416 = 22248
- Extraction Confidence: 0.95

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0375

**Ground Truth**: PROBLEM
**Problem Type**: price_inflation
**Resolution Note**: Price variance detected: 46.48% above contracted rate

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V004
- Name: AeroTech Components Ltd

### Invoice
- Amount: 328101 INR
- Line Items:
  - 3x "Precision Bearings - Lot of 100" @ 24951 = 74853
  - 2x "Hydraulic Cylinders - Set of 4" @ 46862 = 93724
  - 9x "Industrial Fasteners - Assorted Box" @ 8318 = 74862
  - 1x "Steel Plate - Grade 304 - 10 Sheets" @ 34613 = 34613
- Extraction Confidence: 0.91

### Intake Flags
- po_price_variance: 46.48%

---

## Case: INV-2026-0376

**Ground Truth**: PROBLEM
**Problem Type**: price_inflation
**Resolution Note**: Price variance detected: 35.66% above contracted rate

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V025
- Name: DataSync Technologies

### Invoice
- Amount: 285343 INR
- Line Items:
  - 10x "Network Maintenance - Monthly" @ 13187 = 131870
  - 2x "Web Application Development" @ 54973 = 109946
- Extraction Confidence: 0.85

### Intake Flags
- po_price_variance: 35.66%

---

## Case: INV-2026-0377

**Ground Truth**: PROBLEM
**Problem Type**: price_inflation
**Resolution Note**: Price variance detected: 55.10% above contracted rate

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V006
- Name: Bharat Consulting Group

### Invoice
- Amount: 163870 INR
- Line Items:
  - 1x "Strategy Consulting - Phase 1" @ 75360 = 75360
  - 1x "Compliance Audit Services" @ 63513 = 63513
- Extraction Confidence: 0.84

### Intake Flags
- po_price_variance: 55.1%

---

## Case: INV-2026-0378

**Ground Truth**: PROBLEM
**Problem Type**: price_inflation
**Resolution Note**: Price variance detected: 33.87% above contracted rate

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V017
- Name: Digital Wave Technologies

### Invoice
- Amount: 209979 INR
- Line Items:
  - 1x "Web Application Development" @ 49397 = 49397
  - 2x "Monthly Cloud Hosting - Standard Plan" @ 15364 = 30728
  - 5x "Data Backup and Recovery Service" @ 8677 = 43385
  - 2x "Cybersecurity Assessment" @ 27219 = 54438
- Extraction Confidence: 0.88

### Intake Flags
- bank_details_changed: true
- po_price_variance: 33.87%

---

## Case: INV-2026-0379

**Ground Truth**: PROBLEM
**Problem Type**: price_inflation
**Resolution Note**: Unit prices exceed contracted rates

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V007
- Name: NexGen IT Services

### Invoice
- Amount: 168727 INR
- Line Items:
  - 1x "Web Application Development" @ 52107 = 52107
  - 5x "Network Maintenance - Monthly" @ 12222 = 61110
  - 2x "Monthly Cloud Hosting - Standard Plan" @ 14886 = 29772
- Extraction Confidence: 0.89

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0380

**Ground Truth**: PROBLEM
**Problem Type**: price_inflation
**Resolution Note**: Unit prices exceed contracted rates

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V015
- Name: Sharma & Associates

### Invoice
- Amount: 193076 INR
- Line Items:
  - 2x "Legal Consultation - Retainer" @ 24457 = 48914
  - 3x "Intellectual Property Filing" @ 19244 = 57732
  - 2x "Regulatory Compliance Review" @ 28489 = 56978
- Extraction Confidence: 0.90

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0381

**Ground Truth**: PROBLEM
**Problem Type**: quantity_inflation
**Resolution Note**: Billed for 4 units but only 1 received

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V007
- Name: NexGen IT Services

### Invoice
- Amount: 188434 INR
- Line Items:
  - 4x "Network Maintenance - Monthly" @ 12657 = 50628
  - 4x "Monthly Cloud Hosting - Standard Plan" @ 14617 = 58468
  - 2x "Cybersecurity Assessment" @ 25297 = 50594
- Extraction Confidence: 0.81

### Intake Flags
- po_quantity_mismatch: true

---

## Case: INV-2026-0382

**Ground Truth**: PROBLEM
**Problem Type**: quantity_inflation
**Resolution Note**: Billed for 2 units but only 1 received

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V001
- Name: Vertex Solutions Pvt Ltd

### Invoice
- Amount: 186487 INR
- Line Items:
  - 2x "Software License Renewal - Annual" @ 41322 = 82644
  - 3x "Cybersecurity Assessment" @ 25132 = 75396
- Extraction Confidence: 0.80

### Intake Flags
- po_quantity_mismatch: true

---

## Case: INV-2026-0383

**Ground Truth**: PROBLEM
**Problem Type**: quantity_inflation
**Resolution Note**: Billed for 3 units but only 1 received

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V004
- Name: AeroTech Components Ltd

### Invoice
- Amount: 151505 INR
- Line Items:
  - 3x "Hydraulic Cylinders - Set of 4" @ 42798 = 128394
- Extraction Confidence: 0.92

### Intake Flags
- po_quantity_mismatch: true

---

## Case: INV-2026-0384

**Ground Truth**: PROBLEM
**Problem Type**: quantity_inflation
**Resolution Note**: Billed quantity exceeds PO or received quantity

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V001
- Name: Vertex Solutions Pvt Ltd

### Invoice
- Amount: 230552 INR
- Line Items:
  - 3x "IT Support Services - Quarterly" @ 27729 = 83187
  - 6x "Network Maintenance - Monthly" @ 13120 = 78720
  - 1x "Server Migration Services" @ 33476 = 33476
- Extraction Confidence: 0.89

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0385

**Ground Truth**: PROBLEM
**Problem Type**: quantity_inflation
**Resolution Note**: Billed quantity exceeds PO or received quantity

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V011
- Name: TechPro Solutions

### Invoice
- Amount: 220583 INR
- Line Items:
  - 2x "IT Support Services - Quarterly" @ 31321 = 62642
  - 1x "Software License Renewal - Annual" @ 43584 = 43584
  - 3x "Cybersecurity Assessment" @ 26903 = 80709
- Extraction Confidence: 0.96

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0386

**Ground Truth**: PROBLEM
**Problem Type**: phantom_vendor
**Resolution Note**: Vendor could not be verified; physical address check failed and contact numbers unresponsive

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V026
- Name: QuickServe Enterprises

### Invoice
- Amount: 86725 INR
- Line Items:
  - 4x "Professional Services - Monthly" @ 18374 = 73496
- Extraction Confidence: 0.86

### Intake Flags
- vendor_unverified: true

---

## Case: INV-2026-0387

**Ground Truth**: PROBLEM
**Problem Type**: phantom_vendor
**Resolution Note**: Vendor could not be verified; physical address check failed and contact numbers unresponsive

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V027
- Name: Zenith Procurement Services

### Invoice
- Amount: 88394 INR
- Line Items:
  - 1x "Supply Chain Consulting" @ 30752 = 30752
  - 1x "Procurement Advisory - Monthly" @ 26919 = 26919
  - 1x "Vendor Management Services" @ 17239 = 17239
- Extraction Confidence: 0.88

### Intake Flags
- vendor_unverified: true

---

## Case: INV-2026-0388

**Ground Truth**: PROBLEM
**Problem Type**: phantom_vendor
**Resolution Note**: Vendor could not be verified; physical address check failed and contact numbers unresponsive

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V028
- Name: Alpha Trading Corp

### Invoice
- Amount: 13220 INR
- Line Items:
  - 2x "Safety Equipment - PPE Kit" @ 1857 = 3714
  - 1x "Industrial Solvents - 20L Drum" @ 4282 = 4282
  - 1x "Cleaning Supplies - Monthly" @ 3207 = 3207
- Extraction Confidence: 0.85

### Intake Flags
- vendor_unverified: true

---

## Case: INV-2026-0389

**Ground Truth**: PROBLEM
**Problem Type**: phantom_vendor
**Resolution Note**: Vendor could not be verified; physical address check failed and contact numbers unresponsive

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V029
- Name: Reliable Supply Chain Pvt Ltd

### Invoice
- Amount: 50469 INR
- Line Items:
  - 1x "Cold Chain Transport" @ 12666 = 12666
  - 2x "Courier Services - Bulk" @ 4583 = 9166
  - 1x "Freight Charges - Domestic" @ 7394 = 7394
  - 1x "Warehouse Storage - Monthly" @ 13544 = 13544
- Extraction Confidence: 0.91

### Intake Flags
- vendor_unverified: true

---

## Case: INV-2026-0390

**Ground Truth**: PROBLEM
**Problem Type**: phantom_vendor
**Resolution Note**: Vendor could not be verified; physical address check failed and contact numbers unresponsive

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V030
- Name: Prime Solutions India

### Invoice
- Amount: 82165 INR
- Line Items:
  - 1x "Software License Renewal - Annual" @ 45200 = 45200
  - 1x "Cybersecurity Assessment" @ 24431 = 24431
- Extraction Confidence: 0.94

### Intake Flags
- vendor_unverified: true

---

## Case: INV-2026-0391

**Ground Truth**: PROBLEM
**Problem Type**: tax_miscalculation
**Resolution Note**: Tax applied at incorrect rate (e.g., 18% instead of 12%) leading to material overpayment

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V003
- Name: Rajesh Trading Co

### Invoice
- Amount: 20352 INR
- Line Items:
  - 3x "Safety Equipment - PPE Kit" @ 1966 = 5898
  - 1x "Industrial Solvents - 20L Drum" @ 4688 = 4688
  - 1x "Cleaning Supplies - Monthly" @ 3272 = 3272
- Extraction Confidence: 0.85

### Intake Flags
- tax_miscalculation: true

---

## Case: INV-2026-0392

**Ground Truth**: PROBLEM
**Problem Type**: tax_miscalculation
**Resolution Note**: Tax applied at incorrect rate (e.g., 18% instead of 12%) leading to material overpayment

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V016
- Name: Patel Hardware Traders

### Invoice
- Amount: 25798 INR
- Line Items:
  - 8x "Electrical Wiring - 100m Roll" @ 2415 = 19320
- Extraction Confidence: 0.85

### Intake Flags
- tax_miscalculation: true

---

## Case: INV-2026-0393

**Ground Truth**: PROBLEM
**Problem Type**: tax_miscalculation
**Resolution Note**: Tax applied at incorrect rate (e.g., 18% instead of 12%) leading to material overpayment

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V005
- Name: Greenfield Facilities Mgmt

### Invoice
- Amount: 32601 INR
- Line Items:
  - 1x "Fire Safety Equipment Inspection" @ 12104 = 12104
  - 2x "Janitorial Supplies - Monthly" @ 6491 = 12982
- Extraction Confidence: 0.82

### Intake Flags
- tax_miscalculation: true

---

## Case: INV-2026-0394

**Ground Truth**: PROBLEM
**Problem Type**: tax_miscalculation
**Resolution Note**: Tax applied at incorrect rate (e.g., 18% instead of 12%) leading to material overpayment

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V024
- Name: Ravi Construction Materials

### Invoice
- Amount: 101004 INR
- Line Items:
  - 1x "TMT Steel Bars - Per Tonne" @ 52498 = 52498
  - 1x "Cement - 50kg Bags (x100)" @ 34370 = 34370
- Extraction Confidence: 0.83

### Intake Flags
- tax_miscalculation: true

---

## Case: INV-2026-0395

**Ground Truth**: PROBLEM
**Problem Type**: duplicate_across_formats
**Resolution Note**: Duplicate submission across different intake channels (e.g., email and portal)

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V021
- Name: Premier Staffing Solutions

### Invoice
- Amount: 90795 INR
- Line Items:
  - 1x "Payroll Processing - Monthly" @ 16446 = 16446
  - 1x "Recruitment Fee - Mid Level" @ 23884 = 23884
  - 1x "Contract Staff Services - Monthly" @ 36615 = 36615
- Extraction Confidence: 0.92

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0396

**Ground Truth**: PROBLEM
**Problem Type**: duplicate_across_formats
**Resolution Note**: Duplicate submission across different intake channels (e.g., email and portal)

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V022
- Name: Lakshmi Paper Industries

### Invoice
- Amount: 111471 INR
- Line Items:
  - 229x "Sticky Notes - Pack of 12" @ 219 = 50151
  - 36x "Desk Organiser Set" @ 1231 = 44316
- Extraction Confidence: 0.89

### Intake Flags
- amount_anomaly: true

---

## Case: INV-2026-0397

**Ground Truth**: PROBLEM
**Problem Type**: duplicate_across_formats
**Resolution Note**: Duplicate submission across different intake channels (e.g., email and portal)

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V023
- Name: Global Travel Services

### Invoice
- Amount: 155968 INR
- Line Items:
  - 16x "Travel Insurance - Annual" @ 8261 = 132176
- Extraction Confidence: 0.94

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0398

**Ground Truth**: PROBLEM
**Problem Type**: contract_violation
**Resolution Note**: Items billed do not conform to master service agreement restrictions

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V001
- Name: Vertex Solutions Pvt Ltd

### Invoice
- Amount: 145656 INR
- Line Items:
  - 5x "Data Backup and Recovery Service" @ 8116 = 40580
  - 2x "Cybersecurity Assessment" @ 23122 = 46244
  - 1x "Server Migration Services" @ 36613 = 36613
- Extraction Confidence: 0.93

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0399

**Ground Truth**: PROBLEM
**Problem Type**: contract_violation
**Resolution Note**: Items billed do not conform to master service agreement restrictions

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V004
- Name: AeroTech Components Ltd

### Invoice
- Amount: 235127 INR
- Line Items:
  - 6x "Steel Plate - Grade 304 - 10 Sheets" @ 33210 = 199260
- Extraction Confidence: 0.96

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0400

**Ground Truth**: PROBLEM
**Problem Type**: contract_violation
**Resolution Note**: Items billed do not conform to master service agreement restrictions

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V001
- Name: Vertex Solutions Pvt Ltd

### Invoice
- Amount: 242610 INR
- Line Items:
  - 3x "Cybersecurity Assessment" @ 26448 = 79344
  - 11x "Network Maintenance - Monthly" @ 11478 = 126258
- Extraction Confidence: 0.89

### Intake Flags
- *No active flags*

---

