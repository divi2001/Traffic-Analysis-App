// Auth.jsx (updated)
import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import logo from "../assets/MHC logo Final FIle-01.png";
import toast from "react-hot-toast";
import coverImage from "../assets/cover_image.jpeg";
import './Auth.css';

export default function Auth() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (!auth) {
    return <div className="error-container">❌ AuthContext is null! Fix AuthProvider.</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      if (isRegister) {
        const success = await auth.register(formData.name, formData.email, formData.password);
        if (success) {
          toast.success("🎉 Account created! Redirecting to login...");
          setTimeout(() => {
            setIsRegister(false);
          }, 2000);
        }
      } else {
        const success = await auth.login(formData.email, formData.password);
        if (success) {
          toast.success("👋 Welcome back!");
          navigate("/dashboard");
        }
      }
    } catch (err) {
      toast.error(isRegister ? "Registration failed. Please try again." : "Login failed. Check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-app">
      <div className="auth-layout">
        <div className="auth-card">
          {/* Centered logo - shown in both sign-in and sign-up */}
          <div className="auth-logo-center">
            <img src={logo} alt="Logo" className="brand-logo-center" />
          </div>
          
          <div className="auth-header">
            <h2>{isRegister ? "" : "Sign In"}</h2>
            <p className="auth-subtitle">
              {isRegister 
                ? "Create your account to start managing traffic analysis on site."
                : "Log in to your account and manage your traffic analysis on one page"}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="auth-form">
            {isRegister && (
              <div className="input-group">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="auth-button" disabled={isLoading}>
              {isLoading ? (
                <span className="spinner"></span>
              ) : isRegister ? (
                "Create Account"
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              {isRegister ? "Already have an account?" : "Don't have an account?"}
              <button 
                type="button" 
                className="auth-toggle"
                onClick={() => setIsRegister(!isRegister)}
              >
                {isRegister ? " Sign in" : " Create one"}
              </button>
            </p>
          </div>
        </div>

        <div className="auth-hero">
          <div className="hero-media-container">
            {/* Video placeholder with play button overlay */}
            <div 
              className="video-placeholder" 
              style={{ 
                backgroundImage: `url(${coverImage})`,
                backgroundSize: 'contain', // ensures full image is shown
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#000' // optional: fills space around image
              }}
            >

              <div className="play-button-overlay">
                <svg className="play-icon" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                </svg>
              </div>
            </div>
            
            {/* Gradient overlay */}
            <div className="hero-gradient-overlay"></div>
            
            {/* Content */}
            <div className="hero-content">
              <h3>Advanced Traffic Analysis</h3>
              <p>Real-time data visualization and comprehensive reporting tools</p>
              <button className="demo-button">
                Watch Demo
                <svg className="play-icon-sm" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}