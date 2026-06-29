# Limitations And Design Notes

## Vanilla Chest UI Buttons

The original requested design used custom buttons injected directly into the vanilla chest/container screen. Current supported Bedrock APIs do not provide a documented bridge from JSON UI button mappings to Script API callbacks.

Because of that, this add-on does not modify `chest_screen.json` or related vanilla UI files. The companion resource pack is intentionally minimal.

Relevant documentation:

- Microsoft `@minecraft/server-ui`: https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-ui/minecraft-server-ui?view=minecraft-bedrock-stable
- Microsoft `CustomForm`: https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-ui/customform?view=minecraft-bedrock-stable
- Microsoft `UIManager`: https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-ui/uimanager?view=minecraft-bedrock-stable
- Bedrock Wiki JSON UI overview: https://wiki.bedrock.dev/json-ui/json-ui-intro.html

## Supported Interaction

The supported replacement is:

- Normal use opens the container as vanilla.
- Sneak + use opens a Script API form with inventory actions.

This keeps the feature set usable without commands, custom items, or unsupported UI hooks.

## Safety Model

Each operation:

- Reads the source container slots.
- Clones item stacks into a working copy.
- Computes the full result before writing.
- Validates that the source slots did not change before committing.
- Writes the result.
- Verifies the written result.
- Attempts rollback if a write or verification step fails.

Stack merging only happens when `ItemStack.isStackableWith` reports that two stacks are compatible. This is conservative for named, damaged, enchanted, or otherwise customized items.

## Multiplayer

The script locks a container while an Inventory Sorter action is executing. This prevents two scripted actions from changing the same container at the same time.

Players can still normally interact with containers outside the sorter menu. The transaction validation step is there to stop the sorter if the inventory changes during an operation.
