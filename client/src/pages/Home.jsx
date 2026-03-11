import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function Home() {
  const [images, setImages] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const observerRef = useRef();

  // --- Image Feed Logic ---
  const fetchImages = async (pageNumber) => {
    setLoading(true);
    try {
      const curatedDeck = [
        { id: `a-${pageNumber}`, url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&auto=format&fit=crop&q=80", author: "Sarah Modern", tall: true },
        { id: `b-${pageNumber}`, url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&auto=format&fit=crop&q=80", author: "Luxe Interiors", tall: false },
        { id: `c-${pageNumber}`, url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&auto=format&fit=crop&q=80", author: "Japandi Style", tall: true },
        { id: `d-${pageNumber}`, url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&auto=format&fit=crop&q=80", author: "Minimalist Haven", tall: false },
        { id: `e-${pageNumber}`, url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&auto=format&fit=crop&q=80", author: "Cozy Living", tall: false },
        { id: `f-${pageNumber}`, url: "https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=400&auto=format&fit=crop&q=80", author: "Boho Chic", tall: true },
        { id: `g-${pageNumber}`, url: "https://images.unsplash.com/photo-1618220179428-22790b46a0eb?w=400&auto=format&fit=crop&q=80", author: "Urban Loft", tall: false },
        { id: `h-${pageNumber}`, url: "https://images.unsplash.com/photo-1600607686527-6fb886090705?w=400&auto=format&fit=crop&q=80", author: "Nordic Space", tall: true },
        { id: `i-${pageNumber}`, url: "https://images.unsplash.com/photo-1615529182904-14819c35db37?w=400&auto=format&fit=crop&q=80", author: "Midcentury Retro", tall: false },
        { id: `j-${pageNumber}`, url: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=400&auto=format&fit=crop&q=80", author: "Studio Setup", tall: false },
        { id: `k-${pageNumber}`, url: "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=400&auto=format&fit=crop&q=80", author: "Modern Kitchen", tall: true },
        { id: `l-${pageNumber}`, url: "https://images.unsplash.com/photo-1615873968403-89e068629265?w=400&auto=format&fit=crop&q=80", author: "Dark Academia", tall: false },
        { id: `m-${pageNumber}`, url: "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=400&auto=format&fit=crop&q=80", author: "Warm Scandinavian", tall: true },
        { id: `n-${pageNumber}`, url: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=400&auto=format&fit=crop&q=80", author: "Industrial Vibe", tall: false },
        { id: `o-${pageNumber}`, url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&auto=format&fit=crop&q=80", author: "Pastel Dream", tall: true },
        { id: `p-${pageNumber}`, url: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=400&auto=format&fit=crop&q=80", author: "Vintage Room", tall: false },
      ];
      const shuffled = [...curatedDeck].sort(() => 0.5 - Math.random());
      setImages(prev => [...prev, ...shuffled]);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchImages(page);
  }, [page]);

  // Infinite Scroll Intersection Observer Node Callback
  const sentinelRef = useCallback(node => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setPage(prevPage => prevPage + 1);
      }
    });

    if (node) observerRef.current.observe(node);
  }, [loading]);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Hero / Headline */}
      <div className="w-full flex justify-center mt-12 mb-8 px-4">
          <div className="text-center max-w-2xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 animate-fade-in-up">Get your next</h1>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-red-500 mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>home decor idea</h1>
          </div>
      </div>

      {/* Main Content Grid */}
      <main className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 py-4 mb-20 font-sans">
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4">
              
              {images.map((imgObj, i) => (
                <div key={`${imgObj.id}-${i}`} className="break-inside-avoid mb-4 relative group rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 bg-gray-200 min-h-[200px]">
                    <img 
                      src={imgObj.url} 
                      className="w-full h-auto block object-cover rounded-2xl group-hover:brightness-75 transition-all duration-500" 
                      loading="lazy" 
                      alt={`Inspiration by ${imgObj.author}`} 
                    />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 bg-black/20">
                        <div className="flex justify-end">
                            <button className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-4 rounded-full shadow-lg transition-transform active:scale-95">Save</button>
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
