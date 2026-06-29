# Inventory Sorter

Achievement-friendly Minecraft Bedrock inventory management add-on.

## What This Version Supports

Bedrock does not currently expose a supported way for JSON UI buttons inside the vanilla chest screen to call Script API actions. This add-on therefore uses the closest supported flow:

1. Sneak.
2. Use a container block.
3. Pick an action from the Script API form.

Normal container use is unchanged when the player is not sneaking.

## Actions

- Sort Container
- Sort My Inventory
- Quick Stack
- Deposit All
- Loot All
- Restock

The script uses container APIs only. It does not use commands, cheats, gamerule changes, or unsupported JSON UI hooks.

## Files

- `behavior_pack/manifest.json` - behavior pack manifest.
- `behavior_pack/scripts/` - JavaScript loaded by Minecraft.
- `behavior_pack/src/` - TypeScript source.
- `resource_pack/manifest.json` - companion resource pack. It intentionally does not patch vanilla chest UI.
- `docs/INSTALL.md` - installation and build notes.
- `docs/LIMITATIONS.md` - Bedrock API limitations and design choices.

## Usage

Apply both packs to a world. In game, sneak and use a chest, barrel, shulker box, trapped chest, or any block with a supported inventory component.
