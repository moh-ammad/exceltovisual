import React, { useState } from 'react';
import AuthLayout from '@/components/layouts/AuthLayout';
import { Input, Select } from '@/components/layouts/inputs/Input';
import ProfilePhotoSelector from '@/components/layouts/inputs/ProfilePhotoSelector';
import { showError, showSuccess, validateEmail, validatePassword } from '@/utils/helper';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '@/utils/apisPaths';
import axiosInstance from '@/utils/axiosinstance';

const SignUp = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'member',
    adminKey: '',
  });

  const [profilePic, setProfilePic] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required.';
    if (!validateEmail(formData.email)) newErrors.email = 'Invalid email address.';
    if (!validatePassword(formData.password)) newErrors.password = 'Password must be at least 6 characters.';
    if (!formData.role) newErrors.role = 'Role is required.';
    if (formData.role === 'admin' && !formData.adminKey.trim()) {
      newErrors.adminKey = 'Admin key is required for admin registration.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('fullName', formData.fullName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('role', formData.role);
      if (formData.role === 'admin') {
        formDataToSend.append('adminKey', formData.adminKey);
      }
      if (profilePic) {
        formDataToSend.append('image', profilePic);
      }

      const response = await axiosInstance.post(
        API_ENDPOINTS.AUTH.REGISTER,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data', // override Content-Type ONLY here
          },
        }
      );

      showSuccess('Registration successful!');
      localStorage.setItem('profilePic', response.data.profilePic || '');

      setFormData({
        fullName: '',
        email: '',
        password: '',
        role: 'member',
        adminKey: '',
      });
      setProfilePic(null);
      setErrors({});
      navigate('/login');
    } catch (error) {
      showError(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="lg:w-full h-auto md:h-full md:mt-0 flex flex-col justify-center">
        <h3 className="text-xl font-semibold text-black">Create An Account</h3>
        <p className="text-xs text-slate-700 mt-[5px] mb-6">
          Join us today by entering your details below
        </p>

        <form onSubmit={handleSignUp}
        encType='multipart/form-data' 
        >
          <div className="w-full h-30 flex justify-center items-center">
            <ProfilePhotoSelector profilePic={profilePic} setProfilePic={setProfilePic} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <Input
                label="Full Name"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
              />
              {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <Input
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <div>
              <Select
                label="Role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                options={[
                  { value: 'member', label: 'Member' },
                  { value: 'admin', label: 'Admin' },
                ]}
              />
              {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
            </div>

            {formData.role === 'admin' && (
              <div className="md:col-span-2">
                <Input
                  label="Admin Key"
                  name="adminKey"
                  type="text"
                  value={formData.adminKey}
                  onChange={handleChange}
                  placeholder="Enter admin key"
                />
                {errors.adminKey && <p className="text-red-500 text-sm mt-1">{errors.adminKey}</p>}
              </div>
            )}
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary mt-4 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </div>
          <p className="text-[13px] text-slate-800 mt-3">
            Already have an account?{' '}
            <span
              className="text-blue-500 cursor-pointer underline"
              onClick={() => navigate('/login')}
            >
              Login
            </span>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
};

export default SignUp;
