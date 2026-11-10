import xml.etree.ElementTree as ET
import json
import re
import sys
import os

# BattleScribe XML Namespace
NS = {'bs': 'http://www.battlescribe.net/schema/catalogueSchema'}
# Fallback namespace for game systems if different
GST_NS = {'bs': 'http://www.battlescribe.net/schema/gameSystemSchema'}

def slugify(text):
    """Converts a string to a URL-friendly slug ID."""
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')

def get_points(element):
    """Extracts the point cost from a selection entry."""
    costs = element.find('.//bs:costs', NS)
    if costs is not None:
        for cost in costs.findall('bs:cost', NS):
            if cost.get('name') == 'pts':
                return float(cost.get('value', 0))
    return 0.0

def load_gst_data(gst_filepath):
    """Parses the .gst file to extract exact category and profile mappings."""
    gst_data = {
        'categories': {},
        'profile_types': {}
    }
    try:
        tree = ET.parse(gst_filepath)
        root = tree.getroot()

        # Extract Categories (Lords, Heroes, Core, Special, Rare, etc.)
        for category in root.findall('.//bs:categoryEntry', GST_NS):
            cat_id = category.get('id')
            cat_name = category.get('name')
            gst_data['categories'][cat_id] = cat_name.lower()

        # Extract Profile Types (Weapon, Armour, Magic Items, etc.)
        for prof_type in root.findall('.//bs:profileType', GST_NS):
            prof_id = prof_type.get('id')
            prof_name = prof_type.get('name')
            gst_data['profile_types'][prof_id] = prof_name.lower()

    except Exception as e:
        print(f"Warning: Could not parse GST file completely. Error: {e}")

    return gst_data

def categorize_upgrade(upgrade, upg_name, gst_data):
    """
    Uses GST profile links first, then falls back to heuristics
    to categorize an upgrade into the JSON schema arrays.
    """
    name_lower = upg_name.lower()

    # 1. Check Profile Links to use exact GST definitions
    profiles = upgrade.findall('.//bs:profile', NS)
    for prof in profiles:
        type_id = prof.get('typeId')
        type_name = gst_data['profile_types'].get(type_id, prof.get('typeName', '')).lower()

        if type_name == 'weapon':
            # Try to determine if it's ranged or melee by looking at range
            range_char = prof.find('.//bs:characteristic[@name="Range"]', NS)
            if range_char is not None and range_char.text:
                rt = range_char.text.lower()
                if 'cc' in rt or '-' in rt or 'combat' in rt:
                    return 'melee'
                else:
                    return 'ranged'
            return 'melee'
        elif type_name == 'armour':
            return 'armor'
        elif type_name == 'magic items':
            return 'items'

    # 2. Fallback to Heuristics if profiles are missing or generic
    command_keywords = ['musician', 'standard bearer', 'champion', 'lordling', 'veteran', 'reaver', 'herald', 'master', 'first knight']
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

