import React from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import { CardAddminiProps } from "@/types";

const CardAddmini: React.FC<CardAddminiProps> = ({ index, words, setWords, seti, setGarbageCollector }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const updatedWords = [...words];
    if (type === "word") {
      updatedWords[index][0] = e.target.value;
    } else if (type === "translatedWord") {
      updatedWords[index][1] = e.target.value;
    }
    updatedWords[index][2] = "";
    setWords(updatedWords);
  };

  return (
    <div className="flex gap-x-4  items-center justify-center">
      <div className="flex flex-col h-20 justify-center items-center min-w-0 flex-1">
        <label
          htmlFor={`expression-${index}`}
          className="block text-sm font-semibold text-gray-900"
        >
          Expression
        </label>
        <div className="mt-2.5 w-full">
          <input
            id={`expression-${index}`}
            name={`expression-${index}`}
            type="text"
            autoComplete="off"
            value={words[index]?.[0] || ""}
            onChange={(e) => handleInputChange(e, "word")}
            className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
            placeholder="Enter expression"
          />
        </div>
      </div>
      <div className="flex flex-col h-20 justify-center items-center min-w-0 flex-1">
        <label
          htmlFor={`translation-${index}`}
          className="block text-sm font-semibold text-gray-900"
        >
          Translated Expression
        </label>
        <div className="mt-2.5 w-full">
          <input
            id={`translation-${index}`}
            name={`translation-${index}`}
            type="text"
            autoComplete="off"
            value={words[index]?.[1] || ""}
            onChange={(e) => handleInputChange(e, "translatedWord")}
            className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
            placeholder="Enter translation"
          />
        </div>
      </div>
      <div className="flex items-center justify-center pt-7">
        <DeleteIcon
          className="h-6 w-6 cursor-pointer text-gray-400 hover:text-red-500 transition-colors"
          onClick={() => {
            const updatedWords = [...words];
            updatedWords.splice(index, 1);
            setWords(updatedWords);
            setGarbageCollector((prev: number[]) => {
              if (typeof words[index][2] === "number") {
                return [...prev, words[index][2]];
              }
              return prev;
            });

            seti((i: number) => i - 1);
          }}
        />
      </div>
    </div>
  );
};

export default CardAddmini;
