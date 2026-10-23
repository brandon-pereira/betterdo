import { Extension } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

interface ChecklistHintOptions {
  placeholder: string;
}

/**
 * Placeholder for an empty notes box: a grayed-out checkbox (where a checklist item's
 * checkbox would be) followed by placeholder text. Clicking the checkbox starts a
 * checklist in one click; clicks on the text fall through to the editor to type as usual.
 */
class ChecklistHintView {
  private hint: HTMLDivElement;
  private button: HTMLButtonElement;

  constructor(
    private view: EditorView,
    private editor: Editor,
    placeholder: string
  ) {
    this.hint = document.createElement("div");
    this.hint.className = "checklist-hint";
    // Exposed to assistive tech via `aria-placeholder` on the editor instead.
    this.hint.setAttribute("aria-hidden", "true");

    this.button = document.createElement("button");
    this.button.type = "button";
    this.button.tabIndex = -1;
    this.button.title = "Start a checklist";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.tabIndex = -1;
    this.button.append(checkbox);

    const text = document.createElement("span");
    text.textContent = placeholder;
    this.hint.append(this.button, text);

    // Don't steal focus from (or blur) the editor.
    this.button.addEventListener("mousedown", event => event.preventDefault());
    this.button.addEventListener("click", this.onClick);

    // The editor DOM is mounted after the plugin view is created.
    requestAnimationFrame(() => this.render());
  }

  update() {
    this.render();
  }

  destroy() {
    this.hint.remove();
  }

  private isEmpty() {
    const { doc } = this.view.state;
    return doc.childCount === 1 && doc.firstChild?.type.name === "paragraph" && doc.firstChild.content.size === 0;
  }

  private render() {
    const paragraph = this.view.nodeDOM(0);
    // Lives next to (not inside) the contenteditable.
    const container = this.view.dom.parentElement;
    if (!this.editor.isEditable || !this.isEmpty() || !(paragraph instanceof HTMLElement) || !container) {
      delete this.hint.dataset.visible;
      return;
    }
    if (this.hint.parentElement !== container) {
      container.append(this.hint);
    }
    const rect = paragraph.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    this.hint.style.top = `${rect.top - containerRect.top}px`;
    this.hint.style.left = `${rect.left - containerRect.left}px`;
    this.hint.style.width = `${rect.width}px`;
    this.hint.style.height = `${rect.height}px`;
    this.hint.dataset.visible = "true";
  }

  private onClick = (event: MouseEvent) => {
    event.preventDefault();
    if (this.isEmpty()) {
      this.editor.chain().focus().setTextSelection(1).toggleTaskList().run();
    }
  };
}

const ChecklistHint = Extension.create<ChecklistHintOptions>({
  name: "checklistHint",

  addOptions() {
    return { placeholder: "" };
  },

  addProseMirrorPlugins() {
    const { editor, options } = this;
    return [
      new Plugin({
        key: new PluginKey("checklistHint"),
        view: view => new ChecklistHintView(view, editor, options.placeholder)
      })
    ];
  }
});

export default ChecklistHint;
