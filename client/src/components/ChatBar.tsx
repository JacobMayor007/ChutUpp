import { Mails } from "lucide-react";
import DivBox from "./DivBox";

export default function ChatBar() {
  return (
    <DivBox color="light" className="h-full p-4 rounded-xl">
      <div className="flex flex-row items-center justify-between">
        <h1 className="text-white font-sans font-black text-xl">My Inbox</h1>
        <Mails />
      </div>
    </DivBox>
  );
}
