import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', password: '',
    role: searchParams.get('role') === 'owner' ? 'owner' : 'user'
  });

  useEffect(() => {
    if (user) navigate(user.role === 'owner' ? '/dashboard' : '/rooms');
  }, [user, navigate]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill all fields');
    if (!isLogin && !form.name) return toast.error('Name is required');

    setLoading(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin ? { email: form.email, password: form.password } : form;
      const res = await API.post(endpoint, payload);
      login(res.data.user, res.data.token);
      toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
      navigate(res.data.user.role === 'owner' ? '/dashboard' : '/student-dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-logo">🏠 SmartStay</div>
          <h2>Find Your Perfect<br />Accommodation</h2>
          <p>AI-powered room recommendations based on your budget, workplace proximity, and travel time.</p>
          <div className="auth-features">
            {['Smart AI Recommendations', 'Budget-Friendly Rooms', 'Verified Listings', 'Google Maps Integration'].map(f => (
              <div key={f} className="auth-feature">
                <span className="auth-feature-check">✓</span> {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-tabs">
            <button className={`auth-tab ${isLogin ? 'active' : ''}`} onClick={() => setIsLogin(true)}>
              Login
            </button>
            <button className={`auth-tab ${!isLogin ? 'active' : ''}`} onClick={() => setIsLogin(false)}>
              Register
            </button>
          </div>

          <h1 className="auth-title">
            {isLogin ? 'Welcome Back!' : 'Create Account'}
          </h1>
          <p className="auth-subtitle">
            {isLogin ? 'Sign in to find your perfect room' : 'Join thousands of happy residents'}
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="form-group">
                <label>Full Name</label>
                <div className="input-wrap">
                  <User size={16} />
                  <input
                    type="text"
                    name="name"
                    placeholder="Your full name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <div className="input-wrap">
                <Mail size={16} />
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-wrap">
                <Lock size={16} />
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button type="button" className="toggle-pass" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="form-group">
                <label>I am a...</label>
                <div className="role-selector">
                  <button
                    type="button"
                    className={`role-btn ${form.role === 'user' ? 'active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, role: 'user' }))}
                  >
                    🎓 Student / Professional
                  </button>
                  <button
                    type="button"
                    className={`role-btn ${form.role === 'owner' ? 'active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, role: 'owner' }))}
                  >
                    <Home size={16} /> Room Owner
                  </button>
                </div>
              </div>
            )}

            <button type="submit" className="btn-auth" disabled={loading}>
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <p className="auth-switch">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Register here' : 'Login here'}
            </button>
          </p>

          <div className="demo-creds">
            <p>Demo Credentials:</p>
            <div className="demo-row">
              <span>User:</span> amit@user.com / password123
            </div>
            <div className="demo-row">
              <span>Owner:</span> rahul@owner.com / password123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
