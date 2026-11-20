'use client'

import Image from 'next/image'
import { ArrowUpRight, Heart, MapPin, ShieldCheck } from 'lucide-react'
import type { Listing } from '@/lib/listings'

const money = new Intl.NumberFormat('en-KE')

export function ListingCard({ listing, saved, onSave, onOpen }: { listing: Listing; saved: boolean; onSave: () => void; onOpen: () => void }) {
  const image = listing.photos?.[0] || '/placeholder.svg?height=520&width=720'
  return (
    <article className="listing-card">
      <button className="card-photo" onClick={onOpen} aria-label={`View ${listing.title}`}>
        <Image src={image} alt={listing.title} fill sizes="(max-width: 720px) 90vw, (max-width: 1100px) 45vw, 30vw" unoptimized />
        <span className="photo-badge">{listing.house_type}</span>
        {listing.verified && <span className="verified-pill"><ShieldCheck size={13} /> Verified</span>}
        <span className="sample-label">{listing.id.startsWith('sample-') ? 'Sample listing' : listing.available ? 'Available now' : 'Occupied'}</span>
      </button>
      <div className="listing-body">
        <div className="listing-heading">
          <div><p className="listing-price">KES {money.format(listing.rent)}<span> / month</span></p><h3>{listing.title}</h3></div>
          <button className={`save-button ${saved ? 'is-saved' : ''}`} onClick={onSave} aria-label={saved ? 'Remove from saved homes' : 'Save home'} aria-pressed={saved}><Heart size={19} fill={saved ? 'currentColor' : 'none'} /></button>
        </div>
        <p className="listing-location"><MapPin size={15} /> {listing.location}, Narok</p>
        <div className="listing-footer"><span>{listing.amenities?.slice(0, 2).join(' · ') || 'Move-in ready'}</span><button onClick={onOpen} className="text-link">View home <ArrowUpRight size={15} /></button></div>
      </div>
    </article>
  )
}
