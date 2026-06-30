import type { Block, Player } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import {
  depositAll,
  getBlockKey,
  lootAll,
  quickStack,
  restock,
  sortContainer,
  sortPlayerInventory
} from "../inventory/containerOperations.js";

type MenuAction = "sort_container" | "sort_inventory" | "quick_stack" | "deposit_all" | "loot_all" | "restock";

const ACTIONS: Array<{ id: MenuAction; label: string; description: string }> = [
  { id: "sort_container", label: "Sort Container", description: "Merge stacks, sort groups, and move empty slots to the end." },
  { id: "sort_inventory", label: "Sort My Inventory", description: "Sort the player's main inventory. Armor and offhand are not touched." },
  { id: "quick_stack", label: "Quick Stack", description: "Move matching item types from inventory into this container." },
  { id: "deposit_all", label: "Deposit All", description: "Move as much of the main inventory into this container as will fit." },
  { id: "loot_all", label: "Loot All", description: "Move as much of this container into the main inventory as will fit." },
  { id: "restock", label: "Restock", description: "Refill matching inventory stacks from this container, prioritizing the hotbar." }
];

const locks = new Map<string, string>();
const openForms = new Set<string>();

export async function openContainerMenu(player: Player, block: Block): Promise<void> {
  const key = getBlockKey(block);
  const formKey = `${player.id}:${key}`;

  if (openForms.has(formKey)) {
    return;
  }

  if (locks.has(key)) {
    player.sendMessage("Inventory Sorter: that container is already being managed.");
    return;
  }

  openForms.add(formKey);

  const form = new ActionFormData()
    .title("Inventory Sorter")
    .body("Choose an action for this container. Normal use still opens the container; sneak + use opens this menu.");

  for (const action of ACTIONS) {
    form.button(action.label);
  }

  try {
    const response = await form.show(player);
    if (response.canceled || response.selection === undefined) {
      return;
    }

    const action = ACTIONS[response.selection];
    if (!action) {
      return;
    }

    runLocked(key, player, () => runAction(action.id, player, block));
  } catch (error) {
    player.sendMessage(`Inventory Sorter: ${errorMessage(error)}`);
  } finally {
    openForms.delete(formKey);
  }
}

function runLocked(key: string, player: Player, action: () => void): void {
  if (locks.has(key)) {
    player.sendMessage("Inventory Sorter: that container is already being managed.");
    return;
  }

  locks.set(key, player.id);
  try {
    action();
  } finally {
    locks.delete(key);
  }
}

function runAction(action: MenuAction, player: Player, block: Block): void {
  const result = (() => {
    switch (action) {
      case "sort_container":
        return sortContainer(player, block);
      case "sort_inventory":
        return sortPlayerInventory(player);
      case "quick_stack":
        return quickStack(player, block);
      case "deposit_all":
        return depositAll(player, block);
      case "loot_all":
        return lootAll(player, block);
      case "restock":
        return restock(player, block);
    }
  })();

  player.sendMessage(`Inventory Sorter: ${result.message}`);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
