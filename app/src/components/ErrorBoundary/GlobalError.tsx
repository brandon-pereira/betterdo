import Icon from "@components/Icon";
import { Container } from "./ErrorBoundary.styles";
import Button from "@components/Button";
import ServerError from "@components/Icon/svgs/server-error.svg";

export default function GlobalError({ errorMessage }: { errorMessage: string | Error }) {
  const message = errorMessage instanceof Error ? errorMessage.message : errorMessage;
  return (
    <Container>
      <h1>
        <Icon icon={ServerError} size="5rem" />
        Unexpected Error!
      </h1>

      <p>We'll look into this error. It's probably an issue on our end. Please share the below error with us!</p>
      <pre>{message}</pre>
      <Button onClick={() => window.location.reload()} color="rgba(0,0,0,.3)">
        Reload
      </Button>
    </Container>
  );
}
