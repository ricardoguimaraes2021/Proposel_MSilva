"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const ICON_SIZE = 16;

  const TriggerIcon =
    theme === "system" ? (
      <Laptop
        key="system"
        size={ICON_SIZE}
        className="text-muted-foreground"
        aria-hidden
      />
    ) : theme === "dark" ? (
      <Moon
        key="dark"
        size={ICON_SIZE}
        className="text-muted-foreground"
        aria-hidden
      />
    ) : (
      <Sun
        key="light"
        size={ICON_SIZE}
        className="text-muted-foreground"
        aria-hidden
      />
    );

  const modeDescription =
    theme === "system"
      ? `Tema do sistema (${resolvedTheme === "dark" ? "escuro" : "claro"})`
      : theme === "dark"
        ? "Tema escuro"
        : "Tema claro";

  const shortLabel =
    theme === "system" ? "Sistema" : theme === "dark" ? "Escuro" : "Claro";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          className="gap-2"
          aria-label={`Alternar tema. Atual: ${modeDescription}.`}
          aria-haspopup="menu"
        >
          {TriggerIcon}
          <span className="hidden sm:inline text-xs text-muted-foreground">
            {shortLabel}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-[10rem]" align="end">
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          <DropdownMenuRadioItem className="gap-2" value="light">
            <Sun size={ICON_SIZE} className="text-muted-foreground" aria-hidden />
            <span>Claro</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem className="gap-2" value="dark">
            <Moon size={ICON_SIZE} className="text-muted-foreground" aria-hidden />
            <span>Escuro</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem className="gap-2" value="system">
            <Laptop size={ICON_SIZE} className="text-muted-foreground" aria-hidden />
            <span>Sistema</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { ThemeSwitcher };
