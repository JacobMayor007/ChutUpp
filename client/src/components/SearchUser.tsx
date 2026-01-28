import { useEffect, useRef, useState } from "react";
import DivBox from "./DivBox";
import { useSocket } from "../context/SocketContext";
import InputBox from "./InputBox";
import { Search } from "lucide-react";
import MyText from "./MyText";
import { useChatContext } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";

type SearchUserProps = {
  setModal: (name: string) => void;
};

export default function SearchUser({ setModal }: SearchUserProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const { setOtherUser } = useChatContext();
  const {
    searchUser,
    resultSearchUser,
    clearResultSearchUser,
    clearMessages,
    loadMessageHistory,
  } = useSocket();

  useEffect(() => {
    const closeModal = (e: MouseEvent) => {
      if (!divRef.current?.contains(e.target as Node)) {
        setModal("");
        clearResultSearchUser();
      }
    };

    document.body.addEventListener("mousedown", closeModal);

    return () => {
      document.body.removeEventListener("mousedown", closeModal);
    };
  }, [divRef]);

  useEffect(() => {
    if (!search.trim()) {
      clearResultSearchUser();
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      searchUser(search);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search, searchUser, clearResultSearchUser]);

  return (
    <DivBox className="animate-zoom-in fixed z-30 inset-0 bg-transparent ">
      <DivBox className="flex h-screen bg-black/80 items-center justify-center">
        <DivBox
          ref={divRef}
          className={`h-full w-full lg:h-[90%] lg:w-[40%] drop-shadow-2xl rounded-xl bg-slate-200 p-4`}
        >
          <InputBox
            icon={Search}
            widthIcon={24}
            heightIcon={24}
            onChangeValue={setSearch}
            value={search}
            placeholderClassName="placeholder:text-white placeholder:tracking-wide"
            className="w-full bg-black/80 h-12 "
            placeholder="Enter email or the id of a user..."
          />
          <DivBox>
            {resultSearchUser.map((data) => {
              return (
                <DivBox
                  key={data?.user_id}
                  onClick={() => {
                    setOtherUser(data);
                    loadMessageHistory(user?.uid, data?.user_id);
                    setModal("");
                    clearMessages();
                  }}
                  className="md:flex-col p-4 mb-4 rounded-lg flex lg:flex-row gap-4 cursor-pointer active:scale-95 "
                >
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      data?.email
                    )}&background=random`}
                    alt="Other User's Profile Picture"
                    className="h-10 w-10 rounded-full"
                  />
                  <DivBox className="flex flex-col items-center">
                    <MyText font="sans" size="lg" label={data?.email} />
                  </DivBox>
                </DivBox>
              );
            })}
          </DivBox>
        </DivBox>
      </DivBox>
    </DivBox>
  );
}
