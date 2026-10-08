'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [period, setPeriod] = useState('Loading...');
  const [tradingOpen, setTradingOpen] = useState(false);
  const [listings, setListings] = useState([]);
  const [teamsList, setTeamsList] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  
  // Session & UI
  const [activeTeam, setActiveTeam] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState('MARKET');
  
  // Modal Toggles
  const [showPostModal, setShowPostModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  
  // Action States (Fill / Delete)
  const [actionListing, setActionListing] = useState(null);
  const [actionType, setActionType] = useState('');
  const [counterpartyId, setCounterpartyId] = useState('');
  const [rating, setRating] = useState('5');
  
  // Form States
  const [filterType, setFilterType] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [formTeamId, setFormTeamId] = useState('');
  const [formPin, setFormPin] = useState('');
  const [formType, setFormType] = useState('BUY');
  const [formCategory, setFormCategory] = useState('Product X');
  const [formQuantity, setFormQuantity] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formRegion, setFormRegion] = useState('Global');
  const [formNotes, setFormNotes] = useState('');
  
  // Admin States
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminPeriodInput, setAdminPeriodInput] = useState('');
  const [adminTradingOpen, setAdminTradingOpen] = useState(false);
  const [adminAnnouncement, setAdminAnnouncement] = useState('');

  async function fetchData() {
    const { data: clockData } = await supabase.from('simulation_state').select('*').single();
    if (clockData) {
      setPeriod(clockData.current_period);
      setTradingOpen(clockData.trading_status);
      setAdminPeriodInput(clockData.current_period);
      setAdminTradingOpen(clockData.trading_status);
    }
    const { data: listingsData } = await supabase.from('listings').select('*, teams ( team_number, contact_handle )').order('created_at', { ascending: false });
    if (listingsData) setListings(listingsData);
    
    const { data: teamsData } = await supabase.from('teams').select('*').order('reputation_score', { ascending: false });
    if (teamsData) {
      setTeamsList(teamsData);
      if (teamsData.length > 0 && !formTeamId) setFormTeamId(teamsData[0].id);
    }
    
    const { data: newsData } = await supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(3);
    if (newsData) setAnnouncements(newsData);
  }

  useEffect(() => { 
    fetchData(); 
    const channel = supabase.channel('public-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'simulation_state' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  function handleLogin() {
    const selectedTeam = teamsList.find(t => t.id === formTeamId);
    if (selectedTeam && selectedTeam.pin_code === formPin) {
      setActiveTeam(selectedTeam); 
      setShowLoginModal(false); 
      setFormPin('');
    } else {
      alert("Incorrect PIN.");
    }
  }

  async function submitOrder() {
    const teamToUse = activeTeam ? activeTeam.id : formTeamId;
    if (!isAdmin && !activeTeam) {
      const selectedTeam = teamsList.find(t => t.id === teamToUse);
      if (!selectedTeam || selectedTeam.pin_code !== formPin) return alert("Unauthorized: Incorrect Team PIN.");
    }
    const { error } = await supabase.from('listings').insert({
      team_id: teamToUse, type: formType, category: formCategory,
      quantity: parseInt(formQuantity) || 0, price_per_unit: parseFloat(formPrice) || 0,
      region: formRegion, target_period: period, contract_terms: { notes: formNotes }
    });
    if (!error) { 
      setShowPostModal(false); setFormQuantity(''); setFormPrice(''); setFormNotes(''); setFormPin(''); 
    } else alert("Error: " + error.message);
  }

  async function executeListingAction() {
    const isOwner = activeTeam && activeTeam.id === actionListing.team_id;
    if (!isAdmin && !isOwner) {
      const selectedTeam = teamsList.find(t => t.id === actionListing.team_id);
      if (!selectedTeam || selectedTeam.pin_code !== formPin) return alert("Unauthorized: Incorrect PIN.");
    }
    
    if (actionType === 'FILL') {
      if (!counterpartyId) return alert("Please select the team you traded with.");
      
      // 1. Mark filled
      await supabase.from('listings').update({ status: 'FILLED' }).eq('id', actionListing.id);
      
      // 2. Write to Ledger
      await supabase.from('transactions').insert({
        listing_id: actionListing.id, 
        buyer_id: actionListing.type === 'SELL' ? counterpartyId : actionListing.team_id,
        seller_id: actionListing.type === 'BUY' ? counterpartyId : actionListing.team_id,
        price: actionListing.price_per_unit, 
        quantity: actionListing.quantity, 
        rating: parseInt(rating)
      });

      // 3. Trust Math
      const targetTeam = teamsList.find(t => t.id === counterpartyId);
      if (targetTeam) {
        let adjustment = 0;
        if (rating === '5') adjustment = 2;
        if (rating === '3') adjustment = -5;
        if (rating === '2') adjustment = -15;
        if (rating === '1') adjustment = -25;
        
        const newScore = Math.min(100, Math.max(0, targetTeam.reputation_score + adjustment));
        await supabase.from('teams').update({ reputation_score: newScore }).eq('id', counterpartyId);
      }
    } else if (actionType === 'DELETE') {
      await supabase.from('listings').delete().eq('id', actionListing.id);
    }
    setActionListing(null); setFormPin(''); setCounterpartyId(''); setRating('5');
  }

  function handleAdminLogin() {
    if (adminPasswordInput === '9999') { 
      setIsAdmin(true); setActiveTeam(null); setAdminPasswordInput(''); setShowAdminModal(false);
    } else alert("Incorrect Admin Password.");
  }

  async function saveAdminSettings() {
    await supabase.from('simulation_state').update({ current_period: adminPeriodInput, trading_status: adminTradingOpen }).eq('id', 1);
    if (adminAnnouncement.trim() !== '') {
      await supabase.from('announcements').insert({ type: 'ALERT', message: adminAnnouncement });
      setAdminAnnouncement('');
    }
    setShowAdminModal(false);
  }

  const activeListings = listings.filter(l => l.status === 'OPEN' && (filterType === 'ALL' || l.type === filterType) && (filterCategory === 'ALL' || l.category === filterCategory));
  const filledListings = listings.filter(l => l.status === 'FILLED');

  return (
    <div style={{ backgroundColor: '#0B132B', color: 'white', minHeight: '100vh', padding: '0 0 32px 0', fontFamily: 'system-ui, sans-serif' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .responsive-grid { display: grid; grid-template-columns: 2.5fr 1fr; gap: 24px; padding: 0 32px; }
        @media (max-width: 900px) { .responsive-grid { grid-template-columns: 1fr; padding: 0 16px; } }
        .tab-btn { padding: 12px 24px; font-weight: bold; cursor: pointer; border-radius: 6px 6px 0 0; border: none; }
        .tab-active { background-color: #111827; color: #48CAE4; border-bottom: 3px solid #48CAE4; }
        .tab-inactive { background-color: transparent; color: #5C6B89; border-bottom: 3px solid transparent; }
        .news-ticker { background-color: #1C2541; padding: 8px 32px; display: flex; gap: 20px; overflow-x: auto; white-space: nowrap; font-size: 13px; border-bottom: 1px solid #3A506B; }
      `}} />

      {announcements.length > 0 && (
        <div className="news-ticker">
          <strong style={{ color: '#F59E0B' }}>BREAKING NEWS:</strong>
          {announcements.map(a => <span key={a.id} style={{ marginRight: '30px' }}>• {a.message}</span>)}
        </div>
      )}

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1C2541', padding: '20px 32px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '26px' }}>INTOPIA HUB</h1>
          <p style={{ color: '#8892B0', margin: '4px 0 0 0', fontSize: '14px' }}>The central marketplace for the Intopia economy.</p>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '20px' }}>
          {activeTeam ? (
            <div style={{ textAlign: 'right', borderRight: '1px solid #3A506B', paddingRight: '20px' }}>
              <div style={{ fontSize: '12px', color: '#8892B0' }}>Logged in as</div>
              <strong style={{ color: '#34D399' }}>Team {activeTeam.team_number}</strong>
              <button onClick={() => setActiveTeam(null)} style={{ display: 'block', background: 'none', border: 'none', color: '#EF4444', fontSize: '11px', padding: 0, cursor: 'pointer', marginTop: '2px' }}>Sign Out</button>
            </div>
          ) : !isAdmin ? (
            <div style={{ borderRight: '1px solid #3A506B', paddingRight: '20px' }}>
              <button onClick={() => setShowLoginModal(true)} style={{ padding: '8px 16px', backgroundColor: '#1C2541', color: 'white', border: '1px solid #3A506B', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>Team Login</button>
            </div>
          ) : null}
          <div>
            <h2 style={{ margin: 0, color: '#48CAE4', fontSize: '20px' }}>CURRENT PERIOD: {period}</h2>
            <span style={{ backgroundColor: tradingOpen ? '#2D6A4F' : '#780000', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>{tradingOpen ? '✓ Trading Open' : '✕ Trading Closed'}</span>
          </div>
          <button onClick={() => setShowAdminModal(true)} style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px' }}>🔒</button>
        </div>
      </header>

      {isAdmin && <div style={{ backgroundColor: '#B91C1C', padding: '8px 16px', borderRadius: '6px', margin: '0 32px 20px 32px', display: 'inline-block', fontWeight: 'bold', fontSize: '14px' }}>⚠️ ADMIN MODE ACTIVE</div>}

      <div className="responsive-grid">
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #1C2541', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setView('MARKET')} className={`tab-btn ${view === 'MARKET' ? 'tab-active' : 'tab-inactive'}`}>📈 Live Market</button>
              <button onClick={() => setView('LEDGER')} className={`tab-btn ${view === 'LEDGER' ? 'tab-active' : 'tab-inactive'}`}>🏛️ Audit Ledger</button>
            </div>
            {view === 'MARKET' && (
              <div style={{ display: 'flex', gap: '8px', paddingBottom: '10px' }}>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ padding: '6px', backgroundColor: '#1C2541', color: 'white', border: '1px solid #3A506B', borderRadius: '4px', fontSize: '12px' }}><option value="ALL">All Types</option><option value="BUY">Buy</option><option value="SELL">Sell</option></select>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ padding: '6px', backgroundColor: '#1C2541', color: 'white', border: '1px solid #3A506B', borderRadius: '4px', fontSize: '12px' }}><option value="ALL">All Categories</option><option value="Product X">Product X</option><option value="Product Y">Product Y</option><option value="Market Intel">Market Intel</option></select>
              </div>
            )}
          </div>

          {view === 'MARKET' && <button onClick={() => setShowPostModal(true)} style={{ padding: '12px 20px', backgroundColor: '#4361EE', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '16px', width: '100%' }}>+ Post a Need / Offer</button>}

          <div style={{ backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #1C2541', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', minWidth: '700px' }}>
              <thead>
                <tr style={{ backgroundColor: '#111827', color: '#8892B0', borderBottom: '1px solid #1C2541' }}>
                  <th style={{ padding: '12px 20px' }}>Team</th><th style={{ padding: '12px 20px' }}>Type</th><th style={{ padding: '12px 20px' }}>Product</th><th style={{ padding: '12px 20px' }}>Qty & Price</th><th style={{ padding: '12px 20px' }}>Terms & Status</th><th style={{ padding: '12px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(view === 'MARKET' ? activeListings : filledListings).length === 0 ? (
                  <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#5C6B89' }}>No data found.</td></tr>
                ) : (
                  (view === 'MARKET' ? activeListings : filledListings).map((l) => (
                    <tr key={l.id} style={{ borderBottom: '1px solid #1C2541' }}>
                      <td style={{ padding: '12px 20px' }}><strong style={{ display: 'block' }}>Team {l.teams?.team_number || '?'}</strong><span style={{ fontSize: '11px', color: '#48CAE4' }}>{l.teams?.contact_handle || 'No contact info'}</span></td>
                      <td style={{ padding: '12px 20px', color: l.type === 'BUY' ? '#EF4444' : '#10B981', fontWeight: 'bold' }}>{l.type}</td>
                      <td style={{ padding: '12px 20px' }}>{l.category} <br/><span style={{fontSize: '11px', color: '#8892B0'}}>{l.region}</span></td>
                      <td style={{ padding: '12px 20px' }}>{l.quantity?.toLocaleString()} @ ${l.price_per_unit}</td>
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{ display: 'inline-block', marginBottom: '4px', backgroundColor: l.status === 'OPEN' ? '#064E3B' : '#1E3A8A', color: l.status === 'OPEN' ? '#34D399' : '#60A5FA', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{l.status}</span>
                        {l.contract_terms?.notes && <div style={{ fontSize: '11px', color: '#8892B0' }}>📝 {l.contract_terms.notes}</div>}
                      </td>
                      <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                        {view === 'MARKET' && (
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button onClick={() => { setActionListing(l); setActionType('FILL'); }} style={{ padding: '6px 10px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>✓ Fill</button>
                            {(isAdmin || (activeTeam && activeTeam.id === l.team_id)) && <button onClick={() => { setActionListing(l); setActionType('DELETE'); }} style={{ padding: '6px 10px', backgroundColor: '#DC2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>✕ Drop</button>}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div style={{ backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #1C2541', padding: '20px', marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#48CAE4' }}>🏆 Trust & Reputation</h3>
            {teamsList.map((t, i) => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i !== teamsList.length - 1 ? '1px solid #1C2541' : 'none' }}>
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Team {t.team_number}</span>
                <span style={{ backgroundColor: '#1C2541', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: t.reputation_score >= 100 ? '#34D399' : t.reputation_score < 80 ? '#EF4444' : '#F59E0B' }}>{t.reputation_score}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ACTION CONFIRMATION MODAL */}
      {actionListing && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '20px' }}>
          <div style={{ backgroundColor: '#1C2541', padding: '30px', borderRadius: '8px', width: '100%', maxWidth: '350px', textAlign: 'center' }}>
            <h3 style={{ marginTop: 0 }}>{actionType === 'FILL' ? 'Execute Trade' : 'Drop this Order?'}</h3>
            <p style={{ color: '#8892B0', fontSize: '14px', marginBottom: '20px' }}>Team {actionListing.teams?.team_number} • {actionListing.type} {actionListing.quantity} {actionListing.category}</p>
            
            {actionType === 'FILL' ? (
              <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#8892B0', fontSize: '14px', marginBottom: '4px' }}>Who did you trade with?</label>
                <select value={counterpartyId} onChange={(e) => setCounterpartyId(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '15px', backgroundColor: '#0B132B', color: 'white', border: '1px solid #3A506B' }}>
                  <option value="" disabled>Select Counterparty...</option>
                  {teamsList.filter(t => t.id !== actionListing.team_id).map(t => <option key={t.id} value={t.id}>Team {t.team_number}</option>)}
                </select>

                <label style={{ display: 'block', color: '#8892B0', fontSize: '14px', marginBottom: '4px' }}>Rate their sportsmanship</label>
                <select value={rating} onChange={(e) => setRating(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#0B132B', color: 'white', border: '1px solid #3A506B' }}>
                  <option value="5">⭐⭐⭐⭐⭐ Flawless Execution (+2%)</option>
                  <option value="4">⭐⭐⭐⭐ Good, minor delays (0%)</option>
                  <option value="3">⭐⭐⭐ Frustrating negotiation (-5%)</option>
                  <option value="2">⭐⭐ Unprofessional (-15%)</option>
                  <option value="1">⭐ Backed out / Broke terms (-25%)</option>
                </select>
              </div>
            ) : null}

            {!isAdmin && (!activeTeam || activeTeam.id !== actionListing.team_id) && (
              <input type="password" value={formPin} onChange={(e) => setFormPin(e.target.value)} placeholder="Enter PIN to confirm" maxLength="4" style={{ width: '100%', padding: '12px', marginBottom: '20px', backgroundColor: '#0B132B', color: 'white', border: '1px solid #EF4444', textAlign: 'center', letterSpacing: '4px', boxSizing: 'border-box' }} />
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setActionListing(null); setFormPin(''); setCounterpartyId(''); }} style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', color: 'white', border: '1px solid #5C6B89', cursor: 'pointer' }}>Cancel</button>
              <button onClick={executeListingAction} style={{ flex: 1, padding: '10px', backgroundColor: actionType === 'FILL' ? '#059669' : '#DC2626', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>{actionType === 'FILL' ? 'Execute Deal' : 'Confirm Drop'}</button>
            </div>
          </div>
        </div>
      )}

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 60, padding: '20px' }}>
          <div style={{ backgroundColor: '#1C2541', padding: '30px', borderRadius: '8px', width: '100%', maxWidth: '350px' }}>
            <h2 style={{ marginTop: 0 }}>Team Login</h2>
            <label style={{ display: 'block', color: '#8892B0', fontSize: '14px', marginBottom: '4px' }}>Select Team</label>
            <select value={formTeamId} onChange={(e) => setFormTeamId(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '15px', backgroundColor: '#0B132B', color: 'white', border: '1px solid #3A506B' }}>
              {teamsList.map(t => <option key={t.id} value={t.id}>Team {t.team_number}</option>)}
            </select>
            <label style={{ display: 'block', color: '#EF4444', fontSize: '14px', marginBottom: '4px' }}>Team PIN</label>
            <input type="password" value={formPin} onChange={(e) => setFormPin(e.target.value)} placeholder="0000" maxLength="4" style={{ width: '100%', padding: '10px', marginBottom: '20px', backgroundColor: '#0B132B', color: 'white', border: '1px solid #EF4444', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowLoginModal(false)} style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', color: 'white', border: '1px solid #5C6B89', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleLogin} style={{ flex: 1, padding: '10px', backgroundColor: '#4361EE', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Log In</button>
            </div>
          </div>
        </div>
      )}

      {/* POST MODAL */}
      {showPostModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '20px' }}>
          <div style={{ backgroundColor: '#1C2541', padding: '30px', borderRadius: '8px', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0 }}>Create a Listing</h2>
            
            {!activeTeam && !isAdmin && (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', color: '#8892B0', fontSize: '14px', marginBottom: '4px' }}>Your Team</label>
                  <select value={formTeamId} onChange={(e) => setFormTeamId(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#0B132B', color: 'white', border: '1px solid #3A506B' }}>
                    {teamsList.map(t => <option key={t.id} value={t.id}>Team {t.team_number}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', color: '#EF4444', fontSize: '14px', marginBottom: '4px' }}>PIN</label>
                  <input type="password" value={formPin} onChange={(e) => setFormPin(e.target.value)} placeholder="0000" maxLength="4" style={{ width: '100%', padding: '10px', backgroundColor: '#0B132B', color: 'white', border: '1px solid #EF4444', boxSizing: 'border-box' }} />
                </div>
              </div>
            )}

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

            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: '#8892B0', fontSize: '14px', marginBottom: '4px' }}>Quantity</label>
                <input type="number" value={formQuantity} onChange={(e) => setFormQuantity(e.target.value)} placeholder="50000" style={{ width: '100%', padding: '10px', backgroundColor: '#0B132B', color: 'white', border: '1px solid #3A506B', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: '#8892B0', fontSize: '14px', marginBottom: '4px' }}>Price ($)</label>
                <input type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="45" style={{ width: '100%', padding: '10px', backgroundColor: '#0B132B', color: 'white', border: '1px solid #3A506B', boxSizing: 'border-box' }} />
              </div>
            </div>
            
            <label style={{ display: 'block', color: '#8892B0', fontSize: '14px', marginBottom: '4px' }}>Terms / Notes (Optional)</label>
            <input type="text" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="e.g. Will trade for Intel, Net 30" style={{ width: '100%', padding: '10px', marginBottom: '20px', backgroundColor: '#0B132B', color: 'white', border: '1px solid #3A506B', boxSizing: 'border-box' }} />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowPostModal(false)} style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', color: 'white', border: '1px solid #5C6B89', cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitOrder} style={{ flex: 1, padding: '10px', backgroundColor: '#4361EE', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN CONTROL PANEL MODAL */}
      {showAdminModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 60, padding: '20px' }}>
          <div style={{ backgroundColor: '#1C2541', padding: '30px', borderRadius: '8px', width: '100%', maxWidth: '350px' }}>
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
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '20px' }}>
                  <input type="checkbox" checked={adminTradingOpen} onChange={(e) => setAdminTradingOpen(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                  <span style={{ fontSize: '15px', fontWeight: 'bold', color: adminTradingOpen ? '#34D399' : '#EF4444' }}>
                    {adminTradingOpen ? '🟢 TRADING IS OPEN' : '🔴 TRADING IS CLOSED'}
                  </span>
                </label>

                <label style={{ display: 'block', color: '#F59E0B', fontSize: '14px', marginBottom: '4px', fontWeight: 'bold' }}>Broadcast Global Alert</label>
                <input type="text" value={adminAnnouncement} onChange={(e) => setAdminAnnouncement(e.target.value)} placeholder="e.g. Tariffs increased on Product Y" style={{ width: '100%', padding: '10px', marginBottom: '24px', backgroundColor: '#0B132B', color: 'white', border: '1px solid #F59E0B', boxSizing: 'border-box' }} />

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setShowAdminModal(false)} style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', color: 'white', border: '1px solid #5C6B89', cursor: 'pointer' }}>Close Panel</button>
                  <button onClick={saveAdminSettings} style={{ flex: 1, padding: '10px', backgroundColor: '#059669', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Save & Broadcast</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
