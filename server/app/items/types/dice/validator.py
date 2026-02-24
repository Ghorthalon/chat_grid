"""Dice item validation/normalization."""

from __future__ import annotations

from ....models import WorldItem
from ...helpers import keep_only_known_params
from .definition import PARAM_KEYS


def validate_update(_item: WorldItem, next_params: dict) -> dict:
    """Validate and normalize dice params."""

    try:
        sides = int(next_params.get("sides", 6))
        number = int(next_params.get("number", 2))
    except (TypeError, ValueError) as exc:
        raise ValueError("Dice values must be numbers.") from exc
    if not (1 <= sides <= 100 and 1 <= number <= 100):
        raise ValueError("Dice sides and number must be between 1 and 100.")
    next_params["sides"] = sides
    next_params["number"] = number
    return keep_only_known_params(next_params, PARAM_KEYS)
