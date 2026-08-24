import { styled } from "styled-components";

import Loader from "@components/Loader";

const Container = styled.div`
  height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FullScreenLoader = () => (
  <Container>
    <Loader color="#006fb0" size="4rem" isVisible={true} />
  </Container>
);

export default FullScreenLoader;
