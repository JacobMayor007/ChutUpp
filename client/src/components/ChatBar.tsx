import { Mails } from "lucide-react";
import DivBox from "./DivBox";
// import { useTheme } from "../context/ThemeContext";
import MyText from "./MyText";
import { useState } from "react";
import SearchUser from "./SearchUser";

import type { ChatList } from "../types";
import { useAuth } from "../context/AuthContext";

type ChatBarProps = {
  chatBox: ChatList[] | [];
};

export default function ChatBar({ chatBox }: ChatBarProps) {
  const [modal, setModal] = useState("");
  const { user } = useAuth();

  if (modal === "search") {
    return <SearchUser setModal={setModal} />;
  }

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
      {chatBox?.map((data, key) => {
        return (
          <DivBox
            key={key}
            className="md:flex-col p-4 mb-4 rounded-lg flex flex-row"
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
                        data?.last_message.length > 25
                          ? data?.last_message.slice(0, 25).concat("...")
                          : data?.last_message
                      }`
                    : `${data?.last_sender_email.slice(0, 10).concat("...")}: ${
                        data?.last_message.length > 25
                          ? data?.last_message.slice(0, 25).concat("...")
                          : data?.last_message
                      }`
                }`}
              />
            </DivBox>
          </DivBox>
        );
      })}
    </DivBox>
  );
}
