def get_traffic_analysis():
    """
    Demonstration-only Hyderabad Metro traffic data.
    These values are simulated, not actual passenger measurements.
    """
    stations = [
        {"line": "Red Line - Miyapur", "records": 120, "total_entries": 8200, "total_exits": 7600, "traffic_level": "high", "data_source": "simulated"},
        {"line": "Red Line - KPHB Colony", "records": 120, "total_entries": 6100, "total_exits": 5900, "traffic_level": "normal", "data_source": "simulated"},
        {"line": "Red Line - Ameerpet", "records": 120, "total_entries": 9500, "total_exits": 9100, "traffic_level": "high", "data_source": "simulated"},
        {"line": "Blue Line - HITEC City", "records": 120, "total_entries": 7300, "total_exits": 6800, "traffic_level": "high", "data_source": "simulated"},
        {"line": "Blue Line - Raidurg", "records": 120, "total_entries": 5400, "total_exits": 5100, "traffic_level": "normal", "data_source": "simulated"},
        {"line": "Green Line - MGBS", "records": 120, "total_entries": 3200, "total_exits": 3500, "traffic_level": "low", "data_source": "simulated"},
        {"line": "Green Line - Parade Grounds", "records": 120, "total_entries": 4100, "total_exits": 3900, "traffic_level": "normal", "data_source": "simulated"},
        {"line": "Blue Line - Uppal", "records": 120, "total_entries": 4800, "total_exits": 4600, "traffic_level": "normal", "data_source": "simulated"},
    ]
    return stations
