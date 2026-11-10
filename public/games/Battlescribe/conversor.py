import xml.etree.ElementTree as ET
import json
import re
import sys
import os

# BattleScribe XML Namespace
NS = {'bs': 'http://www.battlescribe.net/schema/catalogueSchema'}

def get_points(element):
    """Extracts the point cost from a selection entry."""
    costs = element.find('.//bs:costs', NS)
    if costs is not None:
        for cost in costs.findall('bs:cost', NS):
            if cost.get('name') == 'pts':
                return float(cost.get('value', 0))
    return 0.0

def categorize_upgrade(name, points):
    """Uses heuristics to categorize an upgrade into the JSON schema arrays."""
    name_lower = name.lower()

    command_keywords = ['musician', 'standard bearer', 'champion', 'lordling', 'veteran', 'reaver', 'herald', 'master']
    melee_keywords = ['hand weapon', 'great weapon', 'halberd', 'lance', 'morning star', 'spear', 'flail']
    ranged_keywords = ['crossbow', 'bow', 'handgun', 'pistol', 'throwing']
    armor_keywords = ['armour', 'armor', 'shield', 'cloak', 'barding']
    mount_keywords = ['steed', 'horse', 'pegasus', 'dragon', 'manticore', 'cold one', 'chariot', 'mount']

    if any(kw in name_lower for kw in command_keywords):
        return 'command'
    elif any(kw in name_lower for kw in mount_keywords):
        return 'mounts'
    elif any(kw in name_lower for kw in armor_keywords):
        return 'armor'
    elif any(kw in name_lower for kw in ranged_keywords):
        return 'ranged'
    elif any(kw in name_lower for kw in melee_keywords):
        return 'melee'
    elif 'magic' in name_lower or 'rune' in name_lower or 'item' in name_lower:
        return 'items'
    else:
        return 'options'

def convert_cat_to_json(cat_filepath, output_filepath, faction_id="generic-faction"):
    """Parses the BattleScribe .cat file and outputs the builder-compatible JSON."""

    try:
        tree = ET.parse(cat_filepath)
        root = tree.getroot()
    except ET.ParseError as e:
        print(f"ERROR: The file {cat_filepath} is not a valid XML file. Parse error: {e}")
        sys.exit(1)

    # Validation: Check if it's a BattleScribe catalogue
    if not root.tag.endswith('catalogue'):
        print(f"ERROR: {cat_filepath} is not a valid BattleScribe catalogue format. Missing <catalogue> root tag.")
        sys.exit(1)

    entries = root.find('./bs:selectionEntries', NS)
    if entries is None:
        print("ERROR: No <selectionEntries> found in the catalogue. The file format is incomplete.")
        sys.exit(1)

    # Initialize the output JSON structure
    army_data = {
        "characters": [],
        "lords": [],
        "heroes": [],
        "core": [],
        "special": [],
        "rare": [],
        "mercenaries": [],
        "allies": []
    }

    for unit in entries.findall('./bs:selectionEntry[@type="unit"]', NS):
        unit_name = unit.get('name', 'Unknown Unit')
        unit_id = re.sub(r'[^a-z0-9]+', '-', unit_name.lower()).strip('-')
        base_points = get_points(unit)

        # Infer Category (Lords/Heroes vs Troops) based on categoryLinks and point cost
        is_character = False
        cat_links = unit.findall('.//bs:categoryLink', NS)
        for link in cat_links:
            if 'character' in link.get('name', '').lower():
                is_character = True
                break

        # Basic heuristic for categorization (since GST UUIDs are hidden)
        target_category = "special" # Default fallback
        if is_character:
            target_category = "lords" if base_points >= 100 else "heroes"
        else:
            if base_points < 10:
                target_category = "core"
            elif base_points > 100:
                target_category = "rare"
            else:
                target_category = "special"

        unit_data = {
            "name_en": unit_name,
            "id": unit_id,
            "points": int(base_points) if base_points.is_integer() else base_points,
            "armyComposition": {
                faction_id: {
                    "category": target_category
                }
            },
            "command": [],
            "melee": [],
            "ranged": [],
            "armor": [],
            "options": [],
            "mounts": [],
            "items": []
        }

        # Process upgrades and options
        upgrades = unit.findall('.//bs:selectionEntry[@type="upgrade"]', NS) + unit.findall('.//bs:selectionEntry[@type="model"]', NS)

        for upgrade in upgrades:
            upg_name = upgrade.get('name')
            upg_points = get_points(upgrade)
            upg_id = re.sub(r'[^a-z0-9]+', '-', upg_name.lower()).strip('-')

            # Skip base models inside units if their name closely matches the unit
            if upgrade.get('type') == 'model' and upg_name == unit_name:
                unit_data["points"] = int(upg_points) if upg_points.is_integer() else upg_points
                continue

            category = categorize_upgrade(upg_name, upg_points)

            option_dict = {
                "name_en": upg_name,
                "points": int(upg_points) if upg_points.is_integer() else upg_points
            }

            # Add exclusivity constraint if max is 1
            max_constraint = upgrade.find('.//bs:constraint[@type="max"]', NS)
            if max_constraint is not None and float(max_constraint.get('value', 0)) == 1.0:
                option_dict["exclusive"] = True

            if category == 'items':
                # Consolidate magic items into the specific format
                if not unit_data["items"]:
                    unit_data["items"].append({
                        "name_en": "Magic Items",
                        "types": ["weapon", "armor", "talisman", "enchanted-item", "arcane-item"],
                        "selected": [],
                        "maxPoints": 50 if target_category == "heroes" else 100
                    })
            else:
                # Avoid duplicates
                if not any(existing.get("name_en") == upg_name for existing in unit_data[category]):
                    unit_data[category].append(option_dict)

        army_data[target_category].append(unit_data)

    # Write to JSON file
    with open(output_filepath, 'w', encoding='utf-8') as f:
        json.dump(army_data, f, indent=2, ensure_ascii=False)

    print(f"SUCCESS: Converted {cat_filepath} to {output_filepath}")

if __name__ == "__main__":
    # Example usage
    input_file = "Dark Elves.cat"
    output_file = "dark-elves.json"

    if os.path.exists(input_file):
        convert_cat_to_json(input_file, output_file, faction_id="dark-elves")
    else:
        print(f"Please place {input_file} in the same directory as this script.")