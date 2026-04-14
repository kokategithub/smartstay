import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Users, IndianRupee, Star, Phone, Mail, ArrowLeft, Navigation, Clock, CheckCircle } from 'lucide-react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './RoomDetail.css';

export default function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [workplace, setWorkplace] = useState('');
  const [travelInfo, setTravelInfo] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [reqForm, setReqForm] = useState({ message: '', userPhone: '', visitDate: '', visitTime: '' });
  const [reqLoading, setReqLoading] = useState(false);
  const [contactForm, setContactForm] = useState({ userName: '', userEmail: '', message: '' });
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [bookForm, setBookForm] = useState({ studentName: '', studentEmail: '', studentPhone: '', moveInDate: '', duration: '1' });
  const [bookLoading, setBookLoading] = useState(false);
  const [bookingDone, setBookingDone] = useState(false);
  const [roomReviews, setRoomReviews] = useState([]);

  useEffect(() => {
    API.get(`/rooms/${id}`)
      .then(r => setRoom(r.data))
      .catch(() => toast.error('Room not found'))
      .finally(() => setLoading(false));
    API.get(`/reviews/room/${id}`).then(r => setRoomReviews(r.data)).catch(() => {});
  }, [id]);

  const handleBookRoom = async () => {
    if (!user) { toast.error('Please login to book'); navigate('/auth'); return; }
    if (!bookForm.studentName || !bookForm.studentEmail || !bookForm.moveInDate) {
      toast.error('Please fill all required fields');
      return;
    }
    setBookLoading(true);
    try {
      await API.post('/bookings', {
        roomId: room._id,
        studentName: bookForm.studentName,
        studentEmail: bookForm.studentEmail,
        studentPhone: bookForm.studentPhone,
        moveInDate: bookForm.moveInDate,
        duration: bookForm.duration,
      });
      setBookingDone(true);
      toast.success('Room booked successfully!');
      // Update local vacancy count
      setRoom(prev => ({
        ...prev,
        vacancy: prev.vacancy - 1,
        available: prev.vacancy - 1 > 0
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setBookLoading(false);
    }
  };

  const sendEmailToOwner = async () => {
    if (!contactForm.userName || !contactForm.userEmail || !contactForm.message) {
      toast.error('Please fill all fields');
      return;
    }
    setEmailSending(true);
    try {
      // Create a contact request in the DB so owner sees it in dashboard
      if (user) {
        try {
          await API.post('/requests', {
            type: 'contact',
            roomId: room._id,
            userName: contactForm.userName,
            userEmail: contactForm.userEmail,
            message: contactForm.message,
          });
        } catch (reqErr) {
          // If duplicate request, still proceed with email
          if (!reqErr.response?.data?.message?.includes('already have a pending')) throw reqErr;
        }
      }

      // Also send email notification
      try {
        await API.post('/email/contact', {
          roomId: room._id,
          userName: contactForm.userName,
          userEmail: contactForm.userEmail,
          message: contactForm.message,
        });
      } catch {
        // Email failure shouldn't block the request from being saved
      }

      setEmailSent(true);
      toast.success('Message sent successfully!');
      setTimeout(() => {
        setShowContactModal(false);
        setEmailSent(false);
        setContactForm({ userName: '', userEmail: '', message: '' });
      }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send. Please try again.');
    } finally {
      setEmailSending(false);
    }
  };

  const sendRequest = async (type) => {
    if (!user) { toast.error('Please login to send a request'); navigate('/auth'); return; }
    setReqLoading(true);
    try {
      await API.post('/requests', {
        type,
        roomId: room._id,
        userName: user.name,
        userEmail: user.email,
        userPhone: reqForm.userPhone,
        message: reqForm.message,
        visitDate: reqForm.visitDate,
        visitTime: reqForm.visitTime,
      });
      toast.success(type === 'contact' ? 'Contact request sent to owner!' : 'Visit scheduled! Owner will confirm.');
      setShowContactModal(false);
      setShowVisitModal(false);
      setReqForm({ message: '', userPhone: '', visitDate: '', visitTime: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    } finally {
      setReqLoading(false);
    }
  };

  const calcDistance = async () => {
    if (!workplace.trim()) return toast.error('Enter your workplace address');
    setCalcLoading(true);
    try {
      const res = await API.post('/maps/distance', {
        origin: workplace,
        destination: room.address
      });
      setTravelInfo(res.data);
    } catch {
      toast.error('Could not calculate distance');
    } finally {
      setCalcLoading(false);
    }
  };

  if (loading) return (
    <div className="detail-loading">
      <div className="loading-spinner" />
      <p>Loading room details...</p>
    </div>
  );

  if (!room) return (
    <div className="detail-loading">
      <p>Room not found.</p>
      <button onClick={() => navigate('/rooms')}>Back to Rooms</button>
    </div>
  );

  const images = room.images?.length > 0
    ? room.images.map(img => {
        if (img.startsWith('/uploads')) return `http://localhost:5000${img}`;
        // Strip old params and add fresh cache buster
        const base = img.split('?')[0];
        return base + '?w=800&cb=' + room._id?.toString().slice(-6);
      })
    : ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'];

  return (
    <div className="room-detail">
      <div className="container">
        {/* Back */}
        <button className="btn-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back to Listings
        </button>

        {/* Title */}
        <div className="detail-header">
          <div>
            <h1>{room.title}</h1>
            <div className="detail-meta">
              <span className="detail-rating"><Star size={14} fill="#ff385c" color="#ff385c" /> {room.averageRating > 0 ? `${room.averageRating} (${room.totalReviews} ${room.totalReviews === 1 ? 'review' : 'reviews'})` : 'No reviews yet'}</span>
              <span className="detail-location"><MapPin size={14} /> {room.address}</span>
              {!room.available && <span className="unavail-tag">Currently Unavailable</span>}
            </div>
          </div>
          <div className="detail-price-wrap">
            <div className="detail-price">
              <IndianRupee size={20} />
              {room.price.toLocaleString('en-IN')}
            </div>
            <span className="detail-price-period">per month</span>
          </div>
        </div>

        {/* Gallery */}
        <div className="gallery">
          <div className="gallery-main">
            <img
              src={images[activeImg]}
              alt={room.title}
              onError={e => { e.target.src = 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'; }}
            />
          </div>
          {images.length > 1 && (
            <div className="gallery-thumbs">
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`Room ${i + 1}`}
                  className={i === activeImg ? 'active' : ''}
                  onClick={() => setActiveImg(i)}
                  onError={e => { e.target.src = 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'; }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="detail-body">
          {/* Left */}
          <div className="detail-left">
            {/* Info Cards */}
            <div className="info-cards">
              {[
                { icon: <Users size={20} />, label: 'Sharing', value: room.sharing === 1 ? 'Private Room' : `${room.sharing} Person Sharing` },
                { icon: <CheckCircle size={20} />, label: 'Vacancy', value: `${room.vacancy} ${room.vacancy === 1 ? 'spot' : 'spots'} available` },
                { icon: <MapPin size={20} />, label: 'City', value: room.city },
                { icon: <Star size={20} />, label: 'Status', value: room.available ? 'Available Now' : 'Not Available' },
              ].map((item, i) => (
                <div key={i} className="info-card">
                  <div className="info-icon">{item.icon}</div>
                  <div>
                    <div className="info-label">{item.label}</div>
                    <div className="info-value">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="detail-section">
              <h2>About This Room</h2>
              <p>{room.description}</p>
            </div>

            {/* Amenities */}
            {room.amenities?.length > 0 && (
              <div className="detail-section">
                <h2>Amenities</h2>
                <div className="amenities-grid">
                  {room.amenities.map(a => (
                    <div key={a} className="amenity-item">
                      <CheckCircle size={16} color="#22c55e" />
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="detail-section">
              <h2>⭐ Reviews {roomReviews.length > 0 && `(${roomReviews.length})`}</h2>
              {roomReviews.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>No reviews yet. Be the first to review after your stay!</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {roomReviews.map(r => (
                    <div key={r._id} style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>{r.studentName}</div>
                          <div style={{ display: 'flex', gap: '2px', marginTop: '4px' }}>
                            {[1,2,3,4,5].map(s => <Star key={s} size={13} fill={s <= r.rating ? '#ff385c' : 'none'} color="#ff385c" />)}
                          </div>
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      </div>
                      <p style={{ fontSize: '14px', color: '#475569', margin: 0, lineHeight: '1.5' }}>{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Distance Calculator */}
            <div className="detail-section ai-section">
              <h2>🤖 AI Travel Time Calculator</h2>
              <p className="ai-desc">Enter your workplace or college address to get AI-powered stress classification.</p>
              <div className="ai-input-row">
                <div className="ai-input-wrap">
                  <Navigation size={16} />
                  <input
                    type="text"
                    placeholder="e.g. Infosys, Electronic City, Bangalore"
                    value={workplace}
                    onChange={e => setWorkplace(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && calcDistance()}
                  />
                </div>
                <button className="btn-calc" onClick={calcDistance} disabled={calcLoading}>
                  {calcLoading ? 'Calculating...' : 'Calculate'}
                </button>
              </div>

              {travelInfo && (
                <div className="travel-result" style={{ borderColor: travelInfo.stress.color + '44', background: travelInfo.stress.color + '0d' }}>
                  <div className="travel-stress" style={{ color: travelInfo.stress.color }}>
                    {travelInfo.stress.icon} {travelInfo.stress.level}
                  </div>
                  <div className="travel-stats">
                    <div className="travel-stat">
                      <MapPin size={16} />
                      <span>{travelInfo.distance?.text || 'N/A'}</span>
                      <label>Distance</label>
                    </div>
                    <div className="travel-stat">
                      <Clock size={16} />
                      <span>{travelInfo.duration?.text || 'N/A'}</span>
                      <label>Travel Time</label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Map */}
            <div className="detail-section">
              <h2>📍 Location on Map</h2>
              <div className="map-embed-wrap">
                <iframe
                  title="Room Location"
                  width="100%"
                  height="320"
                  style={{ border: 0, borderRadius: '12px' }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${(room.lng||77.5946)-0.02}%2C${(room.lat||12.9716)-0.02}%2C${(room.lng||77.5946)+0.02}%2C${(room.lat||12.9716)+0.02}&layer=mapnik&marker=${room.lat||12.9716}%2C${room.lng||77.5946}`}
                />
                <div className="map-btn-row">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(room.address + ', ' + room.city)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-open-maps"
                  >
                    <MapPin size={14} /> Open in Google Maps
                  </a>
                  <a
                    href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(room.address + ', ' + room.city)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-open-maps osm"
                  >
                    🗺️ Open in OpenStreetMap
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Contact Card */}
          <div className="detail-right">
            <div className="contact-card">
              <div className="contact-header">
                <div className="owner-avatar">
                  {room.owner?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="owner-name">{room.owner?.name}</div>
                  <div className="owner-label">Property Owner</div>
                </div>
              </div>

              <div className="price-display">
                <div className="price-big">
                  <IndianRupee size={22} />
                  {room.price.toLocaleString('en-IN')}
                </div>
                <span>/ month</span>
              </div>

              <div className="contact-details">
                <div className="contact-item">
                  <Mail size={16} />
                  <span>{room.owner?.email}</span>
                </div>
                <div className="contact-item">
                  <Phone size={16} />
                  <span>+91 98765 43210</span>
                </div>
              </div>

              <button className="btn-contact" onClick={() => user ? setShowContactModal(true) : navigate('/auth')}>
                Contact Owner
              </button>
              <button className="btn-book" onClick={() => user ? setShowBookModal(true) : navigate('/auth')}
                disabled={room.vacancy <= 0}>
                {room.vacancy <= 0 ? '🔴 Fully Booked' : '🏠 Book This Room'}
              </button>
              <button className="btn-schedule" onClick={() => user ? setShowVisitModal(true) : navigate('/auth')}>
                Schedule Visit
              </button>

              <div className="contact-note">
                <CheckCircle size={14} color="#22c55e" />
                <span>Verified listing · No brokerage</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="quick-stats">
              <h3>Quick Info</h3>
              <div className="quick-stat-row">
                <span>Price</span>
                <span className="qs-value">₹{room.price.toLocaleString('en-IN')}/mo</span>
              </div>
              <div className="quick-stat-row">
                <span>Sharing</span>
                <span className="qs-value">{room.sharing === 1 ? 'Private' : `${room.sharing} Person`}</span>
              </div>
              <div className="quick-stat-row">
                <span>Vacancy</span>
                <span className="qs-value" style={{ color: '#22c55e' }}>{room.vacancy} available</span>
              </div>
              <div className="quick-stat-row">
                <span>City</span>
                <span className="qs-value">{room.city}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Owner - Slide Up Panel */}
      {showContactModal && (
        <div className="slideup-overlay" onClick={e => e.target === e.currentTarget && setShowContactModal(false)}>
          <div className="slideup-panel">
            <div className="slideup-handle" />

            <div className="slideup-header">
              <div className="slideup-owner-info">
                <div className="slideup-avatar">
                  {room.owner?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="slideup-owner-name">{room.owner?.name}</div>
                  <div className="slideup-owner-role">Property Owner · Verified ✓</div>
                </div>
              </div>
              <button className="slideup-close" onClick={() => setShowContactModal(false)}>✕</button>
            </div>

            <div className="slideup-room-info">
              <div className="slideup-room-title">{room.title}</div>
              <div className="slideup-room-location">📍 {room.city} · ₹{room.price.toLocaleString('en-IN')}/month</div>
            </div>

            <div className="slideup-divider" />

            {emailSent ? (
              <div style={{ textAlign: 'center', padding: '24px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                <h3 style={{ color: '#16a34a', marginBottom: '8px' }}>Message Sent!</h3>
                <p style={{ color: '#64748b', fontSize: '14px' }}>The owner will contact you soon.</p>
              </div>
            ) : (
              <>
                <div className="slideup-title">Contact Owner</div>
                <p className="slideup-subtitle">Send a message to {room.owner?.name}</p>

                <div className="req-form" style={{ marginBottom: '16px' }}>
                  <label>Your Name *</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={contactForm.userName}
                    onChange={e => setContactForm(f => ({ ...f, userName: e.target.value }))}
                  />
                  <label>Your Email *</label>
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={contactForm.userEmail}
                    onChange={e => setContactForm(f => ({ ...f, userEmail: e.target.value }))}
                  />
                  <label>Message *</label>
                  <textarea
                    rows={4}
                    placeholder="Hi, I am interested in this room. Is it still available?"
                    value={contactForm.message}
                    onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))}
                  />
                </div>

                <button
                  className="btn-req-send"
                  style={{ width: '100%', marginBottom: '10px', padding: '14px', fontSize: '15px' }}
                  onClick={sendEmailToOwner}
                  disabled={emailSending}
                >
                  {emailSending ? '📤 Sending...' : '📧 Send Message'}
                </button>
              </>
            )}

            <button className="slideup-cancel" onClick={() => setShowContactModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookModal && (
        <div className="req-overlay" onClick={e => e.target === e.currentTarget && setShowBookModal(false)}>
          <div className="req-modal">
            {bookingDone ? (
              <div style={{ textAlign: 'center', padding: '24px' }}>
                <div style={{ fontSize: '56px', marginBottom: '12px' }}>🎉</div>
                <h2 style={{ color: '#16a34a', marginBottom: '8px' }}>Booking Confirmed!</h2>
                <p style={{ color: '#64748b', marginBottom: '8px' }}>You have successfully booked <strong>{room.title}</strong></p>
                <p style={{ color: '#94a3b8', fontSize: '13px' }}>Remaining vacancies: {room.vacancy}</p>
                <button className="btn-req-send" style={{ marginTop: '20px', width: '100%' }}
                  onClick={() => { setShowBookModal(false); setBookingDone(false); }}>
                  Close
                </button>
              </div>
            ) : (
              <>
                <h2>🏠 Book This Room</h2>
                <p>Complete your booking for <strong>{room.title}</strong></p>
                <div className="req-form">
                  <label>Your Name *</label>
                  <input type="text" placeholder="Full name" value={bookForm.studentName}
                    onChange={e => setBookForm(f => ({ ...f, studentName: e.target.value }))} />
                  <label>Your Email *</label>
                  <input type="email" placeholder="your@email.com" value={bookForm.studentEmail}
                    onChange={e => setBookForm(f => ({ ...f, studentEmail: e.target.value }))} />
                  <label>Phone Number</label>
                  <input type="tel" placeholder="+91 98765 43210" value={bookForm.studentPhone}
                    onChange={e => setBookForm(f => ({ ...f, studentPhone: e.target.value }))} />
                  <label>Move-in Date *</label>
                  <input type="date" value={bookForm.moveInDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setBookForm(f => ({ ...f, moveInDate: e.target.value }))} />
                  <label>Duration (months) *</label>
                  <select value={bookForm.duration}
                    onChange={e => setBookForm(f => ({ ...f, duration: e.target.value }))}>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                      <option key={m} value={m}>{m} {m === 1 ? 'month' : 'months'}</option>
                    ))}
                  </select>
                </div>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#16a34a' }}>
                    ✅ <strong>{room.vacancy}</strong> {room.vacancy === 1 ? 'vacancy' : 'vacancies'} available
                  </p>
                  {room.sharing > 1 && (
                    <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#2563eb' }}>
                      👥 Your share: ₹{Math.round(room.price / room.sharing).toLocaleString('en-IN')}/month (₹{room.price.toLocaleString('en-IN')} ÷ {room.sharing} persons)
                    </p>
                  )}
                  <p style={{ margin: 0, fontSize: '13px', color: '#16a34a' }}>
                    💰 Total: ₹{(Math.round(room.price / (room.sharing || 1)) * Number(bookForm.duration)).toLocaleString('en-IN')} for {bookForm.duration} {Number(bookForm.duration) === 1 ? 'month' : 'months'}
                  </p>
                </div>
                <div className="req-actions">
                  <button className="btn-req-cancel" onClick={() => setShowBookModal(false)}>Cancel</button>
                  <button className="btn-req-send" onClick={handleBookRoom} disabled={bookLoading}>
                    {bookLoading ? 'Booking...' : 'Confirm Booking'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Visit Modal */}
      {showVisitModal && (
        <div className="req-overlay" onClick={e => e.target === e.currentTarget && setShowVisitModal(false)}>
          <div className="req-modal">
            <h2>📅 Schedule a Visit</h2>
            <p>Book a visit to <strong>{room.title}</strong></p>
            <div className="req-form">
              <label>Your Phone Number</label>
              <input type="tel" placeholder="+91 98765 43210" value={reqForm.userPhone}
                onChange={e => setReqForm(f => ({ ...f, userPhone: e.target.value }))} />
              <label>Preferred Visit Date</label>
              <input type="date" value={reqForm.visitDate} min={new Date().toISOString().split('T')[0]}
                onChange={e => setReqForm(f => ({ ...f, visitDate: e.target.value }))} />
              <label>Preferred Time</label>
              <select value={reqForm.visitTime} onChange={e => setReqForm(f => ({ ...f, visitTime: e.target.value }))}>
                <option value="">Select time slot</option>
                <option>10:00 AM - 11:00 AM</option>
                <option>11:00 AM - 12:00 PM</option>
                <option>12:00 PM - 1:00 PM</option>
                <option>2:00 PM - 3:00 PM</option>
                <option>3:00 PM - 4:00 PM</option>
                <option>4:00 PM - 5:00 PM</option>
                <option>5:00 PM - 6:00 PM</option>
              </select>
              <label>Additional Message (optional)</label>
              <textarea rows={3} placeholder="Any specific requirements or questions..."
                value={reqForm.message}
                onChange={e => setReqForm(f => ({ ...f, message: e.target.value }))} />
            </div>
            <div className="req-actions">
              <button className="btn-req-cancel" onClick={() => setShowVisitModal(false)}>Cancel</button>
              <button className="btn-req-send" onClick={() => sendRequest('visit')} disabled={reqLoading}>
                {reqLoading ? 'Scheduling...' : 'Schedule Visit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
