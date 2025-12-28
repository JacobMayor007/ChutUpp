import { type LucideIcon } from "lucide-react";

type MessageBoxProps = {
  icon: LucideIcon;
  placeholder?: string;
  heightIcon?: number;
  widthIcon?: number;
  heightInputBox?: string;
  value: string;
  onChangeValue: (value: string) => void;
  onKeyDown: (e: any) => void;
  onClick: () => void;
  type?: string;
  className?: string;
};

export default function MessageBox({
  icon: Icon,
  placeholder,
  heightIcon,
  widthIcon,
  value,
  onKeyDown,
  onChangeValue,
  onClick,
  heightInputBox,
  className,
}: MessageBoxProps) {
  return (
    <div className="flex flex-row items-center gap-4">
      <div
        className={`${className} border-[2px] border-slate-300 w-full  items-center px-4 rounded-full  ${heightInputBox} `}
      >
        <textarea
          placeholder={placeholder}
          value={value}
          contentEditable={false}
          style={{ resize: "none" }}
          onChange={(e) => onChangeValue(e.target.value)}
          onKeyDown={onKeyDown}
          className={`h-full text-white placeholder:text-slate-700 outline-0 w-full overflow-hidden `}
        />
      </div>
      <Icon
        className="col-span-1 text-center cursor-pointer active:scale-85"
        width={widthIcon}
        height={heightIcon}
        color="white"
        onClick={onClick}
      />
    </div>
  );
}
