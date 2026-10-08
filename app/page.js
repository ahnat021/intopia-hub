'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [period, setPeriod] = useState('Loading...');
  const [tradingOpen, setTradingOpen] = useState(false);
  const [listings, setListings] = useState([]);
  const [teamsList, setTeamsList] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Filter State
  const [filterType, setFilterType] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');

  // Form State
  const [formTeamId, setFormTeamId] = useState('');
  const [formPin, setFormPin] = useState('');
  const [formType, setFormType] = useState('BUY');
  const [formCategory, setFormCategory] = useState('Product X');
  const [formQuantity, setFormQuantity] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formRegion, setFormRegion] = useState('Global');

  async function fetchData() {
    const { data: clockData } = await supabase.from('simulation_state').select('*').single();
    if (clockData) {
      setPeriod(clockData.current_period);
      setTradingOpen(clockData.trading_status);
    }

    const { data: listingsData } = await supabase
      .from('listings')
      .select(`*, teams ( team_number )`)
      .order('created_at', { ascending: false });
    if (listingsData) setListings(listingsData);

    const { data: teamsData } = await supabase
      .from('teams')
      .select('*')
      .order('reputation_score', { ascending: false });
    if (teamsData) {
      setTeamsList(teamsData);
      if (teamsData.length > 0 && !formTeamId) setFormTeamId(teamsData[0].id);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function submitOrder() {
    // 1. Verify Security PIN
    const selectedTeam = teamsList.find(t => t.id === formTeamId);
    if (!selectedTeam || selectedTeam.pin_code !== formPin) {
      alert("Unauthorized: Incorrect Team PIN.");
      return;
    }

    // 2. Submit to Database
    const { error } = await supabase.from('listings').insert({
      team_id: formTeamId,
      type: formType,
      category: formCategory,
      quantity: parseInt(formQuantity) || 0,
      price_per_unit: parseFloat(formPrice) || 0,
      region: formRegion,
      target_period: period
    });

    if (error) {
      alert("Error posting trade: " + error.message);
    } else {
      setShowModal(false);
      setFormQuantity('');
      setFormPrice('');
      setFormPin('');
      fetchData();
    }
  }

  // Apply active filters to the data
  const filteredListings = listings.filter(listing => {
    const matchType = filterType === 'ALL' || listing.type === filterType;
    const matchCategory = filterCategory === 'ALL' || listing.category === filterCategory;
    return matchType && matchCategory;
  });

  return (
    <div style={{ backgroundColor: '#0B132B', color: 'white', minHeight: '100vh', padding: '32px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1C2541', paddingBottom: '20px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '26px' }}>INTOPIA HUB</h1>
          <p style={{ color: '#8892B0', margin: '4px 0 0 0', fontSize: '14px' }}>The central marketplace for the Intopia economy.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ margin: 0, color: '#48CAE4', fontSize: '20px' }}>CURRENT PERIOD: {period}</h2>
          <span style={{ backgroundColor: tradingOpen ? '#2D6A4F' : '#780000', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
            {tradingOpen ? '✓ Trading Open' : '✕ Trading Closed'}
          </span>
        </div>
      </header>

      {/* MAIN GRID LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '24px' }}>
        
        {/* LEFT COLUMN: Actions & Marketplace */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <button 
              onClick={() => setShowModal(true)}
              style={{ padding: '12px 20px', backgroundColor: '#4361EE', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              + Post a Need / Offer
            </button>
            
            {/* Filter Controls */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ padding: '8px', backgroundColor: '#1C2541', color: 'white', border: '1px solid #3A506B', borderRadius: '4px' }}>
                <option value="ALL">All Types</option>
                <option value="BUY">Buy Offers</option>
                <option value="SELL">Sell Offers</option>
              </select>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ padding: '8px', backgroundColor: '#1C2541', color: 'white', border: '1px solid #3A506B', borderRadius: '4px' }}>
                <option value="ALL">All Categories</option>
                <option value="Product X">Product X</option>
                <option value="Product Y">Product Y</option>
                <option value="Market Intel">Market Intel</option>
              </select>
            </div>
          </div>

          {/* LIVE MARKETPLACE TABLE */}
          <div style={{ backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #1C2541', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#111827', color: '#8892B0', borderBottom: '1px solid #1C2541' }}>
                  <th style={{ padding: '12px 20px' }}>Team</th>
                  <th style={{ padding: '12px 20px' }}>Type</th>
                  <th style={{ padding: '12px 20px' }}>Product</th>
                  <th style={{ padding: '12px 20px' }}>Qty</th>
                  <th style={{ padding: '12px 20px' }}>Price</th>
                  <th style={{ padding: '12px 20px' }}>Region</th>
                </tr>
              </thead>
              <tbody>
                {filteredListings.length === 0 ? (
                  <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#5C6B89' }}>No active listings match your filters.</td></tr>
                ) : (
                  filteredListings.map((listing) => (
                    <tr key={listing.id} style={{ borderBottom: '1px solid #1C2541' }}>
                      <td style={{ padding: '12px 20px', fontWeight: 'bold' }}>Team {listing.teams?.team_number || '?'}</td>
                      <td style={{ padding: '12px 20px', color: listing.type === 'BUY' ? '#EF4444' : '#10B981', fontWeight: 'bold' }}>{listing.type}</td>
                      <td style={{ padding: '12px 20px' }}>{listing.category}</td>
                      <td style={{ padding: '12px 20px' }}>{listing.quantity?.toLocaleString()}</td>
                      <td style={{ padding: '12px 20px' }}>${listing.price_per_unit}</td>
                      <td style={{ padding: '12px 20px', color: '#8892B0' }}>{listing.region}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebars */}
        <div>
          {/* SPORTSMANSHIP LEADERBOARD */}
          <div style={{ backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #1C2541', padding: '20px', marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#48CAE4' }}>🏆 Trust & Reputation</h3>
            {teamsList.length === 0 ? (
              <p style={{ color: '#5C6B89', fontSize: '14px', margin: 0 }}>No teams registered.</p>
            ) : (
              teamsList.map((team, index) => (
                <div key={team.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: index !== teamsList.length - 1 ? '1px solid #1C2541' : 'none' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Team {team.team_number}</span>
                  <span style={{ backgroundColor: '#1C2541', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: '#34D399' }}>
                    {team.reputation_score}% Trust
                  </span>
                </div>
              ))
            )}
          </div>

          {/* MARKET PULSE WIDGET */}
          <div style={{ backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #1C2541', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#48CAE4' }}>📊 Market Pulse</h3>
            <p style={{ color: '#8892B0', fontSize: '13px', margin: '0 0 10px 0' }}>Total Active Listings: <strong style={{ color: 'white' }}>{listings.length}</strong></p>
            <p style={{ color: '#8892B0', fontSize: '13px', margin: 0 }}>Highest Demand: <strong style={{ color: 'white' }}>Product X</strong></p>
          </div>
        </div>

      </div>

      {/* SECURE POP-UP MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#1C2541', padding: '30px', borderRadius: '8px', width: '400px' }}>
            <h2 style={{ marginTop: 0 }}>Create a Listing</h2>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', color: '#8892B0', fontSize: '14px', marginBottom: '4px' }}>Your Team</label>
                <select value={formTeamId} onChange={(e) => setFormTeamId(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#0B132B', color: 'white', border: '1px solid #3A506B' }}>
                  {teamsList.map(team => <option key={team.id} value={team.id}>Team {team.team_number}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: '#EF4444', fontSize: '14px', marginBottom: '4px' }}>Auth PIN</label>
                <input type="password" value={formPin} onChange={(e) => setFormPin(e.target.value)} placeholder="0000" maxLength="4" style={{ width: '100%', padding: '10px', backgroundColor: '#0B132B', color: 'white', border: '1px solid #EF4444', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: '#8892B0', fontSize: '14px', marginBottom: '4px' }}>Type</label>
                <select value={formType} onChange={(e) => setFormType(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#0B132B', color: 'white', border: '1px solid #3A506B' }}>
                  <option>BUY</option>
                  <option>SELL</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: '#8892B0', fontSize: '14px', marginBottom: '4px' }}>Category</label>
                <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#0B132B', color: 'white', border: '1px solid #3A506B' }}>
                  <option>Product X</option>
                  <option>Product Y</option>
                  <option>Market Intel</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: '#8892B0', fontSize: '14px', marginBottom: '4px' }}>Quantity</label>
                <input type="number" value={formQuantity} onChange={(e) => setFormQuantity(e.target.value)} placeholder="e.g. 50000" style={{ width: '100%', padding: '10px', backgroundColor: '#0B132B', color: 'white', border: '1px solid #3A506B', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: '#8892B0', fontSize: '14px', marginBottom: '4px' }}>Price per unit ($)</label>
                <input type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="e.g. 45" style={{ width: '100%', padding: '10px', backgroundColor: '#0B132B', color: 'white', border: '1px solid #3A506B', boxSizing: 'border-box' }} />
              </div>
            </div>

            <label style={{ display: 'block', color: '#8892B0', fontSize: '14px', marginBottom: '4px' }}>Target Region</label>
            <select value={formRegion} onChange={(e) => setFormRegion(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '20px', backgroundColor: '#0B132B', color: 'white', border: '1px solid #3A506B' }}>
              <option>Global</option>
              <option>North America</option>
              <option>Europe</option>
              <option>China</option>
            </select>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', color: 'white', border: '1px solid #5C6B89', cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitOrder} style={{ flex: 1, padding: '10px', backgroundColor: '#4361EE', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Submit Order</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
