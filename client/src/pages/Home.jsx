import { useState, useEffect, useRef, useCallback } from 'react';
import ThreeBackground from '../components/ThreeBackground';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const themes = [
  "Interior Design", "Luxe Interiors", "Japandi Style", "Minimalist Haven", "Cozy Living",
  "Boho Chic", "Urban Loft", "Nordic Space", "Mountain Vista", "Alpine Peaks",
  "Misty Forest", "Ocean Waves", "Desert Dunes", "Golden Hour", "Wildflower Field",
  "City Skyline", "Urban Glow", "Tokyo Lights", "Glass Tower", "Gourmet Plate",
  "Healthy Bowl", "Coffee Ritual", "Pizza Night", "Street Style", "Runway Mood",
  "Vintage Lookbook", "Boho Fashion", "Dark Aesthetic", "Paris Dreams", "Santorini Vibes",
  "Bali Escape", "Beach Bliss", "Amalfi Coast", "Kyoto Garden", "Venice Canals",
  "Color Theory", "Abstract Strokes", "Pop Art Mood", "Neon Palette", "Gym Life",
  "Yoga Peace", "Sunrise Run", "Dev Desk", "Minimal Setup", "Gaming Setup",
  "Puppy Love", "Cat Nap", "Wildlife Gaze", "Plant Parent", "Succulent Garden",
  "Tropical Leaf", "Monstera Love", "Starry Night", "Aurora Borealis", "Milky Way",
  "Concert Energy", "Vinyl Records", "Guitar Solo", "Festival Glow", "Books & Coffee",
  "Morning Spread", "Study Aesthetic", "Reading Nook", "Dark Academia", "Warm Scandi",
  "Industrial Vibe", "Terracotta Mood", "Flat Lay Goals", "Watercolor Sketch", "DIY Candles",
  "Fresh Herbs", "Botanical Print", "Purple Horizon", "Cloudy Drama", "Golden Dusk",
  "Cozy Knits", "Chic Layers", "Luxury Wear", "Casual Friday", "Tropical Vibes",
  "Geometric Play", "Pastel Art", "Ink Art", "Artisan Bread", "Table Setting",
  "Waffle Dreams", "Cake Art", "Sushi Art", "Açaí Bowl", "Healthy Living",
  "Night City", "Rainy Mood", "Foggy Morning", "Cherry Blossom", "Autumn Leaves",
  "Winter Silence", "Spring Fresh", "Summer Lazy", "Lofi Vibes", "Aesthetic Room",
];

// Generate 500 unique images using Picsum seed-based URLs (guaranteed unique, always load)
function buildImagePool() {
  const pool = [];
  for (let seed = 10; seed < 510; seed++) {
    const isTall = seed % 3 === 0;
    const theme = themes[seed % themes.length];
    pool.push({
      id: `picsum-${seed}`,
      url: `https://picsum.photos/seed/${seed}/400/${isTall ? 600 : 450}`,
      author: theme,
      tall: isTall,
    });
  }
  // Shuffle once
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

const IMAGE_POOL = buildImagePool();
const PAGE_SIZE = 40;

import { useAuth } from '../context/AuthContext';

export default function Home() {
  const [images, setImages] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [savingIds, setSavingIds] = useState(new Set()); // currently saving
  const [savedIds, setSavedIds]   = useState(new Set()); // already saved
  const observerRef = useRef();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  // Redirect to feed if already logged in
  useEffect(() => {
    if (user) navigate('/feed');
  }, [user, navigate]);

  const handleSave = async (imgObj) => {
    if (savingIds.has(imgObj.id) || savedIds.has(imgObj.id)) return;
    setSavingIds(prev => new Set(prev).add(imgObj.id));
    try {
      // Step 1: download + create a Post record from the external URL
      const createRes = await axios.post('/createpost/ai', {
        title: imgObj.author,
        description: imgObj.author,
        imageUrl: imgObj.url,
      });
      if (createRes.data.success) {
        // Step 2: save that post to the user's savedPosts
        const saveRes = await axios.post(`/save/${createRes.data.post._id}`);
        if (saveRes.data.success) {
           setUser(saveRes.data.user);
           setSavedIds(prev => new Set(prev).add(imgObj.id));
        }
      }
    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
      else alert('Could not save image. Please try again.');
    } finally {
      setSavingIds(prev => { const n = new Set(prev); n.delete(imgObj.id); return n; });
    }
  };

  const sentinelRef = useCallback(node => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        loadMore();
      }
    });
    if (node) observerRef.current.observe(node);
  }, [loadMore]);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Hero / Headline with 3D Background */}
      <div className="w-full flex flex-col items-center justify-center px-4 relative overflow-hidden"
        style={{ minHeight: '280px', background: '#ffffff' }}
      >
          <ThreeBackground />
          <div className="text-center max-w-3xl relative z-10 py-10">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 mb-3 animate-fade-in-up">
                Discover &amp; create
              </h1>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 animate-fade-in-up"
                style={{
                  animationDelay: '0.1s',
                  background: 'linear-gradient(90deg, #ef4444, #f97316, #a855f7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                your next obsession
              </h1>
              <p className="text-gray-400 text-base md:text-lg" style={{ animationDelay: '0.2s' }}>
                A universe of ideas, art &amp; aesthetics — all in one place.
              </p>
          </div>
      </div>

      {/* Main Content Grid */}
      <main className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 py-4 mb-20 font-sans">
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4">
              {images.map((imgObj, i) => (
                <div key={`${imgObj.id}-${i}`} className="break-inside-avoid mb-4 relative group rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 bg-gray-200">
                    <img 
                      src={imgObj.url} 
                      className="w-full block object-cover rounded-2xl group-hover:brightness-75 transition-all duration-500" 
                      loading="lazy" 
                      alt={imgObj.author}
                      style={{ aspectRatio: imgObj.tall ? '2/3' : '4/3' }}
                    />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 bg-black/20">
                        <div className="flex justify-end">
                            {savedIds.has(imgObj.id) ? (
                              <span className="bg-black text-white text-sm font-bold py-2 px-4 rounded-full shadow-lg flex items-center gap-1">
                                <i className="ri-checkbox-circle-fill text-green-400"></i> Saved
                              </span>
                            ) : savingIds.has(imgObj.id) ? (
                              <span className="bg-red-600 text-white text-sm font-bold py-2 px-4 rounded-full shadow-lg flex items-center gap-1">
                                <i className="ri-loader-4-line animate-spin"></i> Saving…
                              </span>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleSave(imgObj); }}
                                className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-4 rounded-full shadow-lg transition-transform active:scale-95 cursor-pointer"
                              >Save</button>
                            )}
                        </div>
                        <div className="mt-auto">
                            <p className="text-white text-xs font-medium tracking-wide drop-shadow-md truncate">{imgObj.author}</p>
                        </div>
                    </div>
                </div>
              ))}
          </div>

          {/* Infinite Scroll Sentinel */}
          <div ref={sentinelRef} className="w-full h-20 flex items-center justify-center mt-8">
              {loading && <i className="ri-loader-4-line text-4xl animate-spin text-gray-400"></i>}
          </div>
      </main>
    </div>
  )
}
