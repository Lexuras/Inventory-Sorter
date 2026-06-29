import { system, world } from "@minecraft/server";
import { isSupportedContainerBlock } from "./inventory/containerOperations.js";
import { openContainerMenu } from "./ui/containerMenu.js";

world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
  const { block, player } = event;

  if (!player.isSneaking || !isSupportedContainerBlock(block)) {
    return;
  }

  event.cancel = true;
  system.run(() => {
    openContainerMenu(player, block);
  });
});

system.run(() => {
  console.warn("Inventory Sorter loaded. Sneak + use a container to open the management menu.");
});
