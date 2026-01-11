import { useEditor, EditorContent } from "@tiptap/react";
import { Document } from "@tiptap/extension-document";
import { Heading } from "@tiptap/extension-heading";
import { Paragraph } from "@tiptap/extension-paragraph";
import { ListKit } from "@tiptap/extension-list";
import { Text } from "@tiptap/extension-text";
import { Bold } from "@tiptap/extension-bold";
import Link from "./TipTap/Link";

import { styled } from "styled-components";

const Container = styled.div`
  width: 100%;
`;

const Toolbar = styled.div`
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  background: ${({ theme }) => theme.colors.forms.input.background};
  border-radius: 3px 3px 0 0;
  border: 2px solid ${({ theme }) => theme.colors.forms.input.borderColor};
  border-bottom: none;
`;

const ToolbarButton = styled.button<{ $isActive?: boolean }>`
  background: ${({ theme, $isActive }) =>
    $isActive ? (theme.isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)") : "transparent"};
  border: none;
  color: ${({ theme }) => theme.colors.forms.input.color};
  padding: 0.35rem 0.5rem;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: ${({ $isActive }) => ($isActive ? "600" : "500")};
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: background 0.15s ease;
  min-width: 36px; /* Mobile-friendly touch target */
  min-height: 36px;
  justify-content: center;

  &:hover {
    background: ${({ theme }) => (theme.isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)")};
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
  .tiptap {
    border: 2px solid ${({ theme }) => theme.colors.forms.input.borderColor};
    color: ${({ theme }) => theme.colors.forms.input.color};
    background: ${({ theme }) => theme.colors.forms.input.background};
    font-family: inherit;
    font-size: 1rem;
    resize: none;
    width: 100%;
    box-sizing: border-box;
    padding: 0.8rem 1rem;
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
      border-color: ${({ theme }) => theme.colors.general.blue};
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
      color: ${({ theme }) => theme.colors.general.blue};
    }

    /* Task list styles */
    ul[data-type="taskList"] {
      list-style: none;
      padding: 0;
      margin: 0.5rem 0;

      li {
        display: flex;
        align-items: flex-start;
        margin: 0.25rem 0;

        > label {
          flex: 0 0 auto;
          margin-right: 0.5rem;
          user-select: none;
        }

        > div {
          flex: 1 1 auto;
          p {
            margin: 0;
          }
        }

        input[type="checkbox"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
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
  placeholder?: string;
  invalid?: boolean;
}

export default function RichTextEditor({
  content = "",
  onChange,
  placeholder = "Start typing..."
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Link,
      Bold,
      Heading.configure({
        levels: [1, 2, 3]
      }),
      ListKit
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        placeholder
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
          $isActive={editor.isActive("bold")}
          title="Bold (Cmd+B)"
          type="button"
        >
          <strong>B</strong>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          $isActive={editor.isActive("heading", { level: 2 })}
          title="Heading (Cmd+Alt+2)"
          type="button"
        >
          <strong>H</strong>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          $isActive={editor.isActive("taskList")}
          title="Subtasks (Cmd+Shift+9)"
          type="button"
        >
          ☑
        </ToolbarButton>
      </Toolbar>

      <Editor editor={editor} />
    </Container>
  );
}
