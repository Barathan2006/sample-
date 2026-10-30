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
 * Creates fallback procedural photograph for memory frames if image is loading
 */
export function createFallbackPhotoTexture(title: string, category: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 450;
  const ctx = canvas.getContext('2d')!;

  // Elegant gradient
  const grad = ctx.createLinearGradient(0, 0, 600, 450);
  if (category === 'Travel') {
    grad.addColorStop(0, '#1e3a5f');
    grad.addColorStop(1, '#e0a96d');
  } else if (category === 'Art') {
    grad.addColorStop(0, '#2e1c3b');
    grad.addColorStop(1, '#8f4f6e');
  } else if (category === 'Nature') {
    grad.addColorStop(0, '#173f35');
    grad.addColorStop(1, '#5a8264');
  } else {
    grad.addColorStop(0, '#232931');
    grad.addColorStop(1, '#4e5a65');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 600, 450);

  // Subtle geometric horizon
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.arc(300, 380, 180, 0, Math.PI * 2);
  ctx.fill();

  // Category Tag
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '600 18px "Space Grotesk", sans-serif';
  ctx.fillText(category.toUpperCase(), 40, 60);

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 28px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(title, 40, 400);

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
