# Dry Run Case Review

This document contains all 40 PROBLEM cases and 10 random LEGITIMATE cases for manual review.

## Case: INV-2026-0004

**Ground Truth**: LEGITIMATE
**Resolution Note**: Routine invoice processed without incident

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V024
- Name: Ravi Construction Materials

### Invoice
- Amount: 273911 INR
- Line Items:
  - 2x "Cement - 50kg Bags (x100)" @ 35813 = 71626
  - 4x "Sand and Gravel - Truckload" @ 14659 = 58636
  - 2x "TMT Steel Bars - Per Tonne" @ 50933 = 101866
- Extraction Confidence: 0.93

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0013

**Ground Truth**: LEGITIMATE
**Resolution Note**: Monthly service fee, consistent with agreement

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V007
- Name: NexGen IT Services

### Invoice
- Amount: 78964 INR
- Line Items:
  - 1x "Cybersecurity Assessment" @ 24918 = 24918
  - 1x "IT Support Services - Quarterly" @ 29463 = 29463
  - 1x "Network Maintenance - Monthly" @ 12538 = 12538
- Extraction Confidence: 0.90

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0022

**Ground Truth**: PROBLEM
**Problem Type**: quantity_inflation
**Resolution Note**: Goods receipt for "Monthly Cloud Hosting - Standard Plan" records 2 units delivered; invoice bills 5

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V001
- Name: Vertex Solutions Pvt Ltd

### Invoice
- Amount: 252514 INR
- Line Items:
  - 5x "Monthly Cloud Hosting - Standard Plan" @ 15546 = 77730
  - 5x "Network Maintenance - Monthly" @ 12172 = 60860
  - 3x "Cybersecurity Assessment" @ 25135 = 75405
- Extraction Confidence: 0.89

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0027

**Ground Truth**: PROBLEM
**Problem Type**: duplicate_submission
**Resolution Note**: Duplicate of invoice from 2026-01-02; same vendor (Vertex Solutions Pvt Ltd), same amount (₹1,44,049)

### Recorded Decision
- Decision: **APPROVE**
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
- Extraction Confidence: 0.95

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0049

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
- Amount: 126412 INR
- Line Items:
  - 1x "Monthly Cloud Hosting - Standard Plan" @ 16414 = 16414
  - 1x "Network Maintenance - Monthly" @ 12489 = 12489
  - 1x "Software License Renewal - Annual" @ 48215 = 48215
  - 1x "IT Support Services - Quarterly" @ 30011 = 30011
- Extraction Confidence: 0.88

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0057

**Ground Truth**: PROBLEM
**Problem Type**: quantity_inflation
**Resolution Note**: Billed for 2 units of "Training Workshop - 2 Day" but only 1 received per delivery receipt

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V006
- Name: Bharat Consulting Group

### Invoice
- Amount: 335414 INR
- Line Items:
  - 1x "Strategy Consulting - Phase 1" @ 77039 = 77039
  - 1x "Compliance Audit Services" @ 59448 = 59448
  - 2x "Training Workshop - 2 Day" @ 32186 = 64372
  - 2x "Market Research Report" @ 41695 = 83390
- Extraction Confidence: 0.93

### Intake Flags
- po_quantity_mismatch: true

---

## Case: INV-2026-0058

**Ground Truth**: PROBLEM
**Problem Type**: tax_miscalculation
**Resolution Note**: Tax stated as ₹20,576 on subtotal ₹92,089; correct 18% GST is ₹16,576 — overbilled by ₹4,000

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V024
- Name: Ravi Construction Materials

### Invoice
- Amount: 112665 INR
- Line Items:
  - 1x "Scaffolding Rental - Monthly" @ 26591 = 26591
  - 1x "TMT Steel Bars - Per Tonne" @ 50035 = 50035
  - 1x "Sand and Gravel - Truckload" @ 15463 = 15463
- Extraction Confidence: 0.82

### Intake Flags
- tax_miscalculation: true

---

## Case: INV-2026-0085

