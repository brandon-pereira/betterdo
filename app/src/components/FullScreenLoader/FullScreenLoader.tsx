import { useLayoutEffect } from "react";

// Reuses the static app skeleton from index.html (styled by critical.css)
// instead of rendering a second one, so startup is a single loading screen
// that paints before any JS runs. The skeleton is visible whenever <body>
// lacks the "loaded" class. Layout effects run synchronously within a commit,
// so when one FullScreenLoader is swapped for another (e.g. session check ->
// initial list redirect) the skeleton never flickers off.
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
