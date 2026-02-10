"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { Field, Label, Switch } from "@headlessui/react";
import CardAddmini from "../components/cardAddmini";
import { PlusIcon } from "@heroicons/react/16/solid";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DeleteIcon from "@mui/icons-material/Delete";
import { useFormik } from "formik";
import { object, string, boolean, array } from "yup";
import {
  DocumentTextIcon,
  CloudArrowUpIcon,
} from "@heroicons/react/24/outline";

interface ExampleProps {
  Current?: string;
}

const validationSchema = object({
  title: string()
    .required("Card title is required")
    .min(3, "Title must be at least 3 characters"),
  targetLanguage: string()
    .required("Target language is required")
    .min(2, "Language must be at least 2 characters"),
  description: string()
    .required("Description is required")
    .min(10, "Description must be at least 10 characters"),
  agreed: boolean().oneOf([true], "You must agree to the policies"),
});

export default function Example({ Current }: ExampleProps) {
  const [i, seti] = useState(1);
  const [ii, setii] = useState(1);
  const [words, setWords] = useState<string[][]>([["", "", ""]]);
  const [garbageCollector, setGarbageCollector] = useState<number[]>([]);
  const [fileError, setFileError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [inputMethod, setInputMethod] = useState("manual"); // "manual" or "file"
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();
  const Router = useRouter();

  const formik = useFormik({
    initialValues: {
      title: "",
      targetLanguage: "",
      description: "",
      agreed: false,
    },
    validationSchema,
    onSubmit: async (values) => {
      const email = session?.user?.email;

      // Check if using file upload or manual input
      const hasFileUpload = inputMethod === "file" && uploadedFile !== null;
      const hasManualInput =
        inputMethod === "manual" &&
        words.some(([word, trans]) => word.trim() && trans.trim());

      if (
        (inputMethod === "file" && !hasFileUpload) ||
        (inputMethod === "manual" && !hasManualInput)
      ) {
        formik.setFieldError(
          "words",
          "At least one expression pair is required",
        );
        return;
      }

      const cardData: any = {
        ...values,
        edit: Boolean(Current),
        garbageCollector: garbageCollector,
      };

      // If file is uploaded, send file content; otherwise send manual words
      if (hasFileUpload) {
        cardData.fileContent = uploadedFile;
      } else if (hasManualInput) {
        const filteredWords = words.filter(
          ([word, trans]) => word.trim() && trans.trim(),
        );
        cardData.words = filteredWords;
      }

      if (Current) {
        cardData["id"] = Current;
      }

      try {
        console.log(cardData);
        const response = await fetch("/api/addCard", {
          method: "POST",
          headers: {
            authorization: `Bearer ${(session?.user as any)?.accessToken}`,
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
    },
  });

  // File upload handler - just read and store content

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ["text/plain", "text/csv", "application/csv"];
    if (
      !allowedTypes.includes(file.type) &&
      !file.name.match(/\.(txt|csv)$/i)
    ) {
      setFileError("Please upload a .txt or .csv file");
      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      setFileError("File size must be less than 1MB");
      return;
    }

    try {
      const content = await file.text();

      // Store file content to send to server
      setUploadedFile(content);
      setFileError("");

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: unknown) {
      setFileError("Error reading file: " + (error as Error).message);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  useEffect(() => {
    console.log(words);
  }, [words]);

  React.useEffect(() => {
    console.log(Current);
    const fetchCardData = async (Current: string) => {
      try {
        console.log(session);
        const res = await fetch(
          `/api/getCard/${Current}?user_id=${session?.user?.id}`,
        );
        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();
        formik.setFieldValue("title", data.title);
        formik.setFieldValue("targetLanguage", data.targetLanguage);
        formik.setFieldValue("description", data.description);
        setWords((data.cardData || []).map((subArray: any[]) => subArray.slice(0, 3)));
        seti(data.cardData.length);
        setii(data.cardData.length);
        console.log(data);
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };
    if (Current) {
      fetchCardData(Current);
    }
  }, [Current, session]);

  return (
    <div className="bg-white px-6 py-24 sm:py-32 lg:px-8 h-full">
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
          make sure the expressions are neither too hard nor too easy
        </p>
      </div>
      <form
        onSubmit={formik.handleSubmit}
        className="mx-auto mt-16 max-w-xl sm:mt-20"
      >
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              htmlFor="title"
              className="block text-sm/6 font-semibold text-gray-900"
            >
              Card Title
            </label>
            <div className="mt-2.5">
              <input
                id="title"
                name="title"
                type="text"
                value={formik.values.title}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline outline-1 -outline-offset-1 ${
                  formik.touched.title && formik.errors.title
                    ? "outline-red-500"
                    : "outline-gray-300"
                } placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600`}
              />
              {formik.touched.title && formik.errors.title && (
                <p className="mt-1 text-sm text-red-600">
                  {formik.errors.title}
                </p>
              )}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="targetLanguage"
              className="block text-sm/6 font-semibold text-gray-900"
            >
              Target Language
            </label>
            <div className="mt-2.5">
              <input
                id="targetLanguage"
                name="targetLanguage"
                value={formik.values.targetLanguage}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline outline-1 -outline-offset-1 ${
                  formik.touched.targetLanguage && formik.errors.targetLanguage
                    ? "outline-red-500"
                    : "outline-gray-300"
                } placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600`}
              />
              {formik.touched.targetLanguage &&
                formik.errors.targetLanguage && (
                  <p className="mt-1 text-sm text-red-600">
                    {formik.errors.targetLanguage}
                  </p>
                )}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="description"
              className="block text-sm/6 font-semibold text-gray-900"
            >
              Card Description
            </label>
            <div className="mt-2.5">
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline outline-1 -outline-offset-1 ${
                  formik.touched.description && formik.errors.description
                    ? "outline-red-500"
                    : "outline-gray-300"
                } placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600`}
              />
              {formik.touched.description && formik.errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {formik.errors.description}
                </p>
              )}
            </div>
          </div>

          {/* Input Method Selection */}
          <div className="sm:col-span-2">
            <label className="block text-sm/6 font-semibold text-gray-900 mb-4">
              How would you like to add expressions?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                  inputMethod === "manual"
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-gray-300 bg-white hover:bg-gray-50"
                }`}
                onClick={() => {
                  setInputMethod("manual");
                  setUploadedFile(null);
                  setFileError("");
                }}
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-sm">
                      <p
                        className={`font-medium ${
                          inputMethod === "manual"
                            ? "text-indigo-900"
                            : "text-gray-900"
                        }`}
                      >
                        Manual Input
                      </p>
                      <p
                        className={`text-sm ${
                          inputMethod === "manual"
                            ? "text-indigo-700"
                            : "text-gray-500"
                        }`}
                      >
                        Type expressions one by one
                      </p>
                    </div>
                  </div>
                  <div
                    className={`shrink-0 rounded-full border-2 p-1 ${
                      inputMethod === "manual"
                        ? "border-indigo-600 bg-indigo-600"
                        : "border-gray-300"
                    }`}
                  >
                    <div
                      className={`h-2 w-2 rounded-full ${
                        inputMethod === "manual" ? "bg-white" : ""
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div
                className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                  inputMethod === "file"
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-gray-300 bg-white hover:bg-gray-50"
                }`}
                onClick={() => {
                  setInputMethod("file");
                  setWords([["", "", ""]]);
                  seti(1);
                  setii(1);
                }}
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-sm">
                      <p
                        className={`font-medium ${
                          inputMethod === "file"
                            ? "text-indigo-900"
                            : "text-gray-900"
                        }`}
                      >
                        File Upload
                      </p>
                      <p
                        className={`text-sm ${
                          inputMethod === "file"
                            ? "text-indigo-700"
                            : "text-gray-500"
                        }`}
                      >
                        Import from .txt or .csv file
                      </p>
                    </div>
                  </div>
                  <div
                    className={`shrink-0 rounded-full border-2 p-1 ${
                      inputMethod === "file"
                        ? "border-indigo-600 bg-indigo-600"
                        : "border-gray-300"
                    }`}
                  >
                    <div
                      className={`h-2 w-2 rounded-full ${
                        inputMethod === "file" ? "bg-white" : ""
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Manual Input Section */}
          {inputMethod === "manual" && (
            <>
              <div className="sm:col-span-2 mt-8">
                <div className="flex items-center justify-between">
                  <label className="block text-sm/6 font-semibold text-gray-900">
                    Expression Pairs{" "}
                    {words.length > 1
                      ? `(${words.filter(([w, t]) => w.trim() && t.trim()).length} pairs)`
                      : ""}
                  </label>
                  <span className="text-sm text-gray-500">
                    add manually below
                  </span>
                </div>
              </div>
              <div className="sm:col-span-2 space-y-6">
                {Array.from({ length: i }, (_, j) => (
                  <div key={j} className="bg-gray-50 rounded-lg p-4">
                    <CardAddmini
                      index={j}
                      words={words}
                      setWords={setWords}
                      seti={seti}
                      setGarbageCollector={setGarbageCollector}
                    />
                  </div>
                ))}

                <div className="mt-5 mb-12 flex items-center justify-center">
                  <button
                    onClick={() => {
                      seti(i + 1);
                      setWords([...words, ["", "", ""]]);
                    }}
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Add Expression Pair
                  </button>
                </div>
              </div>
            </>
          )}

          {/* File Upload Section */}
          {inputMethod === "file" && (
            <div className="sm:col-span-2">
              <label className="block text-sm/6 font-semibold text-gray-900 mb-2">
                Upload File
              </label>
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start">
                  <DocumentTextIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">
                      File Format Instructions:
                    </p>
                    <p>• Upload a .txt or .csv file</p>
                    <p>
                      • Each line should contain one pair:{" "}
                      <code className="bg-blue-100 px-1 rounded">
                        expression:translation
                      </code>
                    </p>
                    <p>• Example format:</p>
                    <pre className="bg-blue-100 px-2 py-1 rounded text-xs mt-1">
                      hello:bonjour goodbye:au revoir a hard egg:un œuf dur
                    </pre>
                    <p className="mt-1">
                      • Maximum 1000 expression pairs, file size under 1MB
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`mt-2 flex justify-center rounded-lg border border-dashed px-6 py-10 transition-colors ${
                  isDragOver
                    ? "border-indigo-400 bg-indigo-50"
                    : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="text-center">
                  <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-300" />
                  <div className="mt-4 flex text-sm leading-6 text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".txt,.csv,text/plain,text/csv"
                        ref={fileInputRef}
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs leading-5 text-gray-600">
                    TXT, CSV up to 1MB
                  </p>
                </div>
              </div>

              {fileError && (
                <p className="mt-2 text-sm text-red-600">{fileError}</p>
              )}

              {uploadedFile && (
                <div className="mt-2 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      File uploaded successfully - will be processed on server
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedFile(null);
                      setFileError("");
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    Remove file
                  </button>
                </div>
              )}
            </div>
          )}

          <Field className="flex gap-x-4 sm:col-span-2">
            <div className="flex h-6 items-center">
              <Switch
                checked={formik.values.agreed}
                onChange={(value) => formik.setFieldValue("agreed", value)}
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
          {formik.touched.agreed && formik.errors.agreed && (
            <p className="mt-1 text-sm text-red-600 sm:col-span-2">
              {formik.errors.agreed}
            </p>
          )}
        </div>

        <div className="mt-20">
          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="block w-full rounded-md bg-indigo-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {formik.isSubmitting ? "Submitting..." : "let's GO"}
          </button>
        </div>
      </form>
    </div>
  );
}
