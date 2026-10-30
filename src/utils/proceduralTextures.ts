import * as THREE from 'three';

// Cache generated textures so we don't recreate them needlessly
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Creates subtle architectural plaster/wall texture with micro-grain
 */
export function getWallTexture(anisotropy = 4): THREE.CanvasTexture {
  const key = 'wall_plaster';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#fafafa';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle micro-noise for physical plaster feel
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 6;
    data[i] = Math.min(255, Math.max(240, data[i] + grain));
    data[i + 1] = Math.min(255, Math.max(240, data[i + 1] + grain));
    data[i + 2] = Math.min(255, Math.max(240, data[i + 2] + grain));
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  textureCache.set(key, texture);
  return texture;
}

/**
 * Creates polished architectural concrete/white tile floor texture
 */
export function getFloorTexture(anisotropy = 4): THREE.CanvasTexture {
  const key = 'floor_tiles';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Light warm off-white floor
  ctx.fillStyle = '#f4f4f6';
  ctx.fillRect(0, 0, 1024, 1024);

  // Minimalist large-format architectural seams
  ctx.strokeStyle = '#e2e2e6';
  ctx.lineWidth = 2;

  // Grid line at 512
  ctx.beginPath();
  ctx.moveTo(512, 0);
  ctx.lineTo(512, 1024);
  ctx.moveTo(0, 512);
  ctx.lineTo(1024, 512);
  ctx.stroke();

  // Subtle terrazzo / micro specks
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const radius = Math.random() * 1.5;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(210, 212, 220, 0.35)' : 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 16);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  textureCache.set(key, texture);
  return texture;
}

/**
 * Generates high-resolution, ultra-crisp 3D room number signage placard
 */
