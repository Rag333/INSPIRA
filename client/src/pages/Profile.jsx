import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('saved'); // 'saved' or 'created'
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('/profile');
        if (res.data.success) {
          setUser(res.data.user);
        }
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/login');
        }
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
      const res = await axios.post('/uploadfile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setUser(res.data.user);
      }
    } catch (err) {
      console.error("Failed to upload image", err);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading profile...</div>;
  }

  if (!user) return null;

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      {/* Profile Header */}
      <div className="w-full bg-white border-b border-gray-200 pt-12 pb-8">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
          
          <div className="max-w-4xl mx-auto flex flex-col items-center">
              <div 
                className="relative group cursor-pointer mb-4" 
                onClick={() => fileInputRef.current?.click()}
              >
                  <div className="w-32 h-32 md:w-40 md:h-40 bg-gray-200 rounded-full overflow-hidden shadow-md border-4 border-white">
                      {user.profileImage ? (
                          <img src={`http://localhost:3000/images/uploads/${user.profileImage}`} className="w-full h-full object-cover" alt="Profile" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-4xl font-bold">
                              {user.username?.charAt(0).toUpperCase()}
                          </div>
                      )}
                  </div>
                  {/* Hover Overlay for Edit */}
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <i className="ri-camera-fill text-white text-2xl"></i>
                  </div>
                  <div className="absolute bottom-1 right-1 w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white border-4 border-white shadow-sm cursor-pointer hover:bg-gray-800 transition-colors z-10">
                      <i className="ri-pencil-fill"></i>
                  </div>
              </div>
             
              <h1 className="text-3xl font-bold text-gray-900">{user.fullname}</h1>
              <h3 className="text-gray-500 font-medium mt-1">@{user.username}</h3>
              
              <div className="flex gap-3 mt-6">
                  <button className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-full text-sm font-semibold text-gray-800 transition-colors">Edit Profile</button>
                  <Link to="/add" className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-semibold shadow-md transition-colors">Create Pin</Link>
                  <button onClick={() => { axios.get('/logout').then(() => navigate('/home')) }} className="px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-full text-sm font-semibold shadow-sm transition-colors">Logout</button>
              </div>
          </div>
      </div>

      {/* Boards / Folders Section */}
      <main className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 py-8">
          <div className="flex justify-center mb-8">
              <div className="flex space-x-8 border-b border-gray-200">
                  <button onClick={() => setActiveTab('saved')} className={`pb-3 border-b-2 ${activeTab === 'saved' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500'} font-semibold px-2 transition-colors`}>Saved</button>
                  <button onClick={() => setActiveTab('created')} className={`pb-3 border-b-2 ${activeTab === 'created' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500'} font-semibold px-2 transition-colors`}>Created</button>
              </div>
          </div>

          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4 space-y-4">
              {activeTab === 'saved' && (
                  user?.savedPosts?.length > 0 ? (
                      user.savedPosts.map((post) => (
                          <div key={post._id} className="break-inside-avoid relative group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                              <img src={`http://localhost:3000/images/uploads/${post.image}`} className="w-full object-cover rounded-2xl" alt={post.title} />
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
                          <div key={post._id} className="break-inside-avoid relative group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                              <img src={`http://localhost:3000/images/uploads/${post.image}`} className="w-full object-cover rounded-2xl" alt={post.title} />
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
