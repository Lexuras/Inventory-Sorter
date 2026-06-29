# Installation

## Use Without Building

The behavior pack already includes runtime JavaScript in `behavior_pack/scripts`.

1. Copy `behavior_pack` into your Bedrock `development_behavior_packs` folder.
2. Copy `resource_pack` into your Bedrock `development_resource_packs` folder.
3. Enable both packs on a world.
4. Keep cheats off if you want achievements/trophies to remain available.
5. Sneak + use a container block to open the Inventory Sorter menu.

## Optional TypeScript Build

The TypeScript source is in `behavior_pack/src`.

```powershell
npm install
npm run build
```

This compiles TypeScript into `behavior_pack/scripts`.

## Packaging

To distribute as an add-on, zip the contents of `behavior_pack` and `resource_pack` into Bedrock-compatible `.mcpack` files, or bundle both into a `.mcaddon`.

Do not add command functions or experimental JSON UI button bridges if achievement-friendly behavior is required.
