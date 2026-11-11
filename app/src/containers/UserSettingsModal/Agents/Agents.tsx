import { useEffect, useState } from "react";
import { AnimatePresence, useReducedMotion } from "framer-motion";

import SetupGuide from "./SetupGuide";
import ConnectedAgents from "./ConnectedAgents";
import { Hero, HeroContent, HeroTitle, Prompt, PromptText } from "./Agents.styles";
import { Page } from "../Settings.styles";

import { SERVER_URL } from "@utilities/env";

const MCP_SERVER_URL = `${SERVER_URL}/api/mcp`;

const prompts = [
  "What's due this week?",
  "Add oat milk to my groceries list",
  "Move everything overdue to tomorrow",
  "Turn these meeting notes into tasks",
  "Remind me to renew my license"
];

function Agents() {
  const [promptIndex, setPromptIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const interval = window.setInterval(() => setPromptIndex(index => (index + 1) % prompts.length), 3000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <Page>
      <Hero>
        <HeroContent>
          <HeroTitle>Ask your AI assistant</HeroTitle>
          <Prompt>
            <AnimatePresence initial={false}>
              <PromptText
                key={promptIndex}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: "100%" }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: "-100%" }}
                transition={{ duration: 0.3 }}
              >
                &ldquo;{prompts[promptIndex]}&rdquo;
              </PromptText>
            </AnimatePresence>
          </Prompt>
        </HeroContent>
      </Hero>
      <SetupGuide serverUrl={MCP_SERVER_URL} />
      <ConnectedAgents />
    </Page>
  );
}

export default Agents;
