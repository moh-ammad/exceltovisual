import AuthLayout from '@/components/layouts/AuthLayout';
import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/layouts/inputs/Input';
import {
  validateEmail,
  validatePassword,
  showError,
  showSuccess,
} from '@/utils/helper';
import axiosInstance from '@/utils/axiosInstance';
import { API_ENDPOINTS } from '@/utils/apisPaths';
import { UserContext } from '../../context/userContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { updateUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' })); // Clear error on change
  };

  const validateForm = () => {
    const newErrors = {};

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  setLoading(true);
  try {
    const response = await axiosInstance.post(
      API_ENDPOINTS.AUTH.LOGIN,
      formData
    );

    console.log('Login response:', response); // 🔍 Debugging

    const { token, user } = response.data || {};

    if (!user) {
      throw new Error('Invalid response: Missing user data');
    }

    // Save user and token
    updateUser(token ? { ...user, token } : user);

    showSuccess('Login successful!');

    const role = user.role?.toLowerCase();
    if (role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/user/user-dashboard');
    }
  } catch (err) {
    console.error('Login error:', err);
    const message =
      err.response?.data?.message || err.message || 'Login failed. Please try again.';
    setErrors({ general: message });
    showError(message);
  } finally {
    setLoading(false);
  }
};


  return (
    <AuthLayout>
      <div className="lg:w-[70%] h-3/4 md:h-full flex flex-col justify-center">
        <h3 className="text-xl font-semibold text-black">Welcome Back</h3>
        <p className="text-xs text-slate-800 mt-[5px] mb-6">
          Please enter your details to log in.
        </p>

        <form onSubmit={handleLogin}>
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="jimmy@gmail.com"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}

          <Input
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
          )}

          {errors.general && (
            <p className="text-red-500 text-sm mt-2">{errors.general}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-4 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'LOGIN'}
          </button>

          <p className="text-[13px] text-slate-800 mt-3">
            Don't have an account?{' '}
            <span
              className="text-blue-500 cursor-pointer underline"
              onClick={() => navigate('/signUp')}
            >
              Sign Up
            </span>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
};

export default Login;
