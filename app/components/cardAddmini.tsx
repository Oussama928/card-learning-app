import React from "react";
import DeleteIcon from "@mui/icons-material/Delete";

const CardAddmini = ({ index, words, setWords, seti, setGarbageCollector }) => {
  const handleInputChange = (e, type) => {
    const updatedWords = [...words];
    if (type === "word") {
      updatedWords[index][0] = e.target.value;
    } else if (type === "translatedWord") {
      updatedWords[index][1] = e.target.value;
    }
    updatedWords[index][2] = false;
    setWords(updatedWords);
  };

  return (
    <div className="flex gap-x-4 sm:col-span-2 mt-8 items-center justify-center">
      <div className="flex flex-col h-20 justify-center items-center">
        <label
          htmlFor="first-name"
          className="block text-sm font-semibold text-gray-900"
        >
          Word
        </label>
        <div className="mt-2.5">
          <input
            id="first-name"
            name="first-name"
            type="text"
            autoComplete="given-name"
            value={words[index]?.[0] || ""}
            onChange={(e) => handleInputChange(e, "word")}
            className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
          />
        </div>
      </div>
      <div className="flex flex-col h-20 justify-center items-center">
        <label
          htmlFor="last-name"
          className="block text-sm font-semibold text-gray-900"
        >
          Translated Word
        </label>
        <div className="mt-2.5 flex justify-center items-center">
          <input
            id="last-name"
            name="last-name"
            type="text"
            autoComplete="family-name"
            value={words[index]?.[1] || ""}
            onChange={(e) => handleInputChange(e, "translatedWord")}
            className="block w-full  rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
          />
        </div>
      </div>
      <DeleteIcon
        className="mt-7 cursor-pointer"
        style={{ color: "black" }}
        onClick={() => {
          const updatedWords = [...words];
          updatedWords.splice(index, 1);
          setWords(updatedWords);
          setGarbageCollector((prev) => {
            if (typeof words[index][2] === "number") {
              return [...prev, words[index][2]];
            }
            return prev;
          });

          seti((i) => i - 1);
        }}
      />
    </div>
  );
};

export default CardAddmini;