**Ground Truth**: PROBLEM
**Problem Type**: duplicate_submission
**Resolution Note**: Duplicate of invoice from 2026-01-02; same vendor (Rajesh Trading Co), same amount (₹19,023)

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V003
- Name: Rajesh Trading Co

### Invoice
- Amount: 19023 INR
- Line Items:
  - 1x "Industrial Solvents - 20L Drum" @ 4931 = 4931
  - 3x "Cleaning Supplies - Monthly" @ 3730 = 11190
- Extraction Confidence: 0.83

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0090

**Ground Truth**: PROBLEM
**Problem Type**: phantom_vendor
**Resolution Note**: "Zenith Procurement Services" (V027) could not be verified; registered address is a vacant lot, phone numbers route to voicemail, no GST filings found

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V027
- Name: Zenith Procurement Services

### Invoice
- Amount: 132962 INR
- Line Items:
  - 2x "Supply Chain Consulting" @ 29700 = 59400
  - 3x "Vendor Management Services" @ 17760 = 53280
- Extraction Confidence: 0.84

### Intake Flags
- new_vendor: true
- vendor_unverified: true

---

## Case: INV-2026-0101

**Ground Truth**: PROBLEM
**Problem Type**: fraudulent_bank_details
**Resolution Note**: Payment details altered to redirect funds to unauthorized account ending in 6693

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V003
- Name: Rajesh Trading Co

### Invoice
- Amount: 51500 INR
- Line Items:
  - 14x "Safety Equipment - PPE Kit" @ 1746 = 24444
  - 6x "Cleaning Supplies - Monthly" @ 3200 = 19200
- Extraction Confidence: 0.92

### Intake Flags
- bank_details_changed: true

---

## Case: INV-2026-0118

**Ground Truth**: PROBLEM
**Problem Type**: duplicate_across_formats
**Resolution Note**: Same ₹1,08,303 charge from Lakshmi Paper Industries submitted via portal and email; reconciliation confirmed single underlying transaction

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V022
- Name: Lakshmi Paper Industries

### Invoice
- Amount: 108303 INR
- Line Items:
  - 30x "Whiteboard Markers - Pack of 24" @ 875 = 26250
  - 57x "Printer Paper - A3 Ream of 500" @ 564 = 32148
  - 26x "Desk Organiser Set" @ 1284 = 33384
- Extraction Confidence: 0.89

### Intake Flags
- amount_anomaly: true

---

## Case: INV-2026-0129

**Ground Truth**: PROBLEM
**Problem Type**: quantity_inflation
**Resolution Note**: Billed for 3 units of "Recruitment Fee - Mid Level" but only 1 received per delivery receipt

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V021
- Name: Premier Staffing Solutions

### Invoice
- Amount: 178010 INR
- Line Items:
  - 3x "Recruitment Fee - Mid Level" @ 23789 = 71367
  - 29x "Background Verification Services" @ 2741 = 79489
- Extraction Confidence: 0.87

### Intake Flags
- po_quantity_mismatch: true

---

## Case: INV-2026-0131

**Ground Truth**: LEGITIMATE
**Resolution Note**: Routine invoice processed without incident

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V011
- Name: TechPro Solutions

### Invoice
- Amount: 144673 INR
- Line Items:
  - 2x "Cybersecurity Assessment" @ 25510 = 51020
  - 3x "Network Maintenance - Monthly" @ 13064 = 39192
  - 4x "Data Backup and Recovery Service" @ 8098 = 32392
- Extraction Confidence: 0.97

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0136

**Ground Truth**: PROBLEM
**Problem Type**: phantom_vendor
**Resolution Note**: "QuickServe Enterprises" (V026) could not be verified; registered address is a vacant lot, phone numbers route to voicemail, no GST filings found

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V026
- Name: QuickServe Enterprises

### Invoice
- Amount: 96726 INR
- Line Items:
  - 2x "Professional Services - Monthly" @ 20803 = 41606
  - 5x "Document Processing Services" @ 8073 = 40365
- Extraction Confidence: 0.84

### Intake Flags
- vendor_unverified: true

---

## Case: INV-2026-0138

**Ground Truth**: LEGITIMATE
**Resolution Note**: Standard procurement, no issues noted during review

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V011
- Name: TechPro Solutions

