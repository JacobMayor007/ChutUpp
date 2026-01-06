type ButtonProps = {
  label: string;
  onClick?: () => void;
  className?: string;
};

export default function Button({ label, onClick, className }: ButtonProps) {
  return (
    <div
      onClick={onClick}
      className={`h-12 w-2/3 rounded-2xl text-xl font-bold font-display tracking-widest  text-white bg-gradient-to-r cursor-pointer active:scale-95 from-[#6366F1] to-[#3B82F6] flex items-center justify-center ${className}`}
    >
      <h1>{label}</h1>
    </div>
  );
}
