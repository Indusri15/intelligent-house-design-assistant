import math
from typing import Dict, List, Any

ROOM_TYPES = {
    'living': {'minW': 12, 'minL': 14, 'color': '#e0f2fe', 'name': 'Living Room'},
    'master_bedroom': {'minW': 11, 'minL': 13, 'color': '#ede9fe', 'name': 'Master Bedroom'},
    'bedroom': {'minW': 10, 'minL': 11, 'color': '#f3e8ff', 'name': 'Bedroom'},
    'kitchen': {'minW': 8, 'minL': 10, 'color': '#ffedd5', 'name': 'Modular Kitchen'},
    'dining': {'minW': 9, 'minL': 10, 'color': '#fef3c7', 'name': 'Dining Space'},
    'pooja': {'minW': 4, 'minL': 5, 'color': '#fef9c3', 'name': 'Pooja Mandir'},
    'bathroom': {'minW': 5, 'minL': 7, 'color': '#cffafe', 'name': 'Bathroom'},
    'utility': {'minW': 5, 'minL': 6, 'color': '#f1f5f9', 'name': 'Utility / Wash'},
    'staircase': {'minW': 6.5, 'minL': 9, 'color': '#e2e8f0', 'name': 'Staircase'},
    'parking': {'minW': 10, 'minL': 14, 'color': '#f8fafc', 'name': 'Car Parking / Porch'},
    'balcony': {'minW': 4, 'minL': 8, 'color': '#d1fae5', 'name': 'Balcony'},
    'study': {'minW': 8, 'minL': 9, 'color': '#fae8ff', 'name': 'Study Room'}
}

