'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDownWideNarrow, ArrowLeft, ArrowRight, Check, ChevronDown, CircleHelp, Heart, House, MapPin, Menu, Plus, Search, ShieldCheck, SlidersHorizontal, Sparkles, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Listing } from '@/lib/listings'
import { amenitiesList, houseTypes, locations, sampleListings } from '@/lib/listings'
import { ListingCard } from '@/components/listing-card'

type User = { id: string; email?: string }
type DialogMode = 'login' | 'signup' | null
const money = new Intl.NumberFormat('en-KE')
const photoFallback = (id: string) => `https://images.unsplash.com/${id.startsWith('photo-') ? id : `photo-${id}`}?auto=format&fit=crop&w=1200&q=85`

export function NarokApp() {
  const [listings, setListings] = useState<Listing[]>(sampleListings)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<{ full_name: string; role: string; verified: boolean } | null>(null)
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [searchText, setSearchText] = useState('')
  const [type, setType] = useState('')
  const [location, setLocation] = useState('')
  const [maxRent, setMaxRent] = useState('')
  const [minRent, setMinRent] = useState('')
  const [amenity, setAmenity] = useState('')
  const [availability, setAvailability] = useState('available')
  const [sort, setSort] = useState('newest')
  const [activeView, setActiveView] = useState<'home' | 'search' | 'saved' | 'dashboard' | 'profile'>('home')
  const [selected, setSelected] = useState<Listing | null>(null)
  const [dialog, setDialog] = useState<DialogMode>(null)
  const [postOpen, setPostOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const [mobileFilters, setMobileFilters] = useState(false)

  const refresh = useCallback(async () => {
    const supabase = createClient()
    const [{ data: listingRows }, { data: authData }] = await Promise.all([
      supabase.from('listings').select('id,title,house_type,rent,location,description,photos,amenities,phone,whatsapp,available,approved,created_at,expires_at,landlord_id').eq('approved', true).gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }),
      supabase.auth.getUser(),
    ])
    if (listingRows?.length) setListings(listingRows as Listing[])
    if (authData.user) {
      setUser({ id: authData.user.id, email: authData.user.email })
      const [{ data: p }, { data: saved }] = await Promise.all([
        supabase.from('profiles').select('full_name,role,verified').eq('id', authData.user.id).maybeSingle(),
        supabase.from('saved_listings').select('listing_id').eq('user_id', authData.user.id),
      ])
      setProfile(p)
      setSavedIds(saved?.map((row) => row.listing_id) || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  const visibleListings = useMemo(() => {
    const rows = listings.filter((item) => {
      const matchesText = `${item.title} ${item.location} ${item.description}`.toLowerCase().includes(searchText.toLowerCase())
      return matchesText && (!type || item.house_type === type) && (!location || item.location.toLowerCase().includes(location.toLowerCase())) && (!minRent || item.rent >= Number(minRent)) && (!maxRent || item.rent <= Number(maxRent)) && (!amenity || item.amenities?.includes(amenity)) && (availability !== 'available' || item.available) && (availability !== 'occupied' || !item.available) && (activeView !== 'saved' || savedIds.includes(item.id))
    })
    return rows.sort((a, b) => sort === 'low' ? a.rent - b.rent : sort === 'high' ? b.rent - a.rent : new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [activeView, amenity, availability, listings, location, maxRent, minRent, savedIds, searchText, sort, type])

  const goTo = (view: typeof activeView) => {
    if ((view === 'dashboard' || view === 'profile' || view === 'saved') && !user) { setDialog('login'); return }
    setActiveView(view)
    if (view === 'search') document.getElementById('homes')?.scrollIntoView({ behavior: 'smooth' })
  }
  const saveHome = async (item: Listing) => {
    if (item.id.startsWith('sample-')) { setNotice('Sign in to save homes from the live listings.'); setTimeout(() => setNotice(''), 3000); return }
    if (!user) { setDialog('login'); return }
    const supabase = createClient()
    if (savedIds.includes(item.id)) {
      const { error } = await supabase.from('saved_listings').delete().eq('user_id', user.id).eq('listing_id', item.id)
      if (!error) setSavedIds(savedIds.filter((id) => id !== item.id))
    } else {
      const { error } = await supabase.from('saved_listings').insert({ user_id: user.id, listing_id: item.id })
      if (!error) setSavedIds([...savedIds, item.id])
    }
  }
  const reportListing = async (item: Listing) => {
    const reason = window.prompt('What should our team review about this listing?')
    if (!reason?.trim()) return
    const { error } = await createClient().from('listing_reports').insert({ listing_id: item.id, reporter_id: user?.id || null, reason: reason.trim().slice(0, 500) })
    setNotice(error ? 'Could not send your report. Please try again.' : 'Thanks. Our team will review this listing.')
    setTimeout(() => setNotice(''), 3500)
  }
  const doSignOut = async () => { await createClient().auth.signOut(); setUser(null); setProfile(null); setSavedIds([]); setActiveView('home') }

  const categories = [
    { name: 'Single Room', image: 'photo-1631679706909-1844bbd07221', count: 'From KES 4,500' },
    { name: 'Bedsitter', image: 'photo-1522708323590-d24dbb6b0267', count: 'From KES 7,000' },
    { name: 'One Bedroom', image: 'photo-1505693416388-ac5ce068fe85', count: 'From KES 16,000' },
    { name: 'Two Bedroom', image: 'photo-1600210492486-724fe5c67fb0', count: 'From KES 24,000' },
  ]

  return <div className="app-shell">
    <header className="topbar"><a href="#top" className="brand" onClick={() => goTo('home')}><span className="brand-mark"><House size={20} strokeWidth={2.4} /></span><span>Narok <span className="brand-light">House Finder</span><small>FIND YOUR PLACE</small></span></a><nav className="desktop-nav" aria-label="Main navigation"><button className={activeView === 'home' ? 'nav-active' : ''} onClick={() => goTo('home')}>Explore homes</button><button onClick={() => goTo('search')}>Explore areas</button><button onClick={() => goTo('dashboard')}>For landlords</button></nav><div className="header-actions"><button className="help-link" onClick={() => setNotice('Browse for free. Contact landlords directly by WhatsApp or phone.')}><CircleHelp size={17} /> Help</button>{user ? <button className="account-button" onClick={() => goTo('profile')}><span className="avatar-dot">{profile?.full_name?.[0]?.toUpperCase() || 'N'}</span>{profile?.full_name?.split(' ')[0] || 'My account'}<ChevronDown size={15} /></button> : <button className="sign-in" onClick={() => setDialog('login')}>Sign in</button>}<button className="post-top" onClick={() => user ? setPostOpen(true) : setDialog('signup')}><Plus size={17} /> Post a home</button></div></header>

    <main id="top">
      {activeView === 'profile' ? <section className="profile-page"><button className="back-link" onClick={() => goTo('home')}><ArrowLeft size={16} /> Back to homes</button><div className="profile-card"><span className="profile-icon"><House /></span><p className="eyebrow">YOUR ACCOUNT</p><h1>{profile?.full_name || user?.email || 'Welcome back'}</h1><p>Manage your Narok Homes account and listings.</p><div className="profile-actions"><button className="btn-primary" onClick={() => setPostOpen(true)}>Post a home</button><button className="btn-outline" onClick={() => goTo('dashboard')}>My listings</button><button className="text-link" onClick={() => void doSignOut()}>Sign out</button></div></div></section> : activeView === 'dashboard' ? <Dashboard user={user} isAdmin={profile?.role === 'admin'} onPost={() => setPostOpen(true)} onHome={(item) => setSelected(item)} onRefresh={refresh} /> : <>
      <section className="hero"><div className="hero-copy"><div className="hero-overline"><span className="overline-line" /> YOUR NEXT CHAPTER STARTS HERE</div><h1>Find your place<br />in <em>Narok.</em></h1><p>Good homes, honest prices, no more walking around. Find a place you&apos;ll love and talk directly to the landlord.</p><div className="hero-proof"><span><Check size={14} /> Free to browse</span><span><Check size={14} /> Direct landlord contact</span></div></div><div className="hero-visual"><div className="hero-photo" style={{ backgroundImage: `url('${photoFallback('photo-1600210492486-724fe5c67fb0')}')` }} /><div className="hero-location"><span className="location-pin"><MapPin size={17} /></span><span><b>Narok County</b><small>Find home, feel at home</small></span></div><div className="hero-note"><Sparkles size={15} /><span>Better house hunting starts here.</span></div></div>
      <div className="search-panel"><div className="search-field search-location"><label htmlFor="area-search">Where in Narok?</label><div><MapPin size={18} /><input id="area-search" value={searchText} onChange={(e) => setSearchText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) { goTo('search') } }} placeholder="Search an estate or area" /></div></div><span className="search-divider" /><div className="search-field"><label htmlFor="type-search">Home type</label><select id="type-search" value={type} onChange={(e) => setType(e.target.value)}><option value="">Any home type</option>{houseTypes.map((houseType) => <option key={houseType}>{houseType}</option>)}</select></div><span className="search-divider" /><div className="search-field search-rent"><label htmlFor="rent-search">Max monthly rent</label><div><span className="currency-prefix">KES</span><input id="rent-search" inputMode="numeric" value={maxRent} onChange={(e) => setMaxRent(e.target.value.replace(/\D/g, ''))} placeholder="Any budget" /></div></div><button className="search-submit" onClick={() => { goTo('search'); document.getElementById('homes')?.scrollIntoView({ behavior: 'smooth' }) }}><Search size={18} /><span>Find a home</span></button></div></section>

      <section className="section-wrap category-section"><div className="section-heading"><div><p className="eyebrow">A HOME FOR EVERY BUDGET</p><h2>What are you looking for?</h2><p className="section-subtitle">Start with a home type that feels right.</p></div><button className="text-link desktop-only" onClick={() => { setType(''); goTo('search') }}>See all homes <ArrowRight size={16} /></button></div><div className="category-grid">{categories.map((category) => <button key={category.name} className="category-card" onClick={() => { setType(category.name); goTo('search'); setTimeout(() => document.getElementById('homes')?.scrollIntoView({ behavior: 'smooth' }), 0) }}><span className="category-image" style={{ backgroundImage: `url('${photoFallback(category.image)}')` }} /><span className="category-content"><span><b>{category.name}</b><small>{category.count}</small></span><span className="category-arrow"><ArrowRight size={16} /></span></span></button>)}</div></section>

      <section className="section-wrap homes-section" id="homes"><div className="section-heading home-section-heading"><div><p className="eyebrow">THE LATEST IN NAROK</p><h2>{activeView === 'saved' ? 'Your saved homes' : activeView === 'search' ? 'Homes that match' : 'Places worth coming home to'}</h2><p className="section-subtitle">{activeView === 'saved' ? 'The homes you have kept close.' : 'Fresh listings, direct from local landlords.'}</p></div><div className="sort-wrap"><label htmlFor="sort-select"><ArrowDownWideNarrow size={16} /> Sort by</label><select id="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}><option value="newest">Recently added</option><option value="low">Lowest rent</option><option value="high">Highest rent</option></select></div></div>
      <div className="filter-row"><div className="filter-chips"><button className={`filter-chip ${!type ? 'selected' : ''}`} onClick={() => setType('')}>All homes</button>{houseTypes.map((houseType) => <button key={houseType} className={`filter-chip ${type === houseType ? 'selected' : ''}`} onClick={() => setType(type === houseType ? '' : houseType)}>{houseType}</button>)}</div><button className="filter-toggle" onClick={() => setMobileFilters(!mobileFilters)}><SlidersHorizontal size={16} /> Filters</button></div>
      <div className={`filter-controls ${mobileFilters ? 'filters-open' : ''}`}><label><span>Estate</span><select value={location} onChange={(e) => setLocation(e.target.value)}><option value="">All of Narok</option>{locations.map((area) => <option key={area}>{area}</option>)}</select></label><label><span>Min rent (KES)</span><input inputMode="numeric" value={minRent} onChange={(e) => setMinRent(e.target.value.replace(/\D/g, ''))} placeholder="No minimum" /></label><label><span>Max rent (KES)</span><input inputMode="numeric" value={maxRent} onChange={(e) => setMaxRent(e.target.value.replace(/\D/g, ''))} placeholder="No maximum" /></label><label><span>Amenity</span><select value={amenity} onChange={(e) => setAmenity(e.target.value)}><option value="">Any amenity</option>{amenitiesList.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>Availability</span><select value={availability} onChange={(e) => setAvailability(e.target.value)}><option value="available">Available</option><option value="all">All listings</option><option value="occupied">Occupied</option></select></label><button className="clear-filters" onClick={() => { setLocation(''); setType(''); setMinRent(''); setMaxRent(''); setAmenity(''); setAvailability('available'); setSearchText('') }}>Clear all</button></div>
      {loading ? <div className="loading-state"><span className="spinner" /> Finding homes for you…</div> : visibleListings.length ? <div className="listing-grid">{visibleListings.map((item) => <ListingCard key={item.id} listing={item} saved={savedIds.includes(item.id)} onSave={() => void saveHome(item)} onOpen={() => setSelected(item)} />)}</div> : <div className="empty-state"><span><House size={25} /></span><h3>No homes found just yet</h3><p>Try a different area or clear a few filters. New homes are added every week.</p><button className="btn-outline" onClick={() => { setLocation(''); setType(''); setMinRent(''); setMaxRent(''); setAmenity(''); setAvailability('available'); setSearchText('') }}>Clear filters</button></div>}
      <div className="sample-note"><span className="sample-note-icon"><Sparkles size={15} /></span><span><b>Getting started in Narok</b> Some homes shown are sample listings for demonstration. Live landlord listings appear here as they&apos;re approved.</span></div></section>

      <section className="landlord-banner"><div><p className="eyebrow">FOR LOCAL LANDLORDS</p><h2>Good tenants are looking.<br />Let them find you.</h2><p>Share your available home and connect with people looking to move in Narok.</p><button className="btn-light" onClick={() => user ? setPostOpen(true) : setDialog('signup')}>List your home <ArrowRight size={16} /></button></div><div className="banner-art"><div className="banner-card"><span className="banner-house-icon"><House size={24} /></span><div><b>Your next tenant is here.</b><small>Post a listing in a few minutes.</small></div><ArrowRight size={17} /></div><div className="banner-circle" /></div></section>
      </>}
    </main>

    <footer className="site-footer"><a href="#top" className="brand footer-brand"><span className="brand-mark"><House size={19} /></span><span>Narok <span className="brand-light">House Finder</span><small>FIND YOUR PLACE</small></span></a><p>Making it easier to find a place to call home in Narok County.</p><span className="footer-right">Made for Narok, Kenya <span>·</span> KES</span></footer>
    <nav className="mobile-nav" aria-label="Mobile navigation">{[{ view: 'home' as const, icon: House, label: 'Home' }, { view: 'search' as const, icon: Search, label: 'Search' }, { view: 'saved' as const, icon: Heart, label: 'Saved' }, { view: 'dashboard' as const, icon: Plus, label: 'Post home' }, { view: 'profile' as const, icon: Menu, label: 'Profile' }].map(({ view, icon: Icon, label }) => <button key={view} className={activeView === view ? 'mobile-nav-active' : ''} onClick={() => view === 'dashboard' ? user ? setPostOpen(true) : setDialog('login') : goTo(view)}><Icon size={20} /><span>{label}</span></button>)}</nav>
    {notice && <div className="toast-message" role="status"><Check size={17} /> {notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={15} /></button></div>}
    {selected && <ListingDetails listing={selected} onClose={() => setSelected(null)} onReport={() => void reportListing(selected)} onSave={() => void saveHome(selected)} saved={savedIds.includes(selected.id)} />}
    {dialog && <AuthDialog mode={dialog} onClose={() => setDialog(null)} onMode={setDialog} onSuccess={async () => { setDialog(null); await refresh() }} />}
    {postOpen && user && <PostHome user={user} onClose={() => setPostOpen(false)} onSuccess={async () => { setPostOpen(false); setActiveView('dashboard'); setNotice('Your home is submitted for review.'); setTimeout(() => setNotice(''), 3500); await refresh() }} />}
  </div>
}

function AuthDialog({ mode, onClose, onMode, onSuccess }: { mode: Exclude<DialogMode, null>; onClose: () => void; onMode: (mode: DialogMode) => void; onSuccess: () => Promise<void> }) {
  const [isLogin, setIsLogin] = useState(mode === 'login')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  async function submit(formData: FormData) {
    setBusy(true); setError(''); setMessage('')
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '')
    const supabase = createClient()
    const result = isLogin ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`, data: { full_name: String(formData.get('name') || '').trim(), phone: String(formData.get('phone') || '').trim() } } })
    if (result.error) { setError(/confirm|email.*not/i.test(result.error.message) ? 'Check your email for a confirmation link before signing in.' : isLogin ? 'Email or password is incorrect. Please try again.' : 'Could not create your account. Check your details and try again.'); setBusy(false); return }
    if (!isLogin && !result.data.session) { setMessage('Check your inbox to confirm your email. Then sign in to continue.'); setBusy(false); return }
    if (!isLogin && result.data.user) await supabase.from('profiles').upsert({ id: result.data.user.id, full_name: String(formData.get('name') || '').trim(), phone: String(formData.get('phone') || '').trim(), email, location: 'Narok Town' })
    await onSuccess(); setBusy(false)
  }
  return <div className="overlay" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}><section className="dialog-card auth-card" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button className="dialog-close" onClick={onClose} aria-label="Close"><X /></button><span className="dialog-logo"><House size={22} /></span><p className="eyebrow">WELCOME TO NAROK HOMES</p><h2 id="auth-title">{isLogin ? 'Welcome back' : 'Create your account'}</h2><p className="dialog-subtitle">{isLogin ? 'Sign in to save homes and manage your listings.' : 'Join the local community finding home in Narok.'}</p><form action={submit} className="auth-form">{!isLogin && <><label>Full name<input name="name" autoComplete="name" required placeholder="e.g. Amina Nkoitoi" /></label><label>Phone number<input name="phone" type="tel" autoComplete="tel" required placeholder="+254 7XX XXX XXX" /></label></>}<label>Email address<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label><label>Password<input name="password" type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} required minLength={8} placeholder="At least 8 characters" /></label>{error && <p className="form-error" role="alert">{error}</p>}{message && <p className="form-success" role="status">{message}</p>}<button className="btn-primary auth-submit" disabled={busy}>{busy ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}</button></form><p className="auth-switch">{isLogin ? 'New to Narok Homes?' : 'Already have an account?'} <button onClick={() => { setIsLogin(!isLogin); onMode(isLogin ? 'signup' : 'login') }}>{isLogin ? 'Create an account' : 'Sign in'}</button></p><p className="privacy-note"><ShieldCheck size={14} /> Your information stays private and secure.</p></section></div>
}

function ListingDetails({ listing, onClose, onReport, onSave, saved }: { listing: Listing; onClose: () => void; onReport: () => void; onSave: () => void; saved: boolean }) {
  const phone = (listing.whatsapp || listing.phone).replace(/[^\d]/g, '').replace(/^0/, '254')
  const wa = `https://wa.me/${phone}?text=${encodeURIComponent('Hello, I saw your house listing on Narok House Finder and would like to know if it is still available.')}`
  const [photo, setPhoto] = useState(0)
  return <div className="overlay" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}><section className="dialog-card detail-card" role="dialog" aria-modal="true" aria-labelledby="detail-title"><button className="dialog-close detail-close" onClick={onClose} aria-label="Close"><X /></button><div className="detail-photo" style={{ backgroundImage: `url('${listing.photos?.[photo] || '/placeholder.svg?height=520&width=720'}')` }}><span className="photo-badge">{listing.house_type}</span><button className={`save-button detail-save ${saved ? 'is-saved' : ''}`} onClick={onSave} aria-label="Save home"><Heart size={19} fill={saved ? 'currentColor' : 'none'} /></button></div>{listing.photos?.length > 1 && <div className="gallery-thumbs">{listing.photos.map((url, i) => <button key={url} aria-label={`View photo ${i + 1}`} onClick={() => setPhoto(i)} className={photo === i ? 'thumb-active' : ''} style={{ backgroundImage: `url('${url}')` }} />)}</div>}<div className="detail-content"><p className="eyebrow">AVAILABLE IN NAROK</p><h2 id="detail-title">{listing.title}</h2><p className="detail-price">KES {money.format(listing.rent)} <span>/ month</span></p><p className="listing-location"><MapPin size={16} /> {listing.location}, Narok County · {listing.available ? 'Available now' : 'Occupied'}</p><p className="detail-description">{listing.description || 'A welcoming home in Narok. Contact the landlord to arrange a viewing and confirm availability.'}</p><h3>What this home offers</h3><div className="amenities-list">{(listing.amenities?.length ? listing.amenities : ['Comfortable living', 'Narok location']).map((amenity) => <span key={amenity}><Check size={14} />{amenity}</span>)}</div><div className="contact-actions"><a className="whatsapp-btn" href={wa} target="_blank" rel="noreferrer"><span>◉</span> WhatsApp landlord</a><a className="call-btn" href={`tel:${listing.phone}`}>Call landlord</a></div><button className="report-link" onClick={onReport}>Report this listing</button><p className="posted-date">Posted {new Date(listing.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'long' })} · Always confirm availability before visiting.</p></div></section></div>
}

function PostHome({ user, onClose, onSuccess }: { user: User; onClose: () => void; onSuccess: () => Promise<void> }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(formData: FormData) {
    setBusy(true); setError('')
    const supabase = createClient()
    const files = formData.getAll('photos').filter((file): file is File => file instanceof File && file.size > 0)
    if (files.length > 6 || files.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)) { setError('Add up to 6 JPG, PNG, or WebP photos. Each photo must be 5 MB or smaller.'); setBusy(false); return }
    const photos: string[] = []
    for (const file of files) {
      const path = `${user.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '')}`
      const { error: uploadError } = await supabase.storage.from('house-photos').upload(path, file, { contentType: file.type, upsert: false })
      if (uploadError) { setError('A photo could not be uploaded. Try a smaller image or submit without it.'); setBusy(false); return }
      photos.push(supabase.storage.from('house-photos').getPublicUrl(path).data.publicUrl)
    }
    const { error: profileError } = await supabase.from('profiles').upsert({ id: user.id, full_name: String(formData.get('name') || '').trim(), phone: String(formData.get('phone') || '').trim(), email: user.email, location: 'Narok Town' })
    if (profileError) { setError('Please sign in again before posting a home.'); setBusy(false); return }
    const { error: insertError } = await supabase.from('listings').insert({ landlord_id: user.id, title: String(formData.get('title') || '').trim(), house_type: String(formData.get('house_type')), rent: Number(formData.get('rent')), location: String(formData.get('location') || '').trim(), description: String(formData.get('description') || '').trim(), photos, amenities: formData.getAll('amenities').map(String), phone: String(formData.get('phone') || '').trim(), whatsapp: String(formData.get('whatsapp') || formData.get('phone') || '').trim(), available: true })
    if (insertError) { setError(insertError.message.includes('row-level security') ? 'Your account profile could not be verified. Please sign in again and try once more.' : 'Could not publish your home. Check the details and try again.'); setBusy(false); return }
    await onSuccess(); setBusy(false)
  }
  return <div className="overlay" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}><section className="dialog-card post-card" role="dialog" aria-modal="true" aria-labelledby="post-title"><button className="dialog-close" onClick={onClose} aria-label="Close"><X /></button><p className="eyebrow">FOR NAROK LANDLORDS</p><h2 id="post-title">List your available home</h2><p className="dialog-subtitle">Share the details. We&apos;ll review your listing before it appears.</p><form action={submit} className="post-form"><div className="form-grid"><label className="span-two">Listing title<input name="title" required maxLength={100} placeholder="e.g. Sunny bedsitter near town" /></label><label>Home type<select name="house_type" required>{houseTypes.map((item) => <option key={item}>{item}</option>)}</select></label><label>Monthly rent (KES)<input name="rent" type="number" min="1" required placeholder="8500" /></label><label>Estate / area<input name="location" required maxLength={100} list="narok-locations" placeholder="e.g. Teachers" /><datalist id="narok-locations">{locations.map((item) => <option key={item} value={item} />)}</datalist></label><label>Landlord phone<input name="phone" type="tel" required placeholder="+254 7XX XXX XXX" /></label><label>WhatsApp number<input name="whatsapp" type="tel" placeholder="Same as phone if blank" /></label><label className="span-two">About this home<textarea name="description" required minLength={15} maxLength={1200} rows={3} placeholder="Tell renters about the space, access and what makes it a good home." /></label><label className="span-two upload-label">Photos <span>Up to 6 photos · JPG, PNG, WebP · 5 MB each</span><input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple /></label><fieldset className="span-two amenity-field"><legend>Amenities</legend><div className="amenity-options">{amenitiesList.map((item) => <label key={item}><input type="checkbox" name="amenities" value={item} /> {item}</label>)}</div></fieldset></div>{error && <p className="form-error" role="alert">{error}</p>}<button className="btn-primary auth-submit" disabled={busy}>{busy ? 'Submitting…' : 'Submit for review'}</button><p className="post-disclaimer"><ShieldCheck size={14} /> Listings are reviewed by our team and expire after 30 days.</p></form></section></div>
}

function Dashboard({ user, isAdmin, onPost, onHome, onRefresh }: { user: User | null; isAdmin: boolean; onPost: () => void; onHome: (item: Listing) => void; onRefresh: () => Promise<void> }) {
  const [items, setItems] = useState<Listing[]>([])
  const [reports, setReports] = useState<number | null>(null)
  const [reportRows, setReportRows] = useState<{ id: string; listing_id: string; reason: string; created_at: string }[]>([])
  const [landlords, setLandlords] = useState<{ id: string; full_name: string; verified: boolean }[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  useEffect(() => { if (!user) return; void (async () => { const supabase = createClient(); let query = supabase.from('listings').select('id,title,house_type,rent,location,description,photos,amenities,phone,whatsapp,available,approved,created_at,expires_at,landlord_id').order('created_at', { ascending: false }); if (!isAdmin) query = query.eq('landlord_id', user.id); const { data } = await query; setItems((data || []) as Listing[]); if (isAdmin) { const [{ data: reportData }, { count }, { data: landlordData }] = await Promise.all([supabase.from('listing_reports').select('id,listing_id,reason,created_at').eq('status', 'open').order('created_at', { ascending: false }), supabase.from('listing_reports').select('id', { count: 'exact', head: true }).eq('status', 'open'), supabase.from('profiles').select('id,full_name,verified').eq('role', 'landlord').order('full_name')]); setReportRows(reportData || []); setReports(count || 0); setLandlords(landlordData || []) } setLoading(false) })() }, [user, isAdmin])
  const updateListing = async (item: Listing, changes: Partial<Listing>) => { const { error } = await createClient().from('listings').update(changes).eq('id', item.id); setStatus(error ? 'That update could not be saved.' : 'Listing updated.'); if (!error) { setItems((current) => current.map((row) => row.id === item.id ? { ...row, ...changes } : row)); await onRefresh() } setTimeout(() => setStatus(''), 3000) }
  const editListing = async (item: Listing) => {
    const title = window.prompt('Update listing title', item.title)
    if (title === null) return
    const rent = window.prompt('Update monthly rent in KES', String(item.rent))
    if (rent === null) return
    const location = window.prompt('Update estate or location', item.location)
    if (location === null) return
    const description = window.prompt('Update listing description', item.description)
    if (description === null) return
    const amount = Number(rent)
    if (!title.trim() || !location.trim() || description.trim().length < 15 || !Number.isInteger(amount) || amount < 1) { setStatus('Enter a title, location, description of 15+ characters, and a valid rent amount.'); setTimeout(() => setStatus(''), 3000); return }
    await updateListing(item, { title: title.trim(), rent: amount, location: location.trim(), description: description.trim() })
  }
  const renewListing = async (item: Listing) => {
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const { error } = await createClient().from('listings').update({ expires_at: expires, available: true }).eq('id', item.id)
    setStatus(error ? 'Could not renew this listing.' : 'Listing renewed for another 30 days.')
    if (!error) { setItems((current) => current.map((row) => row.id === item.id ? { ...row, expires_at: expires, available: true } : row)); await onRefresh() }
    setTimeout(() => setStatus(''), 3000)
  }
  const deleteListing = async (item: Listing) => { if (!window.confirm('Delete this listing? This cannot be undone.')) return; const { error } = await createClient().from('listings').delete().eq('id', item.id); if (!error) setItems((current) => current.filter((row) => row.id !== item.id)); setStatus(error ? 'Could not delete the listing.' : 'Listing deleted.'); setTimeout(() => setStatus(''), 3000) }
  const closeReport = async (id: string) => { const { error } = await createClient().from('listing_reports').update({ status: 'resolved' }).eq('id', id); setStatus(error ? 'Could not resolve this report.' : 'Report resolved.'); if (!error) { setReportRows((rows) => rows.filter((row) => row.id !== id)); setReports((count) => Math.max((count || 0) - 1, 0)) } setTimeout(() => setStatus(''), 3000) }
  const toggleLandlordVerification = async (landlord: { id: string; full_name: string; verified: boolean }) => { const { error } = await createClient().from('profiles').update({ verified: !landlord.verified }).eq('id', landlord.id); setStatus(error ? 'Could not update landlord verification.' : 'Landlord verification updated.'); if (!error) setLandlords((rows) => rows.map((row) => row.id === landlord.id ? { ...row, verified: !row.verified } : row)); setTimeout(() => setStatus(''), 3000) }
  return <section className="dashboard-page"><div className="dashboard-header"><div><p className="eyebrow">{isAdmin ? 'PLATFORM MANAGEMENT' : 'LANDLORD SPACE'}</p><h1>{isAdmin ? 'Listing review' : 'Your homes'}</h1><p>{isAdmin ? 'Review submitted homes and keep Narok Homes trustworthy.' : 'Keep your listings up to date and find your next tenant.'}</p></div><button className="btn-primary" onClick={onPost}><Plus size={17} /> Add a home</button></div>{isAdmin && <div className="admin-summary"><span><b>{items.length}</b> total listings</span><span><b>{items.filter((item) => item.available).length}</b> available</span><span><b>{landlords.length}</b> landlords</span><span><b>{reports ?? '—'}</b> open reports</span></div>}{isAdmin && <div className="admin-tools"><section className="admin-panel"><div className="admin-panel-heading"><h2>Open reports</h2><span>{reportRows.length}</span></div>{reportRows.length ? reportRows.map((report) => <article className="report-row" key={report.id}><div><b>{items.find((item) => item.id === report.listing_id)?.title || 'Listing removed'}</b><p>{report.reason}</p><small>{new Date(report.created_at).toLocaleDateString('en-KE')}</small></div><div className="report-actions">{items.find((item) => item.id === report.listing_id) && <button className="mini-action remove" onClick={() => void deleteListing(items.find((item) => item.id === report.listing_id)!)}>Remove listing</button>}<button className="mini-action approve" onClick={() => void closeReport(report.id)}>Resolve</button></div></article>) : <p className="admin-empty">No open reports. Thank you for keeping the community safe.</p>}</section><section className="admin-panel"><div className="admin-panel-heading"><h2>Landlord verification</h2><span>{landlords.filter((item) => item.verified).length} verified</span></div>{landlords.length ? landlords.map((landlord) => <article className="landlord-row" key={landlord.id}><span className="avatar-dot">{landlord.full_name?.[0]?.toUpperCase() || 'L'}</span><b>{landlord.full_name || 'Narok landlord'}</b><span className={`status-tag ${landlord.verified ? 'status-live' : 'status-review'}`}>{landlord.verified ? 'Verified' : 'Not verified'}</span><button className="mini-action" onClick={() => void toggleLandlordVerification(landlord)}>{landlord.verified ? 'Remove badge' : 'Verify'}</button></article>) : <p className="admin-empty">Registered landlord profiles will appear here.</p>}</section></div>}{status && <p className="dashboard-status" role="status">{status}</p>}{loading ? <div className="loading-state"><span className="spinner" /> Loading your homes…</div> : items.length ? <div className="dashboard-list">{items.map((item) => <article className="dashboard-row" key={item.id}><button className="dashboard-thumb" onClick={() => onHome(item)} style={{ backgroundImage: `url('${item.photos?.[0] || '/placeholder.svg?height=160&width=200'}')` }} aria-label={`View ${item.title}`} /><div className="dashboard-row-main"><span className={`status-tag ${item.approved ? item.available ? 'status-live' : 'status-occupied' : 'status-review'}`}>{item.approved ? item.available ? 'Live' : 'Occupied' : 'In review'}</span><h3>{item.title}</h3><p>{item.house_type} · {item.location} · KES {money.format(item.rent)}/mo</p><small>Posted {new Date(item.created_at).toLocaleDateString('en-KE')}</small></div><div className="dashboard-row-actions">{isAdmin && !item.approved && <button className="mini-action approve" onClick={() => void updateListing(item, { approved: true })}>Approve</button>}{item.approved && <button className="mini-action" onClick={() => void updateListing(item, { available: !item.available })}>{item.available ? 'Mark occupied' : 'Mark available'}</button>}{!isAdmin && <button className="mini-action" onClick={() => void editListing(item)}>Edit</button>}{!isAdmin && <button className="mini-action" onClick={() => void renewListing(item)}>Renew 30 days</button>}<button className="mini-action remove" onClick={() => void deleteListing(item)}>Delete</button></div></article>)}</div> : <div className="empty-state"><span><House size={25} /></span><h3>{isAdmin ? 'No listings to review' : 'Your first home listing starts here'}</h3><p>{isAdmin ? 'Submitted listings will appear here.' : 'Add a few photos and details so renters can find your home.'}</p><button className="btn-primary" onClick={onPost}><Plus size={16} /> Add a home</button></div>}</section>
}
