"""Plugin registration for clock item type."""

from __future__ import annotations

from ... import clock

ITEM_TYPE_PLUGIN = {
    "type": "clock",
    "order": 10,
    "module": clock,
}