class GeometricFloorPlanEngine:
    def __init__(self, plot_length: float, plot_width: float, setbacks: Dict[str, float], facing: str = "East"):
        self.plot_length = float(plot_length)
        self.plot_width = float(plot_width)
        self.setbacks = setbacks
        self.facing = facing
        
        self.build_width = max(12.0, self.plot_width - float(setbacks.get('left', 3.0)) - float(setbacks.get('right', 3.0)))
        self.build_length = max(14.0, self.plot_length - float(setbacks.get('front', 5.0)) - float(setbacks.get('rear', 3.0)))
        self.built_up_per_floor = round(self.build_width * self.build_length)

    def plan_room_distribution(self, floors_count: int, req_bedrooms: int, req_bathrooms: int) -> List[Dict[str, Any]]:
        distribution = [{"bedrooms": [], "bathrooms": []} for _ in range(floors_count)]
        
        # Bedrooms
        bed_idx = 1
        if floors_count == 1:
            for _ in range(req_bedrooms):
                distribution[0]["bedrooms"].append({
                    "index": bed_idx,
                    "isMaster": bed_idx == 1,
                    "name": "Master Bedroom" if bed_idx == 1 else f"Bedroom {bed_idx}",
                    "type": "master_bedroom" if bed_idx == 1 else "bedroom"
                })
                bed_idx += 1
        elif floors_count == 2:
            gf_count = 1 if req_bedrooms == 1 else (2 if req_bedrooms >= 4 else 1)
            for _ in range(gf_count):
                distribution[0]["bedrooms"].append({
                    "index": bed_idx,
                    "isMaster": bed_idx == 1,
                    "name": "Master Bedroom" if bed_idx == 1 else f"Bedroom {bed_idx}",
                    "type": "master_bedroom" if bed_idx == 1 else "bedroom"
                })
                bed_idx += 1
            for _ in range(req_bedrooms - gf_count):
                distribution[1]["bedrooms"].append({
                    "index": bed_idx,
                    "isMaster": False,
                    "name": f"Bedroom {bed_idx}",
                    "type": "bedroom"
                })
                bed_idx += 1
        else:
            gf_count = 2 if req_bedrooms >= 5 else 1
            for _ in range(gf_count):
                distribution[0]["bedrooms"].append({
                    "index": bed_idx,
                    "isMaster": bed_idx == 1,
                    "name": "Master Bedroom" if bed_idx == 1 else f"Bedroom {bed_idx}",
                    "type": "master_bedroom" if bed_idx == 1 else "bedroom"
                })
                bed_idx += 1
            rem = req_bedrooms - gf_count
            for f in range(1, floors_count):
                cnt = math.ceil(rem / (floors_count - f))
                rem -= cnt
                for _ in range(cnt):
                    distribution[f]["bedrooms"].append({
                        "index": bed_idx,
                        "isMaster": False,
                        "name": f"Bedroom {bed_idx}",
                        "type": "bedroom"
                    })
                    bed_idx += 1

        # Bathrooms
        bath_idx = 1
        if floors_count == 1:
            for _ in range(req_bathrooms):
                distribution[0]["bathrooms"].append({
                    "index": bath_idx,
                    "name": "Master Ensuite Bath" if bath_idx == 1 else f"Bathroom {bath_idx}",
                    "type": "bathroom"
                })
                bath_idx += 1
        elif floors_count == 2:
            gf_baths = 1 if req_bathrooms == 1 else (math.floor(req_bathrooms / 2) if req_bathrooms >= 4 else (2 if req_bathrooms == 3 else 1))
            for _ in range(gf_baths):
                distribution[0]["bathrooms"].append({
                    "index": bath_idx,
                    "name": "Master Ensuite Bath" if bath_idx == 1 else f"Bathroom {bath_idx}",
                    "type": "bathroom"
                })
                bath_idx += 1
            for _ in range(req_bathrooms - gf_baths):
                distribution[1]["bathrooms"].append({
                    "index": bath_idx,
                    "name": f"Bathroom {bath_idx}",
                    "type": "bathroom"
                })
                bath_idx += 1
        else:
            rem_baths = req_bathrooms
            for f in range(floors_count):
                cnt = rem_baths if f == floors_count - 1 else min(rem_baths, max(1, math.floor(req_bathrooms / floors_count)))
                rem_baths -= cnt
                for _ in range(cnt):
                    distribution[f]["bathrooms"].append({
                        "index": bath_idx,
                        "name": f"Bathroom {bath_idx}",
                        "type": "bathroom"
                    })
                    bath_idx += 1

        return distribution

    def generate_layout(self, accommodation: Dict[str, Any], floors_count: int = 1) -> Dict[str, Any]:
        floors = []
        req_beds = int(accommodation.get('bedrooms', 3))
        req_baths = int(accommodation.get('bathrooms', 2))
        distribution = self.plan_room_distribution(floors_count, req_beds, req_baths)

        has_staircase = floors_count > 1 or bool(accommodation.get('staircase', True))
        stair_w = min(8.0, max(6.5, round(self.build_width * 0.24)))
        stair_l = min(12.0, max(8.5, round(self.build_length * 0.24)))
        stair_y = max(11.0, round(self.build_length * 0.32))
        stair_geom = {"x": 0.0, "y": stair_y, "width": stair_w, "length": stair_l} if has_staircase else None

        for f in range(1, floors_count + 1):
            is_ground = (f == 1)
            f_dist = distribution[f - 1]
            rooms = self._allocate_floor_rooms(
                acc=accommodation,
                is_ground=is_ground,
                floor_num=f,
                floor_beds=f_dist["bedrooms"],
                floor_baths=f_dist["bathrooms"],
                stair_geom=stair_geom
            )
            svg_content = self._render_svg(rooms, f)
            
            floors.append({
                "floorNumber": f,
                "floorName": "Ground Floor" if is_ground else f"Floor {f}",
                "floorAreaSqFt": self.built_up_per_floor,
                "boundary": {
                    "x": self.setbacks.get('left', 3.0),
                    "y": self.setbacks.get('front', 5.0),
                    "width": self.build_width,
                    "length": self.build_length
                },
                "rooms": rooms,
                "svgContent": svg_content
            })

        total_area = self.built_up_per_floor * floors_count
        return {
            "totalBuiltUpAreaSqFt": total_area,
            "groundFloorAreaSqFt": self.built_up_per_floor,
            "firstFloorAreaSqFt": self.built_up_per_floor if floors_count > 1 else 0,
            "floors": floors,
            "isValid": True,
            "boundaryFit": True
        }

    def _allocate_floor_rooms(self, acc: Dict[str, Any], is_ground: bool, floor_num: int, floor_beds: List[Dict[str, Any]], floor_baths: List[Dict[str, Any]], stair_geom: Any) -> List[Dict[str, Any]]:
        rooms = []
        w = self.build_width
        l = self.build_length

        front_l = stair_geom["y"] if stair_geom else max(12.0, round(l * 0.33))
        mid_l = stair_geom["length"] if stair_geom else max(10.0, round(l * 0.28))
        rear_y = front_l + mid_l
        rear_l = max(10.0, l - rear_y)

        has_parking = bool(acc.get('parking', True))
        has_living = acc.get('livingRoom', True) is not False
        has_dining = acc.get('diningRoom', True) is not False
        has_kitchen = acc.get('kitchen', True) is not False
        has_pooja = bool(acc.get('poojaRoom', True))
        has_balcony = bool(acc.get('balcony', True))
        has_utility = bool(acc.get('utilityArea', True))
        has_study = bool(acc.get('studyRoom', False))

        if is_ground:
            # Front zone: Parking + Living
            if has_parking:
                park_w = min(12.0, max(10.0, math.floor(w * 0.42)))
                rooms.append({
                    "id": "parking_gf", "name": "Car Parking / Porch", "type": "parking",
                    "x": 0, "y": 0, "width": park_w, "length": front_l,
                    "areaSqFt": park_w * front_l, "vastuZone": "NW" if self.facing != "East" else "SE",
                    "doors": [{"wall": "front", "offset": 2, "width": 8}], "windows": [], "color": ROOM_TYPES['parking']['color']
                })
                liv_w = w - park_w
                rooms.append({
                    "id": "living_gf", "name": "Living Room", "type": "living",
                    "x": park_w, "y": 0, "width": liv_w, "length": front_l,
                    "areaSqFt": liv_w * front_l, "vastuZone": "NE",
                    "doors": [{"wall": "front", "offset": 2, "width": 3.5}], "windows": [{"wall": "right", "offset": 2, "width": 4}], "color": ROOM_TYPES['living']['color']
                })
            else:
                rooms.append({
                    "id": "living_gf", "name": "Formal Living Room", "type": "living",
                    "x": 0, "y": 0, "width": w, "length": front_l,
                    "areaSqFt": w * front_l, "vastuZone": "E",
                    "doors": [{"wall": "front", "offset": math.floor(w * 0.5), "width": 3.5}], "windows": [{"wall": "front", "offset": 2, "width": 4}], "color": ROOM_TYPES['living']['color']
                })

            # Mid zone: Staircase + Dining + Kitchen + Pooja
            start_x = 0.0
            if stair_geom:
                rooms.append({
                    "id": "staircase_gf", "name": "Staircase", "type": "staircase",
                    "x": stair_geom["x"], "y": stair_geom["y"], "width": stair_geom["width"], "length": stair_geom["length"],
                    "areaSqFt": stair_geom["width"] * stair_geom["length"], "vastuZone": "S",
                    "doors": [{"wall": "right", "offset": 2, "width": 3}], "windows": [], "color": ROOM_TYPES['staircase']['color']
                })
                start_x = stair_geom["width"]

            mid_rem_w = w - start_x
            if has_dining and has_kitchen and has_pooja:
                pooja_w = min(5.0, math.floor(mid_rem_w * 0.18))
                din_w = math.floor((mid_rem_w - pooja_w) * 0.48)
                kit_w = mid_rem_w - pooja_w - din_w
                rooms.append({"id": "dining_gf", "name": "Dining Space", "type": "dining", "x": start_x, "y": front_l, "width": din_w, "length": mid_l, "areaSqFt": din_w * mid_l, "vastuZone": "CENTER", "doors": [], "windows": [], "color": ROOM_TYPES['dining']['color']})
                rooms.append({"id": "pooja_gf", "name": "Pooja Mandir", "type": "pooja", "x": start_x + din_w, "y": front_l, "width": pooja_w, "length": mid_l, "areaSqFt": pooja_w * mid_l, "vastuZone": "NE", "doors": [], "windows": [], "color": ROOM_TYPES['pooja']['color']})
                rooms.append({"id": "kitchen_gf", "name": "Modular Kitchen", "type": "kitchen", "x": start_x + din_w + pooja_w, "y": front_l, "width": kit_w, "length": mid_l, "areaSqFt": kit_w * mid_l, "vastuZone": "SE", "doors": [], "windows": [], "color": ROOM_TYPES['kitchen']['color']})
            elif has_dining and has_kitchen:
                din_w = math.floor(mid_rem_w * 0.48)
                kit_w = mid_rem_w - din_w
                rooms.append({"id": "dining_gf", "name": "Dining Space", "type": "dining", "x": start_x, "y": front_l, "width": din_w, "length": mid_l, "areaSqFt": din_w * mid_l, "vastuZone": "CENTER", "doors": [], "windows": [], "color": ROOM_TYPES['dining']['color']})
                rooms.append({"id": "kitchen_gf", "name": "Modular Kitchen", "type": "kitchen", "x": start_x + din_w, "y": front_l, "width": kit_w, "length": mid_l, "areaSqFt": kit_w * mid_l, "vastuZone": "SE", "doors": [], "windows": [], "color": ROOM_TYPES['kitchen']['color']})
            else:
                rooms.append({"id": "kitchen_gf", "name": "Modular Kitchen", "type": "kitchen", "x": start_x, "y": front_l, "width": mid_rem_w, "length": mid_l, "areaSqFt": mid_rem_w * mid_l, "vastuZone": "SE", "doors": [], "windows": [], "color": ROOM_TYPES['kitchen']['color']})

            # Rear zone: Bedrooms and Bathrooms
            rear_beds = floor_beds[:2]
            if len(rear_beds) == 1:
                bed = rear_beds[0]
                bed_w = math.floor(w * 0.62)
                bath_w = w - bed_w
                rooms.append({"id": f"bedroom_gf_{bed['index']}", "name": bed['name'], "type": bed['type'], "x": 0, "y": rear_y, "width": bed_w, "length": rear_l, "areaSqFt": bed_w * rear_l, "vastuZone": "SW", "doors": [], "windows": [], "color": ROOM_TYPES['master_bedroom']['color']})
                rooms.append({"id": "bath_gf", "name": "Master Ensuite Bath", "type": "bathroom", "x": bed_w, "y": rear_y, "width": bath_w, "length": rear_l, "areaSqFt": bath_w * rear_l, "vastuZone": "W", "doors": [], "windows": [], "color": ROOM_TYPES['bathroom']['color']})
            elif len(rear_beds) >= 2:
                half_w = math.floor(w * 0.5)
                bed1, bed2 = rear_beds[0], rear_beds[1]
                rooms.append({"id": f"bedroom_gf_{bed1['index']}", "name": bed1['name'], "type": bed1['type'], "x": 0, "y": rear_y, "width": half_w, "length": rear_l, "areaSqFt": half_w * rear_l, "vastuZone": "SW", "doors": [], "windows": [], "color": ROOM_TYPES['master_bedroom']['color']})
                rooms.append({"id": f"bedroom_gf_{bed2['index']}", "name": bed2['name'], "type": bed2['type'], "x": half_w, "y": rear_y, "width": w - half_w, "length": rear_l, "areaSqFt": (w - half_w) * rear_l, "vastuZone": "SE", "doors": [], "windows": [], "color": ROOM_TYPES['bedroom']['color']})
        else:
            # Upper Floor
            rem_beds = list(floor_beds)
            front_bed = rem_beds.pop(0) if len(rem_beds) > 0 else None
            
            if has_balcony:
                balc_w = min(8.0, math.floor(w * 0.32))
                rooms.append({"id": f"balcony_f{floor_num}", "name": "Balcony", "type": "balcony", "x": 0, "y": 0, "width": balc_w, "length": front_l, "areaSqFt": balc_w * front_l, "vastuZone": "NE", "doors": [], "windows": [], "color": ROOM_TYPES['balcony']['color']})
                if front_bed:
                    rooms.append({"id": f"bedroom_f{floor_num}_{front_bed['index']}", "name": front_bed['name'], "type": "bedroom", "x": balc_w, "y": 0, "width": w - balc_w, "length": front_l, "areaSqFt": (w - balc_w) * front_l, "vastuZone": "NW", "doors": [], "windows": [], "color": ROOM_TYPES['bedroom']['color']})
            elif front_bed:
                rooms.append({"id": f"bedroom_f{floor_num}_{front_bed['index']}", "name": front_bed['name'], "type": "bedroom", "x": 0, "y": 0, "width": w, "length": front_l, "areaSqFt": w * front_l, "vastuZone": "NW", "doors": [], "windows": [], "color": ROOM_TYPES['bedroom']['color']})

            # Staircase
            if stair_geom:
                rooms.append({"id": f"staircase_f{floor_num}", "name": "Staircase Landing", "type": "staircase", "x": stair_geom["x"], "y": stair_geom["y"], "width": stair_geom["width"], "length": stair_geom["length"], "areaSqFt": stair_geom["width"] * stair_geom["length"], "vastuZone": "S", "doors": [], "windows": [], "color": ROOM_TYPES['staircase']['color']})
                rooms.append({"id": f"lounge_f{floor_num}", "name": "Upper Family Lounge", "type": "living", "x": stair_geom["width"], "y": front_l, "width": w - stair_geom["width"], "length": mid_l, "areaSqFt": (w - stair_geom["width"]) * mid_l, "vastuZone": "CENTER", "doors": [], "windows": [], "color": ROOM_TYPES['living']['color']})

            # Rear Beds
            if len(rem_beds) == 1:
                bed = rem_beds[0]
                bed_w = math.floor(w * 0.62)
                rooms.append({"id": f"bedroom_f{floor_num}_{bed['index']}", "name": bed['name'], "type": "bedroom", "x": 0, "y": rear_y, "width": bed_w, "length": rear_l, "areaSqFt": bed_w * rear_l, "vastuZone": "SW", "doors": [], "windows": [], "color": ROOM_TYPES['bedroom']['color']})
                rooms.append({"id": f"bath_f{floor_num}", "name": "Attached Bath", "type": "bathroom", "x": bed_w, "y": rear_y, "width": w - bed_w, "length": rear_l, "areaSqFt": (w - bed_w) * rear_l, "vastuZone": "W", "doors": [], "windows": [], "color": ROOM_TYPES['bathroom']['color']})
            elif len(rem_beds) >= 2:
                half_w = math.floor(w * 0.5)
                b1, b2 = rem_beds[0], rem_beds[1]
                rooms.append({"id": f"bedroom_f{floor_num}_{b1['index']}", "name": b1['name'], "type": "bedroom", "x": 0, "y": rear_y, "width": half_w, "length": rear_l, "areaSqFt": half_w * rear_l, "vastuZone": "SW", "doors": [], "windows": [], "color": ROOM_TYPES['bedroom']['color']})
                rooms.append({"id": f"bedroom_f{floor_num}_{b2['index']}", "name": b2['name'], "type": "bedroom", "x": half_w, "y": rear_y, "width": w - half_w, "length": rear_l, "areaSqFt": (w - half_w) * rear_l, "vastuZone": "SE", "doors": [], "windows": [], "color": ROOM_TYPES['bedroom']['color']})

        return rooms

    def _render_svg(self, rooms: List[Dict[str, Any]], floor_num: int) -> str:
        SCALE = 16
        PAD = 40
        svg_w = int(self.plot_width * SCALE + PAD * 2)
        svg_h = int(self.plot_length * SCALE + PAD * 2)
        off_x = PAD + int(self.setbacks.get('left', 3.0) * SCALE)
        off_y = PAD + int(self.setbacks.get('front', 5.0) * SCALE)

        svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {svg_w} {svg_h}" class="w-full h-auto bg-slate-50">\n'
        svg += f'  <rect x="{PAD}" y="{PAD}" width="{self.plot_width * SCALE}" height="{self.plot_length * SCALE}" fill="#fff" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4,4"/>\n'
        svg += f'  <g transform="translate({off_x}, {off_y})">\n'

        for r in rooms:
            rx = r['x'] * SCALE
            ry = r['y'] * SCALE
            rw = r['width'] * SCALE
            rl = r['length'] * SCALE
            svg += f'    <rect x="{rx}" y="{ry}" width="{rw}" height="{rl}" fill="{r["color"]}" stroke="#334155" stroke-width="2.5"/>\n'
            svg += f'    <text x="{rx + rw/2}" y="{ry + rl/2}" text-anchor="middle" font-size="11" font-weight="700" fill="#0f172a">{r["name"]}</text>\n'
            svg += f'    <text x="{rx + rw/2}" y="{ry + rl/2 + 15}" text-anchor="middle" font-size="9" fill="#475569">{int(r["width"])}\' x {int(r["length"])}\' ({int(r["areaSqFt"])} sq.ft)</text>\n'

        svg += '  </g>\n</svg>'
        return svg
