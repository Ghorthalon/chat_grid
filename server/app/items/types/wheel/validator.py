"""Wheel item validation/normalization."""

from __future__ import annotations

from ....models import WorldItem
from ...helpers import keep_only_known_params
from .definition import PARAM_KEYS


def validate_update(_item: WorldItem, next_params: dict) -> dict:
    """Validate and normalize wheel params."""

    spaces_raw = next_params.get("spaces", "")
    if not isinstance(spaces_raw, str):
        raise ValueError("spaces must be a comma-delimited string.")
    if len(spaces_raw) > 4000:
        raise ValueError("spaces must be 4000 characters or less.")
    spaces = [token.strip() for token in spaces_raw.split(",") if token.strip()]
    if not spaces:
        raise ValueError("spaces must include at least one value, separated by commas.")
    if len(spaces) > 100:
        raise ValueError("spaces supports up to 100 values.")
    if any(len(token) > 80 for token in spaces):
        raise ValueError("each space must be 80 chars or less.")
    next_params["spaces"] = ", ".join(spaces)
    return keep_only_known_params(next_params, PARAM_KEYS)
