import { useEffect, useState } from "react";
import { Container, Logo, ChangeLog } from "./About.styles";
import { VERSION } from "@utilities/env";

function About() {
  const [changelog, setChangelog] = useState<string | null>(null);

  useEffect(() => {
    console.log("load");
    import("../../../../../CHANGELOG.md").then(mod => {
      setChangelog(mod.html || "");
    });
  }, []);

  return (
    <Container>
      <Logo />
      <h1>BetterDo.</h1>
      <h2>Version {VERSION}</h2>
      {changelog && <ChangeLog dangerouslySetInnerHTML={{ __html: changelog }} />}
    </Container>
  );
}

export default About;
