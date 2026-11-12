import { Container, Input } from "./AddTask.styles";

interface Props {
  isHidden: boolean;
  isAbsolute: boolean;
}

// Looks identical to AddTask and is shown while its chunk (which pulls in
// TanStack Form and zod) loads, so the main chunk doesn't need them.
const AddTaskPlaceholder = function ({ isHidden, isAbsolute }: Props) {
  return (
    <Container data-absolute={isAbsolute ? "true" : "false"} data-hidden={isHidden ? "true" : "false"}>
      <Input readOnly disabled={isHidden} placeholder="Add Task" />
    </Container>
  );
};

export default AddTaskPlaceholder;
