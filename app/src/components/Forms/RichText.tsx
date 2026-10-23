import { useEditor, EditorContent } from "@tiptap/react";
import { Document } from "@tiptap/extension-document";
import { Heading } from "@tiptap/extension-heading";
import { Paragraph } from "@tiptap/extension-paragraph";
import { ListKit } from "@tiptap/extension-list";
import { Text } from "@tiptap/extension-text";
import { Bold } from "@tiptap/extension-bold";
import { UndoRedo } from "@tiptap/extensions";
import Link from "./TipTap/Link";
import ChecklistItem, { CHECKLIST_COMMIT } from "./TipTap/ChecklistItem";
import ChecklistHint from "./TipTap/ChecklistHint";

import { styled } from "@linaria/react";

import { theme } from "../../theme";

const Container = styled.div`
  width: 100%;
`;

const Toolbar = styled.div`
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  background: ${theme.colors.forms.input.background};
  border-radius: 3px 3px 0 0;
  border: 2px solid ${theme.colors.forms.input.borderColor};
  border-bottom: none;
`;

const ToolbarButton = styled.button`
  background: transparent;
  border: none;
  color: ${theme.colors.forms.input.color};
  padding: 0.35rem 0.5rem;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: background 0.15s ease;
  min-width: 36px; /* Mobile-friendly touch target */
  min-height: 36px;
  justify-content: center;

  &[data-active="true"] {
    background: ${theme.effects.tintActive};
    font-weight: 600;
  }

  &:hover {
    background: ${theme.effects.tintMedium};
  }

  &:focus-visible {
    outline: 2px solid var(--accent-color, ${theme.colors.general.blue});
    outline-offset: 1px;
  }

  &:active {
    transform: scale(0.95);
  }

  /* Icon styling for checkboxes */
  svg {
    width: 18px;
    height: 18px;
  }
`;