### Invoice
- Amount: 85355 INR
- Line Items:
  - 1x "Web Application Development" @ 49304 = 49304
  - 3x "Data Backup and Recovery Service" @ 7677 = 23031
- Extraction Confidence: 0.83

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0152

**Ground Truth**: PROBLEM
**Problem Type**: duplicate_submission
**Resolution Note**: Duplicate of invoice from 2026-01-02; same vendor (Pinnacle Office Supplies), same amount (₹27,820)

### Recorded Decision
- Decision: **ESCALATE**
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
- Extraction Confidence: 0.81

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0154

**Ground Truth**: PROBLEM
**Problem Type**: phantom_vendor
**Resolution Note**: "Alpha Trading Corp" (V028) could not be verified; registered address is a vacant lot, phone numbers route to voicemail, no GST filings found

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V028
- Name: Alpha Trading Corp

### Invoice
- Amount: 61299 INR
- Line Items:
  - 5x "Cleaning Supplies - Monthly" @ 3322 = 16610
  - 2x "Packaging Material - Bulk Order" @ 8445 = 16890
  - 8x "Adhesive Tape - Carton of 48" @ 2306 = 18448
- Extraction Confidence: 0.82

### Intake Flags
- new_vendor: true
- vendor_unverified: true

---

## Case: INV-2026-0158

**Ground Truth**: PROBLEM
**Problem Type**: quantity_inflation
**Resolution Note**: Goods receipt for "Sand and Gravel - Truckload" records 7 units delivered; invoice bills 9

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V024
- Name: Ravi Construction Materials

### Invoice
- Amount: 312263 INR
- Line Items:
  - 9x "Sand and Gravel - Truckload" @ 16344 = 147096
  - 2x "TMT Steel Bars - Per Tonne" @ 58767 = 117534
- Extraction Confidence: 0.95

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0168

**Ground Truth**: PROBLEM
**Problem Type**: phantom_vendor
**Resolution Note**: "QuickServe Enterprises" (V026) could not be verified; registered address is a vacant lot, phone numbers route to voicemail, no GST filings found

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V026
- Name: QuickServe Enterprises

### Invoice
- Amount: 61584 INR
- Line Items:
  - 2x "Document Processing Services" @ 8609 = 17218
  - 1x "Professional Services - Monthly" @ 21298 = 21298
  - 1x "Technical Support - Quarterly" @ 13674 = 13674
- Extraction Confidence: 0.81

### Intake Flags
- new_vendor: true
- vendor_unverified: true

---

## Case: INV-2026-0180

**Ground Truth**: PROBLEM
**Problem Type**: tax_miscalculation
**Resolution Note**: Tax stated as ₹28,166 on subtotal ₹1,48,146; correct 18% GST is ₹26,666 — overbilled by ₹1,500

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V001
- Name: Vertex Solutions Pvt Ltd

### Invoice
- Amount: 176312 INR
- Line Items:
  - 1x "Web Application Development" @ 51866 = 51866
  - 1x "Server Migration Services" @ 33716 = 33716
  - 2x "Data Backup and Recovery Service" @ 8682 = 17364
  - 1x "Software License Renewal - Annual" @ 45200 = 45200
- Extraction Confidence: 0.81

### Intake Flags
- tax_miscalculation: true

---

## Case: INV-2026-0192

**Ground Truth**: PROBLEM
**Problem Type**: price_inflation
**Resolution Note**: "Scaffolding Rental - Monthly" invoiced at ₹23,119/unit; PO contracted rate is ₹16,594/unit (39.3% variance)

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V024
- Name: Ravi Construction Materials

### Invoice
- Amount: 163683 INR
- Line Items:
  - 6x "Scaffolding Rental - Monthly" @ 23119 = 138714
- Extraction Confidence: 0.91

### Intake Flags
- po_price_variance: 39.32%

---

## Case: INV-2026-0196

**Ground Truth**: PROBLEM
**Problem Type**: fraudulent_bank_details
**Resolution Note**: Payment details altered to redirect funds to unauthorized account ending in 9445

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V009
- Name: Sunrise Logistics Pvt Ltd

