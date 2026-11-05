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
  createAlbumCoverTexture,
  loadColorPhotoTexture,
  createEyeLevelPlacardTexture
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
  isRoom1Unlocked?: boolean;
}

export const HouseEnvironment: React.FC<HouseEnvironmentProps> = ({
  currentRoomId,
  onSelectRoom,
  onSelectPhoto,
  photos,
  isRoom1Unlocked = false,
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
    isRoom1Unlocked: !!isRoom1Unlocked,
  });

  const mountedPhotoIdsRef = useRef<Set<string>>(new Set());
  const addPhotoToSceneRef = useRef<((photo: MemoryPhoto) => void) | null>(null);
  const updatePhotoInSceneRef = useRef<((photo: MemoryPhoto) => void) | null>(null);

  // Sync isRoom1Unlocked into state and trigger gate swing
  useEffect(() => {
    stateRef.current.isRoom1Unlocked = !!isRoom1Unlocked;
    if (isRoom1Unlocked) {
      const room1Gate = stateRef.current.roomGates.find((g) => g.roomId === 'room-01');
      if (room1Gate && !room1Gate.isOpen) {
        room1Gate.isOpen = true;
        audioSynthesizer.playDoorSwingOpen();
      }
    }
  }, [isRoom1Unlocked]);

  // Dynamically sync newly added or changed/edited photos into the live 3D Room 01 scene
  useEffect(() => {
    photos.forEach((p) => {
      if (addPhotoToSceneRef.current && !mountedPhotoIdsRef.current.has(p.id) && p.type !== 'pedestal') {
        addPhotoToSceneRef.current?.(p);
      } else if (updatePhotoInSceneRef.current && mountedPhotoIdsRef.current.has(p.id)) {
        updatePhotoInSceneRef.current?.(p);
      }
    });
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

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.25, 200);
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
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });

    const trimMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e2026,
      roughness: 0.3,
      metalness: 0.7,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    const frameWoodMaterial = new THREE.MeshStandardMaterial({
      color: 0x22242a,
      roughness: 0.4,
      metalness: 0.2,
    });

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.05,
      metalness: 0.05,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
    });

    const lightGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xfffae8,
    });

    // 5. Interactive Raycasting Targets & Gates
    const roomGates: RoomDoorGate[] = [];
    stateRef.current.roomGates = roomGates;
    const interactiveDoors: { mesh: THREE.Mesh; roomId: string; signMesh: THREE.Mesh }[] = [];
    const interactivePhotos: { mesh: THREE.Mesh; photo: MemoryPhoto; frameGroup: THREE.Group; photoMaterial?: THREE.MeshStandardMaterial }[] = [];
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

    // Corridor Ceiling (Sized to fit cleanly between inner walls without edge collision)
    const corrCeilGeo = new THREE.PlaneGeometry(corrWidth - 0.7, corrLength);
    const corrCeil = new THREE.Mesh(corrCeilGeo, ceilingMaterial);
    corrCeil.rotation.x = Math.PI / 2;
    corrCeil.position.set(0, corrHeight - 0.005, corrCenterZ);
    corrCeil.receiveShadow = false;
    corridorGroup.add(corrCeil);

    // Ceiling Light Strips (Recessed cleanly beneath the ceiling surface)
    const lightStripGeo = new THREE.BoxGeometry(0.35, 0.02, corrLength);
    const lightStrip = new THREE.Mesh(lightStripGeo, lightGlowMaterial);
    lightStrip.position.set(0, corrHeight - 0.03, corrCenterZ);
    corridorGroup.add(lightStrip);

    // Recessed light slot border
    const lightSlotTrimGeo = new THREE.BoxGeometry(0.45, 0.035, corrLength);
    const lightSlotTrim = new THREE.Mesh(lightSlotTrimGeo, trimMaterial);
    lightSlotTrim.position.set(0, corrHeight - 0.02, corrCenterZ);
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
    const doorwayHeight = 3.0;

    const buildCorridorWallWithDoorways = (
      side: 'left' | 'right',
      doorwayZs: { z: number; roomId: string; roomNum: string; roomTitle: string; status: string }[]
    ) => {
      const wallX = side === 'left' ? -corrWidth / 2 : corrWidth / 2;
      const innerFaceX = side === 'left' ? wallX + 0.15 : wallX - 0.15;
      const sortedZs = [...doorwayZs].sort((a, b) => b.z - a.z); // from entrance to far end

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

        // Top lintel above doorway (cleanly positioned above doorwayHeight, no overlap with wall)
        const lintelHeight = corrHeight - doorwayHeight;
        const lintelGeo = new THREE.BoxGeometry(0.3, lintelHeight, doorwayWidth);
        const lintelMesh = new THREE.Mesh(lintelGeo, wallMaterial);
        lintelMesh.position.set(wallX, doorwayHeight + lintelHeight / 2, door.z);
        lintelMesh.castShadow = true;
        lintelMesh.receiveShadow = true;
        corridorGroup.add(lintelMesh);

        // Architectural Doorway Jamb Liners (lining the inside jambs, zero volume overlap)
        const jambDepth = 0.06;
        const jambWidth = 0.31;
        const jambGeo = new THREE.BoxGeometry(jambWidth, doorwayHeight, jambDepth);

        const jambNorth = new THREE.Mesh(jambGeo, trimMaterial);
        jambNorth.position.set(wallX, doorwayHeight / 2, door.z + doorwayWidth / 2 - jambDepth / 2);
        corridorGroup.add(jambNorth);

        const jambSouth = new THREE.Mesh(jambGeo, trimMaterial);
        jambSouth.position.set(wallX, doorwayHeight / 2, door.z - doorwayWidth / 2 + jambDepth / 2);
        corridorGroup.add(jambSouth);

        const headJambGeo = new THREE.BoxGeometry(jambWidth, jambDepth, doorwayWidth - jambDepth * 2);
        const headJamb = new THREE.Mesh(headJambGeo, trimMaterial);
        headJamb.position.set(wallX, doorwayHeight - jambDepth / 2, door.z);
        corridorGroup.add(headJamb);

        // Floor threshold strip (slightly proud of floor, no z-fighting)
        const threshGeo = new THREE.BoxGeometry(0.32, 0.02, doorwayWidth - jambDepth * 2);
        const thresh = new THREE.Mesh(threshGeo, trimMaterial);
        thresh.position.set(wallX, 0.01, door.z);
        corridorGroup.add(thresh);

        // 1. Eye-Level Architectural Wall Placard (Mounted at Y = 1.68m, directly at eye height)
        // Solves the issue where door signs were previously cut off at top of screen
        const eyeLevelTex = createEyeLevelPlacardTexture(door.roomNum, door.roomTitle, door.status, false);
        const plaqueZ = door.z + (doorwayWidth / 2 + 0.65);
        const plaqueY = 1.68;
        const plaqueCoreX = side === 'left' ? innerFaceX + 0.015 : innerFaceX - 0.015;
        const plaqueFaceX = side === 'left' ? innerFaceX + 0.028 : innerFaceX - 0.028;

        const plaqueBackGeo = new THREE.BoxGeometry(0.025, 0.48, 0.88);
        const plaqueBackMat = new THREE.MeshStandardMaterial({
          color: 0x111317,
          roughness: 0.35,
          metalness: 0.3,
        });
        const plaqueBack = new THREE.Mesh(plaqueBackGeo, plaqueBackMat);
        plaqueBack.position.set(plaqueCoreX, plaqueY, plaqueZ);
        corridorGroup.add(plaqueBack);

        const plaqueFaceGeo = new THREE.PlaneGeometry(0.85, 0.45);
        const plaqueFaceMat = new THREE.MeshBasicMaterial({
          map: eyeLevelTex,
          polygonOffset: true,
          polygonOffsetFactor: -3,
          polygonOffsetUnits: -3,
        });
        const plaqueFace = new THREE.Mesh(plaqueFaceGeo, plaqueFaceMat);
        plaqueFace.position.set(plaqueFaceX, plaqueY, plaqueZ);
        plaqueFace.rotation.y = side === 'left' ? Math.PI / 2 : -Math.PI / 2;
        corridorGroup.add(plaqueFace);

        // Dedicated architectural sconce downlight above eye-level placard
        const sconceLight = new THREE.PointLight(0xfff5e6, 0.9, 4.0);
        sconceLight.position.set(side === 'left' ? -2.95 : 2.95, plaqueY + 0.38, plaqueZ);
        corridorGroup.add(sconceLight);

        // 2. Overhead Lintel Plaque (Mounted cleanly on corridor face of the lintel)
        const signTex = createSignageTexture(door.roomNum, door.roomTitle, door.status, false);
        const overheadY = doorwayHeight + 0.42;
        const overheadBoxX = side === 'left' ? innerFaceX + 0.015 : innerFaceX - 0.015;
        const overheadFaceX = side === 'left' ? innerFaceX + 0.028 : innerFaceX - 0.028;

        const signBoxGeo = new THREE.BoxGeometry(0.025, 0.65, 1.95);
        const signBoxMat = new THREE.MeshStandardMaterial({
          color: 0x111317,
          roughness: 0.4,
          metalness: 0.2,
        });
        const signBox = new THREE.Mesh(signBoxGeo, signBoxMat);
        signBox.position.set(overheadBoxX, overheadY, door.z);
        corridorGroup.add(signBox);

        const signGeo = new THREE.PlaneGeometry(1.9, 0.6);
        const signMat = new THREE.MeshBasicMaterial({
          map: signTex,
          polygonOffset: true,
          polygonOffsetFactor: -3,
          polygonOffsetUnits: -3,
        });
        const signMesh = new THREE.Mesh(signGeo, signMat);
        signMesh.position.set(overheadFaceX, overheadY, door.z);
        signMesh.rotation.y = side === 'left' ? Math.PI / 2 : -Math.PI / 2;
        corridorGroup.add(signMesh);

        // 3. Projecting Blade Plaque (Sticks out into corridor beside door, visible from far down hallway)
        const bladeTex = createBladeNumberTexture(door.roomNum);
        const bladeMat = new THREE.MeshBasicMaterial({
          map: bladeTex,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2,
        });
        const bladeZ = door.z + (doorwayWidth / 2 + 0.35);
        const bladeY = 2.35;
        const bladeX = side === 'left' ? -2.95 : 2.95;

        // Mounting bracket
        const bracketGeo = new THREE.BoxGeometry(0.24, 0.04, 0.04);
        const bracketMesh = new THREE.Mesh(bracketGeo, trimMaterial);
        bracketMesh.position.set(side === 'left' ? -3.05 : 3.05, bladeY + 0.22, bladeZ);
        corridorGroup.add(bracketMesh);

        // Blade plate core
        const bladeCoreGeo = new THREE.BoxGeometry(0.04, 0.44, 0.36);
        const bladeCore = new THREE.Mesh(bladeCoreGeo, trimMaterial);
        bladeCore.position.set(bladeX, bladeY, bladeZ);
        corridorGroup.add(bladeCore);

        // Front face
        const bladeFrontGeo = new THREE.PlaneGeometry(0.35, 0.42);
        const bladeFront = new THREE.Mesh(bladeFrontGeo, bladeMat);
        bladeFront.position.set(bladeX, bladeY, bladeZ + 0.022);
        bladeFront.rotation.y = 0;
        corridorGroup.add(bladeFront);

        // Back face
        const bladeBack = new THREE.Mesh(bladeFrontGeo, bladeMat);
        bladeBack.position.set(bladeX, bladeY, bladeZ - 0.022);
        bladeBack.rotation.y = Math.PI;
        corridorGroup.add(bladeBack);

        // 4. Overhead Downlight for Doorway
        const doorSpot = new THREE.PointLight(0xfffaed, 0.9, 6);
        doorSpot.position.set(side === 'left' ? -2.9 : 2.9, corrHeight - 0.2, door.z);
        corridorGroup.add(doorSpot);

        // 5. Architectural Gate with swinging hinge (Deeply recessed, zero Z-fighting with wall)
        const hingeGroup = new THREE.Group();
        const hingeX = wallX; // Centered in the door jamb thickness
        const hingeZ = door.z + doorwayWidth / 2 - 0.08;
        hingeGroup.position.set(hingeX, 0, hingeZ);
        corridorGroup.add(hingeGroup);

        const doorWidth = doorwayWidth - 0.14;
        const doorHeight = doorwayHeight - 0.06;
        const doorThick = 0.06;

        const doorPanelGeo = new THREE.BoxGeometry(doorThick, doorHeight, doorWidth);
        const doorPanelMat = new THREE.MeshStandardMaterial({
          color: 0xf5f5f7,
          roughness: 0.35,
          metalness: 0.06,
        });
        const doorPanel = new THREE.Mesh(doorPanelGeo, doorPanelMat);
        doorPanel.position.set(0, doorHeight / 2 + 0.015, -doorWidth / 2);
        doorPanel.castShadow = true;
        doorPanel.receiveShadow = true;
        hingeGroup.add(doorPanel);

        // Modern vertical black aluminum handle bar
        const handleOffset = side === 'left' ? 0.05 : -0.05;
        const handleGeo = new THREE.BoxGeometry(0.035, 1.25, 0.035);
        const handle = new THREE.Mesh(handleGeo, trimMaterial);
        handle.position.set(handleOffset, doorHeight / 2 - 0.1, -doorWidth + 0.22);
        hingeGroup.add(handle);

        // Architectural inset accent line (opaque, eliminates transparent rendering artifacts)
        const revealGeo = new THREE.BoxGeometry(doorThick + 0.006, 2.1, 0.04);
        const revealMat = new THREE.MeshStandardMaterial({
          color: 0x1a1c22,
          roughness: 0.4,
          metalness: 0.3,
        });
        const revealMesh = new THREE.Mesh(revealGeo, revealMat);
        revealMesh.position.set(0, doorHeight / 2, -doorWidth / 2 + 0.3);
        hingeGroup.add(revealMesh);

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

        // 6. Interactive Doorway Hit Area (Raycasting trigger for clicks)
        const hitGeo = new THREE.BoxGeometry(1.6, doorwayHeight + 0.4, doorwayWidth + 0.4);
        const hitMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitMesh = new THREE.Mesh(hitGeo, hitMat);
        hitMesh.position.set(wallX, doorwayHeight / 2, door.z);
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
          mesh: plaqueFace,
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
      status: r.id === 'room-01'
        ? (stateRef.current.isRoom1Unlocked ? 'ACTIVE' : 'LOCKED (PASSCODE 2627)')
        : r.status === 'active' ? 'ACTIVE' : 'COMING SOON',
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

    // Helper: Build Room 01 (Photo Gallery with Designer Lounge Sofa & Static Wall Mounted Frames)
    function buildRoom01Content(
      parent: THREE.Group,
      centerX: number,
      centerZ: number,
      photoList: MemoryPhoto[]
    ) {
      // 1. Contemporary Architectural Lounge Sofa & Coffee Table in center of Room 01
      const sofa = createModernSofa(centerX, centerZ);
      parent.add(sofa);

      // 2. Static Wall Mounted Frames (All photos placed flush and static on the walls)
      const dynamicPhotosGroup = new THREE.Group();
      parent.add(dynamicPhotosGroup);

      const addPhotoFrame = (photo: MemoryPhoto) => {
        if (mountedPhotoIdsRef.current.has(photo.id)) return;
        mountedPhotoIdsRef.current.add(photo.id);

        const frameGroup = createPhotoFrameMesh(photo, photo.id === 'photo-center-album');
        frameGroup.position.set(...photo.worldPosition);
        frameGroup.rotation.set(...photo.worldRotation);
        dynamicPhotosGroup.add(frameGroup);
        // Photos are completely static on the walls - no bobbing or floating animation
      };

      addPhotoToSceneRef.current = addPhotoFrame;

      photoList.forEach((photo) => {
        addPhotoFrame(photo);
      });
    }

    // Helper: Build a realistic modern architectural sofa suite for Room 01
    function createModernSofa(cx: number, cz: number): THREE.Group {
      const sofaGroup = new THREE.Group();
      // Position sofa in Room 01 lounge area, facing West toward the main gallery wall
      sofaGroup.position.set(cx + 0.5, 0, cz);
      sofaGroup.rotation.y = -Math.PI / 2;

      // A. Large woven wool area rug
      const rugGeo = new THREE.PlaneGeometry(3.6, 2.8);
      const rugMat = new THREE.MeshStandardMaterial({
        color: 0xeeece8,
        roughness: 0.95,
        metalness: 0.0,
      });
      const rug = new THREE.Mesh(rugGeo, rugMat);
      rug.rotation.x = -Math.PI / 2;
      rug.position.set(0, 0.008, 0.35);
      rug.receiveShadow = true;
      sofaGroup.add(rug);

      // B. Sofa Wooden Plinth & 4 Tapered Metal Legs
      const plinthMat = new THREE.MeshStandardMaterial({
        color: 0x1f2127,
        roughness: 0.45,
        metalness: 0.3,
      });
      const plinthGeo = new THREE.BoxGeometry(2.6, 0.08, 1.05);
      const plinth = new THREE.Mesh(plinthGeo, plinthMat);
      plinth.position.set(0, 0.12, 0);
      plinth.castShadow = true;
      plinth.receiveShadow = true;
      sofaGroup.add(plinth);

      const legGeo = new THREE.CylinderGeometry(0.024, 0.016, 0.12, 16);
      const legPositions = [
        [-1.2, 0.06, 0.42],
        [1.2, 0.06, 0.42],
        [-1.2, 0.06, -0.42],
        [1.2, 0.06, -0.42],
      ];
      legPositions.forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, plinthMat);
        leg.position.set(lx, ly, lz);
        leg.castShadow = true;
        sofaGroup.add(leg);
      });

      // C. Off-White / Cream Boucle Linen Upholstery
      const fabricMat = new THREE.MeshStandardMaterial({
        color: 0xf5f4f0,
        roughness: 0.88,
        metalness: 0.02,
      });

      // Main seat base
      const seatDeckGeo = new THREE.BoxGeometry(2.56, 0.18, 0.98);
      const seatDeck = new THREE.Mesh(seatDeckGeo, fabricMat);
      seatDeck.position.set(0, 0.25, 0);
      seatDeck.castShadow = true;
      seatDeck.receiveShadow = true;
      sofaGroup.add(seatDeck);

      // Two deep, plush seat cushions
      const cushionGeo = new THREE.BoxGeometry(1.22, 0.14, 0.76);
      const cushionLeft = new THREE.Mesh(cushionGeo, fabricMat);
      cushionLeft.position.set(-0.63, 0.38, 0.08);
      cushionLeft.castShadow = true;
      sofaGroup.add(cushionLeft);

      const cushionRight = new THREE.Mesh(cushionGeo, fabricMat);
      cushionRight.position.set(0.63, 0.38, 0.08);
      cushionRight.castShadow = true;
      sofaGroup.add(cushionRight);

      // Backrest Structure
      const backrestGeo = new THREE.BoxGeometry(2.56, 0.46, 0.22);
      const backrest = new THREE.Mesh(backrestGeo, fabricMat);
      backrest.position.set(0, 0.55, -0.38);
      backrest.castShadow = true;
      sofaGroup.add(backrest);

      // Two angled backrest cushions
      const backCushionGeo = new THREE.BoxGeometry(1.2, 0.36, 0.14);
      const backCushionL = new THREE.Mesh(backCushionGeo, fabricMat);
      backCushionL.position.set(-0.62, 0.52, -0.24);
      backCushionL.rotation.x = 0.08;
      backCushionL.castShadow = true;
      sofaGroup.add(backCushionL);

      const backCushionR = new THREE.Mesh(backCushionGeo, fabricMat);
      backCushionR.position.set(0.62, 0.52, -0.24);
      backCushionR.rotation.x = 0.08;
      backCushionR.castShadow = true;
      sofaGroup.add(backCushionR);

      // Left & Right Armrests
      const armrestGeo = new THREE.BoxGeometry(0.18, 0.32, 0.98);
      const armL = new THREE.Mesh(armrestGeo, fabricMat);
      armL.position.set(-1.24, 0.42, 0);
      armL.castShadow = true;
      sofaGroup.add(armL);

      const armR = new THREE.Mesh(armrestGeo, fabricMat);
      armR.position.set(1.24, 0.42, 0);
      armR.castShadow = true;
      sofaGroup.add(armR);

      // Accent Throw Pillows
      const pillowMat1 = new THREE.MeshStandardMaterial({
        color: 0x33363f, // Slate charcoal
        roughness: 0.8,
      });
      const pillowMat2 = new THREE.MeshStandardMaterial({
        color: 0xd6d2c4, // Warm sand
        roughness: 0.8,
      });

      const pillowGeo = new THREE.BoxGeometry(0.42, 0.32, 0.12);
      const pillowL = new THREE.Mesh(pillowGeo, pillowMat1);
      pillowL.position.set(-1.0, 0.48, -0.15);
      pillowL.rotation.y = 0.35;
      pillowL.rotation.z = -0.1;
      pillowL.castShadow = true;
      sofaGroup.add(pillowL);

      const pillowR = new THREE.Mesh(pillowGeo, pillowMat2);
      pillowR.position.set(1.0, 0.48, -0.15);
      pillowR.rotation.y = -0.35;
      pillowR.rotation.z = 0.1;
      pillowR.castShadow = true;
      sofaGroup.add(pillowR);

      // D. Minimalist Low Travertine Coffee Table
      const tableGroup = new THREE.Group();
      tableGroup.position.set(0, 0, 1.25);

      const tableTopGeo = new THREE.BoxGeometry(1.4, 0.05, 0.65);
      const tableTopMat = new THREE.MeshStandardMaterial({
        color: 0xf0eee8,
        roughness: 0.25,
        metalness: 0.1,
      });
      const tableTop = new THREE.Mesh(tableTopGeo, tableTopMat);
      tableTop.position.set(0, 0.32, 0);
      tableTop.castShadow = true;
      tableTop.receiveShadow = true;
      tableGroup.add(tableTop);

      const tableBaseGeo = new THREE.BoxGeometry(1.25, 0.28, 0.52);
      const tableBaseMat = new THREE.MeshStandardMaterial({
        color: 0x22242a,
        roughness: 0.4,
        metalness: 0.6,
      });
      const tableLegs = new THREE.Mesh(tableBaseGeo, tableBaseMat);
      tableLegs.position.set(0, 0.15, 0);
      tableGroup.add(tableLegs);

      // Architectural art monograph books on table
      const book1Geo = new THREE.BoxGeometry(0.28, 0.03, 0.36);
      const book1Mat = new THREE.MeshStandardMaterial({ color: 0x181a20, roughness: 0.4 });
      const book1 = new THREE.Mesh(book1Geo, book1Mat);
      book1.position.set(-0.25, 0.36, 0.02);
      book1.rotation.y = 0.15;
      tableGroup.add(book1);

      const book2Geo = new THREE.BoxGeometry(0.24, 0.025, 0.32);
      const book2Mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
      const book2 = new THREE.Mesh(book2Geo, book2Mat);
      book2.position.set(-0.23, 0.385, 0.03);
      book2.rotation.y = 0.22;
      tableGroup.add(book2);

      sofaGroup.add(tableGroup);

      return sofaGroup;
    }

    // Helper: Create single 3D Photo Frame Object (Monochrome White-Shaded Print)
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

      // Photo Canvas Texture - Displayed in full vivid color with physical gallery illumination
      const fallbackTex = createFallbackPhotoTexture(photo.title, photo.category);
      const photoMaterial = new THREE.MeshStandardMaterial({
        map: fallbackTex,
        roughness: 0.22,
        metalness: 0.02,
        color: new THREE.Color(0xffffff),
      });

      // Load image in its true, vibrant colors
      loadColorPhotoTexture(
        photo.imageUrl,
        (colorTex) => {
          photoMaterial.map = colorTex;
          photoMaterial.needsUpdate = true;
        },
        () => {
          // Keep vibrant procedural fallback
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
        photoMaterial,
      });

      return frameGroup;
    }

    // Dynamic real-time photo updater for Room 01 (updates live 3D textures when photo is edited)
    updatePhotoInSceneRef.current = (updatedPhoto: MemoryPhoto) => {
      const item = interactivePhotos.find((p) => p.photo.id === updatedPhoto.id);
      if (item) {
        item.photo = updatedPhoto;
        if (item.photoMaterial) {
          loadColorPhotoTexture(
            updatedPhoto.imageUrl,
            (newTex) => {
              if (item.photoMaterial) {
                item.photoMaterial.map = newTex;
                item.photoMaterial.needsUpdate = true;
              }
            }
          );
        }
      }
    };

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
        stateRef.current.targetDragPitch = Math.max(-1.35, Math.min(1.35, stateRef.current.targetDragPitch));
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
            const isProtected = hitDoor.roomId === 'room-01' && !stateRef.current.isRoom1Unlocked;
            if (!isProtected) {
              const gate = stateRef.current.roomGates.find((g) => g.roomId === hitDoor.roomId);
              if (gate) {
                gate.isOpen = true;
              }
              audioSynthesizer.playDoorSwingOpen();
            }
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
        stateRef.current.targetDragPitch = Math.max(-1.35, Math.min(1.35, stateRef.current.targetDragPitch));
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      stateRef.current.isPointerDown = false;
    };

    // Touchpad / Mouse Wheel Scroll Navigation (Corridor walk + View tilt)
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      // 1. Horizontal scroll (touchpad swipe left/right) rotates the view like a geosphere
      if (Math.abs(e.deltaX) > 0) {
        stateRef.current.targetDragYaw -= e.deltaX * 0.0035;
      }

      // 2. Vertical scroll:
      const activeId = stateRef.current.currentRoomId;

      if (!activeId) {
        // Holding Shift or Alt while scrolling tilts camera pitch UP and DOWN!
        if (e.shiftKey || e.altKey) {
          stateRef.current.targetDragPitch -= e.deltaY * 0.0025;
          stateRef.current.targetDragPitch = Math.max(-1.35, Math.min(1.35, stateRef.current.targetDragPitch));
        } else {
          // Normal vertical scroll walks down the corridor:
          if (Math.abs(e.deltaY) > 0) {
            const moveZ = Math.max(-3.0, Math.min(3.0, e.deltaY * 0.03));
            stateRef.current.corridorZ = Math.min(
              5.0,
              Math.max(-80.0, stateRef.current.corridorZ - moveZ)
            );

            stateRef.current.targetCamPos.set(0, 1.85, stateRef.current.corridorZ);
          }
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

    // Keyboard navigation to easily tilt view upward/downward and turn
    const onKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowUp' || e.key === 'KeyW' || e.key === 'PageUp') {
        stateRef.current.targetDragPitch = Math.min(1.35, stateRef.current.targetDragPitch + 0.15);
      } else if (e.key === 'ArrowDown' || e.key === 'KeyS' || e.key === 'PageDown') {
        stateRef.current.targetDragPitch = Math.max(-1.35, stateRef.current.targetDragPitch - 0.15);
      } else if (e.key === 'ArrowLeft' || e.key === 'KeyA') {
        stateRef.current.targetDragYaw += 0.15;
      } else if (e.key === 'ArrowRight' || e.key === 'KeyD') {
        stateRef.current.targetDragYaw -= 0.15;
      } else if (e.key === 'Space') {
        stateRef.current.targetDragPitch = 0;
        stateRef.current.targetDragYaw = 0;
      }
    };

    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mouseup', onPointerUp);
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('touchend', onTouchEnd, { passive: true });
    container.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);

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
      window.removeEventListener('keydown', onKeyDown);
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
      updatePhotoInSceneRef.current = null;
    };
  }, []);

  return (
    <div className="w-full h-full relative">
      <div ref={mountRef} className="w-full h-full relative cursor-grab active:cursor-grabbing" />

      {/* Floating Look Up / Look Down & Tilt Helper Bar */}
      <div className="pointer-events-none fixed bottom-5 right-5 z-20 flex flex-col items-end gap-1.5">
        <div className="pointer-events-auto flex items-center gap-1.5 p-1 rounded-2xl bg-neutral-950/85 border border-white/10 shadow-2xl backdrop-blur-md">
          <button
            onClick={() => {
              stateRef.current.targetDragPitch = Math.min(1.35, stateRef.current.targetDragPitch + 0.28);
            }}
            title="Tilt camera upward to see room names and ceiling [↑]"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium cursor-pointer transition-colors"
          >
            <span>▲ Look Up</span>
          </button>
          <button
            onClick={() => {
              stateRef.current.targetDragPitch = Math.max(-1.35, stateRef.current.targetDragPitch - 0.28);
            }}
            title="Tilt camera downward [↓]"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium cursor-pointer transition-colors"
          >
            <span>▼ Look Down</span>
          </button>
          <button
            onClick={() => {
              stateRef.current.targetDragPitch = 0;
              stateRef.current.targetDragYaw = 0;
            }}
            title="Reset look straight ahead [Space]"
            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white text-xs cursor-pointer transition-colors"
          >
            Reset
          </button>
        </div>
        <div className="text-[10px] text-neutral-400 font-mono tracking-tight bg-neutral-950/70 px-2.5 py-0.5 rounded-full border border-white/5 backdrop-blur-sm">
          [↑ / ↓] Tilt Look • [Shift + Scroll] Tilt • [Drag] Look
        </div>
      </div>
    </div>
  );
};
