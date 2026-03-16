import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import Background3D from '../components/Background3D';
import { BACKEND_URL } from '../config';

export default function Feed() {
  const [data, setData] = useState({ posts: [], fallbacks: [] });
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [likedIds, setLikedIds] = useState(new Set());
  const [likeCounts, setLikeCounts] = useState({});
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100 } }
  };

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        if (!initialLoad) setLoading(true);
        const q = typeof searchQuery === 'string' ? searchQuery.trim() : '';
        const endpoint = q ? `/feed?q=${encodeURIComponent(q)}` : '/feed';
        const res = await axios.get(endpoint);
        
        if (res.data.success) {
          setData({ 
            posts: res.data.posts || [], 
            fallbacks: res.data.fallbacks || [], 
            user: res.data.user || null 
          });
          
          if (!q) {
             setLikedIds(new Set(res.data.likedPostIds || []));
          }
          const counts = {};
          (res.data.posts || []).forEach(p => { counts[p._id] = p.likesCount || 0; });
          setLikeCounts(prev => ({ ...prev, ...counts }));
        }
      } catch (err) {
        if (err.response?.status === 401) navigate('/login');
        console.error('Feed Fetch Error:', err);
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };

    // Debounce the search input
    const timer = setTimeout(() => {
        fetchFeed();
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, navigate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // The useEffect debounce will handle the actual fetch
  };

  const { posts = [], fallbacks = [], user } = data;

  const handleSave = async (postId) => {
    try {
      const res = await axios.post(`/save/${postId}`);
      if (res.data.success) setData(prev => ({ ...prev, user: res.data.user }));
    } catch(err) { console.error('Failed to save', err); }
  };

  const handleLike = (id, isRealPost = false) => {
    const alreadyLiked = likedIds.has(id);
    setLikedIds(prev => {
      const next = new Set(prev);
      alreadyLiked ? next.delete(id) : next.add(id);
      return next;
    });
    setLikeCounts(c => ({
      ...c,
      [id]: alreadyLiked ? Math.max(0, (c[id] || 1) - 1) : (c[id] || 0) + 1
    }));
    // Persist to backend for real posts — update count from server response
    if (isRealPost) {
      axios.post(`/like/${id}`)
        .then(res => {
          if (res.data.success) {
            setLikeCounts(c => ({ ...c, [id]: res.data.likesCount }));
          }
        })
        .catch(() => {});
    }
  };

  const handleShare = async (url, title = 'Check this out on Inspira!') => {
    const shareUrl = url || window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Inspira', text: title, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('🔗 Link copied to clipboard!');
      }
    } catch {
      try { await navigator.clipboard.writeText(shareUrl); alert('🔗 Link copied!'); } catch {}
    }
  };

  const renderCardOverlay = (id, saveButton, isRealPost = false) => (
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3 bg-gradient-to-b from-black/40 via-transparent to-black/40">
      {/* Top row: Like on left, Save on right */}
      <div className="flex items-center justify-between gap-2">
        {/* Like */}
        <button
          onClick={(e) => { e.stopPropagation(); handleLike(id, isRealPost); }}
          className="flex items-center gap-1 bg-white/95 hover:bg-white text-xs font-bold py-1.5 px-2.5 rounded-full shadow-lg transition-all active:scale-95 cursor-pointer"
        >
          <i className={`text-sm ${likedIds.has(id) ? 'ri-heart-fill text-red-500' : 'ri-heart-line text-gray-500'}`}></i>
          <span className={`tabular-nums ${likedIds.has(id) ? 'text-red-500' : 'text-gray-600'}`}>{likeCounts[id] ?? 0}</span>
        </button>

        {/* Save */}
        <div>{saveButton}</div>
      </div>
    </div>
  );

  return (
    <main className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 py-6 font-sans">
      <Background3D />

      {/* Search Panel */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="w-full max-w-4xl mx-auto mb-12 sticky top-24 z-40 px-4"
      >
        <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full group">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-orange-500/20 to-pink-500/20 rounded-full blur-xl group-focus-within:opacity-100 opacity-0 transition-opacity duration-500"></div>
          
          <div className="relative w-full flex items-center bg-white/60 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-full overflow-hidden transition-all duration-300 group-focus-within:bg-white/90 group-focus-within:shadow-[0_8px_32px_rgba(255,50,50,0.15)] group-focus-within:border-red-200">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
              className="absolute left-6 text-gray-400 group-focus-within:text-red-500 transition-colors z-10 flex cursor-pointer"
            >
              <i className="ri-search-2-line text-2xl"></i>
            </motion.div>
            
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Discover aesthetics, visionary concepts & endless creativity..."
              className="w-full bg-transparent text-gray-900 py-5 pl-16 pr-20 outline-none text-lg font-medium placeholder-gray-500/80 z-10"
            />

            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSearchQuery('')}
                type="button"
                className="absolute right-6 bg-gray-200 hover:bg-red-500 text-gray-600 hover:text-white rounded-full w-8 h-8 flex items-center justify-center transition-all duration-300 z-20 cursor-pointer"
              >
                <i className="ri-close-line text-lg"></i>
              </motion.button>
            )}
          </div>
          <button type="submit" className="hidden">Search</button>
        </form>
      </motion.div>

      <AnimatePresence>
      {loading && !initialLoad && (
        <motion.div 
          key="loader-spinner"
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          className="w-full flex justify-center overflow-hidden"
        >
          <i className="ri-loader-4-line text-4xl animate-spin text-red-500"></i>
        </motion.div>
      )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8 pl-2"
      >
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
          Explore
        </h2>
        <p className="text-gray-500 font-medium mt-1">
          Discover ideas and inspiration
        </p>
      </motion.div>

      {!initialLoad && (
        posts.length === 0 ? (
          searchQuery ? (
            <div className="w-full flex flex-col items-center justify-center min-h-[400px]">
              <i className="ri-search-eye-line text-6xl text-gray-300 mb-4"></i>
              <h2 className="text-2xl font-bold text-gray-800">No matching pins found</h2>
              <p className="text-gray-500 mt-2">Try searching for a different aesthetic or keyword!</p>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center justify-center min-h-[300px]">
              <i className="ri-compass-3-line text-6xl text-gray-300 mb-4"></i>
              <h2 className="text-2xl font-bold text-gray-800">Nothing here yet!</h2>
              <p className="text-gray-500 mt-2">Check back later for new inspiration.</p>
            </div>
          )
        ) : (
        <motion.div 
          className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {posts.map((elem, idx) => {
            const imageUrl = `${BACKEND_URL}/images/uploads/${elem.image}`;
            return (
              <motion.div key={elem._id || idx} variants={itemVariants} className="break-inside-avoid mb-4">
                <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.02} transitionSpeed={2000} className="relative group rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-300">
                  <img src={imageUrl} className="w-full object-cover rounded-2xl group-hover:scale-105 group-hover:brightness-75 transition-all duration-700" loading="lazy" alt={elem.title} />
                  {renderCardOverlay(
                    elem._id,
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSave(elem._id); }}
                      className={`${user?.savedPosts?.includes(elem._id) ? 'bg-black text-white' : 'bg-red-600 hover:bg-red-700 text-white'} text-sm font-bold py-2 px-4 rounded-full shadow-lg transition-transform active:scale-95 cursor-pointer`}
                    >
                      {user?.savedPosts?.includes(elem._id) ? 'Saved' : 'Save'}
                    </button>,
                    true
                  )}
                  {/* Author — Floating Profile Chip */}
                  <div className="absolute inset-x-0 bottom-0 opacity-0 group-hover:opacity-100 transition-all duration-300 px-3 pb-8 pointer-events-none translate-y-2 group-hover:translate-y-0">
                    {elem.user?.username && (
                      <div
                        className="flex items-center gap-3 bg-white/30 backdrop-blur-xl p-2.5 rounded-2xl cursor-pointer pointer-events-auto shadow-[0_8px_32px_rgba(0,0,0,0.15)] border border-white/20 hover:bg-white/40 transition-colors"
                        onClick={(e) => { e.stopPropagation(); navigate(`/user/${elem.user.username}`); }}
                      >
                        {/* Avatar Circle */}
                        <div className="relative w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center p-[2px] ring-2 ring-red-400/60 shadow-inner">
                          {elem.user?.profileImage ? (
                            <img src={`${BACKEND_URL}/images/uploads/${elem.user.profileImage}`} className="w-full h-full object-cover rounded-full" alt={elem.user.username} />
                          ) : (
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-sm font-extrabold shadow-sm">
                              {elem.user.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        
                        {/* User details */}
                        <div className="flex flex-col flex-1 overflow-hidden drop-shadow-md">
                          <p className="text-white font-bold text-sm truncate w-full leading-tight">
                            {elem.user.fullName || elem.user.username}
                          </p>
                          <p className="text-white/80 font-medium text-xs truncate w-full">
                            @{elem.user.username}
                          </p>
                        </div>
                        
                        <div className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center transition-colors">
                          <i className="ri-arrow-right-up-line text-white text-sm font-bold"></i>
                        </div>
                      </div>
                    )}
                  </div>
                </Tilt>
                <div className="mt-2 mb-6 px-1">
                  <h5 className="text-sm font-semibold text-gray-900 truncate leading-tight">{elem.title}</h5>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
        )
      )}
    </main>
  );
}
