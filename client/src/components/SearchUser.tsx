import { useEffect, useRef } from "react";
import DivBox from "./DivBox";
import { useSocket } from "../context/SocketContext";

type SearchUserProps = {
  setModal: (name: string) => void;
};

export default function SearchUser({ setModal }: SearchUserProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const {} = useSocket();

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
        <DivBox
          ref={divRef}
          className={`h-full w-full lg:h-[90%] lg:w-[40%] drop-shadow-2xl rounded-xl bg-slate-200 p-4`}
        ></DivBox>
      </DivBox>
    </DivBox>
  );
}
