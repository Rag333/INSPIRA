import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AIPortal({ isOpen, onClose }) {
  const [prompt, setPrompt] = useState('');
  const [preview, setPreview] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: 'Stuck? I am your AI Idea Builder! Ask me for a prompt!' }
  ]);
  const [loadingChat, setLoadingChat] = useState(false);
  
  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isOpen]);

  const handleGenerateAi = () => {
    if (!prompt.trim()) return alert('Please enter a prompt for the AI');
    
    setLoadingAi(true);
    setPreview('');

    const safePrompt = encodeURIComponent(prompt.trim());
    const seed = Math.floor(Math.random() * 1000000);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${safePrompt}?nologo=true&seed=${seed}&width=800&height=1200`;

    setPreview(pollinationsUrl);
  };

  const handleChatSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userText }]);
    setChatInput('');
    setLoadingChat(true);

    try {
      const encodedPrompt = encodeURIComponent(`You are a creative Assistant for a Pinterest clone called Inspira. Generate a short, highly descriptive image prompt based on this request: "${userText}". Only respond with the image prompt itself, nothing else.`);
      const res = await fetch(`https://text.pollinations.ai/${encodedPrompt}`);
      const text = await res.text();
      setChatMessages(prev => [...prev, { role: 'assistant', text: text }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: "Sorry, my creative gears are jammed right now!" }]);
    } finally {
      setLoadingChat(false);
    }
  };

  const useAsPrompt = (text) => setPrompt(text);

  const clearImage = () => {
      setPreview('');
      setPrompt('');
  };

  const handlePublish = () => {
      onClose();
      // Pass the generated image to Add page or just navigate there
      navigate('/add', { state: { generatedUrl: preview, generatedTitle: prompt } });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 top-[72px] bg-black/40 backdrop-blur-xl z-[100] animate-slide-down flex justify-center items-start overflow-y-auto w-full">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-20 mt-4 bg-zinc-900 border border-zinc-700/50 rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)]">
          <div className="flex flex-col md:flex-row gap-8">
              
              {/* Left: Chatbot & Prompt Input */}
              <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold text-white"><i className="ri-magic-line text-red-500 mr-2"></i> Inspira Magic Studio</h2>
                      <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors cursor-pointer"><i className="ri-close-line text-2xl"></i></button>
                  </div>
                  
                  <div className="w-full flex gap-2 mb-4">
                      <input type="text" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="e.g. A cyberpunk samurai city..." className="flex-1 bg-zinc-800 text-white px-5 py-3.5 rounded-xl border border-zinc-700 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-sm font-medium" />
                      <button type="button" onClick={handleGenerateAi} disabled={loadingAi} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center cursor-pointer">
                          {loadingAi ? <i className="ri-loader-4-line animate-spin text-xl"></i> : 'Generate'}
                      </button>
                  </div>

                  {/* Chatbot Interface */}
                  <div className="flex-1 bg-zinc-800/80 rounded-2xl p-4 border border-zinc-700/50 flex flex-col h-[200px] shadow-inner">
                      <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-3 custom-scrollbar">
                          {chatMessages.map((msg, i) => (
                              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`p-3 rounded-2xl max-w-[90%] text-sm ${msg.role === 'user' ? 'bg-red-600 text-white rounded-br-none' : 'bg-zinc-700 text-gray-200 rounded-bl-none'}`}>
                                      <p>{msg.text}</p>
                                      {msg.role === 'assistant' && i !== 0 && (
                                          <button type="button" onClick={() => useAsPrompt(msg.text)} className="mt-2 text-xs font-semibold bg-zinc-800 hover:bg-zinc-900 border border-zinc-600 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 active:scale-95 text-white">
                                              <i className="ri-quill-pen-line"></i> Use prompt
                                          </button>
                                      )}
                                  </div>
                              </div>
                          ))}
                          {loadingChat && (
                              <div className="flex justify-start">
                                  <div className="p-3 bg-zinc-700 rounded-2xl rounded-bl-none"><i className="ri-loader-4-line animate-spin text-gray-400"></i></div>
                              </div>
                          )}
                          <div ref={chatEndRef} />
                      </div>
                      <form onSubmit={handleChatSubmit} className="relative mt-auto">
                          <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask AI for aesthetic ideas..." className="w-full bg-zinc-900 text-white rounded-full py-2.5 pl-4 pr-10 text-sm border border-zinc-700 focus:outline-none focus:border-red-500" />
                          <button type="submit" disabled={loadingChat || !chatInput.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 rounded-full text-white transition-colors cursor-pointer">
                              <i className="ri-send-plane-fill text-xs"></i>
                          </button>
                      </form>
                  </div>
              </div>

              {/* Right: AI Output Preview */}
              <div className="flex-1 bg-zinc-800 rounded-2xl flex flex-col items-center justify-center min-h-[300px] border border-zinc-700 relative overflow-hidden group w-full max-w-[400px]">
                  {preview ? (
                      <>
                          <img 
                            src={preview} 
                            className="w-full h-full object-cover animate-fade-in" 
                            alt="Generated" 
                            onLoad={() => setLoadingAi(false)}
                            onError={() => { setLoadingAi(false); alert("Failed to fetch image. Please try again."); }}
                          />
                          <button onClick={clearImage} className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md transition-colors shadow-lg cursor-pointer"><i className="ri-close-line"></i></button>
                          
                          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={handlePublish} className="w-full max-w-[250px] bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full shadow-xl transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
                                  <i className="ri-save-line"></i> Publish to Feed
                              </button>
                          </div>
                      </>
                  ) : (
                      <div className="text-center p-6 flex flex-col items-center justify-center h-full">
                          {loadingAi ? (
                              <>
                                <i className="ri-loader-4-line text-5xl animate-spin text-red-500 mb-4"></i>
                                <p className="text-zinc-400 font-medium animate-pulse">Painting your masterpiece...</p>
                              </>
                          ) : (
                              <>
                                <i className="ri-image-add-line text-5xl text-zinc-600 mb-4 block group-hover:text-zinc-500 transition-colors"></i>
                                <p className="text-zinc-500 font-medium text-sm">Your creation will appear here</p>
                              </>
                          )}
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
}