const Editor = styled(EditorContent)`
  /* Positioning context for the hover checklist hint. */
  position: relative;

  --checkbox-size: 20px;
  --editor-padding-x: 1rem;

  /* Placeholder for an empty notes box (see TipTap/ChecklistHint.ts): a grayed-out checkbox,
     sitting exactly where a checklist item's checkbox will be, plus hint text. Only the
     checkbox is clickable; clicks on the text reach the editor underneath. */
  .checklist-hint {
    position: absolute;
    display: none;
    align-items: center;
    pointer-events: none;
    user-select: none;
    -webkit-user-select: none;

    &[data-visible="true"] {
      display: flex;
    }

    button {
      display: flex;
      margin: 0 0.5rem 0 0; /* matches a checklist item's checkbox spacing */
      padding: 0;
      border: none;
      background: none;
      cursor: pointer;
      pointer-events: auto;
      opacity: 0.35;
      transition: opacity 0.15s ease;

      &:hover {
        opacity: 0.7;
      }
    }

    input {
      width: var(--checkbox-size);
      height: var(--checkbox-size);
      margin: 0;
      pointer-events: none;
    }

    span {
      color: ${theme.effects.subtleText};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .tiptap {
    border: 2px solid ${theme.colors.forms.input.borderColor};
    color: ${theme.colors.forms.input.color};
    background: ${theme.colors.forms.input.background};
    font-family: inherit;
    font-size: 1rem;
    resize: none;
    width: 100%;
    box-sizing: border-box;
    padding: 0.8rem var(--editor-padding-x);
    border-radius: 0 0 3px 3px;
    outline: none;
    min-height: 200px;
    line-height: 1.6;

    & > :first-child {
      margin-top: 0;
    }
    & > :last-child {
      margin-bottom: 0;
    }

    &:focus {
      border-color: var(--accent-color, ${theme.colors.general.blue});
    }
    &:focus-visible {
      outline: 2px solid transparent; /* visible in forced colors mode */
    }

    /* Heading styles */
    h1,
    h2,
    h3 {
      font-weight: 700;
      line-height: 1.3;
      margin-top: 1em;
      margin-bottom: 0.5em;
    }

    h1 {
      font-size: 1.8rem;
    }

    h2 {
      font-size: 1.5rem;
    }

    h3 {
      font-size: 1.2rem;
    }

    /* Bold styles */
    strong {
      font-weight: 700;
    }

    a {
      /* Text-safe variant (>= 4.5:1). Keep the underline so links aren't identified by color alone. */
      color: var(--accent-text-color, ${theme.colors.general.blue});
      text-decoration: underline;
    }

    /* Task list styles */
    ul[data-type="taskList"] {
      list-style: none;
      padding: 0;
      margin: 0.5rem 0;

      /* More specific than the editor's first/last-child resets, so repeat them here. */
      &:first-child {
        margin-top: 0;
      }
      &:last-child {
        margin-bottom: 0;
      }

      > li {
        position: relative;
        display: flex;
        align-items: flex-start;
        /* Space between items only, so the first item sits on the same line as the
           empty-notes placeholder checkbox (no jump when starting a checklist). */
        & + li {
          margin-top: 0.25rem;
        }

        > label,
        > .checklist-handle {
          display: flex;
          align-items: center;
          height: 1.6em; /* one line, so controls center on the first line */
          user-select: none;
          -webkit-user-select: none;
        }

        > label {
          flex: 0 0 auto;
          margin-right: 0.5rem;
        }

        > div {
          flex: 1 1 auto;
        }

        /* Sits in the editor's side padding so it doesn't indent the text. */
        > .checklist-handle {
          position: absolute;
          top: 0;
          left: calc(-1 * var(--editor-padding-x));
          width: var(--editor-padding-x);
          justify-content: center;
          color: ${theme.colors.forms.input.color};
          opacity: 0;
          cursor: grab;
          touch-action: none; /* let pointer events drive the drag instead of scrolling */
          -webkit-touch-callout: none;
          transition: opacity 0.15s ease;
        }

        &:hover > .checklist-handle {
          opacity: 0.4;
        }

        > .checklist-handle:hover {
          opacity: 0.8;
        }

        > div p {
          margin: 0;
        }

        &[data-checked="true"] > div {
          text-decoration: line-through;
        }

        input[type="checkbox"] {
          width: var(--checkbox-size);
          height: var(--checkbox-size);
          margin: 0;
          cursor: pointer;
          accent-color: var(--accent-color, ${theme.colors.general.blue});
        }

        &[data-sorting="true"] {
          transition: transform 0.15s ease;
        }

        &[data-dragging="true"] {
          z-index: 1;
          transition: none;

          /* Lifted card that also covers the drag handle. */
          &::before {
            content: "";
            position: absolute;
            inset: 0 -0.25rem 0 calc(-1 * var(--editor-padding-x));
            z-index: -1;
            background: ${theme.colors.forms.input.background};
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            border-radius: 3px;
          }

          > .checklist-handle {
            opacity: 0.8;
            cursor: grabbing;
          }
        }

        @media (hover: none) {
          > .checklist-handle {
            opacity: 0.4;
          }
        }
      }
    }

    /* Paragraph spacing */
    p {
      margin: 0.5em 0;
    }
  }
`;

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  onBlur?: (content: string) => void;
  /** Discrete checklist edits (checking or reordering items) that should persist immediately. */
  onCommit?: (content: string) => void;
  placeholder?: string;
  invalid?: boolean;
}

export default function RichTextEditor({
  content = "",
  onChange,
  onBlur,
  onCommit,
  placeholder = "Add notes, or check the box to start a checklist"
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      UndoRedo,
      Link.configure({
        autolink: true,
        linkOnPaste: true,
        openOnClick: true,
        defaultProtocol: "https",
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer nofollow"
        }
      }),
      Bold,
      Heading.configure({
        levels: [1, 2, 3]
      }),
      ListKit.configure({ taskItem: false }),
      ChecklistItem,
      ChecklistHint.configure({ placeholder })
    ],
    content,
    onUpdate: ({ editor, transaction }) => {
      const html = editor.getHTML();
      onChange?.(html);
      if (transaction.getMeta(CHECKLIST_COMMIT)) {
        onCommit?.(html);
      }
    },
    onBlur: ({ editor }) => {
      onBlur?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        "aria-placeholder": placeholder
      }
    }
  });

  if (!editor) {
    return null;
  }

  return (
    <Container>
      <Toolbar>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          data-active={editor.isActive("bold") ? "true" : "false"}
          title="Bold (Cmd+B)"
          type="button"
        >
          <strong>B</strong>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          data-active={editor.isActive("heading", { level: 2 }) ? "true" : "false"}
          title="Heading (Cmd+Alt+2)"
          type="button"
        >
          <strong>H</strong>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          data-active={editor.isActive("taskList") ? "true" : "false"}
          title="Checklist (Cmd+Shift+9)"
          type="button"
        >
          ☑
        </ToolbarButton>
      </Toolbar>

      <Editor editor={editor} />
    </Container>
  );
}
