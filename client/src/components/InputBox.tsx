import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import { useState } from "react";

type InputBoxProps = {
  icon: LucideIcon;
  placeholder?: string;
  heightIcon?: number;
  widthIcon?: number;
  heightInputBox?: string;
  value: string;
  onChangeValue: (value: string) => void;
  type?: string;
  className?: string;
};

export default function InputBox({
  icon: Icon,
  placeholder,
  heightIcon,
  widthIcon,
  value,
  onChangeValue,
  heightInputBox,
  type,
  className,
}: InputBoxProps) {
  const [show, setShow] = useState(false);

  return (
    <div
      className={`${className} border-[2px] border-slate-300 grid grid-cols-12 gap-1 items-center pl-4  rounded-lg  ${heightInputBox} w-2/3`}
    >
      <Icon
        className="col-span-1"
        width={widthIcon}
        height={heightIcon}
        color="white"
      />
      <input
        placeholder={placeholder}
        type={show ? `text` : type}
        value={value}
        onChange={(e) => onChangeValue(e.target.value)}
        className={`h-full text-white placeholder:text-slate-700 outline-0 ${
          type === "password" ? `col-span-10` : `col-span-11`
        } `}
      />

      {type === "password" &&
        (show ? (
          <Eye
            color="white"
            className="col-span-1"
            onClick={() => setShow(false)}
          />
        ) : (
          <EyeOff
            className="col-span-1"
            color="white"
            onClick={() => setShow(true)}
          />
        ))}
    </div>
  );
}
