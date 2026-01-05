import {
  forwardRef,
  type AnimationEventHandler,
  type CSSProperties,
  type MouseEventHandler,
} from "react";
import { useTheme } from "../context/ThemeContext";
import { cn } from "../service/cn";

type DivBoxProps = {
  style?: CSSProperties | undefined;
  className?: string | undefined;
  children?: React.ReactNode;
  onClick?: MouseEventHandler | undefined;
  onAnimationEnd?: AnimationEventHandler | undefined;
};

const DivBox = forwardRef<HTMLDivElement, DivBoxProps>(
  ({ style, className, children, onClick, onAnimationEnd }, ref) => {
    const { color } = useTheme();

    return (
      <div
        onAnimationEnd={onAnimationEnd}
        ref={ref} // The ref is now correctly passed through
        onClick={onClick}
        style={style}
        className={cn(
          "transition-colors duration-200 ease-in-out",
          // Theme defaults
          color === "dark" ? "bg-black text-white" : "bg-white text-black",
          // Custom overrides
          className
        )}
      >
        {children}
      </div>
    );
  }
);

export default DivBox;
