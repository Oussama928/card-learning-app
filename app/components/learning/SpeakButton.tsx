"use client";

import React from "react";
import { FaVolumeUp } from "react-icons/fa";

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
    <button
      type="button"
      onClick={handleSpeak}
      disabled={!supported || !text}
      aria-label={label}
      title={supported ? label : "Text-to-speech not supported in this browser"}
      className={`inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 p-2 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50 ${
        className ?? ""
      }`}
    >
      <FaVolumeUp className="h-4 w-4" />
    </button>
  );
};
