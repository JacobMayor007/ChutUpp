import type { CSSProperties, MouseEventHandler } from "react";
import { cn } from "../service/cn";
import { useTheme } from "../context/ThemeContext";

type HeaderTextProps = {
  label?: string | null | undefined;
  style?: CSSProperties | undefined;
  onClick?: MouseEventHandler | undefined;
  className?: string;
  font: "sans" | "mono" | "serif";
  size:
    | "sm"
    | "xs"
    | "base"
    | "lg"
    | "xl"
    | "2xl"
    | "3xl"
    | "4xl"
    | "5xl"
    | "6xl"
    | "7xl"
    | "8xl";
};

export default function MyText({
  label,
  style,
  onClick,
  className,
  font,
  size,
}: HeaderTextProps) {
  const { color } = useTheme();

  return (
    <h1
      style={style}
      onClick={onClick}
      className={cn(
        "transition-colors duration-200 ease-in-out",
        color === "light" ? "text-[#393939]" : "text-white",
        size === "xs" && "text-xs",
        size === "sm" && "text-sm",
        size === "base" && "text-base",
        size === "lg" && "text-lg",
        size === "xl" && "text-xl",
        size === "2xl" && "text-2xl",
        size === "3xl" && "text-[1.75rem]",
        size === "4xl" && "text-3xl",
        size === "5xl" && "text-[2rem]",
        size === "6xl" && "text-4xl",
        size === "7xl" && "text-[2.5rem]",
        size === "8xl" && "text-5xl",
        font === "sans" && "font-sans",
        font === "mono" && "font-mono",
        font === "serif" && "font-serif",
        className
      )}
    >
      {label}
    </h1>
  );
}
