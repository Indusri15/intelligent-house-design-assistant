import math
from typing import Dict, List, Any

ROOM_TYPES = {
    'living': {'minW': 12, 'minL': 14, 'color': '#e0f2fe', 'name': 'Living Room'},
    'master_bedroom': {'minW': 11, 'minL': 13, 'color': '#ede9fe', 'name': 'Master Bedroom'},
    'bedroom': {'minW': 10, 'minL': 11, 'color': '#f3e8ff', 'name': 'Bedroom'},
    'kitchen': {'minW': 8, 'minL': 10, 'color': '#ffedd5', 'name': 'Modular Kitchen'},
    'dining': {'minW': 9, 'minL': 10, 'color': '#fef3c7', 'name': 'Dining Space'},
    'pooja': {'minW': 5, 'minL': 5, 'color': '#fef9c3', 'name': 'Pooja Room'},
    'bathroom': {'minW': 5, 'minL': 7, 'color': '#cffafe', 'name': 'Bathroom'},
    'utility': {'minW': 5, 'minL': 6, 'color': '#f1f5f9', 'name': 'Utility / Wash'},
    'staircase': {'minW': 7, 'minL': 10, 'color': '#e2e8f0', 'name': 'Staircase'},
    'parking': {'minW': 10, 'minL': 14, 'color': '#f8fafc', 'name': 'Car Parking'},
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

    def generate_layout(self, accommodation: Dict[str, Any], floors_count: int = 1) -> Dict[str, Any]:
        floors = []
        for f in range(1, floors_count + 1):
            is_ground = (f == 1)
            rooms = self._allocate_floor_rooms(accommodation, is_ground=is_ground, floor_num=f)
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

    def _allocate_floor_rooms(self, acc: Dict[str, Any], is_ground: bool, floor_num: int) -> List[Dict[str, Any]]:
        rooms = []
        w = self.build_width
        l = self.build_length
        half_w = math.floor(w / 2)

        if is_ground:
            # Front zone: Parking + Living Room
            front_l = min(14.0, math.floor(l * 0.35))
            if acc.get('parking', True) and w >= 22:
                rooms.append({
                    "id": "parking_gf", "name": "Car Parking / Porch", "type": "parking",
                    "x": 0, "y": 0, "width": min(12, half_w), "length": front_l,
                    "areaSqFt": min(12, half_w) * front_l, "vastuZone": "NW" if self.facing != "East" else "SE",
                    "doors": [{"wall": "front", "offset": 2, "width": 9}], "windows": [], "color": ROOM_TYPES['parking']['color']
                })
                rooms.append({
                    "id": "living_gf", "name": "Living Room", "type": "living",
                    "x": min(12, half_w), "y": 0, "width": w - min(12, half_w), "length": front_l,
                    "areaSqFt": (w - min(12, half_w)) * front_l, "vastuZone": "NE",
                    "doors": [{"wall": "front", "offset": 3, "width": 3.5}], "windows": [{"wall": "right", "offset": 3, "width": 4.5}], "color": ROOM_TYPES['living']['color']
                })
            else:
                rooms.append({
                    "id": "living_gf", "name": "Formal Living Room", "type": "living",
                    "x": 0, "y": 0, "width": w, "length": front_l,
                    "areaSqFt": w * front_l, "vastuZone": "E",
                    "doors": [{"wall": "front", "offset": math.floor(w * 0.6), "width": 3.5}], "windows": [{"wall": "front", "offset": 2, "width": 4}], "color": ROOM_TYPES['living']['color']
                })

            # Mid zone: Staircase + Dining + Kitchen + Pooja
            mid_l = max(11.0, math.floor((l - front_l) * 0.55))
            stair_w = 7.0
            rooms.append({
                "id": "staircase_gf", "name": "Staircase", "type": "staircase",
                "x": 0, "y": front_l, "width": stair_w, "length": mid_l,
                "areaSqFt": stair_w * mid_l, "vastuZone": "S",
                "doors": [{"wall": "right", "offset": 2, "width": 3}], "windows": [], "color": ROOM_TYPES['staircase']['color']
            })

            rem_w = w - stair_w
            kitch_w = math.floor(rem_w * 0.5)
            dining_w = rem_w - kitch_w

            rooms.append({
                "id": "dining_gf", "name": "Dining Space", "type": "dining",
                "x": stair_w, "y": front_l, "width": dining_w, "length": mid_l,
                "areaSqFt": dining_w * mid_l, "vastuZone": "CENTER",
                "doors": [{"wall": "left", "offset": 2, "width": 3}], "windows": [], "color": ROOM_TYPES['dining']['color']
            })

            rooms.append({
                "id": "kitchen_gf", "name": "Modular Kitchen", "type": "kitchen",
                "x": stair_w + dining_w, "y": front_l, "width": kitch_w, "length": mid_l,
                "areaSqFt": kitch_w * mid_l, "vastuZone": "SE",
                "doors": [{"wall": "left", "offset": 2, "width": 3}], "windows": [{"wall": "right", "offset": 2, "width": 3.5}], "color": ROOM_TYPES['kitchen']['color']
            })

            # Rear zone: Master Bedroom + Bathrooms
            rear_y = front_l + mid_l
            rear_l = max(10.0, l - rear_y)
            bed_w = math.floor(w * 0.65)
            bath_w = w - bed_w

            rooms.append({
                "id": "master_bedroom_gf", "name": "Master Bedroom", "type": "master_bedroom",
                "x": 0, "y": rear_y, "width": bed_w, "length": rear_l,
                "areaSqFt": bed_w * rear_l, "vastuZone": "SW",
                "doors": [{"wall": "front", "offset": 2, "width": 3}], "windows": [{"wall": "rear", "offset": 3, "width": 4}], "color": ROOM_TYPES['master_bedroom']['color']
            })

            rooms.append({
                "id": "bath_gf", "name": "Toilet / Bath", "type": "bathroom",
                "x": bed_w, "y": rear_y, "width": bath_w, "length": rear_l,
                "areaSqFt": bath_w * rear_l, "vastuZone": "W",
                "doors": [{"wall": "left", "offset": 1, "width": 2.5}], "windows": [{"wall": "right", "offset": 1, "width": 2}], "color": ROOM_TYPES['bathroom']['color']
            })
        else:
            # First Floor
            rooms.append({
                "id": f"bedroom_f{floor_num}_1", "name": "Bedroom 2", "type": "bedroom",
                "x": 0, "y": 0, "width": half_w, "length": 14,
                "areaSqFt": half_w * 14, "vastuZone": "NW",
                "doors": [{"wall": "rear", "offset": 2, "width": 3}], "windows": [{"wall": "front", "offset": 2, "width": 4}], "color": ROOM_TYPES['bedroom']['color']
            })
            rooms.append({
                "id": f"balcony_f{floor_num}", "name": "Open Balcony", "type": "balcony",
                "x": half_w, "y": 0, "width": w - half_w, "length": 14,
                "areaSqFt": (w - half_w) * 14, "vastuZone": "NE",
                "doors": [{"wall": "rear", "offset": 2, "width": 3}], "windows": [], "color": ROOM_TYPES['balcony']['color']
            })
            rooms.append({
                "id": f"staircase_f{floor_num}", "name": "Staircase", "type": "staircase",
                "x": 0, "y": 14, "width": 7, "length": 12,
                "areaSqFt": 84, "vastuZone": "S",
                "doors": [{"wall": "right", "offset": 2, "width": 3}], "windows": [], "color": ROOM_TYPES['staircase']['color']
            })
            rooms.append({
                "id": f"bedroom_f{floor_num}_2", "name": "Bedroom 3", "type": "bedroom",
                "x": 0, "y": 26, "width": w, "length": max(10, l - 26),
                "areaSqFt": w * max(10, l - 26), "vastuZone": "SW",
                "doors": [{"wall": "front", "offset": 2, "width": 3}], "windows": [{"wall": "rear", "offset": 3, "width": 4}], "color": ROOM_TYPES['bedroom']['color']
            })

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
