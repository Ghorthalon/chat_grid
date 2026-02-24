"""Clock item plugin module surface."""

from __future__ import annotations

from .actions import use_item
from .definition import (
    CAPABILITIES,
    DEFAULT_PARAMS,
    DEFAULT_TIME_ZONE,
    DEFAULT_TITLE,
    DIRECTIONAL,
    EDITABLE_PROPERTIES,
    EMIT_RANGE,
    EMIT_SOUND,
    LABEL,
    PROPERTY_METADATA,
    TIME_ZONE_OPTIONS,
    TOOLTIP,
    USE_COOLDOWN_MS,
    USE_SOUND,
)
from .validator import validate_update

__all__ = [
    "LABEL",
    "TOOLTIP",
    "EDITABLE_PROPERTIES",
    "CAPABILITIES",
    "USE_SOUND",
    "EMIT_SOUND",
    "USE_COOLDOWN_MS",
    "EMIT_RANGE",
    "DIRECTIONAL",
    "DEFAULT_TITLE",
    "DEFAULT_TIME_ZONE",
    "TIME_ZONE_OPTIONS",
    "DEFAULT_PARAMS",
    "PROPERTY_METADATA",
    "validate_update",
    "use_item",
]
