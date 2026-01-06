import { Mails } from "lucide-react";
import DivBox from "./DivBox";
import { useTheme } from "../context/ThemeContext";
import MyText from "./MyText";
import { useState } from "react";
import SearchUser from "./SearchUser";

export default function ChatBar() {
  const { color } = useTheme();
  const iconColor = color === "light" ? "black" : "white";
  const [modal, setModal] = useState("");

  if (modal === "search") {
    return <SearchUser setModal={setModal} />;
  }

  return (
    <DivBox className=" h-full p-4 rounded-xl">
      <DivBox className="bg-transparent flex flex-row items-center justify-between">
        <MyText
          font="sans"
          label="My Inbox"
          size="2xl"
          className="font-black"
        />
        <Mails
          color={iconColor}
          onClick={() => setModal("search")}
          className="active:scale-80 hover:cursor-pointer"
        />
      </DivBox>
    </DivBox>
  );
}
