import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Feed() {
  const [data, setData] = useState({ posts: [], fallbacks: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeed = async (query = '') => {
      try {
        const url = query ? `/feed?q=${encodeURIComponent(query)}` : '/feed';
        const res = await axios.get(url);
        if (res.data.success) {
          setData({ 
            posts: res.data.posts, 
            fallbacks: res.data.fallbacks,
            user: res.data.user // need user to track saved items
          });
        }
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    
    // Initial fetch
    fetchFeed();
  }, [navigate]);

  // Debounced Auto-Search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      try {
        setLoading(true);
        // Specifically check if it's not undefined to avoid null API errors
        const queryRaw = typeof searchQuery === 'string' ? searchQuery.trim() : '';
        const url = queryRaw ? `/feed?q=${encodeURIComponent(queryRaw)}` : '/feed';
        const res = await axios.get(url);
        if (res.data.success) {
          setData({ 
            posts: res.data.posts, 
            fallbacks: res.data.fallbacks,
            user: res.data.user
          });
        }
      } catch(err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 400); // 400ms typing delay before auto-fetching

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const queryRaw = typeof searchQuery === 'string' ? searchQuery.trim() : '';
      const url = queryRaw ? `/feed?q=${encodeURIComponent(queryRaw)}` : '/feed';
      const res = await axios.get(url);
      if (res.data.success) {
        setData({ 
          posts: res.data.posts, 
          fallbacks: res.data.fallbacks,
          user: res.data.user
        });
      }
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // The old block caused the entire page (including the search bar) to unmount, breaking typing!
  // if (loading) {
  //   return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading your feed...</div>;
  // }

  const { posts, fallbacks, user } = data;

  const handleSave = async (postId) => {
    try {
      const res = await axios.post(`/save/${postId}`);
      if (res.data.success) {
        setData(prev => ({ ...prev, user: res.data.user }));
      }
    } catch(err) {
      console.error('Failed to save', err);
    }
  };

  return (
    <main className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 py-6 font-sans">
      
      {/* Search Header */}
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
      
      {/* Inline Loading Indicator */}
      {loading && (
          <div className="w-full flex justify-center mb-6">
              <i className="ri-loader-4-line text-4xl animate-spin text-red-500"></i>
          </div>
      )}

      {posts.length === 0 ? (
        <>
          <div className="mb-6 flex items-center justify-between">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Inspiration for you</h2>
                <p className="text-gray-500 font-medium">Discover new ideas and save them</p>
            </div>
          </div>
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4">
            {fallbacks.map((fallbackUrl, idx) => (
              <div key={idx} className="break-inside-avoid mb-4 relative group rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300">
                <img src={fallbackUrl} className="w-full object-cover rounded-2xl group-hover:brightness-75 transition-all duration-300" onLoad={(e) => e.target.classList.add('loaded')} loading="lazy" alt={`Inspiration idea ${idx + 1}`} />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 bg-black/20">
                    <div className="flex justify-end">
                        <button className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-4 rounded-full shadow-lg transition-transform active:scale-95">Save</button>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4">
          {posts.map((elem, idx) => (
            <div key={elem._id || idx}>
            <div key={elem._id || idx} className="break-inside-avoid mb-4">
              <div className="relative group rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300">
                <img src={`http://localhost:3000/images/uploads/${elem.image}`} className="w-full object-cover rounded-2xl group-hover:brightness-75 transition-all duration-300" onLoad={(e) => e.target.classList.add('loaded')} loading="lazy" alt={elem.title} />
                
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 bg-black/20">
                    <div className="flex justify-end">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleSave(elem._id); }}
                          className={`${user?.savedPosts?.includes(elem._id) ? 'bg-black text-white' : 'bg-red-600 hover:bg-red-700 text-white'} text-sm font-bold py-2 px-4 rounded-full shadow-lg transition-transform active:scale-95`}
                        >
                          {user?.savedPosts?.includes(elem._id) ? 'Saved' : 'Save'}
                        </button>
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto backdrop-blur-md bg-white/20 p-2 rounded-xl">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 border border-white/50">
                                {elem.user?.profileImage ? (
                                    <img src={`http://localhost:3000/images/uploads/${elem.user.profileImage}`} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">{elem.user?.username?.charAt(0).toUpperCase()}</div>
                                )}
                            </div>
                            <p className="text-xs font-medium text-white shadow-sm truncate max-w-[100px]">{elem.user?.username}</p>
                        </div>
                    </div>
                </div>
              </div>
              <div className="mt-2 mb-6 px-1">
                  <h5 className="text-sm font-semibold text-gray-900 truncate leading-tight">{elem.title}</h5>
              </div>
            </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
