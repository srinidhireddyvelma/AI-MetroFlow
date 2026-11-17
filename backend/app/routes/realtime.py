
import random
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.routes.auth import get_current_user
from app.services.realtime_service import get_realtime_update

router = APIRouter(
    prefix="/api/realtime",
    tags=["Real-Time Updates"],
)


class RealtimeRequest(BaseModel):
    station: str
    crowd_level: str = "normal"
    train_status: str = "on_time"
    delay_minutes: float = 0


@router.post("/update")
def realtime_update(
    request: RealtimeRequest,
    current_user=Depends(get_current_user),
):
    return get_realtime_update(
        station=request.station,
        crowd_level=request.crowd_level,
        train_status=request.train_status,
        delay_minutes=request.delay_minutes,
    )


@router.get("/simulate")
def simulate_realtime(
    current_user=Depends(get_current_user),
):
    """Generate simulated conditions for Hyderabad Metro stations."""

    stations = [
        "Miyapur",
        "KPHB Colony",
        "Kukatpally",
        "Ameerpet",
        "Punjagutta",
        "Raidurg",
        "HITEC City",
        "Secunderabad East",
        "Parade Grounds",
        "Uppal",
        "MGBS",
        "LB Nagar",
    ]

    updates = []
    last_updated = datetime.now(timezone.utc).isoformat()

    for station in stations:
        crowd_level = random.choices(
            ["low", "normal", "high", "critical"],
            weights=[20, 40, 30, 10],
            k=1,
        )[0]

        delay_minutes = random.choice(
            [0, 0, 1, 2, 3, 5, 8, 12]
        )

        train_status = (
            "delayed" if delay_minutes >= 5 else "on_time"
        )

        updates.append(
            {
                "station": station,
                "crowd_level": crowd_level,
                "train_status": train_status,
                "delay_minutes": delay_minutes,
                "last_updated": last_updated,
                "status": "simulated",
            }
        )

    return {
        "source": "simulation",
        "count": len(updates),
        "updates": updates,
    }
