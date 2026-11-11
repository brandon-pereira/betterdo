import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Marked } from "marked";

/** Headings, list items, bold, or links: enough to treat pasted plain text as markdown. */
const MARKDOWN_SYNTAX = /^\s*(?:#{1,6}|[-*+]|\d+[.)])\s|\*\*\S|\]\(/m;

/**
 * HTML that carries real formatting (copied from this editor, a web page, or a document), which
 * should be pasted as-is. Code editors put plain `div`/`span` markup on the clipboard alongside
 * markdown source, so that doesn't count.
 */
const RICH_HTML = /data-pm-slice|<(?:ul|ol|li|h[1-6]|strong|b|em|i|a|table|blockquote)\b/i;

/** Renders GFM task lists ("- [ ] item") as checklist markup. */
const marked = new Marked({
  renderer: {
    list(token) {
      if (!token.items.some(item => item.task)) {
        return false;
      }
      const items = token.items.map(
        item => `<li data-type="taskItem" data-checked="${!!item.checked}">${this.parser.parse(item.tokens)}</li>`
      );
      return `<ul data-type="taskList">${items.join("")}</ul>`;
    }
  }
});

/** Pastes markdown copied as plain text as formatted notes, by converting it to HTML first. */
const MarkdownPaste = Extension.create({
  name: "markdownPaste",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("markdownPaste"),
        props: {
          handlePaste: (view, event) => {
            const text = event.clipboardData?.getData("text/plain") ?? "";
            const html = event.clipboardData?.getData("text/html") ?? "";
            if (RICH_HTML.test(html) || !MARKDOWN_SYNTAX.test(text)) {
              return false;
            }
            view.pasteHTML(marked.parse(text, { async: false }));
            return true;
          }
        }
      })
    ];
  }
});

export default MarkdownPaste;
