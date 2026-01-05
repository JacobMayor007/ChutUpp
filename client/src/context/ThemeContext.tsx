import React, { createContext, useContext, useState } from "react";

type ThemeContextProps = {
  color: "light" | "dark";
  setColor: (isDark: "light" | "dark") => void;
};

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [color, setColor] = useState<"light" | "dark">("light");

  return (
    <ThemeContext.Provider value={{ color, setColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context)
    throw new Error(
      "Sorry but the theme is having an error. Please try again!"
    );

  return context;
};
