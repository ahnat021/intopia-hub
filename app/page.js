'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [period, setPeriod] = useState('Loading...');
  const [tradingOpen, setTradingOpen] = useState(false);
  const [listings, setListings] = useState([]);

  useEffect(() => {
    async function fetchData() {
      // 1. Fetch the simulation clock
      const { data: clockData } = await supabase
        .from('simulation_state')
        .select('*')
        .single();

      if (clockData) {
        setPeriod(clockData.current_period);
        setTradingOpen(clockData.trading_status);
      }

      // 2. Fetch the Live Marketplace Listings (and join with the teams table to get team numbers)
      const { data: listingsData, error } = await supabase
        .from('listings')
        .select(`
          *,
          teams ( team_number, contact_handle )
        `)
        .order('created_at', { ascending: false });

      if (listingsData) {
        setListings(listingsData);
      } else {
        console.error("Error fetching listings:", error);
      }
    }
    
    fetchData();
  }, []);

  return (
    <div style={{ backgroundColor: '#0B132B', color: 'white', minHeight: '100vh', padding: '32px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* HEADER SECTION */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1C2541', paddingBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '26px', letterSpacing: '1px' }}>INTOPIA HUB</h1>
          <p style={{ color: '#8892B0', margin: '4px 0 0 0', fontSize: '14px' }}>The central marketplace for the Intopia economy.</p>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ margin: 0, color: '#48CAE4', fontSize: '20px' }}>CURRENT PERIOD: {period}</h2>
          <span style={{ 
            display: 'inline-block',
            marginTop: '6px',
            backgroundColor: tradingOpen ? '#2D6A4F' : '#780000', 
            padding: '4px 12px', 
            borderRadius: '4px', 
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {tradingOpen ? '✓ Trading Open' : '✕ Trading Closed'}
          </span>
        </div>
      </header>

      {/* ACTION BUTTONS */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '28px', marginBottom: '32px' }}>
        <button style={{ padding: '12px 20px', backgroundColor: '#4361EE', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          🛒 Post a Need / Offer
        </button>
        <button style={{ padding: '12px 20px', backgroundColor: '#1C2541', color: 'white', border: '1px solid #3A506B', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          🤝 Find a Partner
        </button>
      </div>

      {/* LIVE MARKETPLACE TABLE */}
      <div style={{ backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #1C2541', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1C2541', backgroundColor: '#1F2937' }}>
          <h3 style={{ margin: 0, fontSize: '18px' }}>Live Marketplace</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#8892B0' }}>Real-time needs and offers from all teams.</p>
        </div>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#111827', color: '#8892B0', borderBottom: '1px solid #1C2541' }}>
              <th style={{ padding: '12px 20px' }}>Status</th>
              <th style={{ padding: '12px 20px' }}>Type</th>
              <th style={{ padding: '12px 20px' }}>Product/Category</th>
              <th style={{ padding: '12px 20px' }}>Quantity</th>
              <th style={{ padding: '12px 20px' }}>Price</th>
              <th style={{ padding: '12px 20px' }}>Region</th>
            </tr>
          </thead>
          <tbody>
            {listings.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#5C6B89' }}>
                  No active listings in the market. Be the first to post an offer!
                </td>
              </tr>
            ) : (
              listings.map((listing) => (
                <tr key={listing.id} style={{ borderBottom: '1px solid #1C2541' }}>
                  <td style={{ padding: '12px 20px' }}>
                    <span style={{ backgroundColor: '#064E3B', color: '#34D399', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{listing.status}</span>
                  </td>
                  <td style={{ padding: '12px 20px', fontWeight: 'bold', color: listing.type === 'BUY' ? '#EF4444' : '#10B981' }}>{listing.type}</td>
                  <td style={{ padding: '12px 20px' }}>{listing.category}</td>
                  <td style={{ padding: '12px 20px' }}>{listing.quantity ? listing.quantity.toLocaleString() : '-'}</td>
                  <td style={{ padding: '12px 20px' }}>{listing.price_per_unit ? `$${listing.price_per_unit}` : 'Negotiable'}</td>
                  <td style={{ padding: '12px 20px' }}>{listing.region}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
