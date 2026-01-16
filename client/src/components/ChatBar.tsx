import { Mails } from "lucide-react";
import DivBox from "./DivBox";
// import { useTheme } from "../context/ThemeContext";
import MyText from "./MyText";
import { useState } from "react";
import SearchUser from "./SearchUser";

import type { ChatList } from "../types";
import { useAuth } from "../context/AuthContext";
import { useChatContext } from "../context/ChatContext";

type ChatBarProps = {
  chatBox: ChatList[] | [];
  setMobileView: (toggle: "chat" | "list") => void;
};

export default function ChatBar({ chatBox, setMobileView }: ChatBarProps) {
  const [modal, setModal] = useState("");
  const { user } = useAuth();
  const { setOtherUser } = useChatContext();

  return (
    <DivBox className="h-full p-4 rounded-xl bg-[#1c1e21]">
      {modal === "search" && <SearchUser setModal={setModal} />}
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
      <DivBox className="h-full bg-transparent pr-4 pb-8 overflow-y-scroll">
        {chatBox?.map((data, key) => {
          return (
            <DivBox
              key={key}
              onClick={() => {
                setOtherUser({
                  email: data?.other_user_email,
                  user_id: data?.other_user_id,
                });
                setMobileView("chat");
              }}
              className="md:flex-col p-4 mb-4 rounded-lg flex lg:flex-row gap-4 cursor-pointer active:scale-95 "
            >
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  data?.other_user_email
                )}&background=random`}
                alt="Other User's Profile Picture"
                className="h-10 w-10 rounded-full"
              />
              <DivBox className="flex flex-col gap-1">
                <MyText font="sans" size="lg" label={data?.other_user_email} />
                <MyText
                  font="serif"
                  size="sm"
                  label={`${
                    data?.last_sender_id === user?.uid
                      ? `You: ${
                          data?.last_message.length > 45
                            ? data?.last_message.slice(0, 45).concat("...")
                            : data?.last_message
                        }`
                      : `${data?.last_sender_email
                          .slice(0, 10)
                          .concat("...")}: ${
                          data?.last_message.length > 45
                            ? data?.last_message.slice(0, 45).concat("...")
                            : data?.last_message
                        }`
                  }`}
                />
              </DivBox>
            </DivBox>
          );
        })}
      </DivBox>
    </DivBox>
  );
}
