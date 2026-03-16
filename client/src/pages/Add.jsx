import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

export default function Add() {
  const navigate = useNavigate();
  const location = useLocation();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(location.state?.generatedUrl || '');
  const [aiUrl, setAiUrl] = useState(location.state?.generatedUrl || '');
  const [prompt, setPrompt] = useState(location.state?.generatedTitle || '');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Chatbot State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: 'Stuck? I am your AI Assistant! Ask me for an image idea!' }
  ]);
  const [loadingChat, setLoadingChat] = useState(false);
  const chatEndRef = useRef(null);
  
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setAiUrl(''); 
    }
  };

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Smart client-side prompt builder — instant, no API dependency
  const buildPrompt = (userText) => {
    const styles = ['hyperrealistic photography', 'cinematic still', '8K ultra-detailed', 'award-winning photo', 'editorial style'];
    const lighting = ['golden hour lighting', 'soft diffused light', 'dramatic side lighting', 'natural window light', 'warm ambient glow'];
    const moods = ['cozy and intimate', 'serene and peaceful', 'vibrant and energetic', 'dark and atmospheric', 'bright and airy', 'elegant and luxurious'];
    const camera = ['shot on Sony A7R IV', 'shallow depth of field', 'bokeh background', 'wide angle lens', '85mm portrait lens'];
    const extras = ['highly detailed', 'sharp focus', 'professional color grading', 'trending on Pinterest', 'visually stunning'];
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
    await new Promise(r => setTimeout(r, 600));
    const generated = buildPrompt(userText);
    setChatMessages(prev => [...prev, { role: 'assistant', text: generated }]);
    setLoadingChat(false);
  };

  const useAsPrompt = (text) => {
      setPrompt(text);
  };

  const handleGenerateAi = async () => {
    if (!prompt.trim()) return alert('Please enter a prompt for the AI');
    setLoadingAi(true);
    setFile(null);
    setPreview('');
    setAiUrl('');

    try {
      // Use Pollinations AI for instant, free image generation without API keys
      const encodedPrompt = encodeURIComponent(prompt.trim() + " highly detailed, 8k resolution, masterpiece");
      const randomSeed = Math.floor(Math.random() * 1000000);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${randomSeed}&width=512&height=768&nologo=true`;
      
      // We just need to load the image to ensure it's generated
      const img = new Image();
      img.onload = () => {
        setPreview(imageUrl);
        setAiUrl(imageUrl);
        setLoadingAi(false);
      };
      img.onerror = () => {
        alert('Image generation failed. Please try again.');
        setLoadingAi(false);
      };
      img.src = imageUrl;

    } catch (err) {
      alert('Image generation failed. Please try again.');
      setLoadingAi(false);
    }
  };

  const clearImage = () => {
    setFile(null);
    setPreview('');
    setAiUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file && !aiUrl) {
      return alert('Please upload an image or generate one using AI.');
    }

    setSaving(true);
    try {
      if (aiUrl) {
        // AI submission logic structure matching Express routes
        const res = await axios.post('/createpost/ai', {
          title, description, imageUrl: aiUrl
        });
        if (res.data.success) {
          setUser(res.data.user);
          navigate('/profile');
        }
      } else {
        // Standard File Upload
        const formData = new FormData();
        formData.append('image', file);
        formData.append('title', title);
        formData.append('description', description);
        
        const res = await axios.post('/createpost', formData);
        if (res.data.success) {
          setUser(res.data.user);
          navigate('/profile');
        }
      }
    } catch (err) {
      alert((err.response?.data?.message || 'Error saving Pin') + ': ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-zinc-900 px-10 py-10 text-white font-sans">
      <h1 className="text-3xl font-bold mt-2 mb-6 cursor-pointer" onClick={() => navigate(-1)}>
         <i className="ri-arrow-left-line mr-2"></i>Create a new Pin
      </h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Options & Preview */}
          <div className="flex-1 bg-zinc-800 p-6 rounded-2xl shadow-xl flex flex-col items-center justify-center min-h-[400px] border border-zinc-700 relative overflow-hidden group transition-all">
              
              {(preview || loadingAi) && (
                <div className="w-full h-full absolute inset-0 bg-zinc-800 z-10 flex flex-col items-center justify-center overflow-hidden">
                    {/* Spinner overlay on TOP while loading — image still loads underneath */}
                    {loadingAi && (
                      <div className="absolute inset-0 bg-zinc-800 flex flex-col items-center justify-center z-20">
                          <i className="ri-loader-4-line text-4xl animate-spin text-indigo-400 mb-3"></i>
                          <p className="text-sm font-medium text-zinc-300">Generating your image...</p>
                          <p className="text-xs text-zinc-500 mt-1">This may take 20–60 seconds</p>
                      </div>
                    )}
                    {preview && (
                      <img 
                        src={preview} 
                        className="w-full h-full object-cover" 
                        alt="Preview"
                        onLoad={() => setLoadingAi(false)}
                      />
                    )}
                    {!loadingAi && preview && (
                      <button onClick={clearImage} className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full cursor-pointer transition-colors backdrop-blur-md z-30">
                          <i className="ri-close-line text-xl"></i>
                      </button>
                    )}
                </div>
              )}

              <div className="flex flex-col items-center gap-6 w-full max-w-sm z-0">
                  <div className="text-center">
                      <i className="ri-upload-cloud-2-line text-5xl text-zinc-400 mb-2 block"></i>
                      <p className="text-zinc-400 font-medium">Choose from your files</p>
                  </div>
                  
                  <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-3 px-6 rounded-full w-full transition-colors cursor-pointer">
                      Upload Image
                  </button>
                  
                  <div className="flex items-center w-full gap-3 opacity-50 my-2">
                       <hr className="flex-1 border-zinc-600" /><span className="text-xs tracking-wider">OR AI</span><hr className="flex-1 border-zinc-600" />
                  </div>

                  {/* AI Prompt Generator */}
                  <div className="w-full flex gap-2">
                      <input type="text" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Image prompt (e.g. A cyberpunk city)" className="flex-1 bg-zinc-700 text-white px-4 py-3 rounded-xl border border-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm" />
                       <button type="button" onClick={handleGenerateAi} disabled={loadingAi} className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 disabled:opacity-50 text-white font-semibold py-3 px-5 rounded-xl transition-all shadow-lg flex items-center justify-center cursor-pointer">
                           {loadingAi ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-magic-line"></i>}
                       </button>
                  </div>
              </div>
          </div>

          <div className="flex flex-col flex-1 gap-6 max-w-md w-full">
              {/* Feature: AI Chatbot Assistant */}
              <div className="bg-zinc-800 rounded-2xl p-5 border border-zinc-700 shadow-xl flex flex-col h-[300px]">
                  <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2"><i className="ri-robot-2-line text-blue-400"></i> AI Idea Assistant</h3>
                  
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-3">
                      {chatMessages.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`p-3 rounded-2xl max-w-[85%] text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-zinc-700 text-gray-200 rounded-bl-none'}`}>
                                  <p>{msg.text}</p>
                                  {msg.role === 'assistant' && i !== 0 && (
                                     <button type="button" onClick={() => useAsPrompt(msg.text)} className="mt-2 text-xs font-semibold bg-zinc-800 hover:bg-zinc-900 border border-zinc-600 px-3 py-1 rounded-full transition-colors flex items-center gap-1 active:scale-95 cursor-pointer">
                                         <i className="ri-quill-pen-line"></i> Use this prompt
                                     </button>
                                  )}
                              </div>
                          </div>
                      ))}
                      {loadingChat && (
                          <div className="flex justify-start">
                              <div className="p-3 bg-zinc-700 rounded-2xl rounded-bl-none">
                                  <i className="ri-loader-4-line animate-spin text-gray-400 block"></i>
                              </div>
                          </div>
                      )}
                      <div ref={chatEndRef} />
                  </div>

                  <form onSubmit={handleChatSubmit} className="relative mt-auto">
                      <input 
                          type="text" 
                          value={chatInput} 
                          onChange={(e) => setChatInput(e.target.value)} 
                          placeholder="Ask for an idea..." 
                          className="w-full bg-zinc-900 text-white rounded-full py-2.5 pl-4 pr-10 text-sm border border-zinc-600 focus:outline-none focus:border-blue-500"
                      />
                      <button type="submit" disabled={loadingChat || !chatInput.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 rounded-full text-white transition-colors cursor-pointer">
                          <i className="ri-send-plane-fill text-xs"></i>
                      </button>
                  </form>
              </div>

              {/* Right: Form Details */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1 ml-1">Title</label>
                      <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-zinc-800 text-white px-4 py-3 rounded-xl border border-zinc-700 focus:outline-none focus:border-blue-500 transition-all text-lg font-medium placeholder-zinc-500" type="text" placeholder="Add a title" />
                  </div>
                  
                  <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1 ml-1">Description</label>
                      <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-zinc-800 text-white px-4 py-3 rounded-xl border border-zinc-700 focus:outline-none focus:border-blue-500 transition-all min-h-[150px] resize-none placeholder-zinc-500" placeholder="Tell everyone what your Pin is about"></textarea>
                  </div>
                  
                  <button type="submit" disabled={saving || (!file && !aiUrl)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-full w-full transition-transform active:scale-95 shadow-lg mt-4 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                      {saving ? <><i className="ri-loader-4-line animate-spin inline-block mr-2"></i> Saving...</> : 'Save Pin'}
                  </button>
              </form>
          </div>
      </div>
    </div>
  );
}
