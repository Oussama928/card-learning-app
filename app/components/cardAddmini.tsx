import React from "react";
import { FaTrash, FaImage } from "react-icons/fa";
import { CardAddminiProps } from "@/types";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";

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
    if (!words[index]) {
        // initialize if undefined
        // Assuming structure [expression, translated, id, image] based on usage
        updatedWords[index] = ["", "", 0, ""]; 
    }
    
    // Ensure the array has enough elements
    while(updatedWords[index].length < 4) updatedWords[index].push("");

    if (type === "word") {
      updatedWords[index][0] = e.target.value;
    } else if (type === "translatedWord") {
      updatedWords[index][1] = e.target.value;
    }
    setWords(updatedWords);
  };

  const currentImage = words[index]?.[3] || "";

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-center p-4 rounded-lg bg-muted/30 border border-border/50">
      <div className="flex flex-col gap-2 w-full sm:flex-1">
        <Label htmlFor={`expression-${index}`} className="text-foreground">
          Expression
        </Label>
        <Input
          id={`expression-${index}`}
          name={`expression-${index}`}
          type="text"
          autoComplete="off"
          value={words[index]?.[0] || ""}
          onChange={(e) => handleInputChange(e, "word")}
          placeholder="Enter expression"
          className="bg-background"
        />
      </div>
      
      <div className="flex flex-col gap-2 w-full sm:flex-1">
        <Label htmlFor={`translation-${index}`} className="text-foreground">
          Translation
        </Label>
        <Input
          id={`translation-${index}`}
          name={`translation-${index}`}
          type="text"
          autoComplete="off"
          value={words[index]?.[1] || ""}
          onChange={(e) => handleInputChange(e, "translatedWord")}
          placeholder="Enter translation"
          className="bg-background"
        />
      </div>

      <div className="flex flex-row sm:flex-row items-center gap-3 w-full sm:w-auto pt-2 sm:pt-0">
        <div className="relative group">
           <input
            id={`image-upload-${index}`}
            type="file"
            accept="image/*"
            disabled={isUploading}
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              await onUploadWordImage(index, file);
              e.currentTarget.value = "";
            }}
          />
          <Label 
            htmlFor={`image-upload-${index}`}
            className={`flex items-center justify-center w-10 h-10 rounded-md border cursor-pointer hover:bg-muted transition-colors ${currentImage ? 'border-primary' : 'border-input'}`}
            title="Upload image"
          >
            {currentImage ? (
               <img
                src={currentImage}
                alt="expression"
                className="h-full w-full rounded-md object-cover"
              />
            ) : (
              <FaImage className="h-4 w-4 text-muted-foreground" />
            )}
          </Label>
          {currentImage && (
             <button
               type="button"
               className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
               onClick={() => {
                 const updatedWords = [...words];
                 if(updatedWords[index]) updatedWords[index][3] = "";
                 setWords(updatedWords);
               }}
             >
               <div className="h-3 w-3 flex items-center justify-center text-[10px]">✕</div>
             </button>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => {
            const updatedWords = [...words];
            const removedItem = updatedWords.splice(index, 1)[0]; 
            setWords(updatedWords);
            
            if (removedItem && typeof removedItem[2] === "number") {
                setGarbageCollector((prev: number[]) => [...prev, removedItem[2]]);
            }

            seti((i: number) => Math.max(0, i - 1));
          }}
          title="Remove word pair"
        >
          <FaTrash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default CardAddmini;
