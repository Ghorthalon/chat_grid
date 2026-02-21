# Item Type Template

This page is a practical, copy/paste template for adding a new item type with the current registry-based system.

Use this when you want a new item type without editing one huge `if/elif` chain.

## Plain-English Flow

When a new item type is added, you wire it in four places:

1. Server catalog (`item_catalog.py`)
- Defines global defaults shared by all instances of that type:
  - default title
  - default params
  - use sound / emit sound
  - cooldown

2. Server behavior (`item_type_handlers.py`)
- Defines what happens when users edit params (`validate_update`).
- Defines what happens when users press `use` (`use`).

3. Shared type unions (`models.py`, protocol/state types)
- Adds the new type name to type literals/unions so packets validate.

4. Client item registry (`itemRegistry.ts`)
- Defines add-menu order, editable properties, and optional property dropdown choices.

That is enough for a first working item type.

## Example: `counter`

This sample item increments a number each time it is used.

### 1. Server Catalog (`server/app/item_catalog.py`)

```py
ItemType = Literal["radio_station", "dice", "wheel", "clock", "counter"]

ITEM_DEFINITIONS: dict[ItemType, ItemDefinition] = {
    # ...existing...
    "counter": ItemDefinition(
        default_title="counter",
        capabilities=("editable", "carryable", "deletable", "usable"),
        use_sound=None,
        emit_sound=None,
        default_params={"value": 0},
        use_cooldown_ms=1000,
    ),
}
```

### 2. Server Handler (`server/app/item_type_handlers.py`)

```py
def _validate_counter_update(_item: WorldItem, next_params: dict) -> dict:
    try:
        value = int(next_params.get("value", 0))
    except (TypeError, ValueError) as exc:
        raise ValueError("value must be a number.") from exc
    if value < 0:
        raise ValueError("value must be 0 or greater.")
    next_params["value"] = value
    return next_params


def _use_counter(item: WorldItem, nickname: str, _clock_formatter: Callable[[dict], str]) -> ItemUseResult:
    current = int(item.params.get("value", 0))
    next_value = current + 1
    return ItemUseResult(
        self_message=f"{item.title}: {next_value}",
        others_message=f"{nickname} uses {item.title}: {next_value}",
        updated_params={**item.params, "value": next_value},
    )


ITEM_TYPE_HANDLERS: dict[ItemType, ItemTypeHandler] = {
    # ...existing...
    "counter": ItemTypeHandler(
        validate_update=_validate_counter_update,
        use=_use_counter,
    ),
}
```

### 3. Type Unions

Update item-type unions/literals in:

- `server/app/models.py`
- `client/src/network/protocol.ts`
- `client/src/state/gameState.ts`

Add `"counter"` anywhere item types are enumerated.

### 4. Client Registry (`client/src/items/itemRegistry.ts`)

```ts
export const ITEM_TYPE_SEQUENCE: ItemType[] = ['clock', 'counter', 'dice', 'radio_station', 'wheel'];

const ITEM_TYPE_EDITABLE_PROPERTIES: Record<ItemType, string[]> = {
  // ...existing...
  counter: ['title', 'value'],
};

export const ITEM_TYPE_GLOBAL_PROPERTIES: Record<ItemType, Record<string, string | number | boolean>> = {
  // ...existing...
  counter: { useSound: 'none', emitSound: 'none', useCooldownMs: 1000 },
};
```

No dropdown options are needed here because `value` is a numeric text field.

## Checklist Before Commit

1. Add/adjust server tests for `use` and `update` validation.
2. Run `cd server && uv run --extra dev pytest`.
3. Run `cd client && npm run lint && npm run build`.
4. Update `docs/item-types.md` and `docs/item-schema.md` if behavior/defaults changed.
