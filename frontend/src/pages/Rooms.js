import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, MapPin, X, ArrowUpDown, LayoutGrid, Map } from 'lucide-react';
import API from '../api/axios';
import RoomCard from '../components/RoomCard';
import './Rooms.css';

const CITIES = ['All', 'Bangalore', 'Mumbai', 'Pune', 'Delhi', 'Hyderabad', 'Chennai'];

export default function Rooms() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map'
  const [workplace, setWorkplace] = useState('');
  const [stressMap, setStressMap] = useState({});

  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    minPrice: 5000,
    maxPrice: Number(searchParams.get('maxPrice')) || 10000,
    sharing: '',
    sortBy: 'newest',
  });

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.city && filters.city !== 'All') params.set('city', filters.city);
      if (filters.minPrice) params.set('minPrice', filters.minPrice);
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
      if (filters.sharing) params.set('sharing', filters.sharing);

      const res = await API.get(`/rooms?${params.toString()}`);
      let data = res.data;

      if (filters.sortBy === 'price-asc') data.sort((a, b) => a.price - b.price);
      else if (filters.sortBy === 'price-desc') data.sort((a, b) => b.price - a.price);
      else if (filters.sortBy === 'newest') data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setRooms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const calculateStress = async () => {
    if (!workplace.trim()) return;
    const newMap = {};
    for (const room of rooms) {
      try {
        const res = await API.post('/maps/distance', {
          origin: workplace,
          destination: room.address
        });
        newMap[room._id] = res.data.stress;
        newMap[room._id].distance = res.data.distance?.text;
        newMap[room._id].duration = res.data.duration?.text;
      } catch {}
    }
    setStressMap(newMap);

    // Sort by stress level
    setRooms(prev => [...prev].sort((a, b) => {
      const order = { 'Low Stress': 0, 'Medium Stress': 1, 'High Stress': 2 };
      return (order[newMap[a._id]?.level] ?? 3) - (order[newMap[b._id]?.level] ?? 3);
    }));
  };

  const updateFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));

  const clearFilters = () => {
    setFilters({ city: '', minPrice: 7500, maxPrice: 10000, sharing: '', sortBy: 'newest' });
    setSearchParams({});
    setStressMap({});
    setWorkplace('');
  };

  const activeFilterCount = [filters.city, filters.sharing].filter(Boolean).length;

  return (
    <div className="rooms-page">
      {/* Header */}
      <div className="rooms-header">
        <div className="container rooms-header-inner">
          <div>
            <h1>Find Your Room</h1>
            <p>{rooms.length} rooms available{filters.city ? ` in ${filters.city}` : ''}</p>
          </div>
          <div className="rooms-header-actions">
            <div className="workplace-input-wrap">
              <MapPin size={16} />
              <input
                type="text"
                placeholder="Enter your workplace/college..."
                value={workplace}
                onChange={e => setWorkplace(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && calculateStress()}
              />
              {workplace && (
                <button className="btn-calc-stress" onClick={calculateStress}>
                  Get AI Recommendations
                </button>
              )}
            </div>
            <button className="btn-filter" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal size={16} />
              Filters {activeFilterCount > 0 && <span className="filter-count">{activeFilterCount}</span>}
            </button>
            <div className="view-toggle">
              <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')} title="Grid View">
                <LayoutGrid size={16} />
              </button>
              <button className={viewMode === 'map' ? 'active' : ''} onClick={() => setViewMode('map')} title="Map View">
                <Map size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="container filters-inner">
            {/* City */}
            <div className="filter-group">
              <label>City</label>
              <div className="city-pills">
                {CITIES.map(c => (
                  <button
                    key={c}
                    className={`city-pill ${(filters.city === c || (c === 'All' && !filters.city)) ? 'active' : ''}`}
                    onClick={() => updateFilter('city', c === 'All' ? '' : c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div className="filter-group">
              <label>Budget Range: ₹{Number(filters.minPrice).toLocaleString('en-IN')} – ₹{Number(filters.maxPrice).toLocaleString('en-IN')}</label>
              <div className="range-inputs">
                <input type="range" min="5000" max="10000" step="500" value={filters.minPrice}
                  onChange={e => updateFilter('minPrice', Number(e.target.value))} />
                <input type="range" min="5000" max="10000" step="500" value={filters.maxPrice}
                  onChange={e => updateFilter('maxPrice', Number(e.target.value))} />
              </div>
            </div>

            {/* Sharing */}
            <div className="filter-group">
              <label>Sharing Type</label>
              <div className="city-pills">
                {[['', 'Any'], ['1', 'Private'], ['2', '2 Sharing'], ['3', '3 Sharing'], ['4', '4+ Sharing']].map(([val, label]) => (
                  <button key={val} className={`city-pill ${filters.sharing === val ? 'active' : ''}`}
                    onClick={() => updateFilter('sharing', val)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="filter-group">
              <label><ArrowUpDown size={14} /> Sort By</label>
              <div className="city-pills">
                {[['newest', 'Newest'], ['price-asc', 'Price: Low to High'], ['price-desc', 'Price: High to Low']].map(([val, label]) => (
                  <button key={val} className={`city-pill ${filters.sortBy === val ? 'active' : ''}`}
                    onClick={() => updateFilter('sortBy', val)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn-clear-filters" onClick={clearFilters}>
              <X size={14} /> Clear All Filters
            </button>
          </div>
        </div>
      )}

      {/* Stress Legend */}
      {Object.keys(stressMap).length > 0 && (
        <div className="stress-legend container">
          <span>AI Recommendations Active:</span>
          <span className="legend-item low">🟢 Low Stress (≤20 min)</span>
          <span className="legend-item medium">🟡 Medium Stress (20–45 min)</span>
          <span className="legend-item high">🔴 High Stress (45+ min)</span>
        </div>
      )}

      {/* Room Grid / Map */}
      <div className="container rooms-content">
        {loading ? (
          <div className="rooms-loading">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton-card" />)}
          </div>
        ) : rooms.length === 0 ? (
          <div className="no-rooms">
            <div className="no-rooms-icon">🏠</div>
            <h3>No rooms found</h3>
            <p>Try adjusting your filters or search in a different city.</p>
            <button className="btn-clear-filters" onClick={clearFilters}>Clear Filters</button>
          </div>
        ) : viewMode === 'map' ? (
          <div className="map-view-wrap">
            <div className="map-view-sidebar">
              {rooms.map(room => <RoomCard key={room._id} room={room} stressInfo={stressMap[room._id]} />)}
            </div>
            <div className="map-view-map">
              <iframe
                title="Rooms Map"
                width="100%"
                height="100%"
                style={{ border: 0, borderRadius: '16px' }}
                loading="lazy"
                allowFullScreen
                src={`https://www.openstreetmap.org/export/embed.html?bbox=72.7%2C12.8%2C80.3%2C19.2&layer=mapnik`}
              />
            </div>
          </div>
        ) : (
          <div className="rooms-grid-main">
            {rooms.map(room => (
              <RoomCard key={room._id} room={room} stressInfo={stressMap[room._id]} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
