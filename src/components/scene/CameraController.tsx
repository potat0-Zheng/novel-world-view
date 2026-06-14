// src/components/scene/CameraController.tsx
//
// Drives the 2.5D / 2D map camera via @react-three/drei <MapControls>.
//
// Architecture
// ────────────
// We OWN four spherical parameters every frame and directly place the
// camera at (target + spherical→cartesian).  MapControls only provides
// two live inputs that we read back:
//   • pan  → ctrl.target  (user drags the map)
//   • zoom → camera→target distance  (user scrolls)
//
// All angular animation (tilt / azimuth) is done outside MapControls so
// we never fight its internal state.  Bounds are tightened around the
// actual values to keep MapControls from drifting.

import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { MapControls } from '@react-three/drei';
import * as THREE from 'three';
import useWorldStore from '../../store/worldStore';
import { parseCoordKey } from '../../types/world';

// ---- constants ----
const TILT_2_5D   = Math.PI / 3;      // ~60°
const TILT_2D     = 0.02;             // nearly top-down
const AZIMUTH_SE  = Math.PI * 0.25;   //  45° south-east
const AZIMUTH_NW  = Math.PI * 1.25;   // 225° north-west (flipped)
const OVERVIEW_DIST = 14;
const SWITCH_SPEED  = 1 / 0.8;        // tilt / flip transition

