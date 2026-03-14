import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AIPortal({ isOpen, onClose }) {
  const [prompt, setPrompt] = useState("");
  const [preview, setPreview] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      text: "Stuck? Ask me for creative Pinterest prompts!",
    },
  ]);

  const [history, setHistory] = useState([]);

  const chatEndRef = useRef(null);
  const controllerRef = useRef(null);
  const navigate = useNavigate();

  // scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // load history
  useEffect(() => {
    const saved = localStorage.getItem("aiHistory");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const addHistory = (url, promptText) => {
    setHistory((prev) => {
      const updated = [{ url, promptText }, ...prev].slice(0, 20);
      localStorage.setItem("aiHistory", JSON.stringify(updated));
      return updated;
    });
  };

  // ===== AI IMAGE GENERATION =====
  const handleGenerateAi = async () => {
    if (!prompt.trim()) return;

    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    controllerRef.current = new AbortController();

    setLoadingAi(true);
    setPreview("");

    try {
      const encoded = encodeURIComponent(prompt);

      const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=512&height=768&seed=${Math.random()}`;

      setPreview(imageUrl);
      addHistory(imageUrl, prompt);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  // ===== PROMPT BUILDER =====
  const buildPrompt = (userText) => {
    const styles = [
      "hyperrealistic photography",
      "cinematic lighting",
      "8K ultra detailed",
      "editorial photography",
    ];

    const moods = [
      "cozy atmosphere",
      "vibrant colors",
      "dark cinematic mood",
      "minimal aesthetic",
    ];

    const cameras = [
      "shot on DSLR",
      "bokeh background",
      "macro detail",
      "shallow depth of field",
    ];

    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    return `${userText}, ${pick(moods)}, ${pick(styles)}, ${pick(cameras)}, trending on Pinterest`;
  };

  // ===== CHAT PROMPT ASSISTANT =====
  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const text = chatInput.trim();

    setChatMessages((prev) => [...prev, { role: "user", text }].slice(-20));

    const generated = buildPrompt(text);

    setChatMessages((prev) =>
      [...prev, { role: "assistant", text: generated }].slice(-20),
    );

    setChatInput("");
  };

  const useAsPrompt = (text) => setPrompt(text);

  const clearImage = () => {
    setPreview("");
    setPrompt("");
  };

  const handlePublish = () => {
    onClose();
    navigate("/add", {
      state: {
        generatedUrl: preview,
        generatedTitle: prompt,
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xl z-50 flex justify-center items-start overflow-y-auto p-6">
      <div className="w-full max-w-6xl bg-zinc-900 rounded-3xl p-6 border border-zinc-700">
        <div className="flex flex-col md:flex-row gap-6">
          {/* LEFT SIDE */}
          <div className="flex-1">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                Inspira Magic Studio
              </h2>

              <button onClick={onClose} className="text-zinc-400">
                ✕
              </button>
            </div>

            {/* PROMPT INPUT */}
            <div className="flex gap-2 mb-4">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image..."
                className="flex-1 bg-zinc-800 text-white px-4 py-3 rounded-xl"
              />

              <button
                onClick={handleGenerateAi}
                className="bg-red-600 px-5 rounded-xl text-white"
              >
                {loadingAi ? "..." : "Generate"}
              </button>
            </div>

            {/* CHAT */}
            <div className="bg-zinc-800 p-4 rounded-xl h-56 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-2">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : ""}`}
                  >
                    <div className="bg-zinc-700 text-white p-2 rounded-lg text-sm max-w-[80%]">
                      {msg.text}

                      {msg.role === "assistant" && (
                        <button
                          onClick={() => useAsPrompt(msg.text)}
                          className="block mt-2 text-xs text-red-400"
                        >
                          Use prompt
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <div ref={chatEndRef}></div>
              </div>

              <form onSubmit={handleChatSubmit} className="mt-2 flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask for prompt ideas..."
                  className="flex-1 bg-zinc-900 text-white px-3 py-2 rounded-lg"
                />

                <button className="bg-red-600 px-3 rounded-lg text-white">
                  Send
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex-1 flex flex-col items-center justify-center bg-zinc-800 rounded-xl min-h-[320px] relative">
            {loadingAi && <div className="text-white">Generating...</div>}

            {preview && !loadingAi && (
              <>
                <img
                  src={preview}
                  alt="AI"
                  className="w-full h-full object-cover rounded-xl"
                />

                <button
                  onClick={clearImage}
                  className="absolute top-3 right-3 bg-black/60 px-3 py-1 rounded text-white"
                >
                  ✕
                </button>

                <button
                  onClick={handlePublish}
                  className="absolute bottom-4 bg-red-600 px-6 py-2 rounded-full text-white"
                >
                  Publish
                </button>
              </>
            )}

            {!preview && !loadingAi && (
              <div className="text-zinc-500">
                Your AI image will appear here
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
