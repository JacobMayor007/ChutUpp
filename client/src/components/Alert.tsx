import { AlertTriangle, CheckCircle } from "lucide-react";

type AlertProps = {
  message?: string;
  type?: "success" | "error";
};

export default function Alert({ message, type }: AlertProps) {
  if (!message) return null;

  return (
    <div
      className={`fixed top-8 right-8 z-50 pl-8 pr-20 py-4 rounded-2xl shadow-2xl font-bold transition-all duration-300 flex items-center gap-3 backdrop-blur-md border-2 ${
        type === "success"
          ? "bg-gradient-to-r from-[#7CB154] to-[#8FC768] text-white border-[#7CB154]"
          : type === "error"
          ? "bg-gradient-to-r from-red-500 to-red-600 text-white border-red-500"
          : "bg-gradient-to-r from-[#F9A825] to-[#FFC107] text-white border-[#F9A825]"
      }`}
    >
      {type === "success" && <CheckCircle className="w-6 h-6" />}
      {type === "error" && <AlertTriangle className="w-6 h-6" />}
      {message}
    </div>
  );
}