// ---- helpers ----
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export default function CameraController() {
  const controlsRef = useRef<any>(null);

  // ---- store selectors ----
  const viewMode        = useWorldStore(s => s.viewMode);
  const focusMode       = useWorldStore(s => s.focusMode);
  const viewFlipped     = useWorldStore(s => s.viewFlipped);
  const selectedCellKey = useWorldStore(s => s.selectedCellKey);
  const gridSize        = useWorldStore(s => s.world.config.gridSize);
  // setFocusMode called via useWorldStore.getState() in event callbacks
  // to avoid stale closures.

  const center = useMemo(() => new THREE.Vector3(gridSize / 2, 0, gridSize / 2), [gridSize]);

  // ---- live camera state (spherical coords around target) ----
  const curTilt     = useRef(TILT_2_5D);
  const curAzimuth  = useRef(AZIMUTH_SE);
  const curTarget   = useRef(center.clone());
  const curDistance = useRef(OVERVIEW_DIST);

  // ---- overview transition ----
  const prevFocusMode    = useRef(focusMode);
  const overviewStart    = useRef({ tilt: 0, azimuth: 0, target: new THREE.Vector3(), dist: 0 });
  const overviewProgress = useRef(0);

  // ---- cell-selection pan animation ----
  const cellAnimTarget   = useRef(new THREE.Vector3());
  const cellAnimStart    = useRef(new THREE.Vector3());
  const cellAnimProgress = useRef(0);
  const isCellAnimating  = useRef(false);
  const prevSelectedKey  = useRef<string | null>(null);

  // ---- apply our spherical coords to the actual camera ----
  function applyCamera(ctrl: any) {
    const phi   = curTilt.current;
    const theta = curAzimuth.current;
    const r     = curDistance.current;
    const tgt   = curTarget.current;

    ctrl.object.position.set(
      tgt.x + r * Math.sin(phi) * Math.sin(theta),
      tgt.y + r * Math.cos(phi),
      tgt.z + r * Math.sin(phi) * Math.cos(theta),
    );
    ctrl.object.lookAt(tgt);
    ctrl.target.copy(tgt);

    // Keep MapControls bounds snug so it doesn't drift away
    const s = 0.01;
    ctrl.minPolarAngle = Math.max(0, phi - s);
    ctrl.maxPolarAngle = Math.min(Math.PI / 2, phi + s);
    ctrl.minAzimuthalAngle = theta - s;
    ctrl.maxAzimuthalAngle = theta + s;
    ctrl.update();
  }

  // ---- initialise camera to overview preset ----
  useEffect(() => {
    const ctrl = controlsRef.current;
    if (!ctrl) return;
    curTilt.current     = TILT_2_5D;
    curAzimuth.current  = AZIMUTH_SE;
    curTarget.current.copy(center);
    curDistance.current = OVERVIEW_DIST;
    applyCamera(ctrl);
  }, [center]);

  // ---- auto-focus when user drags / scrolls ----
  const handleInteractionStart = () => {
    if (useWorldStore.getState().focusMode === 'overview') {
      useWorldStore.getState().setFocusMode('focus');
    }
  };

  // ---- cell-selection → focus + animated pan to cell ----
  useEffect(() => {
    const key = selectedCellKey;
    const prev = prevSelectedKey.current;
    prevSelectedKey.current = key;
    if (!key || key === prev) return;

    const store = useWorldStore.getState();
    if (store.focusMode === 'overview') store.setFocusMode('focus');

    const ctrl = controlsRef.current;
    if (!ctrl) return;
    const { x, y } = parseCoordKey(key);
    cellAnimTarget.current.set(x + 0.5, 0, y + 0.5);
    cellAnimStart.current.copy(curTarget.current);
    cellAnimProgress.current = 0;
    isCellAnimating.current = true;
  }, [selectedCellKey]);

  // ---- per-frame ----
  useFrame((_, delta) => {
    const ctrl = controlsRef.current;
    if (!ctrl) return;

    const isOverview   = focusMode === 'overview';
    const desiredTilt  = viewMode === '2.5d' ? TILT_2_5D : TILT_2D;
    const desiredAzimuth = isOverview
      ? AZIMUTH_SE
      : (viewFlipped ? AZIMUTH_NW : AZIMUTH_SE);

    const dt = Math.min(delta, 0.1); // clamp large delta (tab switch etc.)
    const speed = SWITCH_SPEED;

    // ── detect entering overview (snapshot start for animation) ──
    if (isOverview && prevFocusMode.current !== 'overview') {
      overviewStart.current.tilt    = curTilt.current;
      overviewStart.current.azimuth = curAzimuth.current;
      overviewStart.current.target.copy(curTarget.current);
      overviewStart.current.dist    = curDistance.current;
      overviewProgress.current = 0;
    }
    prevFocusMode.current = focusMode;

    // ── animate tilt / azimuth ──
    if (isOverview) {
      overviewProgress.current = Math.min(1, overviewProgress.current + dt * speed);
      const t = easeInOutCubic(overviewProgress.current);
      curTilt.current    = lerp(overviewStart.current.tilt,    desiredTilt,  t);
      curAzimuth.current = lerp(overviewStart.current.azimuth, AZIMUTH_SE,   t);
      curTarget.current.lerpVectors(overviewStart.current.target, center, t);
      curDistance.current = lerp(overviewStart.current.dist, OVERVIEW_DIST, t);
    } else {
      curTilt.current    += (desiredTilt    - curTilt.current)    * Math.min(dt * speed, 1);
      curAzimuth.current += (desiredAzimuth - curAzimuth.current) * Math.min(dt * speed, 1);

      // In focus mode, read pan/zoom state from MapControls
      curTarget.current.copy(ctrl.target);
      curDistance.current = ctrl.object.position.distanceTo(ctrl.target);
    }

    // ── cell-selection pan ──
    if (isCellAnimating.current) {
      cellAnimProgress.current += dt * 4;
      if (cellAnimProgress.current >= 1) {
        cellAnimProgress.current = 1;
        isCellAnimating.current = false;
      }
      curTarget.current.lerpVectors(
        cellAnimStart.current, cellAnimTarget.current, easeInOutCubic(cellAnimProgress.current),
      );
    }

    // ── lock distance in overview; free otherwise ──
    if (isOverview) {
      ctrl.minDistance = Math.max(0.1, curDistance.current - 0.1);
      ctrl.maxDistance = curDistance.current + 0.1;
    } else {
      ctrl.minDistance = 2;
      ctrl.maxDistance = 40;
    }

    // ── apply everything to the camera ──
    applyCamera(ctrl);
  });

  return (
    <MapControls
      ref={controlsRef}
      makeDefault
      enableRotate={false}
      screenSpacePanning={true}
      minDistance={2}
      maxDistance={40}
      maxPolarAngle={TILT_2_5D}
      minPolarAngle={TILT_2D}
      onStart={handleInteractionStart}
    />
  );
}
