"""Plugin registration for piano item type."""

from __future__ import annotations

from ... import piano

ITEM_TYPE_PLUGIN = {
    "type": "piano",
    "order": 30,
    "module": piano,
}
