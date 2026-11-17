from fastapi import APIRouter, Depends
from app.core.security import require_operator_or_admin

router = APIRouter(
    prefix="/api/congestion",
    tags=["Congestion Tracking"]
)

# Demonstration-only data. These are simulated values, not live passenger counts.
HYDERABAD_DEMO_STATIONS = [
    {"station": "Ameerpet", "entries": 9500, "exits": 9100},
    {"station": "Miyapur", "entries": 8200, "exits": 7600},
    {"station": "HITEC City", "entries": 7300, "exits": 6800},
    {"station": "KPHB Colony", "entries": 6100, "exits": 5900},
    {"station": "Raidurg", "entries": 5400, "exits": 5100},
    {"station": "Uppal", "entries": 4800, "exits": 4600},
    {"station": "Parade Grounds", "entries": 4100, "exits": 3900},
    {"station": "MGBS", "entries": 3200, "exits": 3500},
    {"station": "LB Nagar", "entries": 2800, "exits": 2600},
    {"station": "Secunderabad East", "entries": 2400, "exits": 2300},
]


@router.get("/summary")
def congestion_summary(
    current_user=Depends(require_operator_or_admin)
):
    top_stations = [
        {
            **station,
            "total_activity": station["entries"] + station["exits"]
        }
        for station in HYDERABAD_DEMO_STATIONS
    ]

    top_stations.sort(
        key=lambda station: station["total_activity"],
        reverse=True
    )

    return {
        "total_records": sum(120 for _ in top_stations),
        "total_entries": sum(s["entries"] for s in top_stations),
        "total_exits": sum(s["exits"] for s in top_stations),
        "top_congested_stations": top_stations[:10],
        "data_source": "simulated",
        "notice": "Demonstration data only; not live Hyderabad Metro measurements."
    }
