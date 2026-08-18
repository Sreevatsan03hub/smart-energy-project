# Historical Pattern Discovery

## Overview
The Historical Pattern Discovery module mines multi-year PJM telemetry across all 11 regions to extract verified baselines across hourly, daily, weekly, and monthly dimensions.

## Verified System-Wide Pattern Summary (Source: ALL_REGIONS_HISTORICAL_PATTERN_SUMMARY.csv)

| Region | Historical Rows | Peak Hour | Peak Avg MW | Lowest Hour | Lowest Avg MW | Highest Day | Highest Day Avg MW | Lowest Day | Lowest Day Avg MW | Highest Month | Highest Month Avg MW | Lowest Month | Lowest Month Avg MW |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| **PJME** | 145,366 | 19:00 | 36,426.63 MW | 04:00 | 25,414.92 MW | Tuesday | 33,272.27 MW | Sunday | 29,411.87 MW | July | 37,881.97 MW | April | 27,863.34 MW |
| **AEP** | 121,273 | 19:00 | 16,868.73 MW | 04:00 | 13,095.19 MW | Tuesday | 16,057.62 MW | Sunday | 14,200.75 MW | January | 17,431.27 MW | April | 13,823.86 MW |
| **COMED**| 66,497 | 19:00 | 12,828.56 MW | 05:00 | 9,215.15 MW | Tuesday | 11,913.07 MW | Sunday | 10,254.16 MW | July | 13,564.19 MW | April | 9,995.94 MW |
| **DOM** | 116,189 | 19:00 | 12,467.07 MW | 04:00 | 8,777.06 MW | Tuesday | 11,207.07 MW | Sunday | 10,383.89 MW | July | 12,801.09 MW | April | 9,182.09 MW |
| **FE** | 62,874 | 19:00 | 8,558.77 MW | 04:00 | 6,439.62 MW | Tuesday | 8,141.01 MW | Sunday | 6,983.57 MW | July | 8,639.48 MW | October | 7,037.30 MW |
| **PJMW** | 143,206 | 19:00 | 6,199.29 MW | 04:00 | 4,672.54 MW | Wednesday | 5,802.37 MW | Sunday | 5,149.64 MW | January | 6,447.67 MW | October | 4,997.64 MW |
| **DEOK** | 57,739 | 19:00 | 3,468.52 MW | 04:00 | 2,527.66 MW | Thursday | 3,214.81 MW | Sunday | 2,862.71 MW | July | 3,541.34 MW | April | 2,666.52 MW |
| **DAYTON**| 121,275 | 19:00 | 2,257.96 MW | 04:00 | 1,643.77 MW | Tuesday | 2,146.55 MW | Sunday | 1,794.13 MW | August | 2,264.32 MW | April | 1,791.60 MW |
| **NI** | 58,450 | 19:00 | 13,186.22 MW | 05:00 | 9,296.95 MW | Tuesday | 12,274.05 MW | Sunday | 10,368.12 MW | July | 13,533.98 MW | April | 10,275.19 MW |
| **DUQ** | 119,068 | 18:00 | 1,853.80 MW | 04:00 | 1,356.90 MW | Wednesday | 1,720.15 MW | Sunday | 1,524.39 MW | July | 1,912.24 MW | April | 1,463.70 MW |
| **EKPC** | 45,334 | 20:00 | 1,654.38 MW | 04:00 | 1,225.83 MW | Thursday | 1,485.99 MW | Sunday | 1,415.03 MW | January | 1,913.35 MW | October | 1,184.82 MW |

## Key Insights
1. **Diurnal Inflexion**: Across almost every region, peak electricity demand strikes sharply between **18:00 and 20:00** (predominantly **19:00 / 7 PM**), driven by residential return and commercial overlap.
2. **Baseload Trough**: The lowest consumption consistently occurs between **04:00 and 05:00 AM**.
3. **Weekly Rhythms**: **Tuesday** is the highest weekday load for 7 of the 11 regions, whereas **Sunday** is uniformly the lowest load day across all regions due to commercial/industrial closures.
4. **Seasonal Bimodality**: Summer peaks (July/August) dominate in southern/metropolitan regions (DOM, COMED, PJME) due to HVAC air conditioning, whereas winter peaks (January) occur in northern/appalachian regions (AEP, PJMW, EKPC) due to electric heating.
