/**
 * Regional Metadata and Benchmark Metrics
 */
export const ALL_REGION_CODES = [
  "AEP", "COMED", "DAYTON", "DEOK", "DOM",
  "DUQ", "EKPC", "FE", "NI", "PJME", "PJMW"
];

export const REGIONS_META = {
  PJME:   { name: "PJM Eastern Grid", state: "PA/NJ/MD", baselineMW: 32080, r2: 0.9971, mae: 251.5 },
  AEP:    { name: "American Electric Power", state: "OH/WV/VA", baselineMW: 15420, r2: 0.9961, mae: 115.8 },
  COMED:  { name: "Commonwealth Edison", state: "IL (Chicago)", baselineMW: 11500, r2: 0.9966, mae: 90.1 },
  DOM:    { name: "Dominion Energy Virginia", state: "VA/NC", baselineMW: 10800, r2: 0.9958, mae: 98.4 },
  FE:     { name: "FirstEnergy Corp", state: "OH/PA", baselineMW: 7800, r2: 0.9962, mae: 72.3 },
  PJMW:   { name: "PJM Western Grid", state: "PA/WV", baselineMW: 5600, r2: 0.9969, mae: 48.2 },
  DEOK:   { name: "Duke Energy Ohio/KY", state: "OH/KY", baselineMW: 2900, r2: 0.9954, mae: 31.8 },
  DAYTON: { name: "Dayton Power & Light", state: "OH", baselineMW: 2050, r2: 0.9965, mae: 22.4 },
  NI:     { name: "Northern Indiana PS", state: "IN", baselineMW: 2150, r2: 0.9959, mae: 24.1 },
  DUQ:    { name: "Duquesne Light Co.", state: "PA (Pittsburgh)", baselineMW: 1550, r2: 0.9972, mae: 15.9 },
  EKPC:   { name: "East Kentucky Power", state: "KY", baselineMW: 1450, r2: 0.9960, mae: 16.7 }
};
