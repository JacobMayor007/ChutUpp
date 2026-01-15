import { Mails, SearchIcon } from "lucide-react";
import DivBox from "./DivBox";
// import { useTheme } from "../context/ThemeContext";
import MyText from "./MyText";
import { useState } from "react";
import SearchUser from "./SearchUser";
import type { ChatList } from "../types";
import InputBox from "./InputBox";
// import { useChat } from "../hooks/api/chatHooks";
// import { useAuth } from "../context/AuthContext";

type ChatListProps = {
  chatBox: ChatList[] | [];
};

export default function ChatBar({ chatBox }: ChatListProps) {
  // const { color } = useTheme();
  // const iconColor = color === "light" ? "black" : "white";
  // const { user } = useAuth();
  const [modal, setModal] = useState("");
  const [search, setSearch] = useState("");
  // const { data: chat, isLoading, isError } = useChat(user?.uid);

  if (modal === "search") {
    return <SearchUser setModal={setModal} />;
  }

  // if (isLoading)
  //   return (
  //     <DivBox className="p-4">
  //       <h1>Loading...</h1>
  //     </DivBox>
  //   );
  // if (isError)
  //   return (
  //     <DivBox className="p-4">
  //       <h1>Error loading chats...</h1>
  //     </DivBox>
  //   );

  // console.log(user?.uid);
  // console.log("Chats: ", chat);

  return (
    <DivBox className="h-full p-4 rounded-xl bg-[#1c1e21]">
      <DivBox className="bg-transparent flex flex-row items-center justify-between mb-4">
        <MyText
          font="sans"
          label="My Inbox"
          size="2xl"
          className="font-black text-white"
        />
        <Mails
          color={"white"}
          onClick={() => setModal("search")}
          className="active:scale-80 hover:cursor-pointer"
        />
      </DivBox>
      <InputBox icon={SearchIcon} onChangeValue={setSearch} value={search} />
      {chatBox.map((data, key) => {
        return (
          <DivBox key={key} className="mb-5 rounded-lg p-4">
            <MyText font="sans" size="lg" label={data.chat_id} />
          </DivBox>
        );
      })}
    </DivBox>
  );
}
