import type { Editor } from "@tiptap/core";
import { TaskItem } from "@tiptap/extension-list";
import { Fragment } from "@tiptap/pm/model";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";

import { vibrate } from "@utilities/haptics";

/**
 * Transaction meta flag for discrete checklist edits (checking an item, reordering).
 * These persist immediately instead of waiting for blur.
 */
export const CHECKLIST_COMMIT = "checklistCommit";

const GRIP_SVG =
  '<svg viewBox="0 0 10 16" width="10" height="16" aria-hidden="true" focusable="false"><g fill="currentColor">' +
  '<circle cx="2.5" cy="3" r="1.5"/><circle cx="7.5" cy="3" r="1.5"/>' +
  '<circle cx="2.5" cy="8" r="1.5"/><circle cx="7.5" cy="8" r="1.5"/>' +
  '<circle cx="2.5" cy="13" r="1.5"/><circle cx="7.5" cy="13" r="1.5"/>' +
  "</g></svg>";

/** Moves the task item at `itemPos` to `toIndex` within its list, keeping the cursor inside it. */
function moveItem(editor: Editor, itemPos: number, toIndex: number): boolean {
  const { state } = editor;
  const $pos = state.doc.resolve(itemPos);
  const list = $pos.parent;
  const fromIndex = $pos.index();
  if (toIndex < 0 || toIndex >= list.childCount || toIndex === fromIndex) {
    return false;
  }

  const children: ProseMirrorNode[] = [];
  list.forEach(child => children.push(child));
  const [moved] = children.splice(fromIndex, 1);
  children.splice(toIndex, 0, moved);

  const tr = state.tr.replaceWith($pos.start(), $pos.end(), Fragment.fromArray(children));

  const { from, to } = state.selection;
  if (from >= itemPos && to <= itemPos + moved.nodeSize) {
    const newItemPos = children.slice(0, toIndex).reduce((pos, child) => pos + child.nodeSize, $pos.start());
    tr.setSelection(TextSelection.create(tr.doc, newItemPos + (from - itemPos), newItemPos + (to - itemPos)));
  }

  editor.view.dispatch(tr.setMeta(CHECKLIST_COMMIT, true).scrollIntoView());
  return true;
}

/**
 * Pointer-driven sorting of the `<li>` siblings of `item`, modeled after the dnd-kit
 * vertical lists used elsewhere in the app: the dragged item follows the pointer (clamped to the
 * list) and its siblings slide out of the way. Calls `onDrop` with the new index.
 */
function startDrag(event: PointerEvent, item: HTMLElement, handle: HTMLElement, onDrop: (toIndex: number) => void) {
  const items = Array.from(item.parentElement?.children ?? []).filter(
    (el): el is HTMLElement => el instanceof HTMLElement
  );
  const fromIndex = items.indexOf(item);
  if (items.length < 2 || fromIndex === -1) {
    return;
  }

  const rects = items.map(el => el.getBoundingClientRect());
  const last = items.length - 1;
  const gap =
    fromIndex > 0
      ? rects[fromIndex].top - rects[fromIndex - 1].bottom
      : rects[fromIndex + 1].top - rects[fromIndex].bottom;
  const shift = rects[fromIndex].height + gap;
  const minDy = rects[0].top - rects[fromIndex].top;
  const maxDy = rects[last].bottom - rects[fromIndex].bottom;
  const startY = event.clientY;
  let toIndex = fromIndex;

  handle.setPointerCapture(event.pointerId);
  items.forEach(el => (el.dataset.sorting = "true"));
  item.dataset.dragging = "true";
  vibrate("pickup");

  const onMove = (e: PointerEvent) => {
    const dy = Math.min(maxDy, Math.max(minDy, e.clientY - startY));
    const top = rects[fromIndex].top + dy;
    const bottom = rects[fromIndex].bottom + dy;
    toIndex = fromIndex;
    items.forEach((el, i) => {
      if (i === fromIndex) {
        return;
      }
      // A sibling makes room once the dragged item's leading edge crosses its midpoint.
      const mid = rects[i].top + rects[i].height / 2;
      let offset = 0;
      if (i < fromIndex && top <= mid) {
        offset = shift;
        toIndex = Math.min(toIndex, i);
      } else if (i > fromIndex && bottom >= mid) {
        offset = -shift;
        toIndex = Math.max(toIndex, i);
      }
      el.style.transform = offset ? `translateY(${offset}px)` : "";
    });
    item.style.transform = `translateY(${dy}px)`;
  };

  const finish = (commit: boolean) => {
    handle.removeEventListener("pointermove", onMove);
    handle.removeEventListener("pointerup", onUp);
    handle.removeEventListener("pointercancel", onCancel);
    window.removeEventListener("keydown", onKeyDown, true);
    if (handle.hasPointerCapture(event.pointerId)) {
      handle.releasePointerCapture(event.pointerId);
    }
    // Drop the sorting flag first so items snap into place without animating back.
    items.forEach(el => {
      delete el.dataset.sorting;
      el.style.transform = "";
    });
    delete item.dataset.dragging;
    if (commit && toIndex !== fromIndex) {
      vibrate("tap");
      onDrop(toIndex);
    }
  };
  const onUp = () => finish(true);
  const onCancel = () => finish(false);
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      finish(false);
    }
  };

  handle.addEventListener("pointermove", onMove);
  handle.addEventListener("pointerup", onUp);
  handle.addEventListener("pointercancel", onCancel);
  window.addEventListener("keydown", onKeyDown, true);
}

