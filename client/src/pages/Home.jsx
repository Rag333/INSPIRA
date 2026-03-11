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
      // Use standard lightweight thumbnails to prevent DOM overwhelming
      const res = await axios.get(`https://picsum.photos/v2/list?page=${pageNumber}&limit=20`);
      
      const fastImages = res.data.map((img, index) => {
          // Pre-compute basic standard aspect ratios (tall vs square) instead of true random bounds
          // So the masonry grid locks in firmly without jumping
          const isTall = index % 3 === 0;
          return {
             id: img.id,
             url: `https://picsum.photos/id/${img.id}/400/${isTall ? '600' : '400'}`,
             author: img.author
          }
      });
      setImages(prev => [...prev, ...fastImages]);
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
