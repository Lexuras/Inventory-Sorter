import { sortStacks } from "./itemSorting.js";

export function getBlockInventoryContainer(block) {
  const component = block.getComponent("minecraft:inventory");
  return component?.container;
}

export function getPlayerInventoryContainer(player) {
  const component = player.getComponent("minecraft:inventory");
  return component?.container;
}

export function getBlockKey(block) {
  const { x, y, z } = block.location;
  return `${block.dimension.id}:${x},${y},${z}`;
}

export function isSupportedContainerBlock(block) {
  try {
    const container = getBlockInventoryContainer(block);
    return Boolean(container && container.size > 0);
  } catch {
    return false;
  }
}

export function sortContainer(player, block) {
  const blockContainer = requireContainer(getBlockInventoryContainer(block), "container");
  const containerBefore = readSlots(blockContainer);
  return commitTransaction([
    {
      name: "container",
      container: blockContainer,
      before: containerBefore,
      after: sortAndPack(containerBefore)
    }
  ]);
}

export function sortPlayerInventory(player) {
  const playerContainer = requireContainer(getPlayerInventoryContainer(player), "player inventory");
  const inventoryBefore = readSlots(playerContainer);
  return commitTransaction([
    {
      name: "player inventory",
      container: playerContainer,
      before: inventoryBefore,
      after: sortAndPack(inventoryBefore)
    }
  ]);
}

export function quickStack(player, block) {
  const playerContainer = requireContainer(getPlayerInventoryContainer(player), "player inventory");
  const blockContainer = requireContainer(getBlockInventoryContainer(block), "container");
  const inventoryBefore = readSlots(playerContainer);
  const containerBefore = readSlots(blockContainer);
  const inventoryAfter = cloneSlots(inventoryBefore);
  const containerAfter = cloneSlots(containerBefore);
  const allowedTypes = new Set(containerBefore.filter(Boolean).map((item) => item.typeId));

  for (let slot = 0; slot < inventoryAfter.length; slot++) {
    const item = inventoryAfter[slot];
    if (!item || !allowedTypes.has(item.typeId)) {
      continue;
    }

    inventoryAfter[slot] = insertIntoSlots(item, containerAfter, true);
  }

  return commitTransaction([
    { name: "container", container: blockContainer, before: containerBefore, after: containerAfter },
    { name: "player inventory", container: playerContainer, before: inventoryBefore, after: inventoryAfter }
  ]);
}

export function depositAll(player, block) {
  const playerContainer = requireContainer(getPlayerInventoryContainer(player), "player inventory");
  const blockContainer = requireContainer(getBlockInventoryContainer(block), "container");
  const inventoryBefore = readSlots(playerContainer);
  const containerBefore = readSlots(blockContainer);
  const inventoryAfter = cloneSlots(inventoryBefore);
  const containerAfter = cloneSlots(containerBefore);

  for (let slot = 0; slot < inventoryAfter.length; slot++) {
    const item = inventoryAfter[slot];
    if (item) {
      inventoryAfter[slot] = insertIntoSlots(item, containerAfter, true);
    }
  }

  return commitTransaction([
    { name: "container", container: blockContainer, before: containerBefore, after: containerAfter },
    { name: "player inventory", container: playerContainer, before: inventoryBefore, after: inventoryAfter }
  ]);
}

export function lootAll(player, block) {
  const playerContainer = requireContainer(getPlayerInventoryContainer(player), "player inventory");
  const blockContainer = requireContainer(getBlockInventoryContainer(block), "container");
  const inventoryBefore = readSlots(playerContainer);
  const containerBefore = readSlots(blockContainer);
  const inventoryAfter = cloneSlots(inventoryBefore);
  const containerAfter = cloneSlots(containerBefore);

  for (let slot = 0; slot < containerAfter.length; slot++) {
    const item = containerAfter[slot];
    if (item) {
      containerAfter[slot] = insertIntoSlots(item, inventoryAfter, true);
    }
  }

  return commitTransaction([
    { name: "container", container: blockContainer, before: containerBefore, after: containerAfter },
    { name: "player inventory", container: playerContainer, before: inventoryBefore, after: inventoryAfter }
  ]);
}

export function restock(player, block) {
  const playerContainer = requireContainer(getPlayerInventoryContainer(player), "player inventory");
  const blockContainer = requireContainer(getBlockInventoryContainer(block), "container");
  const inventoryBefore = readSlots(playerContainer);
  const containerBefore = readSlots(blockContainer);
  const inventoryAfter = cloneSlots(inventoryBefore);
  const containerAfter = cloneSlots(containerBefore);
  const wantedTypes = new Set(inventoryBefore.filter(Boolean).map((item) => item.typeId));

  for (const sourceIndex of orderedSlots(containerAfter.length)) {
    const item = containerAfter[sourceIndex];
    if (!item || !wantedTypes.has(item.typeId)) {
      continue;
    }

    containerAfter[sourceIndex] = insertIntoSlots(item, inventoryAfter, true, orderedSlots(inventoryAfter.length));
  }

  return commitTransaction([
    { name: "container", container: blockContainer, before: containerBefore, after: containerAfter },
    { name: "player inventory", container: playerContainer, before: inventoryBefore, after: inventoryAfter }
  ]);
}

