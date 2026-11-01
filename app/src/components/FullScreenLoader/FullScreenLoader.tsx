import { useLayoutEffect } from "react";

// Reuses the static loader from index.html (styled by critical.css) instead of
// rendering a second, differently styled one, so startup is a single loading
// screen rather than blue -> gray -> app. The static loader is visible whenever
// <body> lacks the "loaded" class. Layout effects run synchronously within a
// commit, so when one FullScreenLoader is swapped for another (e.g. session
// check -> initial list redirect) the loader never flickers off.
const FullScreenLoader = () => {
  useLayoutEffect(() => {
    document.body.classList.remove("loaded");
    return () => {
      document.body.classList.add("loaded");
    };
  }, []);

  return null;
};

export default FullScreenLoader;
