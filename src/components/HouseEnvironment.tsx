import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ROOMS_DATA, CORRIDOR_CONFIG, RoomData } from '../data/rooms';
import { MemoryPhoto } from '../data/photos';
import { 
  getWallTexture, 
  getFloorTexture, 
  createSignageTexture, 
  createBladeNumberTexture,
  createFallbackPhotoTexture, 
  createAlbumCoverTexture 
} from '../utils/proceduralTextures';
import { audioSynthesizer } from '../utils/audioSynthesizer';

interface RoomDoorGate {
  roomId: string;
  hingeGroup: THREE.Group;
  doorPanel: THREE.Mesh;
  isOpen: boolean;
  openAngle: number;
}

interface HouseEnvironmentProps {
  currentRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onSelectPhoto: (photo: MemoryPhoto) => void;
  photos: MemoryPhoto[];
}

export const HouseEnvironment: React.FC<HouseEnvironmentProps> = ({
  currentRoomId,
  onSelectRoom,
  onSelectPhoto,
  photos
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  const stateRef = useRef({
    currentRoomId,
    targetCamPos: new THREE.Vector3(...CORRIDOR_CONFIG.cameraDefaultPos),
    targetCamLook: new THREE.Vector3(...CORRIDOR_CONFIG.cameraDefaultLookAt),
    currentLook: new THREE.Vector3(...CORRIDOR_CONFIG.cameraDefaultLookAt),
    corridorZ: CORRIDOR_CONFIG.cameraDefaultPos[2],
    roomZoomProgress: 0,
    baseYaw: 0,
    isTransitioning: false,
    dragYaw: 0,
    dragPitch: 0,
    targetDragYaw: 0,
    targetDragPitch: 0,
    isPointerDown: false,
    prevPointerX: 0,
    prevPointerY: 0,
    hoveredDoorId: null as string | null,
    hoveredPhotoId: null as string | null,
    roomGates: [] as RoomDoorGate[],
  });

  const mountedPhotoIdsRef = useRef<Set<string>>(new Set());
  const addPhotoToSceneRef = useRef<((photo: MemoryPhoto) => void) | null>(null);

  // Dynamically sync newly added photos into the live 3D Room 01 scene
  useEffect(() => {
    if (addPhotoToSceneRef.current) {
      photos.forEach((p) => {
        if (!mountedPhotoIdsRef.current.has(p.id) && p.type !== 'pedestal') {
          addPhotoToSceneRef.current?.(p);
        }
      });
    }
  }, [photos]);

  // Sync currentRoomId into stateRef
  useEffect(() => {
    stateRef.current.currentRoomId = currentRoomId;
    stateRef.current.roomZoomProgress = 0;
    stateRef.current.targetDragYaw = 0;
    stateRef.current.targetDragPitch = 0;
    stateRef.current.dragYaw = 0;
    stateRef.current.dragPitch = 0;

    if (!currentRoomId) {
      // Set to corridor view: looking straight forward down corridor (-Z)
      stateRef.current.baseYaw = 0;
      stateRef.current.targetCamPos.set(0, 1.85, stateRef.current.corridorZ);
      stateRef.current.isTransitioning = true;
      // Close all doors when back in corridor
      stateRef.current.roomGates.forEach((g) => {
        g.isOpen = false;
      });
    } else {
      const room = ROOMS_DATA.find((r) => r.id === currentRoomId);
      if (room) {
        stateRef.current.corridorZ = room.corridorZ;
        // Point base view into the room (left rooms look -X, right rooms look +X)
        stateRef.current.baseYaw = room.side === 'left' ? -Math.PI / 2 : Math.PI / 2;
        stateRef.current.targetCamPos.set(...room.cameraInsidePos);
        stateRef.current.isTransitioning = true;
        // Open the active room's door
        stateRef.current.roomGates.forEach((g) => {
          g.isOpen = g.roomId === currentRoomId;
        });
      }
    }
  }, [currentRoomId]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect Software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Setup Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f0f1f5');
    scene.fog = new THREE.Fog('#eaebf2', 12, 100);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 150);
    camera.position.set(...CORRIDOR_CONFIG.cameraDefaultPos);
    camera.lookAt(new THREE.Vector3(...CORRIDOR_CONFIG.cameraDefaultLookAt));

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 3. PMREMGenerator with RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Lighting Rig
    // Hemisphere light for soft ambient architectural bounce
    const hemiLight = new THREE.HemisphereLight('#ffffff', '#cbd5e1', 0.85);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    // Main directional sunlight casting soft architectural shadows
    const sunLight = new THREE.DirectionalLight('#fffaf0', 1.4);
    sunLight.position.set(12, 28, 10);
    sunLight.castShadow = !isSoftwareGl;
    if (sunLight.castShadow) {
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 0.5;
      sunLight.shadow.camera.far = 120;
      const d = 50;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
      sunLight.shadow.bias = -0.0004;
      sunLight.shadow.normalBias = 0.02;
    }
    scene.add(sunLight);

    // Common Textures & Materials
    const wallTex = getWallTexture(renderer.capabilities.getMaxAnisotropy());
    const floorTex = getFloorTexture(renderer.capabilities.getMaxAnisotropy());

    // Pristine white architectural materials
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xfcfcfd,
      roughness: 0.85,
      metalness: 0.05,
      map: wallTex,
    });

    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0xf6f6f9,
      roughness: 0.25,
      metalness: 0.1,
      map: floorTex,
    });

    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.02,
    });

    const trimMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e2026,
      roughness: 0.3,
      metalness: 0.7,
    });

    const frameWoodMaterial = new THREE.MeshStandardMaterial({
      color: 0x22242a,
      roughness: 0.4,
      metalness: 0.2,
    });

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.1,
      metalness: 0.1,
      transmission: isSoftwareGl ? 0 : 0.88,
      transparent: true,
      opacity: isSoftwareGl ? 0.3 : 0.95,
      ior: 1.5,
      depthWrite: false,
    });

    const lightGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xfffae8,
    });

    // 5. Interactive Raycasting Targets & Gates
    const roomGates: RoomDoorGate[] = [];
    stateRef.current.roomGates = roomGates;
    const interactiveDoors: { mesh: THREE.Mesh; roomId: string; signMesh: THREE.Mesh }[] = [];
    const interactivePhotos: { mesh: THREE.Mesh; photo: MemoryPhoto; frameGroup: THREE.Group }[] = [];
    const floatingMeshObjects: { group: THREE.Group; baseY: number; phase: number; rotSpeed: number }[] = [];

    // --- BUILD ARCHITECTURE ---

    // A. Main Corridor
    const corridorGroup = new THREE.Group();
    scene.add(corridorGroup);

    const corrWidth = CORRIDOR_CONFIG.width;
    const corrHeight = CORRIDOR_CONFIG.height;
    const corrLength = Math.abs(CORRIDOR_CONFIG.corridorEnd - CORRIDOR_CONFIG.corridorStart);
    const corrCenterZ = (CORRIDOR_CONFIG.corridorStart + CORRIDOR_CONFIG.corridorEnd) / 2;

    // Corridor Floor
    const corrFloorGeo = new THREE.PlaneGeometry(corrWidth, corrLength);
    const corrFloor = new THREE.Mesh(corrFloorGeo, floorMaterial);
    corrFloor.rotation.x = -Math.PI / 2;
    corrFloor.position.set(0, 0, corrCenterZ);
    corrFloor.receiveShadow = true;
    corridorGroup.add(corrFloor);

    // Corridor Ceiling
    const corrCeilGeo = new THREE.PlaneGeometry(corrWidth, corrLength);
    const corrCeil = new THREE.Mesh(corrCeilGeo, ceilingMaterial);
    corrCeil.rotation.x = Math.PI / 2;
    corrCeil.position.set(0, corrHeight, corrCenterZ);
    corridorGroup.add(corrCeil);

    // Ceiling Light Strips (Recessed down the center of corridor)
    const lightStripGeo = new THREE.BoxGeometry(0.35, 0.04, corrLength);
    const lightStrip = new THREE.Mesh(lightStripGeo, lightGlowMaterial);
    lightStrip.position.set(0, corrHeight - 0.02, corrCenterZ);
    corridorGroup.add(lightStrip);

    // Recessed light slot border
    const lightSlotTrimGeo = new THREE.BoxGeometry(0.45, 0.06, corrLength);
    const lightSlotTrim = new THREE.Mesh(lightSlotTrimGeo, trimMaterial);
    lightSlotTrim.position.set(0, corrHeight - 0.01, corrCenterZ);
    corridorGroup.add(lightSlotTrim);

    // Corridor Entrance Wall (Z = CORRIDOR_CONFIG.corridorStart)
    const entranceWallGeo = new THREE.BoxGeometry(corrWidth + 4, corrHeight, 0.4);
    const entranceWall = new THREE.Mesh(entranceWallGeo, wallMaterial);
    entranceWall.position.set(0, corrHeight / 2, CORRIDOR_CONFIG.corridorStart + 0.2);
    corridorGroup.add(entranceWall);

    // Corridor Far End Window (Z = CORRIDOR_CONFIG.corridorEnd)
    const farEndWallGeo = new THREE.BoxGeometry(corrWidth, corrHeight, 0.2);
    const farEndWall = new THREE.Mesh(farEndWallGeo, wallMaterial);
    farEndWall.position.set(0, corrHeight / 2, CORRIDOR_CONFIG.corridorEnd - 0.1);
    corridorGroup.add(farEndWall);

    // Elegant tall frosted horizon window at the end of the corridor
    const windowFrameGeo = new THREE.BoxGeometry(3.6, corrHeight * 0.8, 0.15);
    const windowFrame = new THREE.Mesh(windowFrameGeo, trimMaterial);
    windowFrame.position.set(0, corrHeight / 2, CORRIDOR_CONFIG.corridorEnd + 0.05);
    corridorGroup.add(windowFrame);

    const windowGlassGeo = new THREE.PlaneGeometry(3.4, corrHeight * 0.76);
    const windowGlass = new THREE.Mesh(windowGlassGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    windowGlass.position.set(0, corrHeight / 2, CORRIDOR_CONFIG.corridorEnd + 0.1);
    corridorGroup.add(windowGlass);

    // Corridor Side Walls with precise doorway openings for the 6 rooms
    // We build wall segments along Left (X = -corrWidth/2) and Right (X = corrWidth/2)
    const doorwayWidth = 2.4;
    const doorwayHeight = 3.2;

    const buildCorridorWallWithDoorways = (
      side: 'left' | 'right',
      doorwayZs: { z: number; roomId: string; roomNum: string; roomTitle: string; status: string }[]
    ) => {
      const wallX = side === 'left' ? -corrWidth / 2 : corrWidth / 2;
      const sortedZs = [...doorwayZs].sort((a, b) => b.z - a.z); // from start to end

      let currentZ = CORRIDOR_CONFIG.corridorStart;

      sortedZs.forEach((door) => {
        const segStartZ = currentZ;
        const segEndZ = door.z + doorwayWidth / 2;
        const segLength = segStartZ - segEndZ;

        if (segLength > 0.05) {
          const segGeo = new THREE.BoxGeometry(0.3, corrHeight, segLength);
          const segMesh = new THREE.Mesh(segGeo, wallMaterial);
          segMesh.position.set(wallX, corrHeight / 2, (segStartZ + segEndZ) / 2);
          segMesh.castShadow = true;
          segMesh.receiveShadow = true;
          corridorGroup.add(segMesh);
        }

        // Top lintel above doorway
        const lintelHeight = corrHeight - doorwayHeight;
        const lintelGeo = new THREE.BoxGeometry(0.3, lintelHeight, doorwayWidth);
        const lintelMesh = new THREE.Mesh(lintelGeo, wallMaterial);
        lintelMesh.position.set(wallX, doorwayHeight + lintelHeight / 2, door.z);
        lintelMesh.castShadow = true;
        corridorGroup.add(lintelMesh);

        // Architectural Door Architrave / Trim
        const architraveGeo = new THREE.BoxGeometry(0.35, doorwayHeight + 0.1, 0.1);
        const archLeft = new THREE.Mesh(architraveGeo, trimMaterial);
        archLeft.position.set(wallX, doorwayHeight / 2, door.z + doorwayWidth / 2);
        corridorGroup.add(archLeft);

        const archRight = new THREE.Mesh(architraveGeo, trimMaterial);
        archRight.position.set(wallX, doorwayHeight / 2, door.z - doorwayWidth / 2);
        corridorGroup.add(archRight);

        const archTopGeo = new THREE.BoxGeometry(0.35, 0.1, doorwayWidth + 0.2);
        const archTop = new THREE.Mesh(archTopGeo, trimMaterial);
        archTop.position.set(wallX, doorwayHeight + 0.05, door.z);
        corridorGroup.add(archTop);

        // Floor threshold strip
        const threshGeo = new THREE.BoxGeometry(0.4, 0.03, doorwayWidth);
        const thresh = new THREE.Mesh(threshGeo, trimMaterial);
        thresh.position.set(wallX, 0.015, door.z);
        corridorGroup.add(thresh);

        // 1. Large Illuminated Doorway Signage Plaque (Directly above the doorway lintel)
        const signTex = createSignageTexture(door.roomNum, door.roomTitle, door.status, false);
        const signBoxGeo = new THREE.BoxGeometry(0.04, 0.72, 2.0);
        const signBoxMat = new THREE.MeshStandardMaterial({
          color: 0x111317,
          roughness: 0.4,
          metalness: 0.2
        });
        const signBox = new THREE.Mesh(signBoxGeo, signBoxMat);
        const signFaceX = side === 'left' ? -3.31 : 3.31;
        signBox.position.set(side === 'left' ? -3.33 : 3.33, doorwayHeight + 0.48, door.z);
        corridorGroup.add(signBox);

        const signGeo = new THREE.PlaneGeometry(1.96, 0.68);
        const signMat = new THREE.MeshBasicMaterial({
          map: signTex,
        });
        const signMesh = new THREE.Mesh(signGeo, signMat);
        signMesh.position.set(signFaceX, doorwayHeight + 0.48, door.z);
        signMesh.rotation.y = side === 'left' ? Math.PI / 2 : -Math.PI / 2;
        corridorGroup.add(signMesh);

        // 2. Projecting Blade Plaque (Sticks out into corridor beside door, visible from far down hallway)
        const bladeTex = createBladeNumberTexture(door.roomNum);
        const bladeMat = new THREE.MeshBasicMaterial({ map: bladeTex });
        const bladeZ = door.z + (doorwayWidth / 2 + 0.35);
        const bladeY = 2.4;
        const bladeX = side === 'left' ? -3.15 : 3.15;

        // Mounting bracket
        const bracketGeo = new THREE.BoxGeometry(0.38, 0.04, 0.04);
        const bracketMesh = new THREE.Mesh(bracketGeo, trimMaterial);
        bracketMesh.position.set(bladeX, bladeY + 0.22, bladeZ);
        corridorGroup.add(bracketMesh);

        // Blade plate core
        const bladeCoreGeo = new THREE.BoxGeometry(0.36, 0.44, 0.03);
        const bladeCore = new THREE.Mesh(bladeCoreGeo, trimMaterial);
        bladeCore.position.set(bladeX, bladeY, bladeZ);
        corridorGroup.add(bladeCore);

        // Front face (facing visitor coming from entrance towards -Z)
        const bladeFrontGeo = new THREE.PlaneGeometry(0.35, 0.42);
        const bladeFront = new THREE.Mesh(bladeFrontGeo, bladeMat);
        bladeFront.position.set(bladeX, bladeY, bladeZ + 0.016);
        bladeFront.rotation.y = 0;
        corridorGroup.add(bladeFront);

        // Back face (facing visitor coming back from corridor towards +Z)
        const bladeBack = new THREE.Mesh(bladeFrontGeo, bladeMat);
        bladeBack.position.set(bladeX, bladeY, bladeZ - 0.016);
        bladeBack.rotation.y = Math.PI;
        corridorGroup.add(bladeBack);

        // 3. Overhead Downlight for Doorway
        const doorSpot = new THREE.PointLight(0xfffaed, 0.9, 6);
        doorSpot.position.set(side === 'left' ? -3.0 : 3.0, corrHeight - 0.2, door.z);
        corridorGroup.add(doorSpot);

        // 4. Architectural Gate with swinging hinge
        const hingeGroup = new THREE.Group();
        const hingeX = side === 'left' ? wallX + 0.12 : wallX - 0.12;
        const hingeZ = door.z + doorwayWidth / 2 - 0.04;
        hingeGroup.position.set(hingeX, 0, hingeZ);
        corridorGroup.add(hingeGroup);

        const doorWidth = doorwayWidth - 0.08;
        const doorHeight = doorwayHeight - 0.06;
        const doorThick = 0.07;

        const doorPanelGeo = new THREE.BoxGeometry(doorThick, doorHeight, doorWidth);
        const doorPanelMat = new THREE.MeshStandardMaterial({
          color: 0xfcfcfd,
          roughness: 0.35,
          metalness: 0.06,
        });
        const doorPanel = new THREE.Mesh(doorPanelGeo, doorPanelMat);
        doorPanel.position.set(0, doorHeight / 2 + 0.02, -doorWidth / 2);
        doorPanel.castShadow = true;
        doorPanel.receiveShadow = true;
        hingeGroup.add(doorPanel);

        // Modern vertical black aluminum handle bar
        const handleOffset = side === 'left' ? 0.055 : -0.055;
        const handleGeo = new THREE.BoxGeometry(0.035, 1.35, 0.035);
        const handle = new THREE.Mesh(handleGeo, trimMaterial);
        handle.position.set(handleOffset, doorHeight / 2 - 0.1, -doorWidth + 0.22);
        hingeGroup.add(handle);

        // Inset frosted glass vertical slit
        const slitGeo = new THREE.BoxGeometry(doorThick + 0.015, 2.2, 0.08);
        const slitMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.2,
          transparent: true,
          opacity: 0.85,
        });
        const slitMesh = new THREE.Mesh(slitGeo, slitMat);
        slitMesh.position.set(0, doorHeight / 2, -doorWidth / 2);
        hingeGroup.add(slitMesh);

        // Left doors swing inward +86 deg, Right doors swing inward -86 deg
        const openAngle = side === 'left' ? Math.PI * 0.48 : -Math.PI * 0.48;

        const gateObj: RoomDoorGate = {
          roomId: door.roomId,
          hingeGroup,
          doorPanel,
          isOpen: stateRef.current.currentRoomId === door.roomId,
          openAngle,
        };
        roomGates.push(gateObj);

        // 5. Interactive Doorway Hit Area (Raycasting trigger for clicks)
        const hitGeo = new THREE.BoxGeometry(1.6, doorwayHeight + 0.8, doorwayWidth + 0.8);
        const hitMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitMesh = new THREE.Mesh(hitGeo, hitMat);
        hitMesh.position.set(wallX, doorwayHeight / 2 + 0.4, door.z);
        corridorGroup.add(hitMesh);

        interactiveDoors.push({
          mesh: hitMesh,
          roomId: door.roomId,
          signMesh,
        });
        interactiveDoors.push({
          mesh: doorPanel,
          roomId: door.roomId,
          signMesh,
        });
        interactiveDoors.push({
          mesh: signMesh,
          roomId: door.roomId,
          signMesh,
        });
        interactiveDoors.push({
          mesh: bladeFront,
          roomId: door.roomId,
          signMesh,
        });

        currentZ = door.z - doorwayWidth / 2;
      });

      // Tail segment to end of corridor
      const finalSegLength = currentZ - CORRIDOR_CONFIG.corridorEnd;
      if (finalSegLength > 0.05) {
        const segGeo = new THREE.BoxGeometry(0.3, corrHeight, finalSegLength);
        const segMesh = new THREE.Mesh(segGeo, wallMaterial);
        segMesh.position.set(wallX, corrHeight / 2, (currentZ + CORRIDOR_CONFIG.corridorEnd) / 2);
        segMesh.castShadow = true;
        segMesh.receiveShadow = true;
        corridorGroup.add(segMesh);
      }
    };

    const leftDoors = ROOMS_DATA.filter((r) => r.side === 'left').map((r) => ({
      z: r.corridorZ,
      roomId: r.id,
      roomNum: r.number,
      roomTitle: r.title,
      status: r.status === 'active' ? 'ACTIVE' : 'COMING SOON',
    }));

    const rightDoors = ROOMS_DATA.filter((r) => r.side === 'right').map((r) => ({
      z: r.corridorZ,
      roomId: r.id,
      roomNum: r.number,
      roomTitle: r.title,
      status: r.status === 'active' ? 'ACTIVE' : 'COMING SOON',
    }));

    buildCorridorWallWithDoorways('left', leftDoors);
    buildCorridorWallWithDoorways('right', rightDoors);

    // B. Build the 6 Connected Rooms in Zigzag Layout
    ROOMS_DATA.forEach((room) => {
      const roomGroup = new THREE.Group();
      scene.add(roomGroup);

      const roomWidth = 11;
      const roomDepth = 10;
      const roomHeight = 4.0;
      const [centerX, , centerZ] = room.roomCenter;

      // Room Floor
      const rFloorGeo = new THREE.PlaneGeometry(roomWidth, roomDepth);
      const rFloor = new THREE.Mesh(rFloorGeo, floorMaterial);
      rFloor.rotation.x = -Math.PI / 2;
      rFloor.position.set(centerX, 0.005, centerZ);
      rFloor.receiveShadow = true;
      roomGroup.add(rFloor);

      // Room Ceiling
      const rCeilGeo = new THREE.PlaneGeometry(roomWidth, roomDepth);
      const rCeil = new THREE.Mesh(rCeilGeo, ceilingMaterial);
      rCeil.rotation.x = Math.PI / 2;
      rCeil.position.set(centerX, roomHeight, centerZ);
      roomGroup.add(rCeil);

      // Recessed Ceiling Skylight in room
      const rSkylightGeo = new THREE.PlaneGeometry(roomWidth * 0.5, roomDepth * 0.4);
      const rSkylight = new THREE.Mesh(
        rSkylightGeo,
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      rSkylight.rotation.x = Math.PI / 2;
      rSkylight.position.set(centerX, roomHeight - 0.01, centerZ);
      roomGroup.add(rSkylight);

      // Outer Back Wall (opposite corridor doorway)
      const isLeft = room.side === 'left';
      const backWallX = isLeft ? centerX - roomWidth / 2 : centerX + roomWidth / 2;
      const backWallGeo = new THREE.BoxGeometry(0.3, roomHeight, roomDepth);
      const backWall = new THREE.Mesh(backWallGeo, wallMaterial);
      backWall.position.set(backWallX, roomHeight / 2, centerZ);
      backWall.castShadow = true;
      backWall.receiveShadow = true;
      roomGroup.add(backWall);

      // Front & Back Side Walls (along Z)
      const sideWallNorthGeo = new THREE.BoxGeometry(roomWidth, roomHeight, 0.3);
      const sideWallNorth = new THREE.Mesh(sideWallNorthGeo, wallMaterial);
      sideWallNorth.position.set(centerX, roomHeight / 2, centerZ + roomDepth / 2);
      sideWallNorth.castShadow = true;
      sideWallNorth.receiveShadow = true;
      roomGroup.add(sideWallNorth);

      const sideWallSouthGeo = new THREE.BoxGeometry(roomWidth, roomHeight, 0.3);
      const sideWallSouth = new THREE.Mesh(sideWallSouthGeo, wallMaterial);
      sideWallSouth.position.set(centerX, roomHeight / 2, centerZ - roomDepth / 2);
      sideWallSouth.castShadow = true;
      sideWallSouth.receiveShadow = true;
      roomGroup.add(sideWallSouth);

      // Inner Wall (facing corridor) with opening connecting to vestibule
      const innerWallX = isLeft ? centerX + roomWidth / 2 : centerX - roomWidth / 2;
      const wallHalfDepth = (roomDepth - doorwayWidth) / 2;

      // North piece
      const inWallNorthGeo = new THREE.BoxGeometry(0.3, roomHeight, wallHalfDepth);
      const inWallNorth = new THREE.Mesh(inWallNorthGeo, wallMaterial);
      inWallNorth.position.set(
        innerWallX,
        roomHeight / 2,
        centerZ + doorwayWidth / 2 + wallHalfDepth / 2
      );
      roomGroup.add(inWallNorth);

      // South piece
      const inWallSouthGeo = new THREE.BoxGeometry(0.3, roomHeight, wallHalfDepth);
      const inWallSouth = new THREE.Mesh(inWallSouthGeo, wallMaterial);
      inWallSouth.position.set(
        innerWallX,
        roomHeight / 2,
        centerZ - doorwayWidth / 2 - wallHalfDepth / 2
      );
      roomGroup.add(inWallSouth);

      // Lintel
      const inLintelGeo = new THREE.BoxGeometry(0.3, roomHeight - doorwayHeight, doorwayWidth);
      const inLintel = new THREE.Mesh(inLintelGeo, wallMaterial);
      inLintel.position.set(
        innerWallX,
        doorwayHeight + (roomHeight - doorwayHeight) / 2,
        centerZ
      );
      roomGroup.add(inLintel);

      // Vestibule connector walls linking corridor wall to room inner wall
      const vestStartX = isLeft ? -corrWidth / 2 : corrWidth / 2;
      const vestEndX = innerWallX;
      const vestLength = Math.abs(vestEndX - vestStartX);
      const vestCenterX = (vestStartX + vestEndX) / 2;

      const vestSideNorthGeo = new THREE.BoxGeometry(vestLength, doorwayHeight, 0.2);
      const vestSideNorth = new THREE.Mesh(vestSideNorthGeo, wallMaterial);
      vestSideNorth.position.set(vestCenterX, doorwayHeight / 2, centerZ + doorwayWidth / 2);
      roomGroup.add(vestSideNorth);

      const vestSideSouthGeo = new THREE.BoxGeometry(vestLength, doorwayHeight, 0.2);
      const vestSideSouth = new THREE.Mesh(vestSideSouthGeo, wallMaterial);
      vestSideSouth.position.set(vestCenterX, doorwayHeight / 2, centerZ - doorwayWidth / 2);
      roomGroup.add(vestSideSouth);

      // Soft architectural floor recessed baseboards
      const baseboardGeo = new THREE.BoxGeometry(roomWidth, 0.08, 0.02);
      const baseboardN = new THREE.Mesh(baseboardGeo, trimMaterial);
      baseboardN.position.set(centerX, 0.04, centerZ + roomDepth / 2 - 0.15);
      roomGroup.add(baseboardN);

      const baseboardS = new THREE.Mesh(baseboardGeo, trimMaterial);
      baseboardS.position.set(centerX, 0.04, centerZ - roomDepth / 2 + 0.15);
      roomGroup.add(baseboardS);

      // Interior Light for this room
      const roomSpot = new THREE.PointLight(0xfff7e6, 0.85, 14);
      roomSpot.position.set(centerX, 3.6, centerZ);
      roomGroup.add(roomSpot);

      // --- C. SPECIFIC ROOM CONTENTS ---
      if (room.id === 'room-01') {
        // Room 01: The Interactive 3D Photo Album Sanctuary
        buildRoom01Content(roomGroup, centerX, centerZ, photos);
      }
      // Rooms 02 to 06 are completely empty static architectural rooms
    });

    // Helper: Build Room 01 (Photo Gallery, Pedestal Album & Floating Frames)
    function buildRoom01Content(
      parent: THREE.Group,
      centerX: number,
      centerZ: number,
      photoList: MemoryPhoto[]
    ) {
      // 1. Center Minimalist Sculptural Pedestal
      const pedestalBaseGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.8, 32);
      const pedestalMat = new THREE.MeshStandardMaterial({
        color: 0xfafafa,
        roughness: 0.2,
        metalness: 0.1,
      });
      const pedestalBase = new THREE.Mesh(pedestalBaseGeo, pedestalMat);
      pedestalBase.position.set(centerX - 0.5, 0.4, centerZ);
      pedestalBase.receiveShadow = true;
      pedestalBase.castShadow = true;
      parent.add(pedestalBase);

      // Top marble platter
      const platterGeo = new THREE.CylinderGeometry(1.7, 1.7, 0.06, 32);
      const platterMat = new THREE.MeshStandardMaterial({
        color: 0x1a1c22,
        roughness: 0.15,
        metalness: 0.8,
      });
      const platter = new THREE.Mesh(platterGeo, platterMat);
      platter.position.set(centerX - 0.5, 0.83, centerZ);
      parent.add(platter);

      // Soft contact shadow circle under pedestal
      const shadowGeo = new THREE.RingGeometry(0.1, 2.2, 32);
      const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
      });
      const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.set(centerX - 0.5, 0.01, centerZ);
      parent.add(shadowMesh);

      // 2. Center 3D Floating Photo Album
      const albumGroup = new THREE.Group();
      albumGroup.position.set(centerX - 0.5, 1.15, centerZ);
      parent.add(albumGroup);

      // Procedural album book cover & open pages
      const bookWidth = 1.3;
      const bookDepth = 0.95;
      const bookSpineGeo = new THREE.BoxGeometry(bookWidth * 0.1, 0.08, bookDepth);
      const bookCoverMat = new THREE.MeshStandardMaterial({
        map: createAlbumCoverTexture(),
        roughness: 0.35,
        metalness: 0.4,
      });
      const bookSpine = new THREE.Mesh(bookSpineGeo, bookCoverMat);
      albumGroup.add(bookSpine);

      // Left open page wing
      const leftPageGeo = new THREE.BoxGeometry(bookWidth * 0.45, 0.04, bookDepth);
      const leftPage = new THREE.Mesh(leftPageGeo, bookCoverMat);
      leftPage.position.set(-bookWidth * 0.24, 0.04, 0);
      leftPage.rotation.z = 0.12;
      albumGroup.add(leftPage);

      // Right open page wing
      const rightPageGeo = new THREE.BoxGeometry(bookWidth * 0.45, 0.04, bookDepth);
      const rightPage = new THREE.Mesh(rightPageGeo, bookCoverMat);
      rightPage.position.set(bookWidth * 0.24, 0.04, 0);
      rightPage.rotation.z = -0.12;
      albumGroup.add(rightPage);

      // Hero Center Photo mounted floating above book
      const centerPhoto = photoList.find((p) => p.type === 'pedestal') || photoList[0];
      if (centerPhoto) {
        const heroPhotoGroup = createPhotoFrameMesh(centerPhoto, true);
        heroPhotoGroup.position.set(0, 0.35, 0);
        heroPhotoGroup.rotation.x = -0.15;
        albumGroup.add(heroPhotoGroup);
      }

      floatingMeshObjects.push({
        group: albumGroup,
        baseY: 1.15,
        phase: 0,
        rotSpeed: 0.15,
      });

      // 3. Dynamic Wall Frames & Floating Frames
      const dynamicPhotosGroup = new THREE.Group();
      parent.add(dynamicPhotosGroup);

      const addPhotoFrame = (photo: MemoryPhoto) => {
        if (mountedPhotoIdsRef.current.has(photo.id)) return;
        mountedPhotoIdsRef.current.add(photo.id);

        const frameGroup = createPhotoFrameMesh(photo, false);
        frameGroup.position.set(...photo.worldPosition);
        frameGroup.rotation.set(...photo.worldRotation);
        dynamicPhotosGroup.add(frameGroup);

        if (photo.type === 'floating') {
          floatingMeshObjects.push({
            group: frameGroup,
            baseY: photo.worldPosition[1],
            phase: Math.random() * Math.PI * 2,
            rotSpeed: 0.05,
          });
        }
      };

      addPhotoToSceneRef.current = addPhotoFrame;

      photoList.forEach((photo) => {
        if (photo.type === 'pedestal') return; // already handled on center pedestal
        addPhotoFrame(photo);
      });
    }

    // Helper: Create single 3D Photo Frame Object
    function createPhotoFrameMesh(photo: MemoryPhoto, isFeatured: boolean): THREE.Group {
      const frameGroup = new THREE.Group();
      const [width, height] = photo.size;
      const borderThick = 0.07;
      const depth = 0.05;

      // Outer Frame Bevel
      const outerGeo = new THREE.BoxGeometry(
        width + borderThick * 2,
        height + borderThick * 2,
        depth
      );
      const frameMesh = new THREE.Mesh(outerGeo, isFeatured ? trimMaterial : frameWoodMaterial);
      frameMesh.castShadow = true;
      frameGroup.add(frameMesh);

      // White Matting (Passe-partout)
      const matGeo = new THREE.PlaneGeometry(width + 0.04, height + 0.04);
      const matMesh = new THREE.Mesh(
        matGeo,
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
      );
      matMesh.position.z = depth / 2 + 0.002;
      frameGroup.add(matMesh);

      // Photo Canvas Texture (load async with procedural fallback)
      const fallbackTex = createFallbackPhotoTexture(photo.title, photo.category);
      const photoMaterial = new THREE.MeshStandardMaterial({
        map: fallbackTex,
        roughness: 0.35,
        metalness: 0.05,
      });

      // Async texture loader for the actual image
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin('anonymous');
      loader.load(
        photo.imageUrl,
        (loadedTex) => {
          loadedTex.colorSpace = THREE.SRGBColorSpace;
          photoMaterial.map = loadedTex;
          photoMaterial.needsUpdate = true;
        },
        undefined,
        () => {
          // Graceful fallback to procedural canvas
        }
      );

      const photoGeo = new THREE.PlaneGeometry(width * 0.92, height * 0.9);
      const photoMesh = new THREE.Mesh(photoGeo, photoMaterial);
      photoMesh.position.z = depth / 2 + 0.005;
      frameGroup.add(photoMesh);

      // Glazing Glass Layer (glossy physical reflection)
      const glassGeo = new THREE.PlaneGeometry(width + 0.02, height + 0.02);
      const glass = new THREE.Mesh(glassGeo, glassMaterial);
      glass.position.z = depth / 2 + 0.01;
      frameGroup.add(glass);

      // Invisible Raycasting Hit Box
      const hitGeo = new THREE.BoxGeometry(width + 0.2, height + 0.2, 0.2);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.position.z = 0.05;
      frameGroup.add(hitMesh);

      interactivePhotos.push({
        mesh: hitMesh,
        photo,
        frameGroup,
      });

      return frameGroup;
    }

    // --- 6. RAYCASTING & INTERACTION EVENTS ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-1000, -1000);

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Handle interactive drag view pan (Spherical Geosphere)
      if (stateRef.current.isPointerDown) {
        const deltaX = e.clientX - stateRef.current.prevPointerX;
        const deltaY = e.clientY - stateRef.current.prevPointerY;
        stateRef.current.prevPointerX = e.clientX;
        stateRef.current.prevPointerY = e.clientY;

        // Spherical look rotation (full 360 yaw and wide vertical pitch)
        stateRef.current.targetDragYaw -= deltaX * 0.0035;
        stateRef.current.targetDragPitch -= deltaY * 0.003;
        stateRef.current.targetDragPitch = Math.max(-1.15, Math.min(1.15, stateRef.current.targetDragPitch));
      }

      // Raycast check for hover state
      raycaster.setFromCamera(mouse, camera);

      // Check doors in corridor
      let hoveredDoor: typeof interactiveDoors[0] | null = null;
      if (!stateRef.current.currentRoomId) {
        const doorMeshes = interactiveDoors.map((d) => d.mesh);
        const doorIntersects = raycaster.intersectObjects(doorMeshes, false);
        if (doorIntersects.length > 0) {
          hoveredDoor = interactiveDoors.find((d) => d.mesh === doorIntersects[0].object) || null;
        }
      }

      // Check photos in Room 01
      let hoveredPhoto: typeof interactivePhotos[0] | null = null;
      if (stateRef.current.currentRoomId === 'room-01') {
        const photoMeshes = interactivePhotos.map((p) => p.mesh);
        const photoIntersects = raycaster.intersectObjects(photoMeshes, false);
        if (photoIntersects.length > 0) {
          hoveredPhoto = interactivePhotos.find((p) => p.mesh === photoIntersects[0].object) || null;
        }
      }

      if (hoveredDoor) {
        container.style.cursor = 'pointer';
        stateRef.current.hoveredDoorId = hoveredDoor.roomId;
      } else if (hoveredPhoto) {
        container.style.cursor = 'pointer';
        stateRef.current.hoveredPhotoId = hoveredPhoto.photo.id;
      } else {
        container.style.cursor = stateRef.current.isPointerDown ? 'grabbing' : 'default';
        stateRef.current.hoveredDoorId = null;
        stateRef.current.hoveredPhotoId = null;
      }
    };

    const onPointerDown = (e: MouseEvent) => {
      stateRef.current.isPointerDown = true;
      stateRef.current.prevPointerX = e.clientX;
      stateRef.current.prevPointerY = e.clientY;
    };

    const onPointerUp = (e: MouseEvent) => {
      const wasDragging =
        Math.abs(e.clientX - stateRef.current.prevPointerX) > 4 ||
        Math.abs(e.clientY - stateRef.current.prevPointerY) > 4;

      stateRef.current.isPointerDown = false;
      container.style.cursor = 'default';

      if (wasDragging) return; // ignore click if dragged

      // Raycast on click
      const rect = container.getBoundingClientRect();
      const clickMouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(clickMouse, camera);

      // 1. Doorway Click (when in corridor)
      if (!stateRef.current.currentRoomId) {
        const doorMeshes = interactiveDoors.map((d) => d.mesh);
        const doorIntersects = raycaster.intersectObjects(doorMeshes, false);
        if (doorIntersects.length > 0) {
          const hitDoor = interactiveDoors.find((d) => d.mesh === doorIntersects[0].object);
          if (hitDoor) {
            // Open the gate with swinging animation and sound
            const gate = stateRef.current.roomGates.find((g) => g.roomId === hitDoor.roomId);
            if (gate) {
              gate.isOpen = true;
            }
            audioSynthesizer.playDoorSwingOpen();
            onSelectRoom(hitDoor.roomId);
            return;
          }
        }
      }

      // 2. Photo Click (inside Room 01)
      if (stateRef.current.currentRoomId === 'room-01') {
        const photoMeshes = interactivePhotos.map((p) => p.mesh);
        const photoIntersects = raycaster.intersectObjects(photoMeshes, false);
        if (photoIntersects.length > 0) {
          const hitPhoto = interactivePhotos.find((p) => p.mesh === photoIntersects[0].object);
          if (hitPhoto) {
            audioSynthesizer.playPhotoClick();
            onSelectPhoto(hitPhoto.photo);
            return;
          }
        }
      }
    };

    // Touch Support for Mobile
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        stateRef.current.isPointerDown = true;
        stateRef.current.prevPointerX = e.touches[0].clientX;
        stateRef.current.prevPointerY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && stateRef.current.isPointerDown) {
        const deltaX = e.touches[0].clientX - stateRef.current.prevPointerX;
        const deltaY = e.touches[0].clientY - stateRef.current.prevPointerY;
        stateRef.current.prevPointerX = e.touches[0].clientX;
        stateRef.current.prevPointerY = e.touches[0].clientY;

        stateRef.current.targetDragYaw -= deltaX * 0.004;
        stateRef.current.targetDragPitch -= deltaY * 0.003;
        stateRef.current.targetDragPitch = Math.max(-1.15, Math.min(1.15, stateRef.current.targetDragPitch));
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      stateRef.current.isPointerDown = false;
    };

    // Touchpad / Mouse Wheel Scroll Navigation (Geosphere look + Corridor walk)
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      // 1. Horizontal scroll (touchpad swipe left/right) rotates the view like a geosphere
      if (Math.abs(e.deltaX) > 0) {
        stateRef.current.targetDragYaw -= e.deltaX * 0.0035;
      }

      // 2. Vertical scroll:
      const activeId = stateRef.current.currentRoomId;

      if (!activeId) {
        // In the main corridor:
        // Scrolling forward (deltaY > 0) walks down the corridor past all rooms to Room 06
        // Scrolling backward (deltaY < 0) walks back towards the entrance
        if (Math.abs(e.deltaY) > 0) {
          const moveZ = Math.max(-3.0, Math.min(3.0, e.deltaY * 0.03));
          stateRef.current.corridorZ = Math.min(
            5.0,
            Math.max(-80.0, stateRef.current.corridorZ - moveZ)
          );

          stateRef.current.targetCamPos.set(0, 1.85, stateRef.current.corridorZ);
        }
      } else if (activeId === 'room-01') {
        // Inside Room 01: subtle zoom inspection towards photo displays
        if (Math.abs(e.deltaY) > 0) {
          const zoomDelta = Math.max(-0.15, Math.min(0.15, e.deltaY * 0.002));
          stateRef.current.roomZoomProgress = Math.max(
            0,
            Math.min(1.0, stateRef.current.roomZoomProgress + zoomDelta)
          );

          const room = ROOMS_DATA.find((r) => r.id === activeId);
          if (room) {
            const p = stateRef.current.roomZoomProgress;
            const basePos = room.cameraInsidePos;
            const lookAtPos = room.cameraInsideLookAt;

            stateRef.current.targetCamPos.set(
              basePos[0] + (lookAtPos[0] - basePos[0]) * p * 0.45,
              basePos[1],
              basePos[2] + (lookAtPos[2] - basePos[2]) * p * 0.45
            );
          }
        }
      }
    };

    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mouseup', onPointerUp);
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('touchend', onTouchEnd, { passive: true });
    container.addEventListener('wheel', onWheel, { passive: false });

    // Handle Window Resize
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // --- 7. ANIMATION TICK & EXPONENTIAL DAMPING ---
    let frameId = 0;
    const clock = new THREE.Clock();
    const tempLook = new THREE.Vector3();

    const tick = () => {
      const delta = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();

      // Smooth camera position damping
      camera.position.x = THREE.MathUtils.damp(camera.position.x, stateRef.current.targetCamPos.x, 3.8, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, stateRef.current.targetCamPos.y, 3.8, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, stateRef.current.targetCamPos.z, 3.8, delta);

      // Smooth geosphere rotation angles with exponential damping
      stateRef.current.dragYaw = THREE.MathUtils.damp(stateRef.current.dragYaw, stateRef.current.targetDragYaw, 6.0, delta);
      stateRef.current.dragPitch = THREE.MathUtils.damp(stateRef.current.dragPitch, stateRef.current.targetDragPitch, 6.0, delta);

      // Spherical Geosphere View Direction
      const totalYaw = stateRef.current.baseYaw + stateRef.current.dragYaw;
      const pitch = stateRef.current.dragPitch;
      const cosPitch = Math.cos(pitch);

      const dirX = Math.sin(totalYaw) * cosPitch;
      const dirY = Math.sin(pitch);
      const dirZ = -Math.cos(totalYaw) * cosPitch;

      tempLook.set(
        camera.position.x + dirX * 10,
        camera.position.y + dirY * 10,
        camera.position.z + dirZ * 10
      );

      stateRef.current.currentLook.x = THREE.MathUtils.damp(stateRef.current.currentLook.x, tempLook.x, 6.0, delta);
      stateRef.current.currentLook.y = THREE.MathUtils.damp(stateRef.current.currentLook.y, tempLook.y, 6.0, delta);
      stateRef.current.currentLook.z = THREE.MathUtils.damp(stateRef.current.currentLook.z, tempLook.z, 6.0, delta);

      camera.lookAt(stateRef.current.currentLook);

      // Animate floating items (subtle sine levitation & rotation)
      floatingMeshObjects.forEach((item) => {
        item.group.position.y = item.baseY + Math.sin(time * 1.5 + item.phase) * 0.05;
        if (item.rotSpeed > 0) {
          item.group.rotation.y += item.rotSpeed * delta;
        }
      });

      // Hover feedback on photo frames
      interactivePhotos.forEach((item) => {
        const isHovered = item.photo.id === stateRef.current.hoveredPhotoId;
        const targetScale = isHovered ? 1.05 : 1.0;
        item.frameGroup.scale.setScalar(
          THREE.MathUtils.damp(item.frameGroup.scale.x, targetScale, 8.0, delta)
        );
      });

      // Animate room gates / doors swinging open and closed
      roomGates.forEach((gate) => {
        const targetAngle = gate.isOpen ? gate.openAngle : 0;
        gate.hingeGroup.rotation.y = THREE.MathUtils.damp(
          gate.hingeGroup.rotation.y,
          targetAngle,
          3.6,
          delta
        );
      });

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    // --- 8. CLEANUP ---
    return () => {
      cancelAnimationFrame(frameId);
      container.removeEventListener('mousemove', onPointerMove);
      container.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mouseup', onPointerUp);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      wallMaterial.dispose();
      floorMaterial.dispose();
      ceilingMaterial.dispose();
      mountedPhotoIdsRef.current.clear();
      addPhotoToSceneRef.current = null;
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full relative cursor-grab active:cursor-grabbing" />;
};
