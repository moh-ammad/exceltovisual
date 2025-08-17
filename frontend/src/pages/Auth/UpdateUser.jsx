import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Input, Select } from "@/components/layouts/inputs/Input";
import ProfilePhotoSelector from "@/components/layouts/inputs/ProfilePhotoSelector";
import {
  validateEmail,
  validatePassword,
  showError,
  showSuccess,
} from "@/utils/helper";
import axiosInstance from "@/utils/axiosInstance";
import { API_ENDPOINTS } from "@/utils/apisPaths";

const UpdateUser = () => {
  const { userId } = useParams(); // get userId if admin editing other user
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "member",
    adminKey: "",
  });
  const [profilePic, setProfilePic] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isAdminEditing = Boolean(userId);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        let data;
        if (isAdminEditing) {
          // Admin editing user: fetch user by id
          const res = await axiosInstance.get(API_ENDPOINTS.USERS.GET_USER_BY_ID(userId));
          data = res.data;
        } else {
          // User updating self: fetch own profile
          const res = await axiosInstance.get(API_ENDPOINTS.AUTH.GET_PROFILE);
          data = res.data;
        }

        setFormData({
          fullName: data.name || "",
          email: data.email || "",
          password: "",
          role: data.role || "member",
          adminKey: "",
        });
        setExistingImageUrl(data.profileImageUrl || null);
      } catch (error) {
        showError("Failed to load profile");
      }
    };
    fetchProfile();
  }, [userId, isAdminEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required.";
    if (!validateEmail(formData.email)) newErrors.email = "Invalid email address.";
    if (formData.password && !validatePassword(formData.password)) {
      newErrors.password = "Password must be at least 6 characters.";
    }
    // Only require adminKey if role is admin and current user is updating self
    // If admin is editing another user, no need to enter adminKey here
    if (!isAdminEditing && formData.role === "admin" && !formData.adminKey.trim()) {
      newErrors.adminKey = "Admin key is required.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.fullName);
      formDataToSend.append("email", formData.email);
      if (formData.password) formDataToSend.append("password", formData.password);
      formDataToSend.append("role", formData.role);

      // Only append adminKey if user updating own profile
      if (!isAdminEditing && formData.role === "admin") {
        formDataToSend.append("adminKey", formData.adminKey);
      }

      if (profilePic) formDataToSend.append("image", profilePic);
      else if (existingImageUrl === null) formDataToSend.append("image", "");

      if (isAdminEditing) {
        // Admin updating another user
        await axiosInstance.put(API_ENDPOINTS.USERS.UPDATE_USER(userId), formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccess("User updated successfully!");
        navigate("/admin/users");
      } else {
        // User updating self
        await axiosInstance.put(API_ENDPOINTS.AUTH.UPDATE_PROFILE, formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccess("Profile updated successfully!");
        navigate("/profile");
      }
    } catch (err) {
      showError(err?.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white dark:bg-gray-900 shadow-lg rounded-xl">
      <h2 className="text-2xl font-bold mb-6 dark:text-white">
        {isAdminEditing ? "Update User Profile" : "Update Your Profile"}
      </h2>

      <form onSubmit={handleUpdate} encType="multipart/form-data" noValidate>
        <div className="flex justify-center mb-6">
          <ProfilePhotoSelector
            profilePic={profilePic}
            setProfilePic={setProfilePic}
            existingImageUrl={existingImageUrl}
            clearExistingImage={() => setExistingImageUrl(null)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Full Name"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            error={errors.fullName}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
          />
          <Input
            label="New Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Leave empty to keep current password"
            error={errors.password}
          />
          <Select
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            options={[
              { value: "member", label: "Member" },
              { value: "admin", label: "Admin" },
            ]}
            error={errors.role}
            disabled={!isAdminEditing} // Only admin can change role when editing other users
          />
          {/* Show adminKey only if user updating self and role=admin */}
          {!isAdminEditing && formData.role === "admin" && (
            <div className="md:col-span-2">
              <Input
                label="Admin Key"
                name="adminKey"
                type="password"
                value={formData.adminKey}
                onChange={handleChange}
                error={errors.adminKey}
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full mt-8 disabled:opacity-50"
        >
          {loading ? (isAdminEditing ? "Updating User..." : "Updating...") : (isAdminEditing ? "Update User" : "Update Profile")}
        </button>
      </form>
    </div>
  );
};

export default UpdateUser;
