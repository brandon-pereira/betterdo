import { createElement, cloneElement } from "react";

import { ModalsProvider } from "@hooks/useHamburgerNav";
import { ProfileProvider } from "@hooks/useProfile";
import { ListsProvider } from "@hooks/useLists";
import { CompletedTasksProvider } from "@hooks/useCompletedTasks";
import { NavHoverProvider } from "@hooks/useNavHover";

// Order matters for some of these!
const Providers = [ModalsProvider, ProfileProvider, ListsProvider, CompletedTasksProvider, NavHoverProvider].reverse();

function SharedProviders({ children }: { children: React.ReactElement }) {
  return cloneElement(Providers.reduce((acc, provider) => createElement(provider, null, acc), children));
}

export default SharedProviders;
