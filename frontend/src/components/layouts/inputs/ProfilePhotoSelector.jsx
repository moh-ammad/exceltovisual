import React, { useRef, useState, useEffect } from 'react';
import { Upload, Trash2, User } from 'lucide-react';

const ProfilePhotoSelector = ({ profilePic, setProfilePic }) => {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (typeof profilePic === 'string') {
      setPreviewUrl(profilePic); // URL string (already uploaded)
    } else if (profilePic) {
      const objectUrl = URL.createObjectURL(profilePic);
      setPreviewUrl(objectUrl);

      return () => URL.revokeObjectURL(objectUrl); // cleanup on unmount or change
    } else {
      setPreviewUrl(null);
    }
  }, [profilePic]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setProfilePic(file);
    }
  };

  const handleRemoveImage = () => {
    setProfilePic(null);
    setPreviewUrl(null);
  };

  const onFileChoose = () => {
    inputRef.current?.click();
  };

  return (
    <div className="relative w-30 h-30 rounded-full overflow-hidden flex items-center justify-center bg-blue-100/50  my-4 border border-gray-300">
      {previewUrl ? (
        <>
          <img
            src={previewUrl}
            alt="Profile Preview"
            className="object-cover w-full h-full"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute bottom-2 right-5 bg-red-600 text-white p-2 rounded-full shadow-md hover:bg-red-700 z-10"
            style={{ width: 32, height: 32 }}
            aria-label="Remove profile picture"
          >
            <Trash2 size={16} />
          </button>
        </>
      ) : (
        <>
          {/* User Icon as placeholder */}
          <User size={56} className="text-gray-400 mb-3" />
          <button
            type="button"
            onClick={onFileChoose}
            className="absolute h-8 w-8 bottom-2 right-5 bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-blue-700 z-10"
            aria-label="Upload profile picture"
          >
            <Upload size={16} />
          </button>
        </>
      )}

      <input
        type="file"
        name='image'
        accept="image/*"
        ref={inputRef}
        onChange={handleImageChange}
        className="hidden"
      />
    </div>
  );
};

export default ProfilePhotoSelector;
