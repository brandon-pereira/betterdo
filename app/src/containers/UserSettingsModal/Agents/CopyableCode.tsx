import { useEffect, useState } from "react";

import { Code, CopyField } from "./Agents.styles";
import { TinyButton } from "../Settings.styles";

interface Props {
  value: string;
  label?: string;
}

function CopyableCode({ value, label = "Copy" }: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  return (
    <CopyField>
      <Code>{value}</Code>
      <TinyButton
        variant="secondary"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
          } catch {
            // Clipboard can be blocked (e.g. insecure context); the text is still selectable.
          }
        }}
      >
        {copied ? "Copied" : label}
      </TinyButton>
    </CopyField>
  );
}

export default CopyableCode;