export function createSignageTexture(
  numberStr: string,
  titleStr: string,
  statusStr: string,
  isHovered = false
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Background - architectural obsidian
  ctx.fillStyle = isHovered ? '#1c1e24' : '#0f1115';
  ctx.fillRect(0, 0, 1024, 512);

  // Architectural frame border
  ctx.strokeStyle = isHovered ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = 8;
  ctx.strokeRect(12, 12, 1000, 488);

  // Left glowing accent bar
  const isActive = statusStr.toLowerCase().includes('active');
  ctx.fillStyle = isActive ? '#34d399' : '#60a5fa';
  ctx.fillRect(28, 40, 14, 432);

  // "ROOM" Prefix
  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 42px "Space Grotesk", monospace, sans-serif';
  ctx.fillText('ROOM', 70, 130);

  // Room Number (Huge, bold, high contrast)
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 150px "Space Grotesk", monospace, sans-serif';
  ctx.fillText(numberStr, 220, 150);

  // Status Badge
  ctx.fillStyle = isActive ? 'rgba(52, 211, 153, 0.2)' : 'rgba(96, 165, 250, 0.2)';
  ctx.fillRect(660, 70, 310, 64);
  ctx.strokeStyle = isActive ? '#34d399' : '#60a5fa';
  ctx.lineWidth = 3;
  ctx.strokeRect(660, 70, 310, 64);

  ctx.fillStyle = isActive ? '#34d399' : '#93c5fd';
  ctx.font = '700 30px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(isActive ? '● ACTIVE GALLERY' : '● EMPTY SPACE', 815, 114);
  ctx.textAlign = 'left';

  // Divider line
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillRect(70, 210, 900, 3);

  // Room Title
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 64px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(titleStr.toUpperCase(), 70, 310);

  // Click Action Prompt
  ctx.fillStyle = isHovered ? '#ffffff' : '#cbd5e1';
  ctx.font = '600 36px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('CLICK TO ENTER ROOM →', 70, 410);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Generates projecting blade sign with huge room number visible from down the corridor
 */
export function createBladeNumberTexture(numberStr: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Deep matte black background
  ctx.fillStyle = '#0d0f12';
  ctx.fillRect(0, 0, 512, 512);

  // Outer border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 8;
  ctx.strokeRect(16, 16, 480, 480);

  // Top header label
  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 44px "Space Grotesk", monospace, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ROOM', 256, 110);

  // Huge bold room number
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 240px "Space Grotesk", monospace, sans-serif';
  ctx.fillText(numberStr, 256, 330);

  // Bottom subtle dot
  ctx.fillStyle = numberStr === '01' ? '#34d399' : '#60a5fa';
  ctx.beginPath();
  ctx.arc(256, 410, 16, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates fallback procedural photograph for memory frames with vibrant gallery art colors
 */
export function createFallbackPhotoTexture(title: string, category: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 450;
  const ctx = canvas.getContext('2d')!;

  // Vibrant rich gallery gradient
  const grad = ctx.createLinearGradient(0, 0, 600, 450);
  if (category === 'Nature') {
    grad.addColorStop(0, '#0f3d2e');
    grad.addColorStop(0.5, '#1e6f5c');
    grad.addColorStop(1, '#e8aa42');
  } else if (category === 'Travel') {
    grad.addColorStop(0, '#1a365d');
    grad.addColorStop(0.5, '#2b6cb0');
    grad.addColorStop(1, '#f6ad55');
  } else {
    grad.addColorStop(0, '#2d1b4e');
    grad.addColorStop(0.5, '#6b21a8');
    grad.addColorStop(1, '#f43f5e');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 600, 450);

  // Atmospheric sun/horizon glow
  const glowGrad = ctx.createRadialGradient(420, 160, 20, 420, 160, 280);
  glowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
  glowGrad.addColorStop(0.5, 'rgba(255, 230, 180, 0.25)');
  glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, 600, 450);

  // Subtle architectural geometric silhouettes
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.arc(300, 420, 220, 0, Math.PI * 2);
  ctx.fill();

  // Category Tag in crisp white with soft pill background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(32, 28, 220, 36);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 15px "Space Grotesk", sans-serif';
  ctx.fillText(category.toUpperCase() + ' • GALLERY PRINT', 42, 52);

  // Title in vibrant clean white with drop shadow
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 28px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(title, 36, 400);
  ctx.shadowBlur = 0;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Loads any photo in its true, full vivid color with standard physical shading
 */
export function loadColorPhotoTexture(
  imageUrl: string,
  onLoad: (texture: THREE.Texture) => void,
  onError?: () => void
): void {
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin('anonymous');
  loader.load(
    imageUrl,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      texture.needsUpdate = true;
      onLoad(texture);
    },
    undefined,
    () => {
      // If error occurs, call onError
      onError?.();
    }
  );
}

// Keep loadWhiteShadedTexture alias for backwards compatibility, pointing to full color loader
export const loadWhiteShadedTexture = loadColorPhotoTexture;

/**
 * Creates high-contrast eye-level door placard (mounted on wall beside door at Y = 1.68m)
 */
export function createEyeLevelPlacardTexture(
  numberStr: string,
  titleStr: string,
  statusStr: string,
  isHovered = false
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Deep obsidian luxury architectural plaque background
  ctx.fillStyle = isHovered ? '#1a1d24' : '#0c0d11';
  ctx.fillRect(0, 0, 1024, 512);

  // Elegant chamfered border
  ctx.strokeStyle = isHovered ? 'rgba(52, 211, 153, 0.9)' : 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 10;
  ctx.strokeRect(16, 16, 992, 480);

  // Status indicator accent bar
  const isActive = statusStr.toLowerCase().includes('active');
  ctx.fillStyle = isActive ? '#34d399' : '#60a5fa';
  ctx.fillRect(36, 44, 16, 424);

  // "ROOM" Header
  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 38px "Space Grotesk", monospace, sans-serif';
  ctx.fillText('ROOM', 80, 120);

  // Room Number (Large, high-impact)
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 136px "Space Grotesk", monospace, sans-serif';
  ctx.fillText(numberStr, 220, 140);

  // Status Badge
  ctx.fillStyle = isActive ? 'rgba(52, 211, 153, 0.22)' : 'rgba(96, 165, 250, 0.2)';
  ctx.fillRect(640, 60, 330, 68);
  ctx.strokeStyle = isActive ? '#34d399' : '#60a5fa';
  ctx.lineWidth = 3;
  ctx.strokeRect(640, 60, 330, 68);

  ctx.fillStyle = isActive ? '#34d399' : '#93c5fd';
  ctx.font = '700 28px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(isActive ? '● OPEN GALLERY' : '● COMING SOON', 805, 104);
  ctx.textAlign = 'left';

  // Divider line
  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.fillRect(80, 195, 890, 4);

  // Room Title
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 58px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(titleStr.toUpperCase(), 80, 290);

  // Action CTA
  ctx.fillStyle = isActive ? '#34d399' : '#cbd5e1';
  ctx.font = '700 36px "Space Grotesk", sans-serif';
  ctx.fillText(isActive ? 'CLICK DOOR TO OPEN & ENTER ➔' : 'SPACE UNDER CURATION', 80, 400);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates textured album page / book texture
 */
export function createAlbumCoverTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1c1e24';
  ctx.fillRect(0, 0, 512, 512);

  // Gold foil embossed frame
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 4;
  ctx.strokeRect(32, 32, 448, 448);

  ctx.lineWidth = 1;
  ctx.strokeRect(40, 40, 432, 432);

  // Title in gold
  ctx.fillStyle = '#d4af37';
  ctx.font = '600 32px "Cinzel", serif';
  ctx.textAlign = 'center';
  ctx.fillText('CHRONICLES OF MEMORY', 256, 230);

  ctx.font = '400 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#c5b392';
  ctx.fillText('VOLUME 01 • ANTHOLOGY', 256, 270);

  ctx.font = '300 14px "Space Grotesk", monospace';
  ctx.fillText('ROOM 01 EXHIBITION', 256, 310);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
