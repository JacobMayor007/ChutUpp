import { LogOut } from "lucide-react";
import ChatBar from "../components/ChatBar";
import Message from "../components/Message";
import { useLogout } from "../hooks/authHooks";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "../config/firebase";

export default function Chat() {
  const { logout } = useLogout();
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    // onAuthStateChanged returns an unsubscribe function
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setCurrentUserId(currentUser?.uid || "");
    });

    return () => unsubscribe();
  }, []);
  return (
    <div className="h-screen flex flex-col bg-black px-10 py-6 ">
      <div className="flex flex-row justify-end items-center gap-4 mb-4">
        <h1 className="text-white text-right font-sans font-black">
          Hello, {currentUserId}!
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
      <div className="h-full grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <ChatBar />
        </div>
        <div className="col-span-9">
          <Message />
        </div>
      </div>
    </div>
  );
}
