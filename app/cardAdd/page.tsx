"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { Field, Switch } from "@headlessui/react";
import CardAddmini from "../components/cardAddmini";
import { PlusIcon } from "@heroicons/react/16/solid";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import { cardAddSchema } from "@/types/validationSchemas";
import {
  DocumentTextIcon,
  CloudArrowUpIcon,
} from "@heroicons/react/24/outline";
import { CardAddPageProps, CreateCardRequestDTO } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";

const validationSchema = cardAddSchema;

type WordTuple = [string, string, (number | boolean | string)?, string?];

export default function Example({ Current }: CardAddPageProps) {
  const [i, seti] = useState(1);
  const [ii, setii] = useState(1);
  const [words, setWords] = useState<WordTuple[]>([["", "", false, ""]]);
  const [garbageCollector, setGarbageCollector] = useState<number[]>([]);
  const [fileError, setFileError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [inputMethod, setInputMethod] = useState("manual"); // "manual" or "file"
  const [uploadingWordIndex, setUploadingWordIndex] = useState<number | null>(null);
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

      const cardData: CreateCardRequestDTO = {
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
        cardData.words = filteredWords as [string, string, (string | number | boolean)?, string?][];
      }

      if (Current) {
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

  const uploadWordImage = async (index: number, file: File) => {
    try {
      setUploadingWordIndex(index);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/uploads", {
        method: "POST",
        headers: {
          authorization: `Bearer ${session?.user?.accessToken}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data?.data?.url) {
        throw new Error(data?.error || "Failed to upload image");
      }

      setWords((prev) => {
        const next = [...prev];
        const current = next[index] || ["", "", false, ""];
        next[index] = [current[0], current[1], current[2], data.data.url];
        return next;
      });
    } catch (error: unknown) {
      alert(error?.message || "Failed to upload image");
    } finally {
      setUploadingWordIndex(null);
    }
  };

  useEffect(() => {
    console.log(words);
  }, [words]);

  React.useEffect(() => {
    console.log(Current);
    const fetchCardData = async (Current: string) => {
      try {
        const res = await fetch(
          `/api/getCard/${Current}?user_id=${session?.user?.id}`,
          {
            headers: {
              authorization: session?.user?.accessToken ? `Bearer ${session.user.accessToken}` : "",
            },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();
        formik.setFieldValue("title", data.title);
        formik.setFieldValue("targetLanguage", data.targetLanguage);
        formik.setFieldValue("description", data.description);
        setWords(
          (data.cardData || []).map((subArray: (string | number | boolean)[]) => [
            String(subArray[0] || ""),
            String(subArray[1] || ""),
            (subArray[2] as string | number | boolean) || false,
            String(subArray[4] || ""),
          ]),
        );
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
    <div className="min-h-screen bg-background px-6 py-24 sm:py-32 lg:px-8">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-[-10rem] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[-20rem]"
      >
        <div
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
          className="relative left-1/2 -z-10 aspect-[1155/678] w-[36.125rem] max-w-none -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary/40 to-secondary/40 opacity-30 sm:left-[calc(50%-40rem)] sm:w-[72.1875rem]"
        />
      </div>
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Add a Card !
        </h2>
        <p className="mt-2 text-lg leading-8 text-muted-foreground">
          Make sure the expressions are neither too hard nor too easy.
        </p>
      </div>
      <form
        onSubmit={formik.handleSubmit}
        className="mx-auto mt-16 max-w-xl sm:mt-20"
      >
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label
              htmlFor="title"
              className="text-sm font-semibold leading-6 text-foreground"
            >
              Card Title
            </Label>
            <div className="mt-2.5">
              <Input
                id="title"
                name="title"
                type="text"
                value={formik.values.title}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                variant={formik.touched.title && formik.errors.title ? "destructive" : "default"}
              />
              {formik.touched.title && formik.errors.title && (
                <p className="mt-1 text-sm text-destructive">
                  {formik.errors.title}
                </p>
              )}
            </div>
          </div>

          <div className="sm:col-span-2">
            <Label
              htmlFor="targetLanguage"
              className="text-sm font-semibold leading-6 text-foreground"
            >
              Target Language
            </Label>
            <div className="mt-2.5">
              <Input
                id="targetLanguage"
                name="targetLanguage"
                value={formik.values.targetLanguage}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                variant={formik.touched.targetLanguage && formik.errors.targetLanguage ? "destructive" : "default"}
              />
              {formik.touched.targetLanguage &&
                formik.errors.targetLanguage && (
                  <p className="mt-1 text-sm text-destructive">
                    {formik.errors.targetLanguage}
                  </p>
                )}
            </div>
          </div>

          <div className="sm:col-span-2">
            <Label
              htmlFor="description"
              className="text-sm font-semibold leading-6 text-foreground"
            >
              Card Description
            </Label>
            <div className="mt-2.5">
              <Textarea
                id="description"
                name="description"
                rows={4}
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={formik.touched.description && formik.errors.description ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {formik.touched.description && formik.errors.description && (
                <p className="mt-1 text-sm text-destructive">
                  {formik.errors.description}
                </p>
              )}
            </div>
          </div>

          {/* Input Method Selection */}
          <div className="sm:col-span-2">
            <Label className="block text-sm font-semibold leading-6 text-foreground mb-4">
              How would you like to add expressions?
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none transition-colors ${
                  inputMethod === "manual"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:bg-muted/50"
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
                            ? "text-primary"
                            : "text-foreground"
                        }`}
                      >
                        Manual Input
                      </p>
                      <p
                        className={`text-sm ${
                          inputMethod === "manual"
                            ? "text-primary/80"
                            : "text-muted-foreground"
                        }`}
                      >
                        Type expressions one by one
                      </p>
                    </div>
                  </div>
                  <div
                    className={`shrink-0 rounded-full border-2 p-1 ${
                      inputMethod === "manual"
                        ? "border-primary bg-primary"
                        : "border-border"
                    }`}
                  >
                    <div
                      className={`h-2 w-2 rounded-full ${
                        inputMethod === "manual" ? "bg-background" : ""
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div
                className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none transition-colors ${
                  inputMethod === "file"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:bg-muted/50"
                }`}
                onClick={() => {
                  setInputMethod("file");
                  setWords([["", "", false, ""]]);
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
                            ? "text-primary"
                            : "text-foreground"
                        }`}
                      >
                        File Upload
                      </p>
                      <p
                        className={`text-sm ${
                          inputMethod === "file"
                            ? "text-primary/80"
                            : "text-muted-foreground"
                        }`}
                      >
                        Import from .txt or .csv file
                      </p>
                    </div>
                  </div>
                  <div
                    className={`shrink-0 rounded-full border-2 p-1 ${
                      inputMethod === "file"
                        ? "border-primary bg-primary"
                        : "border-border"
                    }`}
                  >
                    <div
                      className={`h-2 w-2 rounded-full ${
                        inputMethod === "file" ? "bg-background" : ""
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
                  <Label className="block text-sm font-semibold leading-6 text-foreground">
                    Expression Pairs{" "}
                    {words.length > 1
                      ? `(${words.filter(([w, t]) => w.trim() && t.trim()).length} pairs)`
                      : ""}
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    add manually below
                  </span>
                </div>
              </div>
              <div className="sm:col-span-2 space-y-6">
                {Array.from({ length: i }, (_, j) => (
                  <div key={j} className="bg-card border border-border rounded-lg p-4 shadow-sm">
                    <CardAddmini
                      index={j}
                      words={words}
                      setWords={setWords}
                      seti={seti}
                      setGarbageCollector={setGarbageCollector}
                      onUploadWordImage={uploadWordImage}
                      isUploading={uploadingWordIndex === j}
                    />
                  </div>
                ))}

                <div className="mt-5 mb-12 flex items-center justify-center">
                  <Button
                    onClick={() => {
                      seti(i + 1);
                      setWords([...words, ["", "", false, ""]]);
                    }}
                    type="button"
                    variant="default"
                    className="gap-2"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Add Expression Pair
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* File Upload Section */}
          {inputMethod === "file" && (
            <div className="sm:col-span-2">
              <Label className="block text-sm font-semibold leading-6 text-foreground mb-2">
                Upload File
              </Label>
              <div className="mb-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-start">
                  <DocumentTextIcon className="h-5 w-5 text-primary mt-0.5 mr-2" />
                  <div className="text-sm text-primary/80">
                    <p className="font-medium mb-1">
                      File Format Instructions:
                    </p>
                    <p>• Upload a .txt or .csv file</p>
                    <p>
                      • Each line should contain one pair:{" "}
                      <code className="bg-background/50 px-1 rounded text-foreground">
                        expression:translation
                      </code>
                    </p>
                    <p>• Example format:</p>
                    <pre className="bg-background/50 px-2 py-1 rounded text-xs mt-1 text-foreground">
                      hello:bonjour <br></br>goodbye:au revoir <br></br>a hard egg:un œuf dur
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
                    ? "border-primary bg-primary/10"
                    : "border-input bg-muted/20 hover:bg-muted/40"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="text-center">
                  <CloudArrowUpIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md font-semibold text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
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
                  <p className="text-xs leading-5 text-muted-foreground">
                    TXT, CSV up to 1MB
                  </p>
                </div>
              </div>

              {fileError && (
                <p className="mt-2 text-sm text-destructive">{fileError}</p>
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
                    className="text-sm text-muted-foreground hover:text-foreground underline"
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
                className="group flex w-8 flex-none cursor-pointer rounded-full bg-input p-px ring-1 ring-inset ring-border transition-colors duration-200 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary data-[checked]:bg-primary"
              >
                <span className="sr-only">Agree to policies</span>
                <span
                  aria-hidden="true"
                  className="size-4 transform rounded-full bg-background shadow-sm ring-1 ring-border transition duration-200 ease-in-out group-data-[checked]:translate-x-3.5"
                />
              </Switch>
            </div>
            <Label className="text-sm leading-6 text-muted-foreground">
              By selecting this, you agree to our{" "}
              <a href="#" className="font-semibold text-primary">
                policies
              </a>
              .
            </Label>
          </Field>
          {formik.touched.agreed && formik.errors.agreed && (
            <p className="mt-1 text-sm text-destructive sm:col-span-2">
              {formik.errors.agreed}
            </p>
          )}
        </div>

        <div className="mt-20">
          <Button
            type="submit"
            disabled={formik.isSubmitting}
            className="w-full"
            variant="default"
          >
            {formik.isSubmitting ? "Submitting..." : "Let's GO"}
          </Button>
        </div>
      </form>
    </div>
  );
}
