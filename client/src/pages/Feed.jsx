import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Feed() {
  const [data, setData] = useState({ posts: [], fallbacks: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [likedIds, setLikedIds] = useState(new Set());
  const [likeCounts, setLikeCounts] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await axios.get('/feed');
        if (res.data.success) {
          setData({ posts: res.data.posts, fallbacks: res.data.fallbacks, user: res.data.user });
          // Initialize liked state from DB
          setLikedIds(new Set(res.data.likedPostIds || []));
          // Initialize counts from post data
          const counts = {};
          (res.data.posts || []).forEach(p => { counts[p._id] = p.likesCount || 0; });
          setLikeCounts(counts);
        }
      } catch (err) {
        if (err.response?.status === 401) navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, [navigate]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const q = typeof searchQuery === 'string' ? searchQuery.trim() : '';
        const res = await axios.get(q ? `/feed?q=${encodeURIComponent(q)}` : '/feed');
        if (res.data.success) setData({ posts: res.data.posts, fallbacks: res.data.fallbacks, user: res.data.user });
      } catch(err) { console.error(err); }
      finally { setLoading(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const q = typeof searchQuery === 'string' ? searchQuery.trim() : '';
      const res = await axios.get(q ? `/feed?q=${encodeURIComponent(q)}` : '/feed');
      if (res.data.success) setData({ posts: res.data.posts, fallbacks: res.data.fallbacks, user: res.data.user });
    } catch(err) { console.error(err); }
    finally { setLoading(false); }
  };

  const { posts, fallbacks, user } = data;

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

  // Top row: Like (left) | Save (right) — Share removed
  const CardOverlay = ({ id, imageUrl, title, saveButton, isRealPost = false }) => (
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

      {/* Search */}
      <div className="w-full max-w-3xl mx-auto mb-8 sticky top-20 z-40">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full group">
          <i className="ri-search-line absolute left-6 text-2xl text-gray-400 group-focus-within:text-red-500 transition-colors"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for Inspiration, Decor, Ideas..."
            className="w-full bg-white/90 backdrop-blur-xl text-gray-900 border border-gray-200 rounded-full py-5 pl-16 pr-6 outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-400 focus:bg-white text-xl font-medium transition-all shadow-xl hover:shadow-2xl"
          />
          <button type="submit" className="hidden">Search</button>
        </form>
      </div>

      {loading && (
        <div className="w-full flex justify-center mb-6">
          <i className="ri-loader-4-line text-4xl animate-spin text-red-500"></i>
        </div>
      )}

      {posts.length === 0 ? (
        searchQuery ? (
          <div className="w-full flex flex-col items-center justify-center min-h-[400px]">
            <i className="ri-search-eye-line text-6xl text-gray-300 mb-4"></i>
            <h2 className="text-2xl font-bold text-gray-800">No matching pins found</h2>
            <p className="text-gray-500 mt-2">Try searching for a different aesthetic or keyword!</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Inspiration for you</h2>
              <p className="text-gray-500 font-medium">Discover new ideas — like and share what inspires you</p>
            </div>
            <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4">
              {fallbacks.map((fallbackUrl, idx) => {
                const id = `fallback-${idx}`;
                return (
                  <div key={idx} className="break-inside-avoid mb-4 relative group rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300">
                    <img src={fallbackUrl} className="w-full object-cover rounded-2xl group-hover:brightness-75 transition-all duration-300" loading="lazy" alt={`Inspiration ${idx + 1}`} />
                    <CardOverlay
                      id={id}
                      imageUrl={fallbackUrl}
                      title="Check this pin on Inspira!"
                      saveButton={
                        <button className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-4 rounded-full shadow-lg transition-transform active:scale-95 cursor-pointer">
                          Save
                        </button>
                      }
                    />
                  </div>
                );
              })}
            </div>
          </>
        )
      ) : (
        <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4">
          {posts.map((elem, idx) => {
            const imageUrl = `http://localhost:3000/images/uploads/${elem.image}`;
            return (
              <div key={elem._id || idx} className="break-inside-avoid mb-4">
                <div className="relative group rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300">
                  <img src={imageUrl} className="w-full object-cover rounded-2xl group-hover:brightness-75 transition-all duration-300" loading="lazy" alt={elem.title} />
                  <CardOverlay
                    id={elem._id}
                    imageUrl={imageUrl}
                    title={elem.title}
                    isRealPost={true}
                    saveButton={
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSave(elem._id); }}
                        className={`${user?.savedPosts?.includes(elem._id) ? 'bg-black text-white' : 'bg-red-600 hover:bg-red-700 text-white'} text-sm font-bold py-2 px-4 rounded-full shadow-lg transition-transform active:scale-95 cursor-pointer`}
                      >
                        {user?.savedPosts?.includes(elem._id) ? 'Saved' : 'Save'}
                      </button>
                    }
                  />
                  {/* Author — clickable to view their profile */}
                  <div className="absolute inset-x-0 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-3 pb-10 pointer-events-none">
                    {elem.user?.username && (
                      <div
                        className="flex items-center gap-2 backdrop-blur-md bg-white/20 p-2 rounded-xl cursor-pointer pointer-events-auto hover:bg-white/30 transition-colors"
                        onClick={(e) => { e.stopPropagation(); navigate(`/user/${elem.user.username}`); }}
                      >
                        <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 border border-white/50">
                          {elem.user?.profileImage ? (
                            <img src={`http://localhost:3000/images/uploads/${elem.user.profileImage}`} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">{elem.user.username.charAt(0).toUpperCase()}</div>
                          )}
                        </div>
                        <p className="text-xs font-medium text-white truncate max-w-[100px]">@{elem.user.username}</p>
                        <i className="ri-arrow-right-s-line text-white/70 text-xs ml-auto"></i>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-2 mb-6 px-1">
                  <h5 className="text-sm font-semibold text-gray-900 truncate leading-tight">{elem.title}</h5>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
