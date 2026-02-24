# Item Type Template

This page is the practical template for the current plugin-driven item architecture.

## Plain-English Flow

When adding a new item type:

1. Server item package
- Add `server/app/items/types/<item_type>/` with:
  - `definition.py` for metadata/constants
  - `validator.py` for `validate_update(item, next_params)`
  - `actions.py` for `use_item(item, nickname, clock_formatter)`
  - `module.py` as thin exported surface
  - `plugin.py` for registration

2. Server plugin file
- Add `server/app/items/types/<item_type>/plugin.py` exporting:
  - `type`
  - `order`
  - `module`

3. Shared item-type unions
- Add the type in:
  - `server/app/models.py`
  - `client/src/network/protocol.ts`
  - `client/src/state/gameState.ts`

4. Client runtime behavior (optional)
- Default: no item-specific client module needed.
- Add `client/src/items/types/<item_type>/behavior.ts` only if this item needs custom client runtime UX/audio logic (for example piano mode).

That is enough for a first working item type.

## Reference Sample Folder

See `docs/examples/item-type-sample/` for a complete copyable folder with all five files.

## Minimal `module.py` Example

```py
from .actions import use_item
from .definition import LABEL, TOOLTIP, EDITABLE_PROPERTIES, CAPABILITIES, USE_SOUND, EMIT_SOUND, USE_COOLDOWN_MS, EMIT_RANGE, DIRECTIONAL, DEFAULT_TITLE, DEFAULT_PARAMS, PROPERTY_METADATA
from .validator import validate_update
```

## Checklist Before Commit

1. Add/adjust server tests for `use` and `update` validation.
2. Run `cd server && uv run --extra dev pytest`.
3. Run `cd client && npm run lint && npm run build`.
4. Update `docs/item-types.md` and `docs/item-schema.md` if behavior/defaults changed.
