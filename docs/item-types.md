# Item Types

This is behavior-focused documentation for item types and their defaults.

## Shared Item Behavior

- Items are server-authoritative.
- Global per-type fields are injected by the server and are not persisted per-instance:
  - `capabilities`
  - `useSound`
  - `emitSound`
  - `useCooldownMs` (from item catalog)
- Instance fields are persisted in `server/runtime/items.json`.

## `radio_station`

### Defaults
- Title: `radio`
- Params:
  - `streamUrl=""`
  - `enabled=true`
  - `channel="stereo"`
  - `volume=50`
  - `effect="off"`
  - `effectValue=50`
- Global:
  - `useSound=none`
  - `emitSound=none`
  - `useCooldownMs=1000`

### Use
- `use` toggles `enabled` on/off and broadcasts chat status.

### Validation
- `channel`: `stereo | mono | left | right`
- `volume`: integer `0..100`
- `effect`: `reverb | echo | flanger | high_pass | low_pass | off`
- `effectValue`: number `0..100` with `0.1` precision

## `dice`

### Defaults
- Title: `Dice`
- Params:
  - `sides=6`
  - `number=2`
- Global:
  - `useSound=sounds/roll.ogg`
  - `emitSound=none`
  - `useCooldownMs=1000`

### Use
- Rolls `number` dice with `sides` sides and reports values + total.

### Validation
- `sides`: integer `1..100`
- `number`: integer `1..100`

## `wheel`

### Defaults
- Title: `wheel`
- Params:
  - `spaces="yes, no"`
- Global:
  - `useSound=sounds/spin.ogg`
  - `emitSound=none`
  - `useCooldownMs=4000`

### Use
- Announces spin immediately.
- Result is sent after delay.

### Validation
- `spaces`: comma-delimited values
- At least 1 entry
- Max 100 entries
- Max 80 chars per entry

## `clock`

### Defaults
- Title: `clock`
- Params:
  - `timeZone="America/Detroit"`
  - `use24Hour=false`
- Global:
  - `useSound=none`
  - `emitSound=sounds/clock.ogg`
  - `useCooldownMs=1000`

### Use
- Reports current time from item timezone and format.

### Validation
- `timeZone`: one of `CLOCK_TIME_ZONE_OPTIONS` in `server/app/item_catalog.py`
- `use24Hour`: boolean or on/off style input