function commitTransaction(targets) {
  const snapshots = targets.map((target) => ({
    name: target.name,
    container: target.container,
    before: cloneSlots(target.before),
    after: cloneSlots(target.after)
  }));

  for (const target of snapshots) {
    if (!sameSlots(readSlots(target.container), target.before)) {
      throw new Error(`${target.name} changed before the operation could finish. No items were moved.`);
    }
  }

  const changedSlots = snapshots.reduce((sum, target) => sum + countChangedSlots(target.before, target.after), 0);
  const movedItems = snapshots.reduce((sum, target) => sum + Math.abs(totalAmount(target.after) - totalAmount(target.before)), 0);

  try {
    for (const target of snapshots) {
      writeSlots(target.container, target.after);
    }

    for (const target of snapshots) {
      if (!sameSlots(readSlots(target.container), target.after)) {
        throw new Error(`${target.name} verification failed after writing slots.`);
      }
    }
  } catch (error) {
    for (const target of snapshots) {
      try {
        writeSlots(target.container, target.before);
      } catch {
        // Best-effort rollback; the original error is more useful to surface.
      }
    }

    throw error;
  }

  return {
    changedSlots,
    movedItems,
    message: changedSlots === 0 ? "Nothing to move." : `Updated ${changedSlots} slot${changedSlots === 1 ? "" : "s"}.`
  };
}

function sortAndPack(slots) {
  const merged = packStacks(slots);
  const sorted = sortStacks(merged);
  const output = sorted.map(({ item }) => item.clone());

  while (output.length < slots.length) {
    output.push(undefined);
  }

  return output.slice(0, slots.length);
}

function packStacks(slots) {
  const stacks = [];

  for (let slot = 0; slot < slots.length; slot++) {
    const item = slots[slot];
    if (!item) {
      continue;
    }

    let remaining = item.clone();
    for (const target of stacks) {
      if (!remaining) {
        break;
      }

      remaining = mergeIntoExistingStack(remaining, target.item);
    }

    while (remaining) {
      const nextStack = remaining.clone();
      const max = getMaxAmount(nextStack);
      if (nextStack.amount > max) {
        nextStack.amount = max;
        remaining.amount -= max;
      } else {
        remaining = undefined;
      }

      stacks.push({ item: nextStack, firstSlot: slot });
    }
  }

  return stacks;
}

function insertIntoSlots(source, targetSlots, allowEmptySlots, slotOrder = orderedSlots(targetSlots.length)) {
  let remaining = source.clone();

  for (const targetIndex of slotOrder) {
    const target = targetSlots[targetIndex];
    if (!target || !remaining) {
      continue;
    }

    remaining = mergeIntoExistingStack(remaining, target);
  }

  if (!allowEmptySlots || !remaining) {
    return remaining;
  }

  for (const targetIndex of slotOrder) {
    if (!remaining) {
      break;
    }

    if (targetSlots[targetIndex]) {
      continue;
    }

    const max = getMaxAmount(remaining);
    const placed = remaining.clone();
    placed.amount = Math.min(remaining.amount, max);
    targetSlots[targetIndex] = placed;

    const leftoverAmount = remaining.amount - placed.amount;
    if (leftoverAmount <= 0) {
      remaining = undefined;
    } else {
      remaining.amount = leftoverAmount;
    }
  }

  return remaining;
}

function mergeIntoExistingStack(source, target) {
  if (!canStack(source, target)) {
    return source;
  }

  const capacity = getMaxAmount(target) - target.amount;
  if (capacity <= 0) {
    return source;
  }

  const moved = Math.min(capacity, source.amount);
  target.amount += moved;
  const leftoverAmount = source.amount - moved;

  if (leftoverAmount <= 0) {
    return undefined;
  }

  source.amount = leftoverAmount;
  return source;
}

function orderedSlots(size) {
  const hotbar = [];
  const rest = [];

  for (let slot = 0; slot < size; slot++) {
    if (slot < 9) {
      hotbar.push(slot);
    } else {
      rest.push(slot);
    }
  }

  return [...hotbar, ...rest];
}

function readSlots(container) {
  const slots = [];
  for (let slot = 0; slot < container.size; slot++) {
    slots.push(container.getItem(slot)?.clone());
  }

  return slots;
}

function writeSlots(container, slots) {
  for (let slot = 0; slot < container.size; slot++) {
    container.setItem(slot, slots[slot]);
  }
}

function cloneSlots(slots) {
  return slots.map((item) => item?.clone());
}

function canStack(left, right) {
  if (left.amount <= 0 || right.amount <= 0) {
    return false;
  }

  try {
    return left.isStackableWith(right) && right.isStackableWith(left);
  } catch {
    return false;
  }
}

function getMaxAmount(item) {
  return Math.max(1, item.maxAmount ?? item.amount);
}

function sameSlots(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  for (let slot = 0; slot < left.length; slot++) {
    if (!sameItem(left[slot], right[slot])) {
      return false;
    }
  }

  return true;
}

function sameItem(left, right) {
  if (!left && !right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  if (left.typeId !== right.typeId || left.amount !== right.amount) {
    return false;
  }

  if (canStack(left, right)) {
    return true;
  }

  return left.nameTag === right.nameTag && loreKey(left) === loreKey(right);
}

function loreKey(item) {
  try {
    return item.getLore().join("\n");
  } catch {
    return "";
  }
}

function countChangedSlots(before, after) {
  let changed = 0;
  for (let slot = 0; slot < Math.max(before.length, after.length); slot++) {
    if (!sameItem(before[slot], after[slot])) {
      changed++;
    }
  }

  return changed;
}

function totalAmount(slots) {
  return slots.reduce((sum, item) => sum + (item?.amount ?? 0), 0);
}

function requireContainer(container, name) {
  if (!container) {
    throw new Error(`No ${name} is available.`);
  }

  return container;
}
