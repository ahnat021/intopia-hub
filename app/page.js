'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [period, setPeriod] = useState('Loading...');
  const [tradingOpen, setTradingOpen] = useState(false);
  const [listings, setListings] = useState([]);
  const [teamsList, setTeamsList] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [formTeamId, setFormTeamId] = useState('');
  const [formType, setFormType] = useState('BUY');
  const [formCategory, setFormCategory] = useState('Product X');
  const [formQuantity, setFormQuantity] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formRegion, setFormRegion] = useState('Global');

  async function fetchData() {
    // 1. Fetch clock
    const { data: clockData } = await supabase.from('simulation_state').select('*').single();
    if (clockData) {
      setPeriod(clockData.current_period);
      setTradingOpen(clockData.trading_status);
    }

    // 2. Fetch live listings
    const { data: listingsData } = await supabase
      .from('listings')
      .select(`*, teams ( team_number )`)
      .order('created_at', { ascending: false });
    if (listingsData) setListings(listingsData);

    // 3. Fetch registered teams for the dropdown
    const { data: teamsData } = await supabase.from('teams').select('*').order('team_number');
    if (teamsData) {
      setTeamsList(teamsData);
      if (teamsData.length > 0 && !formTeamId) setFormTeamId(teamsData[0].id);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function submitOrder() {
    // Write the new row to Supabase
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
      setShowModal(false);     // Close the pop-up
      setFormQuantity('');     // Clear the inputs
      setFormPrice('');
      fetchData();             // Refresh the table instantly
    }
  }

  return (
    <div style={{ backgroundColor: '#0B132B', color: 'white', minHeight: '100vh', padding: '32px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1C2541', paddingBottom: '20px' }}>
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

      {/* ACTION BUTTONS */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '28px', marginBottom: '32px' }}>
        <button 
          onClick={() => setShowModal(true)}
          style={{ padding: '12px 20px', backgroundColor: '#4361EE', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          🛒 Post a Need / Offer
        </button>
      </div>

      {/* LIVE MARKETPLACE TABLE */}
      <div style={{ backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #1C2541', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#111827', color: '#8892B0', borderBottom: '1px solid #1C2541' }}>
              <th style={{ padding: '12px 20px' }}>Team</th>
              <th style={{ padding: '12px 20px' }}>Type</th>
              <th style={{ padding: '12px 20px' }}>Product</th>
              <th style={{ padding: '12px 20px' }}>Quantity</th>
              <th style={{ padding: '12px 20px' }}>Price</th>
              <th style={{ padding: '12px 20px' }}>Region</th>
            </tr>
          </thead>
          <tbody>
            {listings.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#5C6B89' }}>No active listings.</td></tr>
            ) : (
              listings.map((listing) => (
                <tr key={listing.id} style={{ borderBottom: '1px solid #1C2541' }}>
                  <td style={{ padding: '12px 20px', fontWeight: 'bold' }}>Team {listing.teams?.team_number || '?'}</td>
                  <td style={{ padding: '12px 20px', color: listing.type === 'BUY' ? '#EF4444' : '#10B981' }}>{listing.type}</td>
                  <td style={{ padding: '12px 20px' }}>{listing.category}</td>
                  <td style={{ padding: '12px 20px' }}>{listing.quantity?.toLocaleString()}</td>
                  <td style={{ padding: '12px 20px' }}>${listing.price_per_unit}</td>
                  <td style={{ padding: '12px 20px' }}>{listing.region}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* POP-UP MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#1C2541', padding: '30px', borderRadius: '8px', width: '400px' }}>
            <h2 style={{ marginTop: 0 }}>Create a Listing</h2>
            
            <label style={{ display: 'block', color: '#8892B0', fontSize: '14px', marginBottom: '4px' }}>Your Team</label>
            <select value={formTeamId} onChange={(e) => setFormTeamId(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '15px', backgroundColor: '#0B132B', color: 'white', border: '1px solid #3A506B' }}>
              {teamsList.map(team => (
                <option key={team.id} value={team.id}>Team {team.team_number}</option>
              ))}
            </select>

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