def convert_to_json(cat_filepath, gst_filepath, output_filepath, faction_id):
    """Parses the files and outputs the builder-compatible JSON."""

    gst_data = load_gst_data(gst_filepath)

    try:
        tree = ET.parse(cat_filepath)
        root = tree.getroot()
    except ET.ParseError as e:
        print(f"ERROR: {cat_filepath} is not a valid XML file. Parse error: {e}")
        sys.exit(1)

    entries = root.find('./bs:selectionEntries', NS)
    if entries is None:
        print("ERROR: No <selectionEntries> found. The .cat file is incomplete.")
        sys.exit(1)

    army_data = {
        "characters": [], "lords": [], "heroes": [], "core": [],
        "special": [], "rare": [], "mercenaries": [], "allies": []
    }

    for unit in entries.findall('./bs:selectionEntry[@type="unit"]', NS):
        unit_name = unit.get('name', 'Unknown Unit')
        unit_id = slugify(unit_name)
        base_points = get_points(unit)

        # 1. Determine Exact Category using GST mappings
        target_category = "special" # Fallback
        cat_links = unit.findall('.//bs:categoryLink', NS)
        for link in cat_links:
            cat_id = link.get('targetId')
            mapped_cat = gst_data['categories'].get(cat_id, '')
            if mapped_cat in army_data:
                target_category = mapped_cat
                # Prioritize specific slots over generic 'characters' tag
                if mapped_cat in ['lords', 'heroes', 'core', 'special', 'rare']:
                    break

        # Pluralize edge cases from GST to match JSON schema
        if target_category == 'lord': target_category = 'lords'
        if target_category == 'hero': target_category = 'heroes'

        # 2. Setup Unit Dictionary
        unit_dict = {
            "name_en": unit_name,
            "id": unit_id,
            "points": int(base_points) if base_points.is_integer() else base_points,
            "armyComposition": {
                faction_id: { "category": target_category }
            },
            "command": [], "equipment": [], "melee": [],
            "ranged": [], "armor": [], "options": [],
            "mounts": [], "items": []
        }

        # Handle min/max constraints for units
        min_constraint = unit.find('.//bs:constraint[@type="min"]', NS)
        max_constraint = unit.find('.//bs:constraint[@type="max"]', NS)
        if min_constraint is not None:
            unit_dict["minimum"] = int(float(min_constraint.get('value', 0)))
        if max_constraint is not None:
            max_val = float(max_constraint.get('value', 0))
            unit_dict["maximum"] = int(max_val) if max_val > 0 else 0

        # 3. Process Options and Upgrades
        upgrades = unit.findall('.//bs:selectionEntry[@type="upgrade"]', NS) + unit.findall('.//bs:selectionEntry[@type="model"]', NS)

        for upgrade in upgrades:
            upg_name = upgrade.get('name')
            upg_points = get_points(upgrade)
            upg_id = slugify(upg_name)

            # Skip base models that just represent the unit body
            if upgrade.get('type') == 'model' and (upg_name == unit_name or upg_points == base_points):
                unit_dict["points"] = int(upg_points) if upg_points.is_integer() else upg_points
                continue

            category = categorize_upgrade(upgrade, upg_name, gst_data)

            option_dict = {
                "name_en": upg_name,
                "points": int(upg_points) if upg_points.is_integer() else upg_points
            }

            # Handle max=1 exclusivity
            max_c = upgrade.find('.//bs:constraint[@type="max"]', NS)
            if max_c is not None and float(max_c.get('value', 0)) == 1.0:
                option_dict["exclusive"] = True

            # Handle Items consolidating into the builder format
            if category == 'items':
                if not unit_dict["items"]:
                    unit_dict["items"].append({
                        "name_en": "Magic Items & Runes",
                        "types": ["weapon", "armor", "talisman", "enchanted-item", "arcane-item"],
                        "selected": [],
                        "maxPoints": 50 if target_category == "heroes" else 100
                    })
            else:
                # Deduplicate entries safely
                if not any(existing.get("name_en") == upg_name for existing in unit_dict.get(category, [])):
                    if category not in unit_dict:
                        unit_dict[category] = []
                    unit_dict[category].append(option_dict)

        # Cleanup empty arrays to keep JSON tidy
        keys_to_clean = ["command", "equipment", "melee", "ranged", "armor", "options", "mounts", "items"]
        for k in keys_to_clean:
            if not unit_dict.get(k):
                del unit_dict[k]

        army_data[target_category].append(unit_dict)

    # Output File
    with open(output_filepath, 'w', encoding='utf-8') as f:
        json.dump(army_data, f, indent=2, ensure_ascii=False)

    print(f"SUCCESS: Converted {cat_filepath} using GST definitions to {output_filepath}")

if __name__ == "__main__":
    # Execution setup
    gst_file = "Warhammer-Fantasy-Battle-6th-edition.gst"
    faction = "dwarfs"
    cat_file = f"{faction}.cat" # Can be swapped to 'Dwarfs.cat'
    out_file = f"{faction}.json"

    if not os.path.exists(gst_file):
        print(f"ERROR: GST file '{gst_file}' missing. Script requires it for accurate parsing.")
    elif not os.path.exists(cat_file):
        print(f"ERROR: CAT file '{cat_file}' missing.")
    else:
        convert_to_json(cat_file, gst_file, out_file, faction)