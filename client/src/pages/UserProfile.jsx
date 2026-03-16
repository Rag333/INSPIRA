import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL } from '../config';

export default function UserProfile() {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!username || username === 'undefined') {
      setError('Invalid user.');
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const res = await axios.get(`/user/${username}`);
        if (res.data.success) {
          setUser(res.data.user);
        } else {
          setError(res.data.message || 'User not found.');
        }
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          setError(err.response?.data?.message || 'Could not load profile.');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [username, navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <i className="ri-loader-4-line text-4xl animate-spin text-red-500"></i>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-gray-400 gap-4">
      <i className="ri-user-unfollow-line text-5xl text-gray-200"></i>
      <p className="font-medium">{error}</p>
      <button onClick={() => navigate(-1)} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-semibold text-gray-700 cursor-pointer transition-colors">
        ← Go back
      </button>
    </div>
  );

  if (!user) return null;

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      {/* Header */}
      <div className="w-full bg-white border-b border-gray-200 pt-12 pb-8">
        <div className="max-w-3xl mx-auto flex flex-col items-center px-4">
          <button
            onClick={() => navigate(-1)}
            className="self-start mb-6 flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <i className="ri-arrow-left-line text-base"></i> Back
          </button>

          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden bg-gray-200 shadow-md border-4 border-white mb-4">
            {user.profileImage ? (
              <img
                src={user.profileImage?.startsWith('http') ? user.profileImage : `${BACKEND_URL}/images/uploads/${user.profileImage}`}
                className="w-full h-full object-cover"
                alt={user.username}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `
                    <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-400 to-pink-500 text-white text-4xl font-bold">
                      ${user.username ? user.username.charAt(0).toUpperCase() : '?'}
                    </div>
                  `;
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-400 to-pink-500 text-white text-4xl font-bold">
                {user.username?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900">{user.fullname || user.username}</h1>
          <p className="text-gray-400 text-sm mt-1">@{user.username}</p>
          <p className="mt-3 text-sm font-semibold text-gray-500 bg-gray-100 px-4 py-1 rounded-full">
            {user.posts?.length || 0} {user.posts?.length === 1 ? 'Pin' : 'Pins'}
          </p>
        </div>
      </div>

      {/* Posts grid */}
      <main className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 py-8">
        {user.posts?.length > 0 ? (
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4">
            {user.posts.map((post) => (
              <div key={post._id} className="break-inside-avoid mb-4 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 bg-gray-200">
                <img
                  src={post.image?.startsWith('http') ? post.image : `${BACKEND_URL}/images/uploads/${post.image}`}
                  className="w-full h-auto rounded-2xl"
                  alt={post.title || ''}
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&q=80";
                  }}
                />
                {post.title && (
                  <div className="p-2 px-3">
                    <p className="text-xs font-semibold text-gray-800 truncate">{post.title}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <i className="ri-image-line text-5xl mb-3 text-gray-200"></i>
            <p className="font-medium">@{username} hasn't created any pins yet</p>
          </div>
        )}
      </main>
    </div>
  );
}
