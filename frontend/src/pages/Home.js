import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Shield, Zap, Star, ArrowRight, Building2, GraduationCap, TrendingUp } from 'lucide-react';
import API from '../api/axios';
import RoomCard from '../components/RoomCard';
import './Home.css';

const CITIES = ['Bangalore', 'Mumbai', 'Pune', 'Delhi', 'Hyderabad', 'Chennai'];

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&q=80',
];

export default function Home() {
  const [search, setSearch] = useState('');
  const [budget, setBudget] = useState('');
  const [featuredRooms, setFeaturedRooms] = useState([]);
  const [totalRooms, setTotalRooms] = useState(0);
  const [heroIdx, setHeroIdx] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/rooms').then(r => {
      setFeaturedRooms(r.data.slice(0, 6));
      setTotalRooms(r.data.length);
    }).catch(() => {});
    const interval = setInterval(() => setHeroIdx(i => (i + 1) % HERO_IMAGES.length), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('city', search);
    if (budget) params.set('maxPrice', budget);
    navigate(`/rooms?${params.toString()}`);
  };

  const stats = [
    { icon: <Building2 size={28} />, value: `${totalRooms}+`, label: 'Listed Rooms' },
    { icon: <GraduationCap size={28} />, value: '6', label: 'Major Cities' },
    { icon: <TrendingUp size={28} />, value: 'AI', label: 'Smart Recommendations' },
    { icon: <Star size={28} />, value: '4.8★', label: 'Average Rating' },
  ];


  return (
    <div className="home">
      {/* Hero */}
      <section className="hero" style={{ backgroundImage: `url(${HERO_IMAGES[heroIdx]})` }}>
        <div className="hero-overlay" />
        <div className="hero-content container">
          <div className="hero-badge">🏆 India's #1 Smart Accommodation Finder</div>
          <h1 className="hero-title">
            Find Your Perfect<br />
            <span className="hero-accent">Smart Stay</span>
          </h1>
          <p className="hero-subtitle">
            AI-powered recommendations based on your budget, workplace proximity, and travel time.
            Stop wasting time — find the right room in minutes.
          </p>

          <form className="search-box" onSubmit={handleSearch}>
            <div className="search-field">
              <MapPin size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search by city or location..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                list="city-list"
              />
              <datalist id="city-list">
                {CITIES.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="search-divider" />
            <div className="search-field">
              <span className="search-icon rupee">₹</span>
              <select value={budget} onChange={e => setBudget(e.target.value)}>
                <option value="">Any Budget</option>
                <option value="7500">Up to ₹7,500</option>
                <option value="8000">Up to ₹8,000</option>
                <option value="9000">Up to ₹9,000</option>
                <option value="10000">Up to ₹10,000</option>
              </select>
            </div>
            <button type="submit" className="search-btn">
              <Search size={18} /> Search Rooms
            </button>
          </form>

          <div className="hero-tags">
            {CITIES.map(city => (
              <button key={city} className="city-tag" onClick={() => navigate(`/rooms?city=${city}`)}>
                📍 {city}
              </button>
            ))}
          </div>
        </div>

        <div className="hero-dots">
          {HERO_IMAGES.map((_, i) => (
            <span key={i} className={`hero-dot ${i === heroIdx ? 'active' : ''}`} onClick={() => setHeroIdx(i)} />
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section">
        <div className="container stats-grid">
          {stats.map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="how-section container">
        <div className="section-header">
          <h2>How SmartStay Works</h2>
          <p>Three simple steps to find your ideal accommodation</p>
        </div>
        <div className="steps-grid">
          {[
            { step: '01', icon: '🔍', title: 'Search & Filter', desc: 'Enter your city, budget range, and sharing preferences to get personalized results.' },
            { step: '02', icon: '🤖', title: 'AI Recommendation', desc: 'Our AI calculates distance, travel time, and stress level for each room from your workplace.' },
            { step: '03', icon: '🏠', title: 'Book Your Room', desc: 'Contact the owner directly, visit the property, and move into your perfect SmartStay.' },
          ].map((s, i) => (
            <div key={i} className="step-card">
              <div className="step-number">{s.step}</div>
              <div className="step-emoji">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose SmartStay?</h2>
            <p>Built specifically for students and working professionals</p>
          </div>
          <div className="features-grid">
            {[
              { icon: <Zap size={24} />, title: 'AI-Powered Matching', desc: 'Smart recommendations based on proximity, travel time, and stress classification.', color: '#ff385c' },
              { icon: <MapPin size={24} />, title: 'Location Intelligence', desc: 'Google Maps integration shows exact distance and travel time from your workplace.', color: '#00a699' },
              { icon: <Shield size={24} />, title: 'Verified Listings', desc: 'All rooms are verified by our team. No fake listings, no hidden charges.', color: '#7c3aed' },
              { icon: <Star size={24} />, title: 'Budget Friendly', desc: 'Filter rooms within ₹7,500–₹10,000 range. Perfect for students and freshers.', color: '#f59e0b' },
            ].map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon" style={{ background: f.color + '15', color: f.color }}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stress Classification */}
      <section className="stress-section container">
        <div className="section-header">
          <h2>AI Stress Classification</h2>
          <p>We classify rooms based on travel time from your workplace</p>
        </div>
        <div className="stress-grid">
          {[
            { icon: '🟢', level: 'Low Stress', time: '0–20 mins', desc: 'Ideal choice. Short commute, more time for yourself.', bg: '#f0fdf4', border: '#86efac', color: '#16a34a' },
            { icon: '🟡', level: 'Medium Stress', time: '20–45 mins', desc: 'Acceptable commute. Good balance of price and proximity.', bg: '#fefce8', border: '#fde047', color: '#ca8a04' },
            { icon: '🔴', level: 'High Stress', time: '45+ mins', desc: 'Long commute. Consider only if budget is the priority.', bg: '#fef2f2', border: '#fca5a5', color: '#dc2626' },
          ].map((s, i) => (
            <div key={i} className="stress-card" style={{ background: s.bg, borderColor: s.border }}>
              <div className="stress-icon">{s.icon}</div>
              <h3 style={{ color: s.color }}>{s.level}</h3>
              <div className="stress-time" style={{ color: s.color }}>{s.time}</div>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Rooms */}
      {featuredRooms.length > 0 && (
        <section className="featured-section container">
          <div className="section-header">
            <h2>Featured Rooms</h2>
            <p>Hand-picked accommodations across top cities</p>
          </div>
          <div className="rooms-grid">
            {featuredRooms.map(room => <RoomCard key={room._id} room={room} />)}
          </div>
          <div className="view-all-wrap">
            <button className="btn-view-all" onClick={() => navigate('/rooms')}>
              View All Rooms <ArrowRight size={18} />
            </button>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="cta-section">
        <div className="container cta-inner">
          <div className="cta-text">
            <h2>Are You a Room Owner?</h2>
            <p>List your property on SmartStay and reach thousands of students and professionals looking for accommodation.</p>
          </div>
          <div className="cta-actions">
            <button className="btn-cta-primary" onClick={() => navigate('/auth?role=owner')}>
              List Your Room
            </button>
            <button className="btn-cta-secondary" onClick={() => navigate('/rooms')}>
              Browse Rooms
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
