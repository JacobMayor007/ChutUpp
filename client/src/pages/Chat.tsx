import { LogOut } from "lucide-react";
import ChatBar from "../components/ChatBar";
import Message from "../components/Message";
import { useLogout } from "../hooks/authHooks";
import { useAuth } from "../context/AuthContext";

export default function Chat() {
  const { logout } = useLogout();
  const { user } = useAuth();

  return (
    <div className="h-screen flex flex-col bg-black px-10 py-6 ">
      <div className="flex flex-row justify-end items-center gap-4 mb-4">
        <h1 className="text-white text-right font-sans font-black">
          Hello, {user?.email}!
        </h1>
        <div
          onClick={logout}
          className="flex flex-row items-center gap-4 active:95 cursor-pointer"
        >
          <LogOut color="red" />
          <h1 className=" text-right font-sans font-black text-red-500">
            Sign out
          </h1>
        </div>
      </div>
      <div className="h-full grid grid-cols-12 gap-4 overflow-hidden">
        <div className="col-span-3">
          <ChatBar />
        </div>
        <div className="col-span-9 h-full overflow-hidden">
          <Message />
        </div>
      </div>
    </div>
  );
}
