import type { CSSProperties } from "react";

type DivBox = {
  style?: CSSProperties | undefined;
  color?: "light" | "dark" | undefined;
  className?: string | undefined;
  children?: React.ReactNode;
};

export default function DivBox({ style, color, className, children }: DivBox) {
  return (
    <div
      style={style}
      className={`${color === "light" && `bg-white`} ` + className}
    >
      {children}
    </div>
  );
}
