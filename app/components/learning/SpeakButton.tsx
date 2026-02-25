"use client";

import React from "react";
import { Volume2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface SpeakButtonProps {
  text: string;
  lang?: string;
  className?: string;
  label?: string;
}

export const SpeakButton: React.FC<SpeakButtonProps> = ({
  text,
  lang,
  className,
  label = "Play pronunciation",
}) => {
  const [supported, setSupported] = React.useState(false);

  React.useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const handleSpeak = () => {
    if (!supported || !text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    if (lang) utterance.lang = lang;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleSpeak}
      disabled={!supported || !text}
      aria-label={label}
      title={supported ? label : "Text-to-speech not supported in this browser"}
      className={className}
    >
      <Volume2 className="h-4 w-4" />
    </Button>
  );
};
