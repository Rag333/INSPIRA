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
  const [history, setHistory] = useState([]);
  
  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isOpen]);

  const handleGenerateAi = async () => {
    if (!prompt.trim()) return alert('Please enter a prompt for the AI');
    setLoadingAi(true);
    setPreview('');

    try {
      // Step 1: Submit generation job to AI Horde (free, no key needed)
      const submitRes = await fetch('https://stablehorde.net/api/v2/generate/async', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': '0000000000', // Anonymous key
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          params: { width: 512, height: 768, steps: 20, n: 1, sampler_name: 'k_euler_a' },
          nsfw: false,
          models: ['stable_diffusion']
        })
      });

      if (!submitRes.ok) throw new Error('Submit failed');
      const { id } = await submitRes.json();

      // Step 2: Poll until done (every 5 seconds)
      let imageUrl = null;
      for (let attempt = 0; attempt < 30; attempt++) {
        await new Promise(r => setTimeout(r, 5000));
        const checkRes = await fetch(`https://stablehorde.net/api/v2/generate/check/${id}`);
        const checkData = await checkRes.json();
        if (checkData.done) {
          // Step 3: Get final result
          const statusRes = await fetch(`https://stablehorde.net/api/v2/generate/status/${id}`);
          const statusData = await statusRes.json();
          imageUrl = statusData.generations?.[0]?.img;
          break;
        }
      }

      if (imageUrl) {
        setPreview(imageUrl);
        setHistory(prev => [{ url: imageUrl, promptText: prompt.trim() }, ...prev]);
      } else {
        alert('Image generation timed out. Please try again.');
      }
    } catch (err) {
      console.error('AI generation error:', err);
      alert('Image generation failed. Please try again.');
    } finally {
      setLoadingAi(false);
    }
  };

  // Smart client-side prompt builder — no external API needed
  const buildPrompt = (userText) => {
    const styles = ['hyperrealistic photography', 'cinematic still', '8K ultra-detailed', 'award-winning photo', 'DSLR quality', 'editorial style'];
    const lighting = ['golden hour lighting', 'soft diffused light', 'dramatic side lighting', 'natural window light', 'warm ambient glow', 'moody studio lighting'];
    const moods = ['cozy and intimate', 'serene and peaceful', 'vibrant and energetic', 'dark and atmospheric', 'bright and airy', 'elegant and luxurious'];
    const camera = ['shot on Sony A7R IV', 'shallow depth of field', 'bokeh background', 'wide angle lens', '85mm portrait lens', 'macro detail'];
    const extras = ['highly detailed', 'sharp focus', 'professional color grading', 'trending on Pinterest', 'visually stunning', 'magazine quality'];
    
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    
    return `${userText}, ${pick(moods)}, ${pick(lighting)}, ${pick(styles)}, ${pick(camera)}, ${pick(extras)}`;
  };

  const handleChatSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userText }]);
    setChatInput('');
    setLoadingChat(true);

    // Small delay for UX feel
    await new Promise(r => setTimeout(r, 600));
    
    const generated = buildPrompt(userText);
    setChatMessages(prev => [...prev, { role: 'assistant', text: generated }]);
    setLoadingChat(false);
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

  const handleRestoreHistory = (item) => {
      setPreview(item.url);
      setPrompt(item.promptText);
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
                  
                  {/* Idea History Ribbon */}
                  {history.length > 0 && (
                      <div className="mt-4 bg-zinc-800/50 rounded-2xl p-4 border border-zinc-700/30">
                          <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-3"><i className="ri-history-line"></i> Session History</p>
                          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                              {history.map((item, idx) => (
                                  <div 
                                      key={idx} 
                                      onClick={() => handleRestoreHistory(item)}
                                      className="min-w-[80px] w-[80px] h-[80px] rounded-xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-red-500 transition-all flex-shrink-0 group relative"
                                      title={item.promptText}
                                  >
                                      <img src={item.url} className="w-full h-full object-cover group-hover:brightness-75 transition-all" alt="history preview" />
                                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                          <i className="ri-refresh-line text-white/80 text-xl drop-shadow-lg"></i>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
              </div>

              {/* Right: AI Output Preview */}
              <div className="flex-1 bg-zinc-800 rounded-2xl flex flex-col items-center justify-center min-h-[300px] border border-zinc-700 relative overflow-hidden group w-full max-w-[400px]">
                {/* Loading spinner overlay — displayed on top while waiting for Pollinations */}
                {loadingAi && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-800 z-10 rounded-2xl">
                    <i className="ri-loader-4-line text-5xl animate-spin text-red-500 mb-4"></i>
                    <p className="text-zinc-400 font-medium text-sm text-center px-4">Painting your masterpiece...</p>
                    <p className="text-zinc-600 text-xs mt-1">This may take 20–60 seconds</p>
                  </div>
                )}

                {/* Image — shown once URL is set (loads in background) */}
                {preview && (
                  <img 
                    src={preview}
                    className="w-full h-full object-cover"
                    alt="Generated"
                    onLoad={() => {
                      setLoadingAi(false);
                      setHistory(prev => {
                        if (prev.length === 0 || prev[0].url !== preview) {
                          return [{ url: preview, promptText: prompt }, ...prev];
                        }
                        return prev;
                      });
                    }}
                  />
                )}

                {/* Empty state */}
                {!preview && !loadingAi && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                    <i className="ri-image-add-line text-5xl text-zinc-600 mb-4 block"></i>
                    <p className="text-zinc-500 font-medium text-sm">Your creation will appear here</p>
                  </div>
                )}

                {/* Action buttons — only when image loaded */}
                {preview && !loadingAi && (
                  <>
                    <button onClick={clearImage} className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md transition-colors shadow-lg cursor-pointer z-20"><i className="ri-close-line"></i></button>
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <button onClick={handlePublish} className="w-full max-w-[250px] bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full shadow-xl transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
                        <i className="ri-save-line"></i> Publish to Feed
                      </button>
                    </div>
                  </>
                )}
              </div>
          </div>
      </div>
    </div>
  );
}
