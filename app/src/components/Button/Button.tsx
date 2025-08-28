import { StyledButton, Loader } from "./Button.styles";

interface Props {
  children: React.ReactNode;
  loaderColor?: string;
  isLoading?: boolean;
  loadingText?: string;
  variant?: "primary" | "secondary";
}

const Button = ({
  children,
  type,
  loaderColor,
  loadingText,
  isLoading,
  variant = "primary",

  ...props
}: Props & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <StyledButton type={type || "button"} $variant={variant} {...props}>
    {isLoading && <Loader isVisible={true} color={loaderColor} size="1rem" />}
    <span>{isLoading ? loadingText || "Loading" : children}</span>
  </StyledButton>
);

export default Button;
