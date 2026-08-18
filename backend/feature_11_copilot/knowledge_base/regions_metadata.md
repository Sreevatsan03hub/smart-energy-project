# Regional Metadata & Grid Coverage

## 11 Authorized PJM Interconnection Regions

1. **PJME (PJM Eastern Grid)**:
   - Coverage: Pennsylvania, New Jersey, Maryland
   - Baseline Load: ~32,080 MW
   - Grid Characteristic: High metropolitan commercial & dense residential concentration.
   - Model Metrics: $R^2 = 0.9971$, $\text{MAE} = 251.5\text{ MW}$

2. **AEP (American Electric Power)**:
   - Coverage: Ohio, West Virginia, Virginia, Indiana, Kentucky
   - Baseline Load: ~15,420 MW
   - Grid Characteristic: Heavy industrial, manufacturing, and coal/gas generation balance.
   - Model Metrics: $R^2 = 0.9961$, $\text{MAE} = 115.8\text{ MW}$

3. **COMED (Commonwealth Edison)**:
   - Coverage: Greater Chicago Metropolitan Area, Northern Illinois
   - Baseline Load: ~11,500 MW
   - Grid Characteristic: Urban load density with intense summer cooling demand.
   - Model Metrics: $R^2 = 0.9966$, $\text{MAE} = 90.1\text{ MW}$

4. **DOM (Dominion Energy Virginia)**:
   - Coverage: Virginia, North Carolina (Northern Virginia Data Center Alley)
   - Baseline Load: ~10,800 MW
   - Grid Characteristic: Rapidly expanding hyperscale data center base loads.
   - Model Metrics: $R^2 = 0.9958$, $\text{MAE} = 98.4\text{ MW}$

5. **FE (FirstEnergy Corp)**:
   - Coverage: Ohio, Pennsylvania, West Virginia
   - Baseline Load: ~7,800 MW
   - Model Metrics: $R^2 = 0.9962$, $\text{MAE} = 72.3\text{ MW}$

6. **PJMW (PJM Western Grid)**:
   - Coverage: Western Pennsylvania, West Virginia
   - Baseline Load: ~5,600 MW
   - Model Metrics: $R^2 = 0.9969$, $\text{MAE} = 48.2\text{ MW}$

7. **DEOK (Duke Energy Ohio / Kentucky)**:
   - Coverage: Greater Cincinnati, Northern Kentucky
   - Baseline Load: ~2,900 MW
   - Model Metrics: $R^2 = 0.9954$, $\text{MAE} = 31.8\text{ MW}$

8. **DAYTON (Dayton Power & Light)**:
   - Coverage: West Central Ohio
   - Baseline Load: ~2,050 MW
   - Model Metrics: $R^2 = 0.9965$, $\text{MAE} = 22.4\text{ MW}$

9. **NI (Northern Indiana Public Service)**:
   - Coverage: Northern Indiana (Gary, South Bend)
   - Baseline Load: ~2,150 MW
   - Grid Characteristic: Steel mills and heavy industrial load centers.
   - Model Metrics: $R^2 = 0.9959$, $\text{MAE} = 24.1\text{ MW}$

10. **DUQ (Duquesne Light Co.)**:
    - Coverage: Pittsburgh & Allegheny County, PA
    - Baseline Load: ~1,550 MW
    - Model Metrics: $R^2 = 0.9972$, $\text{MAE} = 15.9\text{ MW}$

11. **EKPC (East Kentucky Power Cooperative)**:
    - Coverage: Eastern & Central Kentucky rural electric cooperatives
    - Baseline Load: ~1,450 MW
    - Model Metrics: $R^2 = 0.9960$, $\text{MAE} = 16.7\text{ MW}$

## Access Roles & Security Policy
- **Central Admin / Regional Director (`admin`)**: Authorized to view, query, compare, and benchmark all 11 regional grids simultaneously.
- **Local Grid Operators (e.g. `aep_user`, `pjme_user`)**: Restricted strictly to their assigned single regional jurisdiction. Cross-region data requests are blocked at the pre-retrieval security boundary.