### Invoice
- Amount: 54171 INR
- Line Items:
  - 4x "Cold Chain Transport" @ 11477 = 45908
- Extraction Confidence: 0.93

### Intake Flags
- bank_details_changed: true

---

## Case: INV-2026-0200

**Ground Truth**: PROBLEM
**Problem Type**: contract_violation
**Resolution Note**: "Monthly Cloud Hosting - Standard Plan" (3 units at ₹13,830) not covered under master service agreement with Digital Wave Technologies; no amendment on file

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V017
- Name: Digital Wave Technologies

### Invoice
- Amount: 163116 INR
- Line Items:
  - 3x "Monthly Cloud Hosting - Standard Plan" @ 13830 = 41490
  - 5x "Data Backup and Recovery Service" @ 8186 = 40930
  - 2x "IT Support Services - Quarterly" @ 27907 = 55814
- Extraction Confidence: 0.92

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0204

**Ground Truth**: LEGITIMATE
**Resolution Note**: Project-based billing higher than routine; matches project cost estimate

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V020
- Name: Anand Electrical Works

### Invoice
- Amount: 294356 INR
- Line Items:
  - 6x "Transformer Oil Replacement" @ 10838 = 65028
  - 5x "Generator Servicing - Annual" @ 14693 = 73465
  - 6x "Wiring and Cabling - Per Floor" @ 11181 = 67086
  - 5x "Switchgear Maintenance" @ 8775 = 43875
- Extraction Confidence: 0.90

### Intake Flags
- amount_anomaly: true

---

## Case: INV-2026-0207

**Ground Truth**: LEGITIMATE
**Resolution Note**: Rounding difference of ₹2 in GST calculation; within acceptable tolerance

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V015
- Name: Sharma & Associates

### Invoice
- Amount: 105221 INR
- Line Items:
  - 1x "Regulatory Compliance Review" @ 31056 = 31056
  - 1x "Intellectual Property Filing" @ 18210 = 18210
  - 1x "Legal Consultation - Retainer" @ 24354 = 24354
  - 1x "Contract Drafting Services" @ 15552 = 15552
- Extraction Confidence: 0.83

### Intake Flags
- tax_miscalculation: true

---

## Case: INV-2026-0211

**Ground Truth**: PROBLEM
**Problem Type**: fraudulent_bank_details
**Resolution Note**: Payment details altered to redirect funds to unauthorized account ending in 2861

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V004
- Name: AeroTech Components Ltd

### Invoice
- Amount: 174954 INR
- Line Items:
  - 3x "Hydraulic Cylinders - Set of 4" @ 49422 = 148266
- Extraction Confidence: 0.87

### Intake Flags
- bank_details_changed: true

---

## Case: INV-2026-0217

**Ground Truth**: PROBLEM
**Problem Type**: duplicate_submission
**Resolution Note**: Duplicate charge identified; NexGen IT Services submitted identical ₹36,088 invoice on a different date

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V007
- Name: NexGen IT Services

### Invoice
- Amount: 36088 INR
- Line Items:
  - 1x "IT Support Services - Quarterly" @ 30583 = 30583
- Extraction Confidence: 0.96

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0221

**Ground Truth**: PROBLEM
**Problem Type**: duplicate_across_formats
**Resolution Note**: Same ₹1,02,330 charge from Premier Staffing Solutions submitted via portal and email; reconciliation confirmed single underlying transaction

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V021
- Name: Premier Staffing Solutions

### Invoice
- Amount: 102330 INR
- Line Items:
  - 1x "Payroll Processing - Monthly" @ 15733 = 15733
  - 4x "Background Verification Services" @ 3065 = 12260
  - 1x "Recruitment Fee - Mid Level" @ 23290 = 23290
  - 1x "Contract Staff Services - Monthly" @ 35437 = 35437
- Extraction Confidence: 0.92

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0230

**Ground Truth**: LEGITIMATE
**Resolution Note**: Verified against contract, processed on schedule

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V014
- Name: Clearview Security Systems

