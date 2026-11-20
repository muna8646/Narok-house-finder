export type Listing = {
  id: string
  title: string
  house_type: 'Single Room' | 'Bedsitter' | 'One Bedroom' | 'Two Bedroom'
  rent: number
  location: string
  description: string
  photos: string[]
  amenities: string[]
  phone: string
  whatsapp: string
  available: boolean
  approved: boolean
  created_at: string
  expires_at?: string
  landlord_id?: string
  verified?: boolean
}

export const sampleListings: Listing[] = [
  { id: 'sample-1', title: 'Bright bedsitter near Narok University', house_type: 'Bedsitter', rent: 8500, location: 'Teachers', description: 'A bright, secure bedsitter with a private bathroom and a short walk to shops and public transport.', photos: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=85'], amenities: ['Water 24/7', 'Prepaid power', 'Secure compound'], phone: '+254712345601', whatsapp: '+254712345601', available: true, approved: true, created_at: '2026-11-18T09:00:00Z', verified: true },
  { id: 'sample-2', title: 'Quiet single room in a secure compound', house_type: 'Single Room', rent: 4500, location: 'Majengo', description: 'Neat and affordable room in a friendly compound. Water available and shops close by.', photos: ['https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&w=1000&q=85'], amenities: ['Water', 'Shared kitchen', 'Security'], phone: '+254712345602', whatsapp: '+254712345602', available: true, approved: true, created_at: '2026-11-16T09:00:00Z' },
  { id: 'sample-3', title: 'Modern one bedroom with balcony', house_type: 'One Bedroom', rent: 16000, location: 'Total', description: 'Spacious, freshly painted home with a sunny balcony, tiled floors and reliable water supply.', photos: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=85'], amenities: ['Balcony', 'Water 24/7', 'Parking'], phone: '+254712345603', whatsapp: '+254712345603', available: true, approved: true, created_at: '2026-11-14T09:00:00Z', verified: true },
  { id: 'sample-4', title: 'Spacious two bedroom for a small family', house_type: 'Two Bedroom', rent: 24000, location: 'Narok Town', description: 'A comfortable family home in a quiet area with a separate kitchen and secure parking.', photos: ['https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85'], amenities: ['Separate kitchen', 'Parking', 'Gated compound'], phone: '+254712345604', whatsapp: '+254712345604', available: true, approved: true, created_at: '2026-11-12T09:00:00Z' },
  { id: 'sample-5', title: 'Affordable bedsitter close to town', house_type: 'Bedsitter', rent: 7000, location: 'Muthurwa', description: 'Well-kept bedsitter with good natural light, water storage and easy access to town.', photos: ['https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1000&q=85'], amenities: ['Water tank', 'Prepaid power'], phone: '+254712345605', whatsapp: '+254712345605', available: true, approved: true, created_at: '2026-11-10T09:00:00Z' },
  { id: 'sample-6', title: 'Clean single room in a friendly home', house_type: 'Single Room', rent: 5000, location: 'Teachers', description: 'A clean, well-lit room in a calm compound. Shared kitchen and wash area included.', photos: ['https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1000&q=85'], amenities: ['Shared kitchen', 'Water', 'Security'], phone: '+254712345606', whatsapp: '+254712345606', available: true, approved: true, created_at: '2026-11-08T09:00:00Z' },
]

export const houseTypes = ['Single Room', 'Bedsitter', 'One Bedroom', 'Two Bedroom'] as const
export const locations = ['Narok Town', 'Teachers', 'Total', 'Majengo', 'Muthurwa']
export const amenitiesList = ['Water 24/7', 'Prepaid power', 'Security', 'Parking', 'Balcony', 'Gated compound', 'Shared kitchen', 'Water tank']
