from typing import List, Dict, Any

VASTU_RULES = {
    'entrance': {'optimal': ['NE', 'E', 'N'], 'score': 100, 'remedy': 'Install brass threshold and warm entryway lighting.'},
    'kitchen': {'optimal': ['SE', 'NW'], 'score': 100, 'remedy': 'Orient stove platform to face East and add high-capacity exhaust.'},
    'master_bedroom': {'optimal': ['SW', 'S'], 'score': 100, 'remedy': 'Headboard should orient Southward with grounding earth tones.'},
    'pooja': {'optimal': ['NE', 'E'], 'score': 100, 'remedy': 'Place white marble mandir platform facing East.'},
    'bathroom': {'optimal': ['NW', 'W'], 'score': 100, 'remedy': 'Keep doors closed and maintain continuous ventilation.'},
    'staircase': {'optimal': ['S', 'SW', 'W'], 'score': 100, 'remedy': 'Use clockwise ascending treads.'}
}

class VastuEvaluator:
    @staticmethod
    def evaluate(rooms: List[Dict[str, Any]], facing: str = "East") -> Dict[str, Any]:
        evaluations = []
        total_score = 0
        count = 0

        for r in rooms:
            rtype = r.get('type')
            if rtype in VASTU_RULES:
                count += 1
                rule = VASTU_RULES[rtype]
                zone = r.get('vastuZone', 'NE')
                is_optimal = zone in rule['optimal']
                score = rule['score'] if is_optimal else 40
                total_score += score

                evaluations.append({
                    "roomType": rtype,
                    "roomName": r.get('name', rtype.title()),
                    "zone": zone,
                    "optimalZones": rule['optimal'],
                    "status": "OPTIMAL" if is_optimal else "NEEDS_ATTENTION",
                    "score": score,
                    "remedy": "Compliant orientation." if is_optimal else rule['remedy']
                })

        overall_score = round(total_score / max(1, count))
        return {
            "overallScore": overall_score,
            "grade": "EXCELLENT" if overall_score >= 90 else "GOOD" if overall_score >= 70 else "NEEDS_ADJUSTMENT",
            "evaluations": evaluations
        }
