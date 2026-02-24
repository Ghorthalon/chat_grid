"""Counter item validation/normalization."""

from __future__ import annotations

from ....models import WorldItem
from ...helpers import keep_only_known_params
from .definition import PARAM_KEYS


def validate_update(_item: WorldItem, next_params: dict) -> dict:
    """Validate and normalize counter params."""

    try:
        value = int(next_params.get("value", 0))
    except (TypeError, ValueError) as exc:
        raise ValueError("value must be a number.") from exc
    if value < 0:
        raise ValueError("value must be 0 or greater.")
    next_params["value"] = value
    return keep_only_known_params(next_params, PARAM_KEYS)
