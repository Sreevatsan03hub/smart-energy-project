# Similar Day Finder vs Historical Pattern Discovery

## Critical Architectural Distinction

### 1. Historical Pattern Discovery ("What Normally Happens?")
- **Definition**: Statistical aggregation (mean, standard deviation, min, max) over multi-year datasets grouped by calendar categories (e.g. all Mondays, all Julys, all 19:00 hours).
- **Purpose**: Establishes fixed diurnal curves, baseline load expectations, and structural seasonal seasonality.
- **Output**: Static aggregate curves and weekday/weekend profiles.

### 2. Similar Day Finder ("Which Specific Past Day Looked Like Today?")
- **Definition**: Dynamic vector distance matching across 24-hour load curves using **Cosine Similarity** and normalized **Euclidean Distance**.
- **Purpose**: Identifies specific historical calendar dates whose 24-hour shape, peak timing, and ramps closely match the current target day's operational signature.
- **Output**: Ranked historical days with similarity scores (e.g., 99.4% cosine similarity) and exact delta comparisons.

## Vector Matching Formula
For a target day load vector $\mathbf{u} = [u_0, u_1, \dots, u_{23}]$ and candidate historical day vector $\mathbf{v} = [v_0, v_1, \dots, v_{23}]$:
$$\text{Cosine Similarity}(\mathbf{u}, \mathbf{v}) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2}$$
Rankings prioritize matching day types (weekday vs weekend) and seasonal temperatures.
