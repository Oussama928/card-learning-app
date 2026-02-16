import React from "react";
import { FaTrash } from "react-icons/fa";
import { CardAddminiProps } from "@/types";

const CardAddmini: React.FC<CardAddminiProps> = ({
  index,
  words,
  setWords,
  seti,
  setGarbageCollector,
  onUploadWordImage,
  isUploading,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const updatedWords = [...words];
    if (type === "word") {
      updatedWords[index][0] = e.target.value;
    } else if (type === "translatedWord") {
      updatedWords[index][1] = e.target.value;
    }
    setWords(updatedWords);
  };

  const currentImage = words[index]?.[3] || "";

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
      <div className="flex flex-col items-center justify-center pt-7 gap-2">
        <label className="text-xs text-gray-600" htmlFor={`image-upload-${index}`}>
          Expression Image
        </label>
        <input
          id={`image-upload-${index}`}
          type="file"
          accept="image/*"
          disabled={isUploading}
          className="text-xs w-36"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            await onUploadWordImage(index, file);
            e.currentTarget.value = "";
          }}
        />
        {currentImage ? (
          <img
            src={currentImage}
            alt="expression"
            className="h-12 w-12 rounded object-cover border border-gray-200"
          />
        ) : null}
        <button
          type="button"
          className="text-xs text-gray-500 hover:text-gray-700"
          onClick={() => {
            const updatedWords = [...words];
            updatedWords[index][3] = "";
            setWords(updatedWords);
          }}
        >
          Remove image
        </button>
        <FaTrash
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
