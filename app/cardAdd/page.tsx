"use client";

import React, { useState, useEffect } from "react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { Field, Label, Switch } from "@headlessui/react";
import CardAddmini from "../components/cardAddmini";
import { PlusIcon } from "@heroicons/react/16/solid";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DeleteIcon from "@mui/icons-material/Delete";

export default function Example({ Current }) {
  const [agreed, setAgreed] = useState(false);
  const [i, seti] = useState(1);
  const [ii, setii] = useState(1);
  const [words, setWords] = useState([["", "",""]]);
  const [title, setTitle] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("");
  const [description, setDescription] = useState("");
  const [garbageCollector, setGarbageCollector] = useState([]);
  const { data: session } = useSession();
  const Router = useRouter();
  console.log("current : ",Current);

  useEffect(() => {
    console.log(words);
  }, [words]);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = session?.user?.email;

    const cardData = {
      title,
      targetLanguage,
      description,
      words,
      edit: Boolean(Current),
      garbageCollector: garbageCollector,

      
    };
    if(Current){
      cardData["id"] = Current;
    }
    

    try {
      console.log(cardData);
      const response = await fetch("/api/addCard", {
        method: "POST",
        headers: {
          authorization: `Bearer ${session?.user?.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cardData),
      });

      if (response.ok) {
        console.log("Card added successfully");
        Router.push("/community");
      } else {
        console.error("Failed to add card");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };
  React.useEffect(() => {
    console.log(Current);
    const fetchCardData = async (Current) => {
      try {
        console.log(session);
        const res = await fetch(
          `/api/getCard/${Current}?user_id=${session?.user?.id}`
        );
        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();
        setTitle(data.title);
        setWords((data.cardData || []).map(subArray => subArray.slice(0, 3)));
        setTargetLanguage(data.targetLanguage);
        seti(data.cardData.length);
        setii(data.cardData.length);
        console.log(data);


        setDescription(data.description);
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };
    if (Current) {
      fetchCardData(Current);
    }
  }, [Current,session]);

  return (
    <div className="   bg-white px-6 py-24 sm:py-32 lg:px-8 h-full">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-[-10rem] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[-20rem]"
      >
        <div
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
          className="relative left-1/2 -z-10 aspect-[1155/678] w-[36.125rem] max-w-none -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-40rem)] sm:w-[72.1875rem]"
        />
      </div>
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
          Add a Card !
        </h2>
        <p className="mt-2 text-lg/8 text-gray-600">
          make sure the words are neither too hard nor too easy
        </p>
      </div>
      <form onSubmit={handleSubmit} className="mx-auto mt-16 max-w-xl sm:mt-20">
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              htmlFor="company"
              className="block text-sm/6 font-semibold text-gray-900"
            >
              Card Title
            </label>
            <div className="mt-2.5">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                id="company"
                name="company"
                type="text"
                autoComplete="organization"
                className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="email"
              className="block text-sm/6 font-semibold text-gray-900"
            >
              target language
            </label>
            <div className="mt-2.5">
              <input
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                id="email"
                autoComplete="email"
                className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="message"
              className="block text-sm/6 font-semibold text-gray-900"
            >
              Card description
            </label>
            <div className="mt-2.5">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                id="message"
                name="message"
                rows={4}
                className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
              />
            </div>
          </div>
          <Field className="flex gap-x-4 sm:col-span-2">
            <div className="flex h-6 items-center">
              <Switch
                checked={agreed}
                onChange={setAgreed}
                className="group flex w-8 flex-none cursor-pointer rounded-full bg-gray-200 p-px ring-1 ring-inset ring-gray-900/5 transition-colors duration-200 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 data-[checked]:bg-indigo-600"
              >
                <span className="sr-only">Agree to policies</span>
                <span
                  aria-hidden="true"
                  className="size-4 transform rounded-full bg-white shadow-sm ring-1 ring-gray-900/5 transition duration-200 ease-in-out group-data-[checked]:translate-x-3.5"
                />
              </Switch>
            </div>
            <Label className="text-sm/6 text-gray-600">
              By selecting this, you agree to our{" "}
              <a href="#" className="font-semibold text-indigo-600">
                policies
              </a>
              .
            </Label>
          </Field>
        </div>
        <div>
          {Array.from({ length: i }, (_, j) => (
            <div key={j} >
              <CardAddmini index={j} words={words} setWords={setWords} seti={seti}  setGarbageCollector={setGarbageCollector} />
            </div>
          ))}
        </div>
        <div className="mt-5 mb-12  flex  items-center justify-center">
          <button
            onClick={() => {
              seti(i + 1);
              setWords([...words, ["", ""]]);
            }}
            type="button"
            className="block w-1/8 rounded-full bg-indigo-600 px-3 py-1.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <PlusIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="mt-20">
          <button
            type="submit"
            className="block w-full rounded-md bg-indigo-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            let's GO
          </button>
        </div>
      </form>
    </div>
  );
}
