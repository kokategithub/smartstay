import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Home, TrendingUp, Users, CheckCircle, X, LogOut, BarChart2, IndianRupee, Star } from 'lucide-react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './OwnerDashboard.css';

const EMPTY_FORM = {
  title: '', description: '', price: '', city: '', address: '',
  lat: '', lng: '', vacancy: '', sharing: '1', amenities: '', available: true
};

export default function OwnerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRoom, setEditRoom] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('rooms');
  const [requests, setRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [tenants, setTenants] = useState([]);

  const fetchAnalytics = async () => {
    try {
      const [analyticsRes, tenantsRes] = await Promise.all([
        API.get('/analytics/summary'),
        API.get('/analytics/tenants'),
      ]);
      setAnalytics(analyticsRes.data);
      setTenants(tenantsRes.data);
    } catch {}
  };

  useEffect(() => { fetchRooms(); fetchRequests(); fetchBookings(); fetchAnalytics(); }, []);

  const fetchRooms = async () => {
    try {
      const res = await API.get('/rooms/owner/my-rooms');
      setRooms(res.data);
    } catch { toast.error('Failed to load rooms'); }
    finally { setLoading(false); }
  };

  const fetchRequests = async () => {
    try {
      const res = await API.get('/requests/owner');
      setRequests(res.data);
    } catch {}
  };

  const fetchBookings = async () => {
    try {
      const res = await API.get('/bookings/owner');
      setBookings(res.data);
    } catch {}
  };

  const openAdd = () => {
    setEditRoom(null);
    setForm(EMPTY_FORM);
    setSelectedImages([]);
    setImagePreviews([]);
    setShowModal(true);
  };

  const openEdit = (room) => {
    setEditRoom(room);
    setForm({
      title: room.title, description: room.description, price: room.price,
      city: room.city, address: room.address, lat: room.lat || '', lng: room.lng || '',
      vacancy: room.vacancy, sharing: room.sharing, amenities: room.amenities?.join(', ') || '',
      available: room.available
    });
    setSelectedImages([]);
    setImagePreviews([]);
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) { toast.error('Maximum 5 images allowed'); return; }
    setSelectedImages(files);
    const previews = files.map(f => URL.createObjectURL(f));
    setImagePreviews(previews);
  };

  const removeImage = (index) => {
    const newFiles = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedImages(newFiles);
    setImagePreviews(newPreviews);
  };

  const handleChange = async (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));

    // Auto-geocode only when full address is entered (min 15 chars, contains comma)
    if (name === 'address' && value.length > 15 && value.includes(',')) {
      clearTimeout(window._geocodeTimer);
      window._geocodeTimer = setTimeout(async () => {
        try {
          const res = await API.get(`/maps/geocode?address=${encodeURIComponent(value)}`);
          setForm(f => ({ ...f, lat: res.data.lat, lng: res.data.lng }));
        } catch {}
      }, 1000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      selectedImages.forEach(img => formData.append('images', img));

      if (editRoom) {
        await API.put(`/rooms/${editRoom._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Room updated!');
      } else {
        await API.post('/rooms', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Room listed successfully!');
      }
      setShowModal(false);
      setSelectedImages([]);
      setImagePreviews([]);
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save room');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this room listing?')) return;
    try {
      await API.delete(`/rooms/${id}`);
      toast.success('Room deleted');
      setRooms(r => r.filter(room => room._id !== id));
    } catch { toast.error('Failed to delete'); }
  };

  const handleBookingStatus = async (bookingId, status) => {
    try {
      await API.put(`/bookings/${bookingId}/status`, { status });
      toast.success(`Booking ${status}!`);
      fetchBookings();
    } catch { toast.error('Failed to update booking'); }
  };

  const handleStatusUpdate = async (reqId, status) => {
    try {
      await API.put(`/requests/${reqId}`, { status });
      toast.success(`Request ${status}`);
      fetchRequests();
    } catch { toast.error('Failed to update'); }
  };

  const stats = [
    { icon: <Home size={24} />, label: 'Total Listings', value: rooms.length, color: '#ff385c' },
    { icon: <CheckCircle size={24} />, label: 'Available', value: rooms.filter(r => r.available).length, color: '#22c55e' },
    { icon: <Users size={24} />, label: 'Total Bookings', value: bookings.filter(b => b.status !== 'cancelled').length, color: '#3b82f6' },
    { icon: <TrendingUp size={24} />, label: 'Pending Requests', value: requests.filter(r => r.status === 'pending').length, color: '#f59e0b' },
  ];

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="container dashboard-header-inner">
          <div>
            <h1>Welcome, {user?.name} 👋</h1>
            <p>Manage your rooms and booking requests</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button className="btn-add-room" onClick={openAdd}>
              <Plus size={18} /> Add New Room
            </button>
            <button
              onClick={() => { logout(); navigate('/'); }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: '#fee2e2', color: '#dc2626', borderRadius: '12px', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s' }}
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container dashboard-body">
        {/* Stats */}
        <div className="dashboard-stats">
          {stats.map((s, i) => (
            <div key={i} className="dash-stat-card">
              <div className="dash-stat-icon" style={{ background: s.color + '15', color: s.color }}>{s.icon}</div>
              <div className="dash-stat-value">{s.value}</div>
              <div className="dash-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="dash-tabs">
          <button className={`dash-tab ${activeTab === 'rooms' ? 'active' : ''}`} onClick={() => setActiveTab('rooms')}>
            My Listings ({rooms.length})
          </button>
          <button className={`dash-tab ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>
            Bookings {bookings.filter(b => b.status === 'pending').length > 0 && <span className="req-badge">{bookings.filter(b => b.status === 'pending').length}</span>}
          </button>
          <button className={`dash-tab ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
            Requests {requests.filter(r => r.status === 'pending').length > 0 && <span className="req-badge">{requests.filter(r => r.status === 'pending').length}</span>}
          </button>
          <button className={`dash-tab ${activeTab === 'tenants' ? 'active' : ''}`} onClick={() => setActiveTab('tenants')}>
            👥 Tenants ({tenants.length})
          </button>
          <button className={`dash-tab ${activeTab === 'earnings' ? 'active' : ''}`} onClick={() => setActiveTab('earnings')}>
            💰 Earnings
          </button>
          <button className={`dash-tab ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
            📊 Analytics
          </button>
        </div>

        {/* Rooms Table */}
        {activeTab === 'rooms' && (
          <>
        {loading ? (
          <div className="dash-loading">Loading your listings...</div>
        ) : rooms.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon">🏠</div>
            <h3>No listings yet</h3>
            <p>Add your first room to start getting inquiries from students and professionals.</p>
            <button className="btn-add-room" onClick={openAdd}><Plus size={16} /> Add Your First Room</button>
          </div>
        ) : (
          <div className="rooms-table-wrap">
            <table className="rooms-table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>City</th>
                  <th>Price</th>
                  <th>Sharing</th>
                  <th>Vacancy</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map(room => (
                  <tr key={room._id}>
                    <td>
                      <div className="table-room-name">
                        <div className="table-room-img">
                          <img
                            src={room.images?.[0]?.startsWith('/uploads') ? `http://localhost:5000${room.images[0]}` : (room.images?.[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200')}
                            alt={room.title}
                            onError={e => { e.target.src = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200'; }}
                          />
                        </div>
                        <span>{room.title}</span>
                      </div>
                    </td>
                    <td>{room.city}</td>
                    <td className="price-cell">₹{room.price.toLocaleString('en-IN')}</td>
                    <td>{room.sharing === 1 ? 'Private' : `${room.sharing} Sharing`}</td>
                    <td>{room.vacancy}</td>
                    <td>
                      <span className={`status-badge ${room.available ? 'available' : 'unavailable'}`}>
                        {room.available ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <a href={`/rooms/${room._id}`} target="_blank" rel="noopener noreferrer" className="action-btn view" title="View">
                          <Eye size={15} />
                        </a>
                        <button className="action-btn edit" onClick={() => openEdit(room)} title="Edit">
                          <Edit2 size={15} />
                        </button>
                        <button className="action-btn delete" onClick={() => handleDelete(room._id)} title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
          </>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="requests-section">
            {bookings.length === 0 ? (
              <div className="dash-empty">
                <div className="dash-empty-icon">📋</div>
                <h3>No bookings yet</h3>
                <p>Room bookings from students will appear here.</p>
              </div>
            ) : (
              <div className="requests-list">
                {bookings.map(b => (
                  <div key={b._id} className={`request-card ${b.status}`}>
                    <div className="req-card-header">
                      <div className="req-type-badge" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                        🏠 Room Booking
                      </div>
                      <span className={`req-status-badge ${b.status}`}>{b.status}</span>
                    </div>
                    <div className="req-card-body">
                      <div className="req-info-row"><strong>Room:</strong> {b.room?.title} — {b.room?.city}</div>
                      <div className="req-info-row"><strong>Student:</strong> {b.studentName} ({b.studentEmail})</div>
                      {b.studentPhone && <div className="req-info-row"><strong>Phone:</strong> {b.studentPhone}</div>}
                      <div className="req-info-row"><strong>Move-in Date:</strong> {b.moveInDate}</div>
                      <div className="req-info-row"><strong>Duration:</strong> {b.duration || 1} {(b.duration || 1) === 1 ? 'month' : 'months'}</div>
                      <div className="req-info-row"><strong>Per Person Rent:</strong> ₹{(Math.round((b.room?.price || 0) / (b.room?.sharing || 1)) * (b.duration || 1)).toLocaleString('en-IN')} {b.room?.sharing > 1 && `(₹${(b.room?.price || 0).toLocaleString('en-IN')} ÷ ${b.room?.sharing})`}</div>
                      <div className="req-info-row">
                        <strong>Payment:</strong>
                        <span style={{
                          marginLeft: '8px', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600',
                          background: b.payment_status === 'paid' ? '#dcfce7' : b.payment_status === 'failed' ? '#fee2e2' : '#fef9c3',
                          color: b.payment_status === 'paid' ? '#16a34a' : b.payment_status === 'failed' ? '#dc2626' : '#ca8a04'
                        }}>
                          {b.payment_status === 'paid' ? '✅ Paid' : b.payment_status === 'failed' ? '❌ Failed' : '⏳ Unpaid'}
                        </span>
                      </div>
                      <div className="req-info-row req-date">Booked: {new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    </div>
                    {b.status === 'pending' && (
                      <div className="req-card-actions">
                        <button className="btn-accept" onClick={() => handleBookingStatus(b._id, 'confirmed')}>✓ Approve & Request Payment</button>
                        <button className="btn-reject" onClick={() => handleBookingStatus(b._id, 'cancelled')}>✗ Reject</button>
                      </div>
                    )}
                    {b.status === 'confirmed' && b.payment_status === 'paid' && (
                      <div style={{ padding: '10px', background: '#dcfce7', borderRadius: '8px', color: '#16a34a', fontWeight: '600', fontSize: '13px', textAlign: 'center' }}>
                        ✅ Confirmed & Payment Received
                      </div>
                    )}
                    {b.status === 'pending_payment' && (
                      <div style={{ padding: '10px', background: '#fef9c3', borderRadius: '8px', color: '#ca8a04', fontWeight: '600', fontSize: '13px', textAlign: 'center' }}>
                        💳 Waiting for Student Payment
                      </div>
                    )}
                    {b.status === 'cancelled' && (
                      <div style={{ padding: '10px', background: '#fee2e2', borderRadius: '8px', color: '#dc2626', fontWeight: '600', fontSize: '13px', textAlign: 'center' }}>
                        ❌ Rejected
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="requests-section">
            {requests.length === 0 ? (
              <div className="dash-empty">
                <div className="dash-empty-icon">📩</div>
                <h3>No requests yet</h3>
                <p>Contact and visit requests from users will appear here.</p>
              </div>
            ) : (
              <div className="requests-list">
                {requests.map(req => (
                  <div key={req._id} className={`request-card ${req.status}`}>
                    <div className="req-card-header">
                      <div className="req-type-badge" style={{ background: req.type === 'contact' ? '#eff6ff' : '#f0fdf4', color: req.type === 'contact' ? '#3b82f6' : '#16a34a' }}>
                        {req.type === 'contact' ? '📩 Contact Request' : '📅 Visit Request'}
                      </div>
                      <span className={`req-status-badge ${req.status}`}>{req.status}</span>
                    </div>
                    <div className="req-card-body">
                      <div className="req-info-row">
                        <strong>Room:</strong> {req.room?.title} — {req.room?.city}
                      </div>
                      <div className="req-info-row">
                        <strong>From:</strong> {req.userName} ({req.userEmail})
                      </div>
                      {req.userPhone && <div className="req-info-row"><strong>Phone:</strong> {req.userPhone}</div>}
                      {req.type === 'visit' && req.visitDate && (
                        <div className="req-info-row">
                          <strong>Visit Date:</strong> {req.visitDate} at {req.visitTime}
                        </div>
                      )}
                      {req.message && <div className="req-info-row"><strong>Message:</strong> {req.message}</div>}
                      <div className="req-info-row req-date">
                        Received: {new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {req.status === 'pending' && (
                      <div className="req-card-actions">
                        <button className="btn-accept" onClick={() => handleStatusUpdate(req._id, 'accepted')}>✓ Accept</button>
                        <button className="btn-reject" onClick={() => handleStatusUpdate(req._id, 'rejected')}>✗ Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tenants Tab */}
        {activeTab === 'tenants' && (
          <div className="requests-section">
            <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '700' }}>👥 Current Tenants</h2>
            {tenants.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>👥</div>
                <h3>No active tenants yet</h3>
                <p>Confirmed and paid bookings will appear here</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      {['Tenant', 'Email', 'Phone', 'Room', 'Move-in', 'Duration', 'Share/mo', 'Move-out'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map(t => (
                      <tr key={t._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: '600', color: '#1e293b' }}>{t.studentName}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{t.studentEmail}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{t.studentPhone || '—'}</td>
                        <td style={{ padding: '12px 16px', color: '#1e293b' }}>{t.room?.title}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{t.moveInDate}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{t.duration} mo</td>
                        <td style={{ padding: '12px 16px', fontWeight: '700', color: '#ff385c' }}>₹{Math.round((t.room?.price || 0) / (t.room?.sharing || 1)).toLocaleString('en-IN')}</td>
                        <td style={{ padding: '12px 16px' }}>
                          {t.moveOutDate ? (
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>{t.moveOutDate}</span>
                          ) : (
                            <button onClick={async () => { await API.put(`/analytics/tenants/${t._id}/moveout`, {}); fetchAnalytics(); toast.success('Move-out recorded'); }} style={{ padding: '4px 10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
                              Mark Out
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && analytics && (
          <div className="requests-section">
            <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '700' }}>💰 Earnings Overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              {[
                { label: 'Total Earnings', value: `₹${analytics.totalEarnings.toLocaleString('en-IN')}`, color: '#16a34a', bg: '#dcfce7' },
                { label: 'Total Bookings', value: analytics.totalBookings, color: '#3b82f6', bg: '#eff6ff' },
                { label: 'Confirmed & Paid', value: analytics.confirmedBookings, color: '#ff385c', bg: '#fff1f2' },
                { label: 'Total Views', value: analytics.totalViews, color: '#f59e0b', bg: '#fef9c3' },
              ].map(c => (
                <div key={c.label} style={{ background: c.bg, borderRadius: '14px', padding: '20px' }}>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: c.color }}>{c.value}</div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{c.label}</div>
                </div>
              ))}
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Monthly Earnings</h3>
            {Object.keys(analytics.monthlyEarnings).length === 0 ? (
              <p style={{ color: '#94a3b8' }}>No earnings data yet</p>
            ) : (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {Object.entries(analytics.monthlyEarnings).map(([month, amount]) => (
                  <div key={month} style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px 18px', minWidth: '120px', textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#ff385c' }}>₹{amount.toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{month}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <div className="requests-section">
            <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '700' }}>📊 Room Analytics</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {analytics.roomAnalytics.map(r => (
                <div key={r._id} style={{ background: '#f8fafc', borderRadius: '14px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px' }}>{r.title}</h3>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>{r.city} · {r.sharing === 1 ? 'Private' : `${r.sharing} Sharing`} · ₹{r.price.toLocaleString('en-IN')}/mo</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {r.averageRating > 0 && (
                        <span style={{ background: '#fef9c3', color: '#ca8a04', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Star size={12} fill="#ca8a04" color="#ca8a04" /> {r.averageRating} ({r.totalReviews})
                        </span>
                      )}
                      <span style={{ background: r.vacancy > 0 ? '#dcfce7' : '#fee2e2', color: r.vacancy > 0 ? '#16a34a' : '#dc2626', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                        {r.vacancy > 0 ? `${r.vacancy} vacant` : 'Full'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '16px' }}>
                    {[
                      { label: '👁️ Views', value: r.views },
                      { label: '📋 Bookings', value: r.bookings },
                      { label: '💳 Paid', value: r.paidBookings },
                      { label: '📩 Requests', value: r.requests },
                    ].map(s => (
                      <div key={s.label} style={{ background: 'white', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>{s.value}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>{editRoom ? 'Edit Room' : 'Add New Room'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Room Title *</label>
                  <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Cozy Studio near IT Park" required />
                </div>
                <div className="form-group">
                  <label>City *</label>
                  <select name="city" value={form.city} onChange={handleChange} required>
                    <option value="">Select City</option>
                    {['Bangalore', 'Mumbai', 'Pune', 'Delhi', 'Hyderabad', 'Chennai'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Full Address *</label>
                <input name="address" value={form.address} onChange={handleChange} placeholder="e.g. Koramangala, Bangalore, Karnataka" required />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Describe the room, nearby facilities, rules..." required />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Monthly Rent (₹) *</label>
                  <input type="number" name="price" value={form.price} onChange={handleChange} placeholder="e.g. 8500" min="1000" required />
                </div>
                <div className="form-group">
                  <label>Sharing Capacity *</label>
                  <select name="sharing" value={form.sharing} onChange={handleChange} required>
                    <option value="1">Private (1 Person)</option>
                    <option value="2">2 Sharing</option>
                    <option value="3">3 Sharing</option>
                    <option value="4">4 Sharing</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Current Vacancies *</label>
                  <input type="number" name="vacancy" value={form.vacancy} onChange={handleChange} placeholder="e.g. 2" min="0" required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Latitude (optional)</label>
                  <input type="number" name="lat" value={form.lat} onChange={handleChange} placeholder="e.g. 12.9352" step="any" />
                </div>
                <div className="form-group">
                  <label>Longitude (optional)</label>
                  <input type="number" name="lng" value={form.lng} onChange={handleChange} placeholder="e.g. 77.6245" step="any" />
                </div>
              </div>

              <div className="form-group">
                <label>Amenities (comma-separated)</label>
                <input name="amenities" value={form.amenities} onChange={handleChange} placeholder="WiFi, AC, Furnished, Kitchen, Parking" />
              </div>

              <div className="form-group">
                <label>Room Images (up to 5)</label>
                <div className="image-upload-area" onClick={() => document.getElementById('room-images').click()}>
                  <input
                    id="room-images"
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                  />
                  {imagePreviews.length === 0 ? (
                    <div className="image-upload-placeholder">
                      <span className="upload-icon">📷</span>
                      <span>Click to upload images</span>
                      <span className="upload-hint">JPG, PNG up to 5MB each · Max 5 images</span>
                    </div>
                  ) : (
                    <div className="image-previews">
                      {imagePreviews.map((src, i) => (
                        <div key={i} className="preview-item">
                          <img src={src} alt={`Preview ${i + 1}`} />
                          <button
                            type="button"
                            className="remove-img"
                            onClick={e => { e.stopPropagation(); removeImage(i); }}
                          >✕</button>
                        </div>
                      ))}
                      {imagePreviews.length < 5 && (
                        <div className="preview-add">+ Add more</div>
                      )}
                    </div>
                  )}
                </div>
                {editRoom && imagePreviews.length === 0 && (
                  <p className="upload-note">Leave empty to keep existing images</p>
                )}
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input type="checkbox" name="available" checked={form.available} onChange={handleChange} />
                  Room is currently available
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-save" disabled={submitting}>
                  {submitting ? 'Saving...' : (editRoom ? 'Update Room' : 'Add Room')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
