import { StyledButton, Loader } from "./Button.styles";
import { vibrate } from "@utilities/haptics";

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
  onClick,

  ...props
}: Props & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    vibrate("tap");
    onClick?.(e);
  };

  return (
    <StyledButton type={type || "button"} $variant={variant} onClick={handleClick} {...props}>
      {isLoading && <Loader isVisible={true} color={loaderColor} size="1rem" />}
      <span>{isLoading ? loadingText || "Loading" : children}</span>
    </StyledButton>
  );
};

export default Button;
