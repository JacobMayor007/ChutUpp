import { LogOut, Moon, Sun } from "lucide-react";
import ChatBar from "../components/ChatBar";
import Message from "../components/Message";
import { useLogout } from "../hooks/authHooks";
import { useTheme } from "../context/ThemeContext";
import DivBox from "../components/DivBox";
import MyText from "../components/MyText";
import { useAuth } from "../context/AuthContext";

export default function Chat() {
  const { logout } = useLogout();
  const { user } = useAuth();
  const { color, setColor } = useTheme();

  console.log(color);

  return (
    <DivBox className="h-screen flex flex-col  px-10 py-6 ">
      <div className="flex flex-row justify-end items-center gap-4 mb-4">
        <MyText
          label={user?.email}
          size="lg"
          font="sans"
          className="font-bold"
        />
        <DivBox
          onClick={logout}
          className="flex flex-row items-center gap-4 active:95 cursor-pointer bg-red-500 px-4 py-1.5 rounded-lg"
        >
          <LogOut color="white" />
          <MyText
            font="sans"
            size="lg"
            label="Sign out"
            className="text-right font-sans font-black text-white"
          />
        </DivBox>
        {color === "light" ? (
          <Moon
            color={"black"}
            onClick={() => {
              setColor("dark");
            }}
            className="active:scale-80 hover:cursor-pointer"
          />
        ) : (
          <Sun
            onClick={() => {
              setColor("light");
            }}
            color={"yellow"}
            className="active:scale-80 hover:cursor-pointer"
          />
        )}
      </div>
      <div className="h-full grid grid-cols-12 gap-4 overflow-hidden">
        <div className="col-span-3">
          <ChatBar />
        </div>
        <div className="col-span-9 h-full overflow-hidden">
          <Message />
        </div>
      </div>
    </DivBox>
  );
}
