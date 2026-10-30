export interface MemoryPhoto {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  cameraInfo?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  category: 'Travel' | 'Moments' | 'Architecture' | 'Nature' | 'People' | 'Art';
  aspectRatio: number; // width / height
  type: 'wall' | 'floating' | 'pedestal';
  // Position in 3D world space (inside Room 01 around center [-11, 2, -14])
  worldPosition: [number, number, number];
  worldRotation: [number, number, number]; // [rx, ry, rz] in radians
  size: [number, number]; // [width, height] in 3D units
}

export const INITIAL_PHOTOS: MemoryPhoto[] = [
  // Center Floating Photo Album (Featured Hero)
  {
    id: 'photo-center-album',
    title: 'The Solitary Lighthouse at Dawn',
    date: 'October 14, 2024',
    location: 'Faroe Islands, Nordic Sea',
    description: 'Standing at the edge of the world as the morning fog parted. The gentle swell of the Atlantic crashed against basalt cliffs in complete silence. A moment of utter stillness etched forever.',
    cameraInfo: 'Leica M11 • Summicron 35mm f/2 • ISO 100 • 1/250s',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85',
    category: 'Travel',
    aspectRatio: 1.4,
    type: 'pedestal',
    worldPosition: [-11.5, 1.5, -14],
    worldRotation: [-0.15, 0, 0],
    size: [1.8, 1.3]
  },
  // Floating Memories (Gently floating around the room)
  {
    id: 'photo-float-01',
    title: 'Autumn Rain in Kyoto',
    date: 'November 22, 2023',
    location: 'Gion, Kyoto, Japan',
    description: 'Lanterns catching raindrops along the stone alleys of Gion. The aroma of roasted green tea drifted from wooden teahouses into the quiet evening air.',
    cameraInfo: 'Fujifilm X-T5 • 23mm f/1.4 • Classic Chrome • ISO 400',
    imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=85',
    category: 'Travel',
    aspectRatio: 1.33,
    type: 'floating',
    worldPosition: [-9.8, 2.1, -12.3],
    worldRotation: [0.08, -0.4, 0.05],
    size: [1.3, 1.0]
  },
  {
    id: 'photo-float-02',
    title: 'The Golden Hour Atelier',
    date: 'March 18, 2024',
    location: 'SoHo, New York',
    description: 'Afternoon sunbeams cutting through cast-iron floor-to-ceiling windows, casting geometric shadows across unfinished linen canvases and clay sculptures.',
    cameraInfo: 'Contax G2 • 45mm Planar • Kodak Portra 400',
    imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=85',
    category: 'Art',
    aspectRatio: 1.25,
    type: 'floating',
    worldPosition: [-9.6, 2.1, -15.6],
    worldRotation: [0.06, 0.45, -0.04],
    size: [1.3, 1.0]
  },
  {
    id: 'photo-float-03',
    title: 'Serenade of the Pine Forest',
    date: 'June 05, 2024',
    location: 'Dolomites, Northern Italy',
    description: 'Hiking beneath limestone pinnacles as morning dew evaporated from high alpine meadows. The air was crisp, tasting of cold rock and ancient pine needles.',
    cameraInfo: 'Sony A7R V • 24-70mm GM II @ 35mm • ISO 100',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85',
    category: 'Nature',
    aspectRatio: 1.45,
    type: 'floating',
    worldPosition: [-13.2, 2.3, -11.9],
    worldRotation: [-0.05, -0.35, 0.03],
    size: [1.4, 1.0]
  },

  // Back Wall Gallery (Facing the viewer as they look deep into Room 01, at X = -15.8)
  {
    id: 'photo-wall-01',
    title: 'Minimalist Architecture in Copenhagen',
    date: 'August 12, 2024',
    location: 'Ørestad, Copenhagen',
    description: 'Pristine concrete intersecting clean glass volumes. A study in geometric rhythm, Nordic natural daylight, and the beauty of negative space.',
    cameraInfo: 'Hasselblad 907X • 45mm • ISO 64',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=85',
    category: 'Architecture',
    aspectRatio: 1.35,
    type: 'wall',
    worldPosition: [-15.75, 2.6, -15.8],
    worldRotation: [0, Math.PI / 2, 0],
    size: [1.6, 1.2]
  },
  {
    id: 'photo-wall-02',
    title: 'Reflections on Lake Como',
    date: 'May 29, 2024',
    location: 'Bellagio, Lake Como, Italy',
    description: 'Waking up to shimmering azure waters reflecting pastel villas against misty pre-Alpine mountains. A terrace breakfast surrounded by jasmine blossoms.',
    cameraInfo: 'Leica Q3 • Summilux 28mm • f/4 • ISO 125',
    imageUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=85',
    category: 'Travel',
    aspectRatio: 1.5,
    type: 'wall',
    worldPosition: [-15.75, 2.6, -13.8],
    worldRotation: [0, Math.PI / 2, 0],
    size: [1.8, 1.2]
  },
  {
    id: 'photo-wall-03',
    title: 'Midnight Sun over the Fjord',
    date: 'July 03, 2024',
    location: 'Geirangerfjord, Norway',
    description: 'At 1:00 AM, the sun dipped just below the jagged snowy horizon, painting the sky in iridescent violet, peach, and liquid gold for four uninterrupted hours.',
    cameraInfo: 'Sony A7R V • 16-35mm GM • ISO 200',
    imageUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=85',
    category: 'Nature',
    aspectRatio: 1.4,
    type: 'wall',
    worldPosition: [-15.75, 2.6, -11.8],
    worldRotation: [0, Math.PI / 2, 0],
    size: [1.6, 1.15]
  },

  // Left Wall Gallery (Z = -8.7, Facing +Z towards center)
  {
    id: 'photo-wall-04',
    title: 'Espresso & Old Bookstores',
    date: 'January 15, 2024',
    location: 'Saint-Germain-des-Prés, Paris',
    description: 'Tucked away in a 200-year-old bookshop courtyard while winter drizzle touched the skylight. Pages of poetry, hot ceramic mug, and tranquil solitude.',
    cameraInfo: 'Fujifilm X100V • 23mm f/2 • Classic Negative',
    imageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=85',
    category: 'Moments',
    aspectRatio: 1.3,
    type: 'wall',
    worldPosition: [-13.4, 2.3, -8.75],
    worldRotation: [0, Math.PI, 0],
    size: [1.5, 1.15]
  },
  {
    id: 'photo-wall-05',
    title: 'Ceramic Craft & Morning Shadows',
    date: 'February 10, 2024',
    location: 'Arita, Saga Prefecture, Japan',
    description: 'Watching a fourth-generation ceramic master turn local mountain porcelain clay into paper-thin tea bowls on a foot-pedal wooden wheel.',
    cameraInfo: 'Leica SL2-S • Apo-Summicron 50mm • ISO 320',
    imageUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=85',
    category: 'Art',
    aspectRatio: 1.25,
    type: 'wall',
    worldPosition: [-11.0, 2.3, -8.75],
    worldRotation: [0, Math.PI, 0],
    size: [1.4, 1.1]
  },

  // Right Wall Gallery (Z = -18.7, Facing -Z towards center)
  {
    id: 'photo-wall-06',
    title: 'Stargazing at Joshua Tree',
    date: 'September 28, 2024',
    location: 'Hidden Valley, Joshua Tree, California',
    description: 'The Milky Way stretching directly overhead like a crystalline river above giant monzogranite boulder stacks. Shooting stars every few minutes.',
    cameraInfo: 'Nikon Z8 • 20mm f/1.8 S • 15s • ISO 3200',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=85',
    category: 'Nature',
    aspectRatio: 1.45,
    type: 'wall',
    worldPosition: [-13.4, 2.3, -19.25],
    worldRotation: [0, 0, 0],
    size: [1.5, 1.1]
  },
  {
    id: 'photo-wall-07',
    title: 'Coastline of Cape Town',
    date: 'December 19, 2023',
    location: 'Camps Bay, Cape Town',
    description: 'Twelve Apostles peaks glowing crimson under evening dusk while waves crested with white seafoam. A coastal breeze filled with ozone and sea salt.',
    cameraInfo: 'Canon EOS R5 • 24-105mm f/4L • ISO 160',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85',
    category: 'Travel',
    aspectRatio: 1.4,
    type: 'wall',
    worldPosition: [-11.0, 2.3, -19.25],
    worldRotation: [0, 0, 0],
    size: [1.4, 1.05]
  }
];

const STORAGE_KEY = 'memory_house_custom_photos_v1';

export function getStoredPhotos(): MemoryPhoto[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_PHOTOS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // fallback
  }
  return INITIAL_PHOTOS;
}

export function saveStoredPhotos(photos: MemoryPhoto[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
  } catch (e) {
    console.error('Failed to save photos to localStorage', e);
  }
}