### Invoice
- Amount: 70225 INR
- Line Items:
  - 1x "CCTV Monitoring - Monthly" @ 11504 = 11504
  - 2x "Access Control System Maintenance" @ 7693 = 15386
  - 1x "Security Guard Services - Monthly" @ 18223 = 18223
  - 1x "Security Audit Services" @ 14400 = 14400
- Extraction Confidence: 0.87

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0236

**Ground Truth**: PROBLEM
**Problem Type**: duplicate_submission
**Resolution Note**: Duplicate charge identified; Bharat Consulting Group submitted identical ₹2,28,085 invoice on a different date

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V006
- Name: Bharat Consulting Group

### Invoice
- Amount: 228085 INR
- Line Items:
  - 1x "Strategy Consulting - Phase 1" @ 78475 = 78475
  - 1x "Compliance Audit Services" @ 63426 = 63426
  - 1x "Process Optimization Review" @ 51391 = 51391
- Extraction Confidence: 0.93

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0242

**Ground Truth**: PROBLEM
**Problem Type**: contract_violation
**Resolution Note**: "Monthly Cloud Hosting - Standard Plan" (11 units at ₹13,895) not covered under master service agreement with Digital Wave Technologies; no amendment on file

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V017
- Name: Digital Wave Technologies

### Invoice
- Amount: 180357 INR
- Line Items:
  - 11x "Monthly Cloud Hosting - Standard Plan" @ 13895 = 152845
- Extraction Confidence: 0.93

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0252

**Ground Truth**: LEGITIMATE
**Resolution Note**: System flagged as duplicate but investigation confirmed separate purchase orders

### Recorded Decision
- Decision: **BLOCK**
- Ruleset Version: 1

### Vendor
- ID: V001
- Name: Vertex Solutions Pvt Ltd

### Invoice
- Amount: 144049 INR
- Line Items:
  - 2x "Server Migration Services" @ 35399 = 70798
  - 4x "Monthly Cloud Hosting - Standard Plan" @ 15183 = 60732
- Extraction Confidence: 0.87

### Intake Flags
- duplicate_hash_match: true

---

## Case: INV-2026-0262

**Ground Truth**: LEGITIMATE
**Resolution Note**: Regular periodic billing, matched to purchase order

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V002
- Name: Pinnacle Office Supplies

### Invoice
- Amount: 19385 INR
- Line Items:
  - 25x "Sticky Notes - Pack of 12" @ 210 = 5250
  - 4x "Desk Organiser Set" @ 1286 = 5144
  - 7x "Whiteboard Markers - Pack of 24" @ 862 = 6034
- Extraction Confidence: 0.93

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0270

**Ground Truth**: PROBLEM
**Problem Type**: duplicate_submission
**Resolution Note**: Duplicate charge identified; Priya Electronics Ltd submitted identical ₹26,890 invoice on a different date

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

## Case: INV-2026-0273

**Ground Truth**: PROBLEM
**Problem Type**: fraudulent_bank_details
**Resolution Note**: Payment details altered to redirect funds to unauthorized account ending in 7172

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V025
- Name: DataSync Technologies

### Invoice
- Amount: 57327 INR
- Line Items:
  - 1x "Software License Renewal - Annual" @ 48582 = 48582
- Extraction Confidence: 0.86

### Intake Flags
- bank_details_changed: true

---

## Case: INV-2026-0275

**Ground Truth**: PROBLEM
**Problem Type**: duplicate_across_formats
**Resolution Note**: Same ₹1,20,485 charge from Global Travel Services submitted via email and portal; reconciliation confirmed single underlying transaction

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V023
- Name: Global Travel Services

### Invoice
- Amount: 120485 INR
- Line Items:
  - 4x "Travel Insurance - Annual" @ 7935 = 31740
  - 2x "Hotel Accommodation - Corporate" @ 12557 = 25114
  - 9x "Airport Transfer Services" @ 5028 = 45252
- Extraction Confidence: 0.88

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0291

**Ground Truth**: PROBLEM
**Problem Type**: price_inflation
**Resolution Note**: "Cement - 50kg Bags (x100)" invoiced at ₹35,257/unit; PO contracted rate is ₹25,347/unit (39.1% variance)

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V024
- Name: Ravi Construction Materials

