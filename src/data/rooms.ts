export interface RoomData {
  id: string;
  number: string;
  displayNumber: string;
  title: string;
  subtitle: string;
  side: 'left' | 'right';
  status: 'active' | 'coming-soon';
  corridorZ: number;
  doorwayX: number;
  roomCenter: [number, number, number];
  cameraInsidePos: [number, number, number];
  cameraInsideLookAt: [number, number, number];
  themeColor: string;
  description: string;
  futureConcept?: string;
  stats?: string;
}

export const ROOMS_DATA: RoomData[] = [
  {
    id: 'room-01',
    number: '01',
    displayNumber: 'ROOM 01',
    title: 'The Photo Gallery',
    subtitle: 'Moments Captured in Light',
    side: 'left',
    status: 'active',
    corridorZ: -14,
    doorwayX: -3.5,
    roomCenter: [-11, 2, -14],
    cameraInsidePos: [-8.8, 1.85, -14],
    cameraInsideLookAt: [-12.2, 1.8, -14],
    themeColor: '#e0e7ff',
    description: 'A curated sanctuary of physical and floating 3D memories, analog frames, and moments preserved through time.',
    stats: '12 Framed Memories'
  },
  {
    id: 'room-02',
    number: '02',
    displayNumber: 'ROOM 02',
    title: 'The Sound Chamber',
    subtitle: 'Acoustics & Ambient Resonance',
    side: 'right',
    status: 'coming-soon',
    corridorZ: -26,
    doorwayX: 3.5,
    roomCenter: [11, 2, -26],
    cameraInsidePos: [8.8, 1.85, -26],
    cameraInsideLookAt: [12.2, 1.8, -26],
    themeColor: '#fef3c7',
    description: 'An acoustic sanctuary designed to house soundscapes, vinyl memories, voice memos, and musical milestones.',
    futureConcept: 'Spatial audio player with interactive vinyl records and kinetic acoustic waveform sculpture.'
  },
  {
    id: 'room-03',
    number: '03',
    displayNumber: 'ROOM 03',
    title: 'The Letter Vault',
    subtitle: 'Epistles, Journal Entries & Thoughts',
    side: 'left',
    status: 'coming-soon',
    corridorZ: -38,
    doorwayX: -3.5,
    roomCenter: [-11, 2, -38],
    cameraInsidePos: [-8.8, 1.85, -38],
    cameraInsideLookAt: [-12.2, 1.8, -38],
    themeColor: '#fbcfe8',
    description: 'A quiet library chamber dedicated to handwritten letters, vintage postcards, and personal diary pages.',
    futureConcept: 'Interactive 3D parchment manuscripts that unfold with handwritten typography upon inspection.'
  },
  {
    id: 'room-04',
    number: '04',
    displayNumber: 'ROOM 04',
    title: 'The Project Atelier',
    subtitle: 'Blueprints, Code & Artifacts',
    side: 'right',
    status: 'coming-soon',
    corridorZ: -50,
    doorwayX: 3.5,
    roomCenter: [11, 2, -50],
    cameraInsidePos: [8.8, 1.85, -50],
    cameraInsideLookAt: [12.2, 1.8, -50],
    themeColor: '#c7d2fe',
    description: 'An architectural workshop displaying creative projects, interactive prototypes, and milestones.',
    futureConcept: 'Holographic project plinths with 3D model previews, source code snippets, and live demo links.'
  },
  {
    id: 'room-05',
    number: '05',
    displayNumber: 'ROOM 05',
    title: 'The Screening Room',
    subtitle: 'Cinema, Motion & Vignettes',
    side: 'left',
    status: 'coming-soon',
    corridorZ: -62,
    doorwayX: -3.5,
    roomCenter: [-11, 2, -62],
    cameraInsidePos: [-8.8, 1.85, -62],
    cameraInsideLookAt: [-12.2, 1.8, -62],
    themeColor: '#ddd6fe',
    description: 'A cinematic theatre space crafted for 16mm film loops, travel reels, and moving visual vignettes.',
    futureConcept: 'Ambient 3D projection wall playing vintage film reels with mechanical reel-to-reel projector.'
  },
  {
    id: 'room-06',
    number: '06',
    displayNumber: 'ROOM 06',
    title: 'The Sanctuary',
    subtitle: 'Meditations & Future Horizons',
    side: 'right',
    status: 'coming-soon',
    corridorZ: -74,
    doorwayX: 3.5,
    roomCenter: [11, 2, -74],
    cameraInsidePos: [8.8, 1.85, -74],
    cameraInsideLookAt: [12.2, 1.8, -74],
    themeColor: '#a7f3d0',
    description: 'The final destination of the house — a calm contemplative sanctuary with open skylight and endless horizons.',
    futureConcept: 'Zen stone garden with procedural water reflections, dynamic day/night cycles, and time capsule vault.'
  }
];

export const CORRIDOR_CONFIG = {
  width: 7.0,
  height: 4.2,
  corridorStart: 5.5,
  corridorEnd: -86,
  cameraDefaultPos: [0, 1.85, 4.2] as [number, number, number],
  cameraDefaultLookAt: [0, 1.75, -36] as [number, number, number]
};
