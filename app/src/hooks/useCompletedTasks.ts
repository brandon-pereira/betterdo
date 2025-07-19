import { useState } from "react";

import createSharedHook from "./internal/createSharedHook";

function useCompletedTasksOnce() {
  return useState(false);
}

const { Provider: CompletedTasksProvider, useConsumer: useCompletedTasks } = createSharedHook(useCompletedTasksOnce);

export { CompletedTasksProvider };
export default useCompletedTasks;
