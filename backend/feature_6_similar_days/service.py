import os
import sys
from typing import Optional, List, Dict, Any
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# Add project root to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from backend.feature_3_energy_trends.service import EnergyTrendsService, DATA_DIR

class SimilarDayService:

    @staticmethod
    def load_prepared_dataframe(region: str) -> tuple[pd.DataFrame, str]:
        """
        Loads cleaned CSV, ensures 24-hour completeness, and adds date/hour/weekday columns.
        """
        region = region.strip().upper()
        df = EnergyTrendsService.load_region_dataframe(region)
        
        # Add temporal columns
        df["date"] = df.index.date
        df["hour"] = df.index.hour
        df["day_of_week"] = df.index.dayofweek
        df["day_name"] = df.index.day_name()

        return df, "consumption_mw"

    @staticmethod
    def get_available_dates(region: str = "PJME") -> List[str]:
        """
        Returns list of all complete 24-hour dates for a region.
        """
        df, _ = SimilarDayService.load_prepared_dataframe(region)
        daily_counts = df.groupby("date").size()
        complete_dates = sorted([str(d) for d in daily_counts[daily_counts == 24].index])
        return complete_dates

    @staticmethod
    def find_similar_days(
        region: str = "PJME",
        target_date: Optional[str] = None,
        top_n: int = 5,
        same_weekday_only: bool = True
    ) -> Dict[str, Any]:
        """
        High-performance vectorized 24-hour curve shape vector matching using Cosine Similarity.
        """
        region = region.strip().upper()
        df, col = SimilarDayService.load_prepared_dataframe(region)

        # Pivot to create a fast Date x 24-Hour Matrix
        matrix = df.pivot_table(index="date", columns="hour", values=col)
        # Keep only days with complete 24 hours (no NaNs)
        matrix = matrix.dropna(how="any")

        if matrix.empty:
            return {
                "region": region,
                "target_date": None,
                "labels": [f"{h:02d}:00" for h in range(24)],
                "selectedDay": None,
                "matches": []
            }

        complete_dates = list(matrix.index)

        # Resolve target date
        target_dt = None
        if target_date and str(target_date).lower() != "today":
            try:
                parsed_dt = pd.to_datetime(target_date).date()
                if parsed_dt in matrix.index:
                    target_dt = parsed_dt
            except Exception:
                target_dt = None

        if target_dt is None:
            # Default to the most recent complete date
            target_dt = complete_dates[-1]

        target_vector = matrix.loc[target_dt].values.astype(float)
        target_mean = target_vector.mean()
        target_std = target_vector.std()
        if target_std == 0:
            target_std = 1.0

        target_norm = (target_vector - target_mean) / target_std
        target_day_name = pd.Timestamp(target_dt).day_name()
        target_dayofweek = pd.Timestamp(target_dt).dayofweek

        # Filter candidates
        candidate_matrix = matrix.drop(index=target_dt)
        if same_weekday_only:
            # Filter rows where index dayofweek matches target
            same_day_mask = [pd.Timestamp(d).dayofweek == target_dayofweek for d in candidate_matrix.index]
            candidate_matrix = candidate_matrix[same_day_mask]

        if candidate_matrix.empty:
            candidate_matrix = matrix.drop(index=target_dt)

        # Vectorized Normalization: Z = (X - mean) / std per row
        cand_values = candidate_matrix.values.astype(float)
        cand_means = cand_values.mean(axis=1, keepdims=True)
        cand_stds = cand_values.std(axis=1, keepdims=True)
        cand_stds[cand_stds == 0] = 1.0
        cand_norms = (cand_values - cand_means) / cand_stds

        # Compute all cosine similarities in a single vectorized matrix multiplication
        sim_scores = cosine_similarity(target_norm.reshape(1, -1), cand_norms)[0]
        similarity_pcts = np.round(((sim_scores + 1.0) / 2.0) * 100.0, 2)

        # Sort top N indices
        top_indices = np.argsort(similarity_pcts)[::-1][:top_n]

        formatted_matches = []
        for rank_idx, idx in enumerate(top_indices):
            cand_dt = candidate_matrix.index[idx]
            cand_curve = candidate_matrix.iloc[idx].values
            cand_peak_hour = int(np.argmax(cand_curve))

            formatted_matches.append({
                "rank": rank_idx + 1,
                "date": pd.Timestamp(cand_dt).strftime("%b %d, %Y"),
                "rawDate": str(cand_dt),
                "dayType": pd.Timestamp(cand_dt).day_name(),
                "similarityPct": float(similarity_pcts[idx]),
                "avgMW": round(float(cand_curve.mean()), 2),
                "peakMW": round(float(cand_curve.max()), 2),
                "minMW": round(float(cand_curve.min()), 2),
                "peakHour": f"{cand_peak_hour:02d}:00",
                "curve": [round(float(v), 1) for v in cand_curve]
            })

        target_peak_hour = int(np.argmax(target_vector))

        return {
            "region": region,
            "targetDate": pd.Timestamp(target_dt).strftime("%b %d, %Y"),
            "targetDateRaw": str(target_dt),
            "targetDayName": target_day_name,
            "totalComparisons": len(candidate_matrix),
            "labels": [f"{h:02d}:00" for h in range(24)],
            "selectedDay": {
                "date": pd.Timestamp(target_dt).strftime("%b %d, %Y"),
                "dayName": target_day_name,
                "avgMW": round(float(target_mean), 2),
                "peakMW": round(float(target_vector.max()), 2),
                "minMW": round(float(target_vector.min()), 2),
                "peakHour": f"{target_peak_hour:02d}:00",
                "curve": [round(float(v), 1) for v in target_vector]
            },
            "matches": formatted_matches
        }
