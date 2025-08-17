import { useEffect, useState } from "react";
import { Input, Select } from "@/components/layouts/inputs/Input";
import ProfilePhotoSelector from "@/components/layouts/inputs/ProfilePhotoSelector";
import {
  validateEmail,
  validatePassword,
  showError,
  showSuccess,
} from "@/utils/helper";
import axiosInstance from "@/utils/axiosinstance";
import { API_ENDPOINTS } from "@/utils/apisPaths";
import { useNavigate } from "react-router-dom";

const UpdateUser = () => {
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

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axiosInstance.get(API_ENDPOINTS.AUTH.GET_PROFILE);
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
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required.";
    if (!validateEmail(formData.email)) newErrors.email = "Invalid email.";
    if (formData.password && !validatePassword(formData.password)) {
      newErrors.password = "Password must be at least 6 characters.";
    }
    if (!formData.role) newErrors.role = "Role is required.";
    if (formData.role === "admin" && !formData.adminKey.trim()) {
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
      if (formData.role === "admin") {
        formDataToSend.append("adminKey", formData.adminKey);
      }
      if (profilePic) {
        formDataToSend.append("image", profilePic);
      } else if (existingImageUrl === null) {
        // User cleared existing image
        formDataToSend.append("image", "");
      }

      await axiosInstance.put(API_ENDPOINTS.AUTH.UPDATE_PROFILE, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showSuccess("Profile updated successfully!");
      navigate("/profile");
    } catch (error) {
      showError(error.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl w-full mx-auto bg-white dark:bg-gray-900 p-10 rounded-xl shadow-xl">
      <h2 className="text-3xl font-extrabold mb-3 text-gray-900 dark:text-white">
        Update Your Profile
      </h2>
      <p className="text-base text-gray-600 dark:text-gray-300 mb-8">
        Edit your account details below
      </p>

      <form onSubmit={handleUpdate} encType="multipart/form-data" noValidate>
        <div className="flex justify-center mb-10">
          <ProfilePhotoSelector
            profilePic={profilePic}
            setProfilePic={setProfilePic}
            existingImageUrl={existingImageUrl}
            clearExistingImage={() => setExistingImageUrl(null)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <Input
              label="Full Name"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              className="mb-1"
              error={errors.fullName}
            />
          </div>

          <div>
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="mb-1"
              error={errors.email}
            />
          </div>

          <div>
            <Input
              label="New Password (optional)"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter a new password if changing"
              className="mb-1"
              error={errors.password}
            />
          </div>

          <div>
            <Select
              label="Role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              options={[
                { value: "member", label: "Member" },
                { value: "admin", label: "Admin" },
              ]}
              className="mb-1"
              error={errors.role}
            />
          </div>

          {formData.role === "admin" && (
            <div className="md:col-span-2">
              <Input
                label="Admin Key"
                name="adminKey"
                type="password"
                autoComplete="off" // <-- change here to better prevent autofill
                value={formData.adminKey}
                onChange={handleChange}
                placeholder="Enter admin key to verify"
                className="mb-1"
                error={errors.adminKey}
              />

            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-10 w-full disabled:opacity-50"
        >
          {loading ? "Updating profile..." : "Update Profile"}
        </button>
      </form>
    </div>
  );
};

export default UpdateUser;
