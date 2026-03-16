import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL } from '../config';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('saved');
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({ fullname: '', email: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('/profile');
        if (res.data.success) setUser(res.data.user);
      } catch (err) {
        if (err.response?.status === 401) navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await axios.post('/uploadfile', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) setUser(res.data.user);
    } catch (err) { console.error('Failed to upload image', err); }
  };

  const handleUnsave = async (postId) => {
    setUser(prev => ({ ...prev, savedPosts: prev.savedPosts.filter(p => p._id !== postId) }));
    try {
      await axios.post(`/save/${postId}`);
    } catch (err) {
      console.error('Failed to unsave', err);
      const res = await axios.get('/profile');
      if (res.data.success) setUser(res.data.user);
    }
  };

  const handleShare = async (post) => {
    const imageUrl = post.image?.startsWith('http') ? post.image : `${BACKEND_URL}/images/uploads/${post.image}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title || 'Inspira Pin', text: `Check out this pin on Inspira!`, url: imageUrl });
      } else {
        await navigator.clipboard.writeText(imageUrl);
        alert('🔗 Link copied to clipboard!');
      }
    } catch { try { await navigator.clipboard.writeText(imageUrl); alert('🔗 Copied!'); } catch {} }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this pin permanently? This cannot be undone.')) return;
    // Optimistic remove
    setUser(prev => ({ ...prev, posts: prev.posts.filter(p => p._id !== postId) }));
    try {
      await axios.delete(`/post/${postId}`);
    } catch (err) {
      console.error('Failed to delete', err);
      // Restore on failure
      const res = await axios.get('/profile');
      if (res.data.success) setUser(res.data.user);
    }
  };

  const openEdit = () => {
    setEditData({ fullname: user?.fullname || '', email: user?.email || '' });
    setEditError('');
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    setEditSaving(true);
    setEditError('');
    try {
      const res = await axios.post('/profile/edit', editData);
      if (res.data.success) {
        setUser(prev => ({ ...prev, ...res.data.user }));
        setEditOpen(false);
      }
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to save changes.');
    } finally {
      setEditSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading profile...</div>;
  if (!user) return null;

  return (
    <div className="bg-gray-50 min-h-screen font-sans">

      {/* Edit Profile Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
              <button onClick={() => setEditOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer">
                <i className="ri-close-line text-gray-500 text-lg"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editData.fullname}
                  onChange={e => setEditData(d => ({ ...d, fullname: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editData.email}
                  onChange={e => setEditData(d => ({ ...d, email: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={user.username}
                  disabled
                  className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">Username cannot be changed</p>
              </div>
            </div>

            {editError && <p className="mt-3 text-sm text-red-500 font-medium">{editError}</p>}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditOpen(false)}
                className="flex-1 py-2.5 rounded-full border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={editSaving}
                className="flex-1 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-md transition cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {editSaving && <i className="ri-loader-4-line animate-spin"></i>}
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="w-full bg-white border-b border-gray-200 pt-12 pb-8">
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          
          <div className="max-w-4xl mx-auto flex flex-col items-center">
              <div className="relative group cursor-pointer mb-4" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-32 h-32 md:w-40 md:h-40 bg-gray-200 rounded-full overflow-hidden shadow-md border-4 border-white">
                      {user.profileImage ? (
                          <img 
                            src={user.profileImage.startsWith('http') ? user.profileImage : `${BACKEND_URL}/images/uploads/${user.profileImage}`} 
                            className="w-full h-full object-cover" 
                            alt="Profile"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center bg-blue-500 text-white text-4xl font-bold">
                                  ${user.username?.charAt(0).toUpperCase()}
                                </div>
                              `;
                            }}
                          />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-4xl font-bold">
                              {user.username?.charAt(0).toUpperCase()}
                          </div>
                      )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <i className="ri-camera-fill text-white text-2xl"></i>
                  </div>
                  <div className="absolute bottom-1 right-1 w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white border-4 border-white shadow-sm cursor-pointer hover:bg-gray-800 transition-colors z-10">
                      <i className="ri-pencil-fill"></i>
                  </div>
              </div>
             
              <h1 className="text-3xl font-bold text-gray-900">{user.fullname}</h1>
              <h3 className="text-gray-500 font-medium mt-1">@{user.username}</h3>
              {user.email && <p className="text-gray-400 text-sm mt-1">{user.email}</p>}
              
              <div className="flex gap-3 mt-6">
                  <button onClick={openEdit} className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-full text-sm font-semibold text-gray-800 transition-colors cursor-pointer">Edit Profile</button>
                  <Link to="/add" className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-semibold shadow-md transition-colors">Create Pin</Link>
                  <button onClick={() => { axios.get('/logout').then(() => navigate('/home')) }} className="px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-full text-sm font-semibold shadow-sm transition-colors cursor-pointer">Logout</button>
              </div>
          </div>
      </div>

      {/* Tabs + Grid */}
      <main className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 py-8">
          <div className="flex justify-center mb-8">
              <div className="flex space-x-8 border-b border-gray-200">
                  <button onClick={() => setActiveTab('saved')} className={`pb-3 border-b-2 ${activeTab === 'saved' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500'} font-semibold px-2 transition-colors cursor-pointer`}>Saved</button>
                  <button onClick={() => setActiveTab('created')} className={`pb-3 border-b-2 ${activeTab === 'created' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500'} font-semibold px-2 transition-colors cursor-pointer`}>Created</button>
              </div>
          </div>

          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4">
              {activeTab === 'saved' && (
                  user?.savedPosts?.length > 0 ? (
                      user.savedPosts.map((post) => (
                          <div key={post._id} className="break-inside-avoid mb-4 relative group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                              <img src={post.image?.startsWith('http') ? post.image : `${BACKEND_URL}/images/uploads/${post.image}`} className="w-full h-auto rounded-2xl group-hover:brightness-75 transition-all duration-300" alt={post.title} />
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                                  <div className="flex items-center justify-end gap-2">
                                      <button
                                          onClick={() => handleShare(post)}
                                          className="bg-white/95 hover:bg-white text-gray-700 text-xs font-bold py-2 px-3 rounded-full shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center gap-1"
                                      >
                                          <i className="ri-share-forward-line text-sm"></i>
                                          Share
                                      </button>
                                      <button
                                          onClick={() => handleUnsave(post._id)}
                                          className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-3 rounded-full shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center gap-1"
                                      >
                                          <i className="ri-bookmark-fill text-sm"></i>
                                          Unsave
                                      </button>
                                  </div>
                                  <div className="px-1">
                                      <p className="text-white text-xs font-semibold truncate drop-shadow">{post.title}</p>
                                  </div>
                              </div>
                          </div>
                      ))
                  ) : (
                      <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
                          <i className="ri-bookmark-line text-5xl mb-3 text-gray-300"></i>
                          <p className="font-medium">You haven't saved any Pins yet</p>
                          <Link to="/feed" className="mt-4 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-full font-bold transition-colors">Find Ideas</Link>
                      </div>
                  )
              )}

              {activeTab === 'created' && (
                  user?.posts?.length > 0 ? (
                      user.posts.map((post) => (
                          <div key={post._id} className="break-inside-avoid mb-4 relative group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                              <img src={post.image?.startsWith('http') ? post.image : `${BACKEND_URL}/images/uploads/${post.image}`} className="w-full h-auto rounded-2xl group-hover:brightness-75 transition-all duration-300" alt={post.title} />
                              {/* Delete overlay */}
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                                  <div className="flex justify-end">
                                      <button
                                          onClick={() => handleDelete(post._id)}
                                          className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-3 rounded-full shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center gap-1"
                                      >
                                          <i className="ri-delete-bin-line text-sm"></i>
                                          Delete
                                      </button>
                                  </div>
                                  {post.title && (
                                      <div className="px-1">
                                          <p className="text-white text-xs font-semibold truncate drop-shadow">{post.title}</p>
                                      </div>
                                  )}
                              </div>
                          </div>
                      ))
                  ) : (
                      <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
                          <i className="ri-add-line text-5xl mb-3 text-gray-300"></i>
                          <p className="font-medium">Nothing to show...yet! Pins you create will live here.</p>
                          <Link to="/add" className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold transition-colors">Create Pin</Link>
                      </div>
                  )
              )}
          </div>
      </main>
    </div>
  );
}
