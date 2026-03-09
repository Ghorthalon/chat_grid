## Goal

Add an optional HRTF-based spatial audio mode for Chat Grid so positional sounds use browser 3D panning rather than the current shared left/right stereo pan model.

This must preserve the current source-specific behavior of grid audio. Different sounds already originate from different positions and runtimes, and that should remain true after any HRTF work.

## Feasibility

This is feasible in the current client architecture.

Why:

- The client already has shared spatial math in [`spatial.ts`](/home/jjm/code/chgrid/client/src/audio/spatial.ts).
- Most spatial sources already route through a small set of audio modules.
- The browser Web Audio API supports `PannerNode` with `panningModel = "HRTF"`.

What is not true today:

- There is not one single central spatial node for all sources.
- Most spatial sources still create their own `StereoPannerNode` directly.

So the right plan is not "flip one switch." The right plan is to introduce a shared spatial output abstraction, then migrate the existing spatial sources to it.

## Current Spatial Coverage

The current spatial system already covers most of the sources you care about:

- peer voice in [`audioEngine.ts`](/home/jjm/code/chgrid/client/src/audio/audioEngine.ts)
- remote footsteps / teleports / item-use one-shots in [`audioEngine.ts`](/home/jjm/code/chgrid/client/src/audio/audioEngine.ts) and [`main.ts`](/home/jjm/code/chgrid/client/src/main.ts)
- clock announcements in [`clockAnnouncer.ts`](/home/jjm/code/chgrid/client/src/audio/clockAnnouncer.ts)
- radios in [`radioStationRuntime.ts`](/home/jjm/code/chgrid/client/src/audio/radioStationRuntime.ts)
- item emit sounds in [`itemEmitRuntime.ts`](/home/jjm/code/chgrid/client/src/audio/itemEmitRuntime.ts)
- piano notes in [`pianoSynth.ts`](/home/jjm/code/chgrid/client/src/audio/pianoSynth.ts)

The common part today is the gain/pan math in [`spatial.ts`](/home/jjm/code/chgrid/client/src/audio/spatial.ts), not the actual Web Audio node graph.

## Main Constraint

The current spatial model computes:

- gain
- stereo pan

HRTF needs more than that:

- source position on X/Y/Z axes
- listener position
- listener orientation
- `PannerNode` distance model and cone settings

So the plan should keep the existing spatial math for range/directional audibility, but move pan handling into a shared HRTF-aware node builder.

## Recommended Design

### 1. Introduce a spatial mode setting

Add a new audio spatial mode concept, separate from the current output mode:

- `stereo`
- `mono`
- `hrtf`

Do not overload the existing `mono` / `stereo` toggle with HRTF semantics.

Why:

- mono/stereo is a speaker/downmix preference
- HRTF is a spatial rendering mode

If you want to keep the current command surface small, the first pass can expose:

- output mode: `mono` / `stereo`
- spatial mode: `classic` / `hrtf`

Where:

- `classic` means current gain + `StereoPannerNode` behavior
- `hrtf` means current gain plus `PannerNode`

For now, a simple keyboard toggle is reasonable. `H` makes sense as an initial shortcut as long as it does not conflict with an existing command in normal mode.

### 2. Add a shared spatial node helper

Create one shared helper under `client/src/audio/`, for example:

- `spatialGraph.ts`

It should own:

- creation of either `StereoPannerNode` or `PannerNode`
- common connect/disconnect behavior
- common position/orientation updates
- a small runtime type so all spatial sources can be updated uniformly

What it should not do:

- erase the fact that different sound sources have different lifecycles
- collapse radio, voice, emitters, piano, and one-shots into one generic runtime if that loses behavior

The centralization goal should be limited to shared node construction and shared spatial updates, not flattening all audio features into one code path.

This helper should replace direct `createStereoPanner()` calls in:

- [`audioEngine.ts`](/home/jjm/code/chgrid/client/src/audio/audioEngine.ts)
- [`radioStationRuntime.ts`](/home/jjm/code/chgrid/client/src/audio/radioStationRuntime.ts)
- [`itemEmitRuntime.ts`](/home/jjm/code/chgrid/client/src/audio/itemEmitRuntime.ts)
- [`pianoSynth.ts`](/home/jjm/code/chgrid/client/src/audio/pianoSynth.ts)

### 3. Keep current gain/distance logic in `spatial.ts`

The current `resolveSpatialMix()` logic is still useful for:

- audibility cutoff
- gain shaping
- directional attenuation

I would keep that server/game-feel logic and reuse it for HRTF mode as the gain envelope.

What should change:

- `pan` should stop being the main output for HRTF mode
- HRTF mode should instead map source/listener coordinates into a `PannerNode`

So the likely split is:

- `resolveSpatialMix()` continues to return gain and optional directional attenuation
- a new helper computes node position/orientation updates for HRTF

### 4. Add listener orientation support

HRTF only becomes meaningful if the listener orientation is updated.

The natural mapping here is:

- listener position: player `x`, `y`
- listener forward direction: player facing / heading

If the grid does not currently track a stable listening orientation outside movement, define one explicitly and keep it updated in the main loop or audio engine update path.

Without listener orientation, HRTF will still spatialize left/right, but front/back cues will be much weaker and less intentional.

### 5. Preserve current item and source features

This is the main guardrail for the change.

The HRTF work should preserve existing behavior for:

- radio channel routing and radio effect chains
- item emit timing, looping, delays, and effect chains
- piano voice handling and release behavior
- peer voice listen gain
- directional cones / rear attenuation
- distance-gated subscribe / unsubscribe behavior
- current per-source positions on the grid

The correct implementation is:

- keep source-specific runtimes where they still own real behavior
- centralize only the spatial rendering layer they share

If a piece of code looks similar but still owns different behavior, treat it as separate unless the duplication is clearly only about node construction or coordinate updates.

### 6. Convert spatial sources incrementally

Recommended order:

1. peer voice
2. one-shot world sounds in `AudioEngine`
3. radios
4. item emitters
5. piano synth

That order gives the largest user impact first and keeps the early work in the most centralized code.

### 7. Preserve current directional muffling/effects behavior

Directional cones and muffling already exist in the current spatial logic for items/radios.

Do not move that responsibility into `PannerNode` alone.

Instead:

- keep current directional attenuation logic in `spatial.ts`
- optionally later map some of it to `coneInnerAngle`, `coneOuterAngle`, and `coneOuterGain`

For the first pass, software-side directional gain shaping is simpler and more predictable.

## Important Realities

### Not every sound should use HRTF

These should remain non-spatial:

- UI confirmations/cancels
- local footstep/self-confirmation sounds
- menu/help feedback

HRTF should apply only to world-positioned sounds.

### Radio and emitters are continuous sources

These are not one-shot sounds. For them, the implementation needs:

- persistent `PannerNode` lifecycles
- regular listener/source position updates
- no audible zippering/clicks on movement updates

That is why shared spatial node handling matters.

### Voice is the best early target

Peer voice already has:

- per-peer runtime state
- continuous streaming
- position updates every frame

So it is the strongest real-world test for whether HRTF improves the grid.

## Suggested First Pass Scope

First pass should do only this:

- add `classic` vs `hrtf` spatial mode
- add a temporary `H` toggle for that mode
- support HRTF for:
  - peer voice
  - remote one-shot spatial samples
  - radios
  - item emitters
- leave piano on the old model until the shared helper is stable if needed

That gets most of the value without forcing every audio path to change at once.

## User Settings / Commands

The current client already stores output mode in [`settingsStore.ts`](/home/jjm/code/chgrid/client/src/settings/settingsStore.ts) and toggles it from [`main.ts`](/home/jjm/code/chgrid/client/src/main.ts).

I would add:

- persisted spatial mode setting
- one command to cycle:
  - `classic`
  - `hrtf`

For the first pass, mapping that command to `H` is reasonable.

Keep `mono` / `stereo` separate.

If needed, HRTF mode can automatically degrade to `classic` when browser support is missing.

## Testing Plan

### Functional

- peer voice moves around listener and remains audible
- front/back changes are perceptible with facing changes
- radio/item emitters move cleanly with no disconnects
- clock announcements and remote footsteps still play
- mono output still disables spatial left/right behavior cleanly

### Regression

- no breaks in existing media/effect chains
- no stuck nodes after item cleanup / peer disconnect
- no crashes on browsers without useful `PannerNode` support

### Listening

- test with headphones first
- verify that HRTF does not make near-field sounds too quiet or too harsh
- verify that movement/facing updates do not create pumping artifacts

## Recommended Implementation Order

1. Add spatial mode setting and persistence.
2. Add shared spatial node runtime/helper.
3. Convert peer voice and one-shot spatial samples in `AudioEngine`.
4. Convert radios and item emitters.
5. Tune listener orientation and gain curves.
6. Convert piano if the result still feels worth it after the first pass.

## Bottom Line

HRTF is possible here, but the codebase is not yet one-node-centralized enough to make it a trivial switch.

The good news is that the architecture is already close:

- common spatial math exists
- spatial sources are clearly identified
- most of the remaining work is consolidating node creation and adding listener/source position handling for `PannerNode`

That makes this a realistic next-step audio feature, not a speculative rewrite.

The key design rule should be:

- centralize the spatial rendering layer where it is truly shared
- preserve all existing per-source and per-item behavior unless it is demonstrably duplicate