### Invoice
- Amount: 289027 INR
- Line Items:
  - 2x "Cement - 50kg Bags (x100)" @ 35257 = 70514
  - 3x "Scaffolding Rental - Monthly" @ 23226 = 69678
  - 1x "TMT Steel Bars - Per Tonne" @ 59086 = 59086
  - 3x "Sand and Gravel - Truckload" @ 15220 = 45660
- Extraction Confidence: 0.84

### Intake Flags
- po_price_variance: 39.1%

---

## Case: INV-2026-0292

**Ground Truth**: PROBLEM
**Problem Type**: duplicate_submission
**Resolution Note**: Duplicate of invoice from 2026-01-03; same vendor (AeroTech Components Ltd), same amount (₹1,07,144)

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
- Extraction Confidence: 0.87

### Intake Flags
- duplicate_hash_match: true

---

## Case: INV-2026-0299

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
- Amount: 78455 INR
- Line Items:
  - 3x "Filing Cabinets - 4 Drawer" @ 4113 = 12339
  - 42x "Ballpoint Pens - Box of 50" @ 442 = 18564
  - 76x "Sticky Notes - Pack of 12" @ 199 = 15124
  - 55x "A4 Copy Paper - Box of 10 Reams" @ 372 = 20460
- Extraction Confidence: 0.89

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0312

**Ground Truth**: PROBLEM
**Problem Type**: price_inflation
**Resolution Note**: Market rate audit found "Network Maintenance - Monthly" at ₹11,534/unit exceeds comparable vendor quotes by 30-50%; PO was raised at the inflated rate

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V025
- Name: DataSync Technologies

### Invoice
- Amount: 180042 INR
- Line Items:
  - 7x "Network Maintenance - Monthly" @ 11534 = 80738
  - 5x "Monthly Cloud Hosting - Standard Plan" @ 14368 = 71840
- Extraction Confidence: 0.93

### Intake Flags
- bank_details_changed: true

---

## Case: INV-2026-0315

**Ground Truth**: PROBLEM
**Problem Type**: price_inflation
**Resolution Note**: Market rate audit found "Web Application Development" at ₹51,307/unit exceeds comparable vendor quotes by 30-50%; PO was raised at the inflated rate

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V025
- Name: DataSync Technologies

### Invoice
- Amount: 142406 INR
- Line Items:
  - 1x "Web Application Development" @ 51307 = 51307
  - 2x "Server Migration Services" @ 34688 = 69376
- Extraction Confidence: 0.89

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0319

**Ground Truth**: PROBLEM
**Problem Type**: price_inflation
**Resolution Note**: "Steel Plate - Grade 304 - 10 Sheets" invoiced at ₹38,106/unit; PO contracted rate is ₹26,305/unit (44.9% variance)

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V004
- Name: AeroTech Components Ltd

### Invoice
- Amount: 218503 INR
- Line Items:
  - 1x "Steel Plate - Grade 304 - 10 Sheets" @ 38106 = 38106
  - 6x "Industrial Fasteners - Assorted Box" @ 7681 = 46086
  - 2x "Precision Bearings - Lot of 100" @ 23364 = 46728
  - 1x "CNC Machining Components" @ 54252 = 54252
- Extraction Confidence: 0.87

### Intake Flags
- bank_details_changed: true
- po_price_variance: 44.87%

---

## Case: INV-2026-0325

**Ground Truth**: PROBLEM
**Problem Type**: price_inflation
**Resolution Note**: "Contract Staff Services - Monthly" invoiced at ₹34,467/unit; PO contracted rate is ₹21,565/unit (59.8% variance)

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V021
- Name: Premier Staffing Solutions

### Invoice
- Amount: 284697 INR
- Line Items:
  - 7x "Contract Staff Services - Monthly" @ 34467 = 241269
- Extraction Confidence: 0.94

### Intake Flags
- po_price_variance: 59.83%

---

## Case: INV-2026-0337

