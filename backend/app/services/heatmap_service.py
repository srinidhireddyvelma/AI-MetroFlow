
# Hyderabad Metro station locations.
# These are approximate map coordinates, not live crowd measurements.

HYDERABAD_STATIONS = [
    {"station": "Miyapur", "latitude": 17.4968, "longitude": 78.3560},
    {"station": "KPHB Colony", "latitude": 17.4933, "longitude": 78.3997},
    {"station": "Kukatpally", "latitude": 17.4849, "longitude": 78.4138},
    {"station": "Ameerpet", "latitude": 17.4375, "longitude": 78.4483},
    {"station": "Punjagutta", "latitude": 17.4287, "longitude": 78.4528},
    {"station": "Raidurg", "latitude": 17.4421, "longitude": 78.3772},
    {"station": "HITEC City", "latitude": 17.4474, "longitude": 78.3816},
    {"station": "Secunderabad East", "latitude": 17.4344, "longitude": 78.5013},
    {"station": "Parade Grounds", "latitude": 17.4430, "longitude": 78.4980},
    {"station": "Uppal", "latitude": 17.4016, "longitude": 78.5591},
    {"station": "MGBS", "latitude": 17.3784, "longitude": 78.4804},
    {"station": "LB Nagar", "latitude": 17.3497, "longitude": 78.5480},
]


def get_heatmap_data():
    stations = [
        {
            **station,
            "intensity": None,
        }
        for station in HYDERABAD_STATIONS
    ]

    return {
        "count": len(stations),
        "source": "station_locations",
        "heatmap": stations,
    }