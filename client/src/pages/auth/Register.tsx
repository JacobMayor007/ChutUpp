import { LoaderIcon, Mail, MessageCircle } from "lucide-react";
import InputBox from "../../components/InputBox";
import { useState } from "react";
import Button from "../../components/Button";
import { useNavigate } from "react-router-dom";
import Alert from "../../components/Alert";
import { useRegister } from "../../hooks/authHooks";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { execute, loading, alert } = useRegister();

  const handleRegister = async () => {
    const isOk = await execute(email, password);
    if (isOk) {
      setEmail("");
      setPassword("");
      setTimeout(() => navigate("/login"), 2000);
    }
  };

  return (
    <div className="bg-gradient-to-r from-neutral-300 to-stone-400 h-screen flex items-center justify-center">
      <div className="xl:h-5/6 w-1/2 bg-gradient-to-r from-purple-500 to-purple-900 rounded-2xl flex flex-col items-center pt-10 pb-12">
        <div className="flex flex-row gap-4 items-center">
          <MessageCircle height={36} width={36} color="white" />{" "}
          <h1 className="font-display text-2xl text-white">
            Websocket Chat App
          </h1>
        </div>

        <h1 className="font-display font-black text-white text-3xl mt-20">
          Welcome to my chat app!
        </h1>
        <p className="font-display font-light text-white text-lg my-4">
          Register your account
        </p>

        <InputBox
          icon={Mail}
          value={email}
          onChangeValue={setEmail}
          heightIcon={24}
          widthIcon={24}
          placeholder="Email"
          heightInputBox="h-12"
          type="text"
          className="mb-5"
        />

        <InputBox
          icon={Mail}
          heightIcon={24}
          widthIcon={24}
          value={password}
          onChangeValue={setPassword}
          placeholder="Password"
          heightInputBox="h-12"
          type="password"
        />

        {loading ? (
          <LoaderIcon />
        ) : (
          <Button onClick={handleRegister} className="mt-10" label="Register" />
        )}
      </div>

      <Alert message={alert.message} type={alert.type} />
    </div>
  );
}
