import type { CSSProperties } from "react";

import { StyledButton, Loader } from "./Button.styles";
import { vibrate } from "@utilities/haptics";

interface Props {
  children: React.ReactNode;
  loaderColor?: string;
  isLoading?: boolean;
  loadingText?: string;
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
}

const THEME_COLORS: Record<string, string> = {
  blue: "var(--colors-general-blue)",
  red: "var(--colors-general-red)"
};

const Button = ({
  children,
  type,
  color,
  loaderColor,
  loadingText,
  isLoading,
  variant = "primary",
  fullWidth,
  onClick,
  style,

  ...props
}: Props & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    vibrate("tap");
    onClick?.(e);
  };

  const resolvedColor = (color && THEME_COLORS[color]) || color || "var(--colors-general-blue)";

  return (
    <StyledButton
      type={type || "button"}
      $fullWidth={fullWidth}
      data-variant={variant}
      data-loading={isLoading ? "true" : "false"}
      onClick={handleClick}
      style={{ "--color": resolvedColor, ...style } as CSSProperties}
      {...props}
    >
      {isLoading && <Loader isVisible={true} color={loaderColor} size="1rem" />}
      <span>{isLoading ? loadingText || "Loading" : children}</span>
    </StyledButton>
  );
};

export default Button;
