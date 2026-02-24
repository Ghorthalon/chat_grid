"""Counter plugin registration sample."""

from __future__ import annotations

from . import module

ITEM_TYPE_PLUGIN = {
    "type": "counter",
    "order": 25,
    "module": module,
}