/**
 * Task item with a drag handle for reordering, and checks that persist immediately.
 * Alt+ArrowUp / Alt+ArrowDown move the item under the cursor.
 */
const ChecklistItem = TaskItem.extend({
  addKeyboardShortcuts() {
    const move = (direction: -1 | 1) => () => {
      const { $from } = this.editor.state.selection;
      for (let depth = $from.depth; depth > 0; depth--) {
        if ($from.node(depth).type === this.type) {
          return moveItem(this.editor, $from.before(depth), $from.index(depth - 1) + direction);
        }
      }
      return false;
    };

    return {
      ...this.parent?.(),
      "Alt-ArrowUp": move(-1),
      "Alt-ArrowDown": move(1)
    };
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const listItem = document.createElement("li");
      const handle = document.createElement("span");
      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      const content = document.createElement("div");

      listItem.dataset.type = this.name;

      handle.className = "checklist-handle";
      handle.contentEditable = "false";
      handle.title = "Drag to reorder";
      handle.setAttribute("aria-hidden", "true");
      handle.innerHTML = GRIP_SVG;

      label.contentEditable = "false";
      checkbox.type = "checkbox";
      label.append(checkbox);
      listItem.append(handle, label, content);

      const sync = (current: ProseMirrorNode) => {
        listItem.dataset.checked = String(!!current.attrs.checked);
        checkbox.checked = !!current.attrs.checked;
        checkbox.setAttribute("aria-label", `Checklist item: ${current.textContent || "empty item"}`);
      };
      sync(node);

      // Keep the editor's selection/focus untouched (avoids popping the keyboard on mobile).
      checkbox.addEventListener("mousedown", event => event.preventDefault());
      checkbox.addEventListener("change", () => {
        const pos = getPos();
        if (!editor.isEditable || typeof pos !== "number") {
          checkbox.checked = !checkbox.checked;
          return;
        }
        vibrate("tap");
        editor.view.dispatch(
          editor.state.tr.setNodeAttribute(pos, "checked", checkbox.checked).setMeta(CHECKLIST_COMMIT, true)
        );
      });

      handle.addEventListener("pointerdown", event => {
        if (!editor.isEditable || event.button !== 0) {
          return;
        }
        event.preventDefault();
        startDrag(event, listItem, handle, toIndex => {
          const pos = getPos();
          if (typeof pos === "number") {
            moveItem(editor, pos, toIndex);
          }
        });
      });

      return {
        dom: listItem,
        contentDOM: content,
        update: updatedNode => {
          if (updatedNode.type !== this.type) {
            return false;
          }
          sync(updatedNode);
          return true;
        },
        // Drag styles/attributes on the item and anything in the handle/checkbox aren't document content.
        ignoreMutation: mutation => {
          if (mutation.type === "selection") {
            return false;
          }
          if (mutation.type === "attributes" && mutation.target === listItem) {
            return true;
          }
          return !content.contains(mutation.target);
        }
      };
    };
  }
});

export default ChecklistItem;
