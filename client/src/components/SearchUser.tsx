import { useEffect, useRef } from "react";
import DivBox from "./DivBox";
import MyText from "./MyText";

type SearchUserProps = {
  setModal: (name: string) => void;
};

export default function SearchUser({ setModal }: SearchUserProps) {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeModal = (e: MouseEvent) => {
      if (!divRef.current?.contains(e.target as Node)) {
        setModal("");
      }
    };

    document.body.addEventListener("mousedown", closeModal);

    return () => {
      document.body.removeEventListener("mousedown", closeModal);
    };
  }, [divRef]);

  return (
    <DivBox className="animate-zoom-in fixed z-30 inset-0 bg-transparent ">
      <DivBox className="flex h-screen bg-black/80 items-center justify-center">
        <DivBox ref={divRef} className=" bg-gray-500">
          <MyText
            label={"Hello World"}
            font="sans"
            size="xl"
            className="text-white"
          />
        </DivBox>
      </DivBox>
    </DivBox>
  );
}
