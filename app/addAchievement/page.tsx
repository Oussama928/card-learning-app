"use client";
import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AddAchievementPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [conditionType, setConditionType] = React.useState<"cards_studied_total" | "cards_created_total">("cards_studied_total");
  const [target, setTarget] = React.useState<number>(1);
  const [xpReward, setXpReward] = React.useState<number>(0);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setUploadError(null);
    setSelectedFile(file);

    if (!file) {
      setPreviewUrl((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev);
        }
        return null;
      });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return objectUrl;
    });
  };

  const uploadImage = async (): Promise<string | undefined> => {
    if (!selectedFile) {
      return undefined;
    }

    if (!session?.user?.accessToken) {
      throw new Error("Unauthorized");
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const response = await fetch("/api/uploads", {
        method: "POST",
        headers: {
          authorization: `Bearer ${session.user.accessToken}`,
        },
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok || !payload?.data?.url) {
        const reason = payload?.error || payload?.message || "Image upload failed";
        setUploadError(reason);
        throw new Error(reason);
      }

      return payload.data.url;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setUploadError(null);

    if (!name || !description) {
      setMessage("Name and description are required.");
      return;
    }

    try {
      setLoading(true);
      const imageUrl = await uploadImage();

      const payload = {
        name,
        description,
        conditionType,
        target,
        xpReward: xpReward || undefined,
        imageUrl: imageUrl || undefined,
      };

      const response = await fetch("/api/achievements", {
        method: "POST",
        headers: {
          authorization: `Bearer ${session?.user?.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        const errorMessage = data?.details ? `${data.error}: ${data.details}` : (data?.error || data?.message || "Failed to create achievement.");
        setMessage(errorMessage);
        return;
      }

      setMessage(`Achievement created. Notified users: ${data.notifiedUsers}`);
      setName("");
      setDescription("");
      setTarget(1);
      setXpReward(0);
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadError(null);
    } catch (err) {
      setMessage(uploadError || "Network error while creating achievement.");
    } finally {
      setLoading(false);
    }
  };

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
          Add an Achievement Badge
        </h2>
        <p className="mt-2 text-lg text-gray-600">Create a badge and optionally award it retroactively.</p>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto mt-16 max-w-xl sm:mt-20">
        {message && (
          <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{message}</div>
        )}

        <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="name" className="block text-sm font-semibold text-gray-900">Name</label>
            <div className="mt-2.5">
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-indigo-600"
                placeholder="Study Grinder"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="description" className="block text-sm font-semibold text-gray-900">Description</label>
            <div className="mt-2.5">
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-indigo-600"
                placeholder="Enter a short description..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900">Condition Type</label>
            <div className="mt-2.5">
              <select
                value={conditionType}
                onChange={(e) => setConditionType(e.target.value as any)}
                className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-indigo-600"
              >
                <option value="cards_studied_total">Cards Studied (total)</option>
                <option value="cards_created_total">Cards Created (total)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900">Target</label>
            <div className="mt-2.5">
              <input
                type="number"
                min={1}
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-indigo-600"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-900">Image (optional)</label>
            <div className="mt-2.5">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-indigo-600"
              />
              <p className="text-xs text-gray-500 mt-1">JPEG, PNG, or WEBP up to 5MB.</p>
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="mt-3 h-28 w-full rounded-lg object-cover"
                />
              )}
              {uploadError && <p className="mt-1 text-sm text-red-600">{uploadError}</p>}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-900">XP Reward (optional)</label>
            <div className="mt-2.5">
              <input
                type="number"
                min={0}
                value={xpReward}
                onChange={(e) => setXpReward(Number(e.target.value))}
                className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-indigo-600"
              />
            </div>
          </div>
        </div>

        <div className="mt-20">
          <button
            type="submit"
            disabled={loading || uploadingImage}
            className="block w-full rounded-md bg-indigo-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : uploadingImage ? "Uploading image..." : "Create Achievement"}
          </button>
        </div>
      </form>
    </div>
  );
}
