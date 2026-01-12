import { Mails } from "lucide-react";
import DivBox from "./DivBox";
import { useTheme } from "../context/ThemeContext";
import MyText from "./MyText";
import { useState } from "react";
import SearchUser from "./SearchUser";
import { useChat } from "../hooks/api/chatHooks";
import { useAuth } from "../context/AuthContext";

export default function ChatBar() {
  const { color } = useTheme();
  const iconColor = color === "light" ? "black" : "white";
  const { user } = useAuth();
  const [modal, setModal] = useState("");
  const { data: chat, isLoading, isError } = useChat(user?.uid);

  if (modal === "search") {
    return <SearchUser setModal={setModal} />;
  }

  if (isLoading)
    return (
      <DivBox className="p-4">
        <h1>Loading...</h1>
      </DivBox>
    );
  if (isError)
    return (
      <DivBox className="p-4">
        <h1>Error loading chats...</h1>
      </DivBox>
    );

  console.log(user?.uid);
  console.log("Chats: ", chat);

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
