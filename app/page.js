'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [period, setPeriod] = useState('Loading...');
  const [tradingOpen, setTradingOpen] = useState(false);
  const [listings, setListings] = useState([]);
  const [teamsList, setTeamsList] = useState([]);
  
  // Modals
  const [showPostModal, setShowPostModal] = useState(false);
  const [actionListing, setActionListing] = useState(null); // Which listing is being cancelled/filled
  const [actionType, setActionType] = useState(''); // 'FILL' or 'DELETE'
  const [showAdminModal, setShowAdminModal] = useState(false);
  
  // States for inputs
  const [filterType, setFilterType] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [formTeamId, setFormTeamId] = useState('');
  const [formPin, setFormPin] = useState('');
  const [formType, setFormType] = useState('BUY');
  const [formCategory, setFormCategory] = useState('Product X');
  const [formQuantity, setFormQuantity] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formRegion, setFormRegion] = useState('Global');
  
  // Admin States
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminPeriodInput, setAdminPeriodInput] = useState('');
  const [adminTradingOpen, setAdminTradingOpen] = useState(false);

  async function fetchData() {
    const { data: clockData } = await supabase.from('simulation_state').select('*').single();
    if (clockData) {
      setPeriod(clockData.current_period);
      setTradingOpen(clockData.trading_status);
      setAdminPeriodInput(clockData.current_period);
      setAdminTradingOpen(clockData.trading_status);
    }

    const { data: listingsData } = await supabase
      .from('listings')
      .select(`*, teams ( team_number )`)
      .order('created_at', { ascending: false });
    if (listingsData) setListings(listingsData);

    const { data: teamsData } = await supabase.from('teams').select('*').order('reputation_score', { ascending: false });
    if (teamsData) {
      setTeamsList(teamsData);
      if (teamsData.length > 0 && !formTeamId) setFormTeamId(teamsData[0].id);
    }
  }

  useEffect(() => { fetchData(); }, []);

  // 1. Post a new order
  async function submitOrder() {
    const selectedTeam = teamsList.find(t => t.id === formTeamId);
    if (!isAdmin && (!selectedTeam || selectedTeam.pin_code !== formPin)) {
      return alert("Unauthorized: Incorrect Team PIN.");
    }

    const { error } = await supabase.from('listings').insert({
      team_id: formTeamId, type: formType, category: formCategory,
      quantity: parseInt(formQuantity) || 0, price_per_unit: parseFloat(formPrice) || 0,
      region: formRegion, target_period: period
    });

    if (!error) {
      setShowPostModal(false); setFormQuantity(''); setFormPrice(''); setFormPin(''); fetchData();
    } else alert("Error: " + error.message);
  }

  // 2. Modify an existing order (Fill or Cancel)
  async function executeListingAction() {
    if (!isAdmin) {
      const selectedTeam = teamsList.find(t => t.id === actionListing.team_id);
      if (!selectedTeam || selectedTeam.pin_code !== formPin) {
        return alert("Unauthorized: Incorrect Team PIN.");
      }
    }

    if (actionType === 'FILL') {
      await supabase.from('listings').update({ status: 'FILLED' }).eq('id', actionListing.id);
    } else if (actionType === 'DELETE') {
      await supabase.from('listings').delete().eq('id', actionListing.id);
    }
    
    setActionListing(null); setFormPin(''); fetchData();
  }

  // 3. Admin Tools
  function handleAdminLogin() {
    if (adminPasswordInput === '9999') {
      setIsAdmin(true);
      setAdminPasswordInput('');
    } else alert("Incorrect Admin Password.");
  }

  async function saveAdminSettings() {
    await supabase.from('simulation_state').update({
      current_period: adminPeriodInput,
      trading_status: adminTradingOpen
    }).eq('id', 1);
    setShowAdminModal(false);
    fetchData();
  }

  const filteredListings = listings.filter(l => (filterType === 'ALL' || l.type === filterType) && (filterCategory === 'ALL' || l.category === filterCategory));

  return (
    <div style={{ backgroundColor: '#0B132B', color: 'white', minHeight: '100vh', padding: '32px', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1C2541', paddingBottom: '20px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '26px' }}>INTOPIA HUB</h1>
          <p style={{ color: '#8892B0', margin: '4px 0 0 0', fontSize: '14px' }}>The central marketplace for the Intopia economy.</p>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div>
            <h2 style={{ margin: 0, color: '#48CAE4', fontSize: '20px' }}>CURRENT PERIOD: {period}</h2>
            <span style={{ backgroundColor: tradingOpen ? '#2D6A4F' : '#780000', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
              {tradingOpen ? '✓ Trading Open' : '✕ Trading Closed'}
            </span>
          </div>
          <button onClick={() => setShowAdminModal(true)} style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px' }} title="Admin Panel">🔒</button>
        </div>
      </header>

      {/* ADMIN BADGE */}
      {isAdmin && (
        <div style={{ backgroundColor: '#B91C1C', padding: '8px 16px', borderRadius: '6px', marginBottom: '20px', display: 'inline-block', fontWeight: 'bold', fontSize: '14px' }}>
          ⚠️ ADMIN MODE ACTIVE (Bypassing PINs)
        </div>
      )}

      {/* MAIN GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '24px' }}>
        
        {/* LEFT COLUMN: Actions & Marketplace */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <button onClick={() => setShowPostModal(true)} style={{ padding: '12px 20px', backgroundColor: '#4361EE', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              + Post a Need / Offer
            </button>
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

          <div style={{ backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #1C2541', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#111827', color: '#8892B0', borderBottom: '1px solid #1C2541' }}>
                  <th style={{ padding: '12px 20px' }}>Team</th>
                  <th style={{ padding: '12px 20px' }}>Type</th>
                  <th style={{ padding: '12px 20px' }}>Product</th>
                  <th style={{ padding: '12px 20px' }}>Qty & Price</th>
                  <th style={{ padding: '12px 20px' }}>Status</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredListings.length === 0 ? (
                  <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#5C6B89' }}>No active listings.</td></tr>
                ) : (
                  filteredListings.map((l) => (
                    <tr key={l.id} style={{ borderBottom: '1px solid #1C2541', opacity: l.status === 'FILLED' ? 0.5 : 1 }}>
                      <td style={{ padding: '12px 20px', fontWeight: 'bold' }}>Team {l.teams?.team_number || '?'}</td>
                      <td style={{ padding: '12px 20px', color: l.type === 'BUY' ? '#EF4444' : '#10B981', fontWeight: 'bold' }}>{l.type}</td>
                      <td style={{ padding: '12px 20px' }}>{l.category} <br/><span style={{fontSize: '11px', color: '#8892B0'}}>{l.region}</span></td>
                      <td style={{ padding: '12px 20px' }}>{l.quantity?.toLocaleString()} @ ${l.price_per_unit}</td>
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{ backgroundColor: l.status === 'OPEN' ? '#064E3B' : '#374151', color: l.status === 'OPEN' ? '#34D399' : '#9CA3AF', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                          {l.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                        {l.status === 'OPEN' && (
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button onClick={() => { setActionListing(l); setActionType('FILL'); }} style={{ padding: '6px 10px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>✓ Fill</button>
                            <button onClick={() => { setActionListing(l); setActionType('DELETE'); }} style={{ padding: '6px 10px', backgroundColor: '#DC2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>✕ Drop</button>
                          </div>
                        )}
                        {l.status === 'FILLED' && isAdmin && (
                           <button onClick={() => { setActionListing(l); setActionType('DELETE'); }} style={{ padding: '4px 8px', backgroundColor: 'transparent', color: '#DC2626', border: '1px solid #DC2626', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Delete Record</button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div>
          <div style={{ backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #1C2541', padding: '20px', marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#48CAE4' }}>🏆 Trust & Reputation</h3>
            {teamsList.map((t, i) => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i !== teamsList.length - 1 ? '1px solid #1C2541' : 'none' }}>
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Team {t.team_number}</span>
                <span style={{ backgroundColor: '#1C2541', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: '#34D399' }}>{t.reputation_score}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* POST MODAL */}
      {showPostModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#1C2541', padding: '30px', borderRadius: '8px', width: '400px' }}>
            <h2 style={{ marginTop: 0 }}>Create a Listing</h2>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', color: '#8892B0', fontSize: '14px', marginBottom: '4px' }}>Your Team</label>
                <select value={formTeamId} onChange={(e) => setFormTeamId(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#0B132B', color: 'white', border: '1px solid #3A506B' }}>
                  {teamsList.map(t => <option key={t.id} value={t.id}>Team {t.team_number}</option>)}
                </select>
              </div>
              {!isAdmin && (
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', color: '#EF4444', fontSize: '14px', marginBottom: '4px' }}>PIN</label>
                  <input type="password" value={formPin} onChange={(e) => setFormPin(e.target.value)} placeholder="0000" maxLength="4" style={{ width: '100%', padding: '10px', backgroundColor: '#0B132B', color: 'white', border: '1px solid #EF4444', boxSizing: 'border-box' }} />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: '#8892B0', fontSize: '14px', marginBottom: '4px' }}>Type</label>
                <select value={formType} onChange={(e) => setFormType(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#0B132B', color: 'white', border: '1px solid #3A506B' }}>
                  <option>BUY</option><option>SELL</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: '#8892B0', fontSize: '14px', marginBottom: '4px' }}>Category</label>
                <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#0B132B', color: 'white', border: '1px solid #3A506B' }}>
                  <option>Product X</option><option>Product Y</option><option>Market Intel</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: '#8892B0', fontSize: '14px', marginBottom: '4px' }}>Quantity</label>
                <input type="number" value={formQuantity} onChange={(e) => setFormQuantity(e.target.value)} placeholder="50000" style={{ width: '100%', padding: '10px', backgroundColor: '#0B132B', color: 'white', border: '1px solid #3A506B', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: '#8892B0', fontSize: '14px', marginBottom: '4px' }}>Price ($)</label>
                <input type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="45" style={{ width: '100%', padding: '10px', backgroundColor: '#0B132B', color: 'white', border: '1px solid #3A506B', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowPostModal(false)} style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', color: 'white', border: '1px solid #5C6B89', cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitOrder} style={{ flex: 1, padding: '10px', backgroundColor: '#4361EE', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* ACTION CONFIRMATION MODAL (FILL / DELETE) */}
      {actionListing && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#1C2541', padding: '30px', borderRadius: '8px', width: '350px', textAlign: 'center' }}>
            <h3 style={{ marginTop: 0 }}>{actionType === 'FILL' ? 'Mark Order as Filled?' : 'Drop this Order?'}</h3>
            <p style={{ color: '#8892B0', fontSize: '14px', marginBottom: '20px' }}>
              Team {actionListing.teams?.team_number} • {actionListing.type} {actionListing.quantity} {actionListing.category}
            </p>
            
            {!isAdmin && (
              <input type="password" value={formPin} onChange={(e) => setFormPin(e.target.value)} placeholder="Enter Team PIN to confirm" maxLength="4" style={{ width: '100%', padding: '12px', marginBottom: '20px', backgroundColor: '#0B132B', color: 'white', border: '1px solid #EF4444', textAlign: 'center', letterSpacing: '4px', boxSizing: 'border-box' }} />
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setActionListing(null); setFormPin(''); }} style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', color: 'white', border: '1px solid #5C6B89', cursor: 'pointer' }}>Cancel</button>
              <button onClick={executeListingAction} style={{ flex: 1, padding: '10px', backgroundColor: actionType === 'FILL' ? '#059669' : '#DC2626', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN CONTROL PANEL MODAL */}
      {showAdminModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: '#1C2541', padding: '30px', borderRadius: '8px', width: '350px' }}>
            <h2 style={{ marginTop: 0, color: '#48CAE4' }}>🔒 Admin Override</h2>
            
            {!isAdmin ? (
              <>
                <p style={{ color: '#8892B0', fontSize: '14px' }}>Enter Master Password:</p>
                <input type="password" value={adminPasswordInput} onChange={(e) => setAdminPasswordInput(e.target.value)} placeholder="Password" style={{ width: '100%', padding: '12px', marginBottom: '20px', backgroundColor: '#0B132B', color: 'white', border: '1px solid #3A506B', boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setShowAdminModal(false)} style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', color: 'white', border: '1px solid #5C6B89', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleAdminLogin} style={{ flex: 1, padding: '10px', backgroundColor: '#4361EE', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Log In</button>
                </div>
              </>
            ) : (
              <>
                <label style={{ display: 'block', color: '#8892B0', fontSize: '14px', marginBottom: '4px' }}>Change Current Period</label>
                <input type="text" value={adminPeriodInput} onChange={(e) => setAdminPeriodInput(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '15px', backgroundColor: '#0B132B', color: 'white', border: '1px solid #3A506B', boxSizing: 'border-box' }} />
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '24px' }}>
                  <input type="checkbox" checked={adminTradingOpen} onChange={(e) => setAdminTradingOpen(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                  <span style={{ fontSize: '15px', fontWeight: 'bold', color: adminTradingOpen ? '#34D399' : '#EF4444' }}>
                    {adminTradingOpen ? '🟢 TRADING IS OPEN' : '🔴 TRADING IS CLOSED'}
                  </span>
                </label>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setShowAdminModal(false)} style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', color: 'white', border: '1px solid #5C6B89', cursor: 'pointer' }}>Close Panel</button>
                  <button onClick={saveAdminSettings} style={{ flex: 1, padding: '10px', backgroundColor: '#059669', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Save Game State</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
