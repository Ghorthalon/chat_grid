"""Plugin registration for dice item type."""

from __future__ import annotations

from ... import dice

ITEM_TYPE_PLUGIN = {
    "type": "dice",
    "order": 20,
    "module": dice,
}
