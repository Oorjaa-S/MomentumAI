import json
import re
from typing import Any, Dict, Optional


def clean_and_parse_json(raw_text: str) -> Dict[str, Any]:
    """
    Safely extracts and parses a JSON object from an LLM response string.
    Strips markdown formatting, code fences, and extraneous prefix/suffix text.
    """
    if not raw_text or not raw_text.strip():
        raise ValueError("Empty response received from LLM.")

    text = raw_text.strip()
    
    # Remove markdown code blocks if present
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)
        text = text.strip()

    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try regex search for outermost JSON object {...}
    match = re.search(r"(\{[\s\S]*\})", text)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    # Try regex search for JSON array [...]
    match_arr = re.search(r"(\[[\s\S]*\])", text)
    if match_arr:
        try:
            parsed_arr = json.loads(match_arr.group(1))
            return {"items": parsed_arr}
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not parse valid JSON from LLM response: {raw_text[:200]}...")
