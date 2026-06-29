# Architecture

## Behavior Pack

The behavior pack contains the Script API implementation.

- `src/main.ts` subscribes to `playerInteractWithBlock` before-events.
- `src/ui/containerMenu.ts` owns the Script API form and per-container action lock.
- `src/inventory/containerOperations.ts` owns slot snapshots, transfer logic, transaction validation, rollback, and container access.
- `src/inventory/itemSorting.ts` owns item category ordering.

The `scripts/` folder mirrors this source as JavaScript for direct Bedrock loading.

## Resource Pack

The resource pack is present as a companion pack, but it does not modify vanilla UI. This is intentional: resource-pack JSON UI can draw or remap UI controls, but it cannot call Script API functions from injected vanilla chest buttons.

## Achievement-Friendly Rules

The add-on avoids:

- Commands
- Cheats
- Gamerule changes
- Experimental UI hooks
- Special tool items

All item movement is done through supported container APIs.
