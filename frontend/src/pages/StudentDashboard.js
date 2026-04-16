import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Calendar, Heart, LogOut, MapPin, Users, IndianRupee, Star, Clock, Download, MessageSquare, CheckCircle, User } from 'lucide-react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './StudentDashboard.css';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('bookings');
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState(null);
  const [reviewModal, setReviewModal] = useState(null); // { roomId, roomTitle }
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    if (user.role === 'owner') { navigate('/dashboard'); return; }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [roomsRes, bookingsRes, requestsRes, wishlistRes, reviewsRes] = await Promise.all([
        API.get('/rooms'),
        API.get('/bookings/my-bookings'),
        API.get('/requests/my-requests'),
        API.get('/wishlist'),
        API.get('/reviews/my'),
      ]);
      setRooms(roomsRes.data.slice(0, 5));
      setBookings(bookingsRes.data);
      setRequests(requestsRes.data);
      setWishlist(wishlistRes.data);
      setReviews(reviewsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const handlePayNow = async (booking) => {
    try {
      // Load Razorpay script
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise(resolve => script.onload = resolve);
      }

      const { data } = await API.post('/payment/create-order', { bookingId: booking._id });

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'SmartStay',
        description: `Booking: ${data.roomTitle}`,
        order_id: data.orderId,
        prefill: {
          name: data.studentName,
          email: data.studentEmail,
        },
        theme: { color: '#ff385c' },
        handler: async (response) => {
          try {
            const verifyRes = await API.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: booking._id,
            });
            toast.success('Payment successful! Booking confirmed.');
            // Show receipt
            const perPersonAmount = Math.round((booking.room?.price || 0) / (booking.room?.sharing || 1));
            setReceipt({
              paymentId: response.razorpay_payment_id,
              studentName: data.studentName,
              studentEmail: data.studentEmail,
              roomTitle: data.roomTitle,
              city: booking.room?.city || '',
              amount: perPersonAmount * (booking.duration || 1),
              perMonth: perPersonAmount,
              duration: booking.duration || 1,
              moveInDate: booking.moveInDate,
              date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
            });
            fetchData();
          } catch {
            toast.error('Payment verification failed');
            fetchData();
          }
        },
        modal: {
          ondismiss: () => toast.error('Payment cancelled'),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async () => {
        toast.error('Payment failed. Please try again.');
        fetchData();
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
    }
  };

  const getStatusStyle = (status, payment_status) => {
    if (status === 'confirmed' && payment_status === 'paid') return { bg: '#dcfce7', color: '#16a34a', icon: '✅', label: 'Confirmed & Paid' };
    if (status === 'pending_payment') return { bg: '#fef9c3', color: '#ca8a04', icon: '💳', label: 'Payment Pending' };
    if (status === 'payment_failed') return { bg: '#fee2e2', color: '#dc2626', icon: '❌', label: 'Payment Failed' };
    if (status === 'confirmed') return { bg: '#dcfce7', color: '#16a34a', icon: '✅', label: 'Approved' };
    if (status === 'cancelled') return { bg: '#fee2e2', color: '#dc2626', icon: '❌', label: 'Rejected' };
    return { bg: '#fef9c3', color: '#ca8a04', icon: '⏳', label: 'Pending' };
  };

  const getImage = (room) => {
    const img = room.images?.[0] || '';
    if (img.startsWith('/uploads')) return `http://localhost:5000${img}`;
    return img.split('?')[0] + '?w=400&cb=' + (room._id?.toString().slice(-4) || '1');
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const toggleWishlist = async (roomId) => {
    try {
      const { data } = await API.post(`/wishlist/${roomId}`);
      toast.success(data.message);
      const wishlistRes = await API.get('/wishlist');
      setWishlist(wishlistRes.data);
    } catch { toast.error('Failed to update wishlist'); }
  };

  const submitReview = async () => {
    if (!reviewForm.comment.trim()) { toast.error('Please write a comment'); return; }
    setReviewLoading(true);
    try {
      await API.post('/reviews', { roomId: reviewModal.roomId, rating: reviewForm.rating, comment: reviewForm.comment });
      toast.success('Review submitted!');
      setReviewModal(null);
      setReviewForm({ rating: 5, comment: '' });
      const reviewsRes = await API.get('/reviews/my');
      setReviews(reviewsRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  const getTimeline = (booking) => {
    const steps = [
      { key: 'pending', label: 'Requested', icon: '📋' },
      { key: 'pending_payment', label: 'Approved', icon: '✅' },
      { key: 'payment', label: 'Payment Done', icon: '💳' },
      { key: 'confirmed', label: 'Confirmed', icon: '🏠' },
    ];
    let activeIdx = 0;
    if (booking.status === 'pending') activeIdx = 0;
    else if (booking.status === 'pending_payment') activeIdx = 1;
    else if (booking.status === 'payment_failed') activeIdx = 1;
    else if (booking.status === 'confirmed' && booking.payment_status !== 'paid') activeIdx = 2;
    else if (booking.status === 'confirmed' && booking.payment_status === 'paid') activeIdx = 3;
    return { steps, activeIdx };
  };

  if (loading) return (
    <div className="sd-loading">
      <div className="sd-spinner" />
      <p>Loading your dashboard...</p>
    </div>
  );

  return (
    <div className="sd-page">
      {/* Header */}
      <div className="sd-header">
        <div className="sd-header-inner">
          <div className="sd-logo" onClick={() => navigate('/')}>🏠 SmartStay</div>
          <div className="sd-header-right">
            <Link to="/rooms" className="sd-nav-link">Find Rooms</Link>
            <button className="sd-logout-btn" onClick={handleLogout}>
              <LogOut size={15} /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="sd-container">

        {/* Welcome + User Info */}
        <div className="sd-welcome-row">
          <div className="sd-welcome">
            <div className="sd-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
            <div>
              <h1>Welcome, {user?.name} 👋</h1>
              <p>Find your perfect stay easily</p>
            </div>
          </div>
          <div className="sd-user-card">
            <div className="sd-user-row"><span>Name</span><strong>{user?.name}</strong></div>
            <div className="sd-user-row"><span>Email</span><strong>{user?.email}</strong></div>
            <div className="sd-user-row"><span>Role</span><strong style={{ color: '#ff385c', textTransform: 'capitalize' }}>{user?.role === 'user' ? 'Student' : user?.role}</strong></div>
            <div className="sd-user-row"><span>Bookings</span><strong>{bookings.length}</strong></div>
            <div className="sd-user-row"><span>Requests</span><strong>{requests.length}</strong></div>
            <div className="sd-user-row"><span>Wishlist</span><strong>{wishlist.length}</strong></div>
            <button onClick={() => navigate('/profile')} style={{ marginTop: '12px', width: '100%', padding: '8px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <User size={14} /> Edit Profile
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="sd-section">
          <h2 className="sd-section-title">Quick Actions</h2>
          <div className="sd-actions-grid">
            <button className="sd-action-card" onClick={() => navigate('/rooms')}>
              <div className="sd-action-icon" style={{ background: '#fff1f2', color: '#ff385c' }}>
                <Search size={28} />
              </div>
              <h3>Explore Rooms</h3>
              <p>Search rooms by city, budget and sharing</p>
            </button>
            <button className="sd-action-card" onClick={() => setActiveTab('bookings')}>
              <div className="sd-action-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                <Calendar size={28} />
              </div>
              <h3>My Bookings</h3>
              <p>View and manage your room bookings</p>
            </button>
            <button className="sd-action-card" onClick={() => setActiveTab('wishlist')}>
              <div className="sd-action-icon" style={{ background: '#fdf4ff', color: '#a855f7' }}>
                <Heart size={28} />
              </div>
              <h3>Saved Rooms</h3>
              <p>Browse rooms you liked and saved</p>
            </button>
            <button className="sd-action-card" onClick={() => setActiveTab('requests')}>
              <div className="sd-action-icon" style={{ background: '#fff7ed', color: '#f97316' }}>
                <Users size={28} />
              </div>
              <h3>My Requests</h3>
              <p>Track contact and visit requests you sent</p>
            </button>
          </div>
        </div>

        {/* Recommended Rooms */}
        <div className="sd-section">
          <h2 className="sd-section-title">⭐ Recommended for You</h2>
          <div className="sd-rooms-grid">
            {rooms.map((room, i) => (
              <div key={room._id} className="sd-room-card" onClick={() => navigate(`/rooms/${room._id}`)}>
                {i === 0 && <div className="sd-top-badge">🏆 Top Match</div>}
                <div className="sd-room-img-wrap">
                  <img
                    src={getImage(room)}
                    alt={room.title}
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400'; }}
                  />
                </div>
                <div className="sd-room-body">
                  <h3>{room.title}</h3>
                  <div className="sd-room-location">
                    <MapPin size={12} /> {room.city} · {room.address?.split(',')[0]}
                  </div>
                  <div className="sd-room-meta">
                    <span><Users size={12} /> {room.sharing === 1 ? 'Private' : `${room.sharing} Sharing`}</span>
                    <span><Clock size={12} /> ~{10 + i * 5} mins</span>
                  </div>
                  <div className="sd-room-footer">
                    <div className="sd-room-price">
                      <IndianRupee size={13} />{room.price.toLocaleString('en-IN')}<span>/mo</span>
                    </div>
                    <div className="sd-room-rating">
                      <Star size={12} fill="#ff385c" color="#ff385c" />
                      {(4.2 + i * 0.1).toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button className="sd-view-all" onClick={() => navigate('/rooms')}>
              View All Rooms →
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="sd-section">
          <div className="sd-tabs">
            {[
              { key: 'bookings', label: `📅 Bookings (${bookings.length})` },
              { key: 'requests', label: `📩 Requests (${requests.length})` },
              { key: 'wishlist', label: `❤️ Wishlist (${wishlist.length})` },
              { key: 'reviews', label: `⭐ Reviews (${reviews.length})` },
            ].map(t => (
              <button key={t.key} className={`sd-tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            bookings.length === 0 ? (
              <div className="sd-empty">
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
                <h3>No bookings yet</h3>
                <p>Book a room to see it here</p>
                <button className="sd-view-all" onClick={() => navigate('/rooms')}>Find a Room</button>
              </div>
            ) : (
              <div className="sd-bookings-grid">
                {bookings.map(b => {
                  const s = getStatusStyle(b.status, b.payment_status);
                  const { steps, activeIdx } = getTimeline(b);
                  const alreadyReviewed = reviews.some(r => r.room?._id === b.room?._id);
                  return (
                    <div key={b._id} className="sd-booking-card">
                      <div className="sd-booking-img">
                        <img src={getImage(b.room)} alt={b.room?.title} onError={e => { e.target.src = 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400'; }} />
                      </div>
                      <div className="sd-booking-body">
                        <div className="sd-booking-header">
                          <h3>{b.room?.title}</h3>
                          <span className="sd-booking-status" style={{ background: s.bg, color: s.color }}>{s.icon} {s.label}</span>
                        </div>
                        <div className="sd-booking-location"><MapPin size={12} /> {b.room?.city}</div>

                        {/* Timeline */}
                        <div className="sd-timeline">
                          {steps.map((step, i) => (
                            <div key={step.key} className={`sd-timeline-step ${i <= activeIdx ? 'done' : ''} ${i === activeIdx ? 'current' : ''}`}>
                              <div className="sd-timeline-dot">{i <= activeIdx ? '✓' : ''}</div>
                              {i < steps.length - 1 && <div className={`sd-timeline-line ${i < activeIdx ? 'done' : ''}`} />}
                              <div className="sd-timeline-label">{step.icon} {step.label}</div>
                            </div>
                          ))}
                        </div>

                        <div className="sd-booking-details">
                          <div><span>Move-in</span><strong>{b.moveInDate}</strong></div>
                          <div><span>Duration</span><strong>{b.duration || 1} {(b.duration || 1) === 1 ? 'month' : 'months'}</strong></div>
                          <div><span>Your Share</span><strong>₹{(Math.round((b.room?.price || 0) / (b.room?.sharing || 1)) * (b.duration || 1)).toLocaleString('en-IN')}</strong></div>
                        </div>
                        {b.status === 'pending_payment' && (
                          <button onClick={() => handlePayNow(b)} style={{ marginTop: '12px', width: '100%', padding: '10px', background: 'linear-gradient(135deg, #ff385c, #e31c5f)', color: 'white', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', border: 'none' }}>
                            💳 Pay Now — ₹{(Math.round((b.room?.price || 0) / (b.room?.sharing || 1)) * (b.duration || 1)).toLocaleString('en-IN')}
                          </button>
                        )}
                        {b.status === 'payment_failed' && (
                          <button onClick={() => handlePayNow(b)} style={{ marginTop: '12px', width: '100%', padding: '10px', background: '#fee2e2', color: '#dc2626', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', border: '1px solid #fca5a5' }}>
                            🔄 Retry Payment
                          </button>
                        )}
                        {b.status === 'confirmed' && b.payment_status === 'paid' && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <button onClick={() => { const p = Math.round((b.room?.price || 0) / (b.room?.sharing || 1)); setReceipt({ paymentId: b.payment_id || b._id, studentName: b.studentName, studentEmail: b.studentEmail, roomTitle: b.room?.title, city: b.room?.city || '', amount: p * (b.duration || 1), perMonth: p, duration: b.duration || 1, moveInDate: b.moveInDate, date: new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) }); }} style={{ flex: 1, padding: '10px', background: '#f0fdf4', color: '#16a34a', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', border: '1px solid #bbf7d0' }}>
                              🧾 Receipt
                            </button>
                            {!alreadyReviewed && (
                              <button onClick={() => setReviewModal({ roomId: b.room?._id, roomTitle: b.room?.title })} style={{ flex: 1, padding: '10px', background: '#fef9c3', color: '#ca8a04', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', border: '1px solid #fde68a' }}>
                                ⭐ Review
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            requests.length === 0 ? (
              <div className="sd-empty">
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📩</div>
                <h3>No requests sent yet</h3>
                <p>Contact or visit requests you send will appear here</p>
                <button className="sd-view-all" onClick={() => navigate('/rooms')}>Browse Rooms</button>
              </div>
            ) : (
              <div className="sd-bookings-grid">
                {requests.map(req => {
                  const statusColors = { pending: { bg: '#fef9c3', color: '#ca8a04', icon: '⏳' }, accepted: { bg: '#dcfce7', color: '#16a34a', icon: '✅' }, rejected: { bg: '#fee2e2', color: '#dc2626', icon: '❌' } };
                  const s = statusColors[req.status] || statusColors.pending;
                  return (
                    <div key={req._id} className="sd-booking-card">
                      <div className="sd-booking-img">
                        <img src={getImage(req.room)} alt={req.room?.title} onError={e => { e.target.src = 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400'; }} />
                      </div>
                      <div className="sd-booking-body">
                        <div className="sd-booking-header">
                          <h3>{req.room?.title}</h3>
                          <span className="sd-booking-status" style={{ background: s.bg, color: s.color }}>{s.icon} {req.status.charAt(0).toUpperCase() + req.status.slice(1)}</span>
                        </div>
                        <div className="sd-booking-location"><MapPin size={12} /> {req.room?.city}</div>
                        <div className="sd-booking-details">
                          <div><span>Type</span><strong>{req.type === 'contact' ? '📩 Contact' : '📅 Visit'}</strong></div>
                          {req.type === 'visit' && req.visitDate && <div><span>Visit</span><strong>{req.visitDate} {req.visitTime && `at ${req.visitTime}`}</strong></div>}
                          <div><span>Sent</span><strong>{new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></div>
                        </div>
                        {req.message && <div style={{ marginTop: '8px', fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>"{req.message}"</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* Wishlist Tab */}
          {activeTab === 'wishlist' && (
            wishlist.length === 0 ? (
              <div className="sd-empty">
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>❤️</div>
                <h3>No saved rooms yet</h3>
                <p>Tap the heart on any room to save it here</p>
                <button className="sd-view-all" onClick={() => navigate('/rooms')}>Browse Rooms</button>
              </div>
            ) : (
              <div className="sd-rooms-grid">
                {wishlist.map(room => (
                  <div key={room._id} className="sd-room-card">
                    <div className="sd-room-img-wrap" style={{ position: 'relative' }}>
                      <img src={getImage(room)} alt={room.title} onClick={() => navigate(`/rooms/${room._id}`)} style={{ cursor: 'pointer' }} onError={e => { e.target.src = 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400'; }} />
                      <button onClick={() => toggleWishlist(room._id)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                        <Heart size={16} fill="#ff385c" color="#ff385c" />
                      </button>
                    </div>
                    <div className="sd-room-body" onClick={() => navigate(`/rooms/${room._id}`)} style={{ cursor: 'pointer' }}>
                      <h3>{room.title}</h3>
                      <div className="sd-room-location"><MapPin size={12} /> {room.city}</div>
                      <div className="sd-room-footer">
                        <div className="sd-room-price"><IndianRupee size={13} />{room.price.toLocaleString('en-IN')}<span>/mo</span></div>
                        {room.averageRating > 0 && <div className="sd-room-rating"><Star size={12} fill="#ff385c" color="#ff385c" /> {room.averageRating}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            reviews.length === 0 ? (
              <div className="sd-empty">
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>⭐</div>
                <h3>No reviews yet</h3>
                <p>After a confirmed stay, you can review the room</p>
              </div>
            ) : (
              <div className="sd-bookings-grid">
                {reviews.map(r => (
                  <div key={r._id} className="sd-booking-card" style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <div className="sd-booking-img" style={{ width: '80px', flexShrink: 0 }}>
                      <img src={getImage(r.room)} alt={r.room?.title} onError={e => { e.target.src = 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400'; }} />
                    </div>
                    <div className="sd-booking-body" style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3 style={{ fontSize: '14px', marginBottom: '4px' }}>{r.room?.title}</h3>
                        <button
                          onClick={async () => {
                            if (!window.confirm('Delete this review?')) return;
                            try {
                              await API.delete(`/reviews/${r._id}`);
                              setReviews(prev => prev.filter(x => x._id !== r._id));
                              toast.success('Review deleted');
                            } catch (err) {
                              toast.error(err.response?.data?.message || 'Failed to delete review');
                            }
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '13px', padding: '2px 6px' }}
                          title="Delete your review"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '2px', marginBottom: '6px' }}>
                        {[1,2,3,4,5].map(s => <Star key={s} size={14} fill={s <= r.rating ? '#ff385c' : 'none'} color="#ff385c" />)}
                      </div>
                      <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>{r.comment}</p>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="req-overlay" onClick={e => e.target === e.currentTarget && setReviewModal(null)}>
          <div className="req-modal" style={{ maxWidth: '420px' }}>
            <h2>⭐ Review Room</h2>
            <p>Share your experience at <strong>{reviewModal.roomTitle}</strong></p>
            <div className="req-form">
              <label>Rating</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => setReviewForm(f => ({ ...f, rating: s }))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                    <Star size={28} fill={s <= reviewForm.rating ? '#ff385c' : 'none'} color="#ff385c" />
                  </button>
                ))}
              </div>
              <label>Your Review</label>
              <textarea rows={4} placeholder="Describe your experience..." value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))} />
            </div>
            <div className="req-actions">
              <button className="btn-req-cancel" onClick={() => setReviewModal(null)}>Cancel</button>
              <button className="btn-req-send" onClick={submitReview} disabled={reviewLoading}>
                {reviewLoading ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receipt && (
        <div className="req-overlay" onClick={e => e.target === e.currentTarget && setReceipt(null)}>
          <div className="req-modal" id="receipt-modal" style={{ maxWidth: '420px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '48px' }}>🧾</div>
              <h2 style={{ margin: '8px 0 4px', color: '#16a34a' }}>Payment Successful!</h2>
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Your booking is confirmed</p>
            </div>
            <div style={{ border: '2px dashed #e2e8f0', borderRadius: '12px', padding: '20px', background: '#f8fafc', marginBottom: '20px' }}>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600', letterSpacing: '1px' }}>SMARTSTAY</div>
                <div style={{ fontSize: '11px', color: '#cbd5e1' }}>BOOKING RECEIPT</div>
              </div>
              {[
                { label: 'Receipt No.', value: receipt.paymentId?.slice(-10).toUpperCase() },
                { label: 'Name', value: receipt.studentName },
                { label: 'Email', value: receipt.studentEmail },
                { label: 'Room', value: receipt.roomTitle },
                { label: 'City', value: receipt.city },
                { label: 'Move-in Date', value: receipt.moveInDate },
                { label: 'Duration', value: `${receipt.duration} ${receipt.duration === 1 ? 'month' : 'months'}` },
                { label: 'Per Month', value: `₹${receipt.perMonth.toLocaleString('en-IN')}` },
                { label: 'Payment Date', value: receipt.date },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                  <span style={{ color: '#64748b' }}>{label}</span>
                  <strong style={{ color: '#1e293b', maxWidth: '200px', textAlign: 'right', wordBreak: 'break-all' }}>{value}</strong>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', padding: '12px', background: '#ff385c', borderRadius: '8px', color: 'white' }}>
                <span style={{ fontWeight: '700', fontSize: '15px' }}>Total Paid</span>
                <strong style={{ fontSize: '18px' }}>₹{receipt.amount.toLocaleString('en-IN')}</strong>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handlePrintReceipt} style={{ flex: 1, padding: '12px', background: '#1e293b', color: 'white', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', border: 'none' }}>
                🖨️ Print / Save PDF
              </button>
              <button onClick={() => setReceipt(null)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', border: 'none' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
