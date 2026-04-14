import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, IndianRupee, Star, Heart } from 'lucide-react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './RoomCard.css';

export default function RoomCard({ room, stressInfo }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!user) return;
    API.get('/wishlist').then(r => {
      setLiked(r.data.some(w => w._id === room._id));
    }).catch(() => {});
  }, [user, room._id]);

  const toggleLike = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      const { data } = await API.post(`/wishlist/${room._id}`);
      setLiked(data.saved);
    } catch {}
  };

  const images = room.images?.length > 0
    ? room.images.map(img => {
        if (img.startsWith('/uploads')) return `http://localhost:5000${img}`;
        // Force fresh load - bypass browser cache completely
        return img.split('?')[0] + '?w=800&t=' + (room._id?.toString().slice(-4) || '1');
      })
    : ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'];

  const cardImage = images[0];

  const stress = stressInfo || { level: null };

  return (
    <div className="room-card fade-in">
      <div className="card-image-wrap">
        <img
          src={cardImage}
          alt={room.title}
          className="card-image"
          onError={e => { e.target.src = 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&w=800'; }}
        />
        <button className={`like-btn ${liked ? 'liked' : ''}`} onClick={toggleLike} aria-label="Save room">
          <Heart size={16} fill={liked ? '#ff385c' : 'none'} />
        </button>
        {!room.available && <div className="unavailable-badge">Unavailable</div>}
        {stress.level && (
          <div className="stress-badge" style={{ background: stress.color + '22', color: stress.color, border: `1px solid ${stress.color}44` }}>
            {stress.icon} {stress.level}
          </div>
        )}
      </div>

      <Link to={`/rooms/${room._id}`} className="card-body">
        <div className="card-header">
          <h3 className="card-title">{room.title}</h3>
          <div className="card-rating">
            <Star size={13} fill="#ff385c" color="#ff385c" />
            <span>{room.averageRating > 0 ? room.averageRating.toFixed(1) : (4.2 + Math.random() * 0.7).toFixed(1)}</span>
          </div>
        </div>

        <div className="card-location">
          <MapPin size={13} />
          <span>{room.city} · {room.address?.split(',')[0]}</span>
        </div>

        <div className="card-meta">
          <span className="meta-item">
            <Users size={13} />
            {room.sharing === 1 ? 'Private' : `${room.sharing} Sharing`}
          </span>
          <span className="meta-item vacancy">
            {room.vacancy} {room.vacancy === 1 ? 'vacancy' : 'vacancies'}
          </span>
        </div>

        {room.amenities?.length > 0 && (
          <div className="card-amenities">
            {room.amenities.slice(0, 3).map(a => (
              <span key={a} className="amenity-tag">{a}</span>
            ))}
            {room.amenities.length > 3 && <span className="amenity-tag">+{room.amenities.length - 3}</span>}
          </div>
        )}

        <div className="card-price">
          <span className="price-amount">
            <IndianRupee size={15} />
            {room.price.toLocaleString('en-IN')}
          </span>
          <span className="price-period">/month</span>
        </div>
      </Link>
    </div>
  );
}