**Ground Truth**: PROBLEM
**Problem Type**: contract_violation
**Resolution Note**: "Precision Bearings - Lot of 100" (10 units at ₹23,652) not covered under master service agreement with IndoSteel Corporation; no amendment on file

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V013
- Name: IndoSteel Corporation

### Invoice
- Amount: 279094 INR
- Line Items:
  - 10x "Precision Bearings - Lot of 100" @ 23652 = 236520
- Extraction Confidence: 0.95

### Intake Flags
- bank_details_changed: true

---

## Case: INV-2026-0344

**Ground Truth**: PROBLEM
**Problem Type**: duplicate_submission
**Resolution Note**: Duplicate charge identified; Greenfield Facilities Mgmt submitted identical ₹84,973 invoice on a different date

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
- Extraction Confidence: 0.91

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0348

**Ground Truth**: PROBLEM
**Problem Type**: tax_miscalculation
**Resolution Note**: Tax stated as ₹14,030 on subtotal ₹66,836; correct 18% GST is ₹12,030 — overbilled by ₹2,000

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V005
- Name: Greenfield Facilities Mgmt

### Invoice
- Amount: 80866 INR
- Line Items:
  - 4x "Pest Control - Quarterly Treatment" @ 4830 = 19320
  - 1x "Fire Safety Equipment Inspection" @ 11722 = 11722
  - 1x "HVAC Maintenance - Quarterly" @ 18334 = 18334
  - 2x "Plumbing Repair Services" @ 8730 = 17460
- Extraction Confidence: 0.87

### Intake Flags
- tax_miscalculation: true

---

## Case: INV-2026-0358

**Ground Truth**: LEGITIMATE
**Resolution Note**: Standard procurement, no issues noted during review

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V020
- Name: Anand Electrical Works

### Invoice
- Amount: 45576 INR
- Line Items:
  - 1x "Generator Servicing - Annual" @ 14950 = 14950
  - 2x "Wiring and Cabling - Per Floor" @ 11837 = 23674
- Extraction Confidence: 0.96

### Intake Flags
- *No active flags*

---

## Case: INV-2026-0372

**Ground Truth**: PROBLEM
**Problem Type**: quantity_inflation
**Resolution Note**: Billed for 5 units of "Scaffolding Rental - Monthly" but only 3 received per delivery receipt

### Recorded Decision
- Decision: **APPROVE**
- Ruleset Version: 1

### Vendor
- ID: V024
- Name: Ravi Construction Materials

### Invoice
- Amount: 230703 INR
- Line Items:
  - 5x "Scaffolding Rental - Monthly" @ 24727 = 123635
  - 2x "Cement - 50kg Bags (x100)" @ 35938 = 71876
- Extraction Confidence: 0.83

### Intake Flags
- po_quantity_mismatch: true

---

## Case: INV-2026-0373

**Ground Truth**: PROBLEM
**Problem Type**: tax_miscalculation
**Resolution Note**: Tax stated as ₹2,222 on subtotal ₹1,232; correct 18% GST is ₹222 — overbilled by ₹2,000

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V012
- Name: Kiran Stationery Mart

### Invoice
- Amount: 3454 INR
- Line Items:
  - 1x "Desk Organiser Set" @ 1232 = 1232
- Extraction Confidence: 0.92

### Intake Flags
- bank_details_changed: true
- tax_miscalculation: true

---

## Case: INV-2026-0398

**Ground Truth**: PROBLEM
**Problem Type**: phantom_vendor
**Resolution Note**: "Zenith Procurement Services" (V027) could not be verified; registered address is a vacant lot, phone numbers route to voicemail, no GST filings found

### Recorded Decision
- Decision: **ESCALATE**
- Ruleset Version: 1

### Vendor
- ID: V027
- Name: Zenith Procurement Services

### Invoice
- Amount: 100807 INR
- Line Items:
  - 1x "Procurement Advisory - Monthly" @ 23584 = 23584
  - 1x "Supply Chain Consulting" @ 27848 = 27848
  - 2x "Vendor Management Services" @ 16999 = 33998
- Extraction Confidence: 0.89

### Intake Flags
- new_vendor: true
- vendor_unverified: true

---

