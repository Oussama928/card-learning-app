"use client";

import React from "react";
import { FaArrowLeft, FaHome } from "react-icons/fa";
import { useParams, useRouter } from "next/navigation";
import Loading from "../../components/loading";
import { useSession } from "next-auth/react";

const Learning = () => {
  const [index, setIndex] = React.useState(0);
  const [side, setSide] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [terms, setTerms] = React.useState<Array<[string, string, string | number, string | boolean, string | null]>>([]); // [word, translation, id, learned?, image]
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [mode, setMode] = React.useState<"flashcard" | "fill" | "mc">(
    "flashcard"
  );
  const [fillAnswer, setFillAnswer] = React.useState("");
  const [mcOptions, setMcOptions] = React.useState<string[]>([]);
  const [selectedOption, setSelectedOption] = React.useState("");
  const [correctCount, setCorrectCount] = React.useState(0);
  const [incorrectCount, setIncorrectCount] = React.useState(0);

  const { data: session } = useSession();
  const { id } = useParams();
  const router = useRouter();

  React.useEffect(() => {
    const fetchCardData = async () => {
      try {
        const res = await fetch(
          `/api/getCard/${id}?user_id=${session?.user?.id}`
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setTitle(data.title);
        setDescription(data.description);
        setTerms(data.cardData || []);
        // Append a "done" card for completion indication
        setTerms((prev) => [...prev, ["done", "done", "done", "done", null]]);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    if (session) fetchCardData();
  }, [id, session]);

  // Generate options for Multiple Choice mode
  React.useEffect(() => {
    if (mode === "mc" && terms.length > 0 && index < terms.length - 1) {
      const correctAnswer = terms[index][1];
      const allTranslations = terms
        .filter((term, i) => i !== index && term[1] !== "done")
        .map((term) => term[1]);
      const shuffled = allTranslations.sort(() => 0.5 - Math.random());
      const distractors = shuffled.slice(0, 3);
      const options = [...distractors, correctAnswer];
      const finalOptions = options.sort(() => 0.5 - Math.random());
      setMcOptions(finalOptions);
      setSelectedOption("");
    }
  }, [index, terms, mode]);

  const sendProgress = async (isLearned: boolean) => {
    try {
      const res = await fetch("/api/postProgress", {
        method: "POST",
        headers: {
          authorization: `Bearer ${session?.user?.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: session?.user?.id,
          word_id: terms[index][2],
          is_learned: isLearned,
        }),
      });
      if (!res.ok) throw new Error("Failed to update progress");
    } catch (error) {
      console.error("Progress update error:", error);
    }
  };

  const handleNext = (isLearned: boolean) => {
    sendProgress(isLearned);
    if (isLearned) {
      setCorrectCount(prev => prev + 1);
    } else {
      setIncorrectCount(prev => prev + 1);
    }
    setIndex((prev) => Math.min(prev + 1, terms.length - 1));
    setFillAnswer("");
  };

  if (loading) return <Loading />;
  const currentCard = terms[index];
  const totalCards = terms.length - 1;
  const accuracy = totalCards > 0 ? ((correctCount / totalCards) * 100).toFixed(1) : 0;

  return (
    <div
      className="flex flex-col gap-5 min-h-screen pt-28 items-center px-4"
      style={{
        background: "linear-gradient(145deg, #1e2b3a 0%, #2a3f54 100%)",
        color: "#ffffff",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <div className="text-center mb-8">
        <h1
          className="text-4xl font-bold mb-2"
          style={{
            letterSpacing: "0.5px",
            textShadow: "0 2px 4px rgba(0,0,0,0.2)",
            fontFamily: "'Montserrat', sans-serif",
          }}
        >
          {title}
        </h1>
        <h3
          className="text-xl opacity-80"
          style={{
            color: "rgba(255,255,255,0.7)",
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          {description}
        </h3>
      </div>

      {/* Mode selection */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => setMode("flashcard")}
          className={`px-4 py-2 rounded ${
            mode === "flashcard"
              ? "bg-blue-500 text-white"
              : "bg-gray-300 text-black"
          }`}
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          Flashcards
        </button>
        <button
          onClick={() => setMode("fill")}
          className={`px-4 py-2 rounded ${
            mode === "fill"
              ? "bg-blue-500 text-white"
              : "bg-gray-300 text-black"
          }`}
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          Fill in the Blanks
        </button>
        <button
          onClick={() => setMode("mc")}
          className={`px-4 py-2 rounded ${
            mode === "mc" ? "bg-blue-500 text-white" : "bg-gray-300 text-black"
          }`}
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          Multiple Choice
        </button>
      </div>

      {index === terms.length - 1 ? (
        <div
          className="text-center flex flex-col items-center gap-6 p-8 rounded-xl bg-gradient-to-br from-gray-800 to-gray-700 shadow-lg border border-gray-600 max-w-md"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          <h2 className="text-3xl font-bold text-teal-300"> Congratulations!</h2>
          <p className="text-xl text-gray-200">You've completed the set!</p>
          
          <div className="w-full space-y-4 mt-4">
            <div className="flex justify-between items-center p-4 bg-gray-900 rounded-lg">
              <span className="text-lg text-gray-300">Total Cards:</span>
              <span className="text-2xl font-bold text-white">{totalCards}</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-green-900/30 rounded-lg border border-green-500/30">
              <span className="text-lg text-gray-300">Correct:</span>
              <span className="text-2xl font-bold text-green-400"> {correctCount}</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-red-900/30 rounded-lg border border-red-500/30">
              <span className="text-lg text-gray-300">Incorrect:</span>
              <span className="text-2xl font-bold text-red-400"> {incorrectCount}</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-blue-900/30 rounded-lg border border-blue-500/30">
              <span className="text-lg text-gray-300">Accuracy:</span>
              <span className="text-2xl font-bold text-blue-400">{accuracy}%</span>
            </div>
          </div>

          <button
            onClick={() => router.push("/")}
            className="mt-6 flex items-center gap-3 px-8 py-4 rounded-lg bg-teal-500 hover:bg-teal-600 transition duration-200 text-white font-semibold shadow-md text-lg"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            <FaHome className="text-xl" />
            Go to Home
          </button>
        </div>
      ) : mode === "flashcard" ? (
        <>
          {currentCard?.[4] ? (
            <img
              src={String(currentCard[4])}
              alt="Expression visual"
              className="w-full max-w-md h-48 object-cover rounded-xl border border-white/20 shadow-md"
            />
          ) : null}
          <div
            onClick={() => setSide((prev) => (prev === 0 ? 1 : 0))}
            className="cursor-pointer mt-6 text-center flex justify-center items-center text-3xl w-full max-w-2xl rounded-xl transition-transform hover:scale-105"
            style={{
              background:
                "linear-gradient(145deg, rgba(42,63,84,0.9) 0%, rgba(30,43,58,0.9) 100%)",
              minHeight: "300px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              border: "1px solid rgba(127,202,201,0.1)",
              padding: "2rem",
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            <span
              style={{
                color: currentCard[side] ? "#7fcac9" : "rgba(255,255,255,0.5)",
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              {currentCard[side] || "No term found"}
            </span>
          </div>
          <div className="flex items-center justify-center gap-8 mt-12">
            <button
              onClick={() => handleNext(false)}
              disabled={index === terms.length - 1}
              className="p-4 rounded-full transition-all flex items-center justify-center hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              <span className="text-red-500 text-lg font-semibold">
                Dunno 🔴
              </span>
            </button>

            <span
              className="text-xl font-medium text-white/80"
              style={{
                minWidth: "100px",
                textAlign: "center",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {index + 1} / {terms.length - 1}
            </span>

            <button
              onClick={() => handleNext(true)}
              disabled={index === terms.length - 1}
              className="p-4 rounded-full transition-all flex items-center justify-center hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "rgba(34, 197, 94, 0.1)",
                boxShadow: "0 4px 12px rgba(34, 197, 94, 0.2)",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              <span className="text-green-500 text-lg font-semibold">
                Know ✅
              </span>
            </button>
          </div>
          <div>
            <button
              onClick={() => setIndex((prev) => Math.max(prev - 1, 0))}
              disabled={index === 0}
              className="p-3 rounded-full transition-all"
              style={{
                background: "rgba(127,202,201,0.1)",
                opacity: index === 0 ? 0.5 : 1,
                cursor: index === 0 ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              <FaArrowLeft className="h-8 w-8" style={{ color: "#7fcac9" }} />
            </button>
          </div>
        </>
      ) : mode === "fill" ? (
        <>
          <div className="mt-6 text-center flex flex-col items-center justify-center w-full max-w-2xl rounded-xl p-8 transition-transform hover:scale-105 bg-gradient-to-br from-gray-800 to-gray-700 shadow-lg border border-gray-600">
            {currentCard?.[4] ? (
              <img
                src={String(currentCard[4])}
                alt="Expression visual"
                className="w-full max-w-md h-44 object-cover rounded-xl border border-white/20 shadow-md mb-5"
              />
            ) : null}
            <h2
              className="mb-4 text-2xl font-semibold text-gray-200"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Translate the following:
            </h2>
            <div
              className="mb-6 text-3xl font-bold text-teal-300"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {currentCard[0]}
            </div>
            <input
              type="text"
              value={fillAnswer}
              onChange={(e) => setFillAnswer(e.target.value)}
              placeholder="Your translation"
              className="p-3 w-full max-w-md rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400 text-black"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            />
            <button
              onClick={() =>
                handleNext(
                  fillAnswer.trim().toLowerCase() ===
                    currentCard[1].toLowerCase()
                )
              }
              className="mt-6 px-6 py-3 rounded-lg bg-teal-500 hover:bg-teal-600 transition duration-200 text-white font-medium shadow-md"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Submit
            </button>
          </div>
          <div className="mt-4">
            <button
              onClick={() => setIndex((prev) => Math.max(prev - 1, 0))}
              disabled={index === 0}
              className="p-3 rounded-full transition-all bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              <FaArrowLeft className="h-8 w-8 text-teal-300" />
            </button>
          </div>
        </>
      ) : mode === "mc" ? (
        <>
          <div className="mt-6 text-center flex flex-col items-center justify-center w-full max-w-2xl rounded-xl p-8 transition-transform hover:scale-105 bg-gradient-to-br from-gray-800 to-gray-700 shadow-lg border border-gray-600">
            {currentCard?.[4] ? (
              <img
                src={String(currentCard[4])}
                alt="Expression visual"
                className="w-full max-w-md h-44 object-cover rounded-xl border border-white/20 shadow-md mb-5"
              />
            ) : null}
            <h2
              className="mb-4 text-2xl font-semibold text-gray-200"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              What is the translation of:
            </h2>
            <div
              className="mb-6 text-3xl font-bold text-teal-300"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {currentCard[0]}
            </div>
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
              {mcOptions.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedOption(option)}
                  className={`p-3 rounded-lg border transition duration-200 ${
                    selectedOption === option
                      ? "bg-teal-500 text-white border-teal-500"
                      : "bg-gray-100 text-gray-900 border-gray-300 hover:bg-gray-200"
                  }`}
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {option}
                </button>
              ))}
            </div>
            <button
              onClick={() => handleNext(selectedOption === currentCard[1])}
              disabled={!selectedOption}
              className="mt-6 px-6 py-3 rounded-lg bg-teal-500 hover:bg-teal-600 transition duration-200 text-white font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Submit
            </button>
          </div>
          <div className="mt-4">
            <button
              onClick={() => setIndex((prev) => Math.max(prev - 1, 0))}
              disabled={index === 0}
              className="p-3 rounded-full transition-all bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              <FaArrowLeft className="h-8 w-8 text-teal-300" />
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default Learning;