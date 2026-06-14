// src/components/scene/CameraController.tsx
//
// Drives the 2.5D / 2D map camera via @react-three/drei <MapControls>.
//
// Architecture
// ────────────
// MapControls handles pan (drag → target) and zoom (scroll → distance)
// natively — we never override those.
//
// For tilt/polar and azimuth we animate the angles via lerp and then
// place the camera at (target + spherical→cartesian) using MapControls'
// LIVE distance so the user's zoom level is never disrupted.
//
// Behavioural modes:
//   overview — all four params locked to a fixed preset
//   focus    — user has deviated from the preset
//   cell-focus (edit mode) — close-up of the focused cell

import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { MapControls } from '@react-three/drei';
import * as THREE from 'three';
import useWorldStore from '../../store/worldStore';
import { parseCoordKey } from '../../types/world';

// ---- constants ----
const TILT_2_5D   = Math.PI / 3;
const TILT_2D     = 0.02;
const AZIMUTH_SE  = Math.PI * 0.25;
const AZIMUTH_NW  = Math.PI * 1.25;
const OVERVIEW_DIST = 14;
const FOCUS_DIST    = 5;
const SWITCH_SPEED  = 1 / 0.8;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export default function CameraController() {
  const controlsRef = useRef<any>(null);

  const viewMode        = useWorldStore(s => s.viewMode);
  const focusMode       = useWorldStore(s => s.focusMode);
  const viewFlipped     = useWorldStore(s => s.viewFlipped);
  const selectedCellKey = useWorldStore(s => s.selectedCellKey);
  const focusedCellKey  = useWorldStore(s => s.focusedCellKey);
  const gridSize        = useWorldStore(s => s.world.config.gridSize);

  const center = useMemo(() => new THREE.Vector3(gridSize / 2, 0, gridSize / 2), [gridSize]);

  // Animated spherical coords — curDistance is only used in overview / cell-focus;
  // in free-focus we read distance from MapControls live.
  const curTilt     = useRef(TILT_2_5D);
  const curAzimuth  = useRef(AZIMUTH_SE);
  const curTarget   = useRef(center.clone());
  const curDistance = useRef(OVERVIEW_DIST);

  // Overview transition
  const prevFocusMode    = useRef(focusMode);
  const overviewStart    = useRef({ azimuth: 0, target: new THREE.Vector3(), dist: 0 });
  const overviewProgress = useRef(0);

  // Cell-focus transition
  const focusStartKey   = useRef<string | null>(null);
  const focusStartVal   = useRef({ target: new THREE.Vector3(), dist: 0, tilt: 0, azimuth: 0 });
  const focusProgress   = useRef(0);
  const prevFocusedKey  = useRef<string | null>(null);

  // Browse-mode cell-selection pan
  const cellAnimTarget   = useRef(new THREE.Vector3());
  const cellAnimStart    = useRef(new THREE.Vector3());
  const cellAnimProgress = useRef(0);
  const isCellAnimating  = useRef(false);
  const prevSelectedKey  = useRef<string | null>(null);

  // ── Apply current spherical coords to the camera, preserving
  //     MapControls' live zoom level (i.e. read distance, don't force it). ──
  function syncCamera(ctrl: any) {
    const phi   = curTilt.current;
    const theta = curAzimuth.current;
    const tgt   = curTarget.current;

    // Use MapControls' own distance so we never fight user zoom
    const dist = ctrl.object.position.distanceTo(ctrl.target);
    ctrl.object.position.set(
      tgt.x + dist * Math.sin(phi) * Math.sin(theta),
      tgt.y + dist * Math.cos(phi),
      tgt.z + dist * Math.sin(phi) * Math.cos(theta),
    );
    ctrl.object.lookAt(tgt);
    ctrl.target.copy(tgt);

    // Tight bounds prevent MapControls from drifting
    const s = 0.01;
    ctrl.minPolarAngle = Math.max(0, phi - s);
    ctrl.maxPolarAngle = Math.min(Math.PI / 2, phi + s);
    ctrl.minAzimuthalAngle = theta - s;
    ctrl.maxAzimuthalAngle = theta + s;
  }

  // ── Initialise ──
  useEffect(() => {
    const ctrl = controlsRef.current;
    if (!ctrl) return;
    curTilt.current     = TILT_2_5D;
    curAzimuth.current  = AZIMUTH_SE;
    curTarget.current.copy(center);
    curDistance.current = OVERVIEW_DIST;
    ctrl.target.copy(center);
    ctrl.minDistance = OVERVIEW_DIST - 0.1;
    ctrl.maxDistance = OVERVIEW_DIST + 0.1;
    syncCamera(ctrl);
  }, [center]);

  // ── Auto-focus when user drags / scrolls in overview ──
  const handleInteractionStart = () => {
    if (useWorldStore.getState().focusMode === 'overview') {
      useWorldStore.getState().setFocusMode('focus');
    }
  };

  // ── Browse: cell-selection → focus + pan ──
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
    cellAnimStart.current.copy(ctrl.target);
    cellAnimProgress.current = 0;
    isCellAnimating.current = true;
  }, [selectedCellKey]);

  // ── Edit: cell-focus → close-up ──
  useEffect(() => {
    const key = focusedCellKey;
    const prev = prevFocusedKey.current;
    prevFocusedKey.current = key;
    if (key === prev) return;

    const ctrl = controlsRef.current;
    if (!ctrl) return;

    focusStartVal.current.target.copy(ctrl.target);
    focusStartVal.current.dist    = ctrl.object.position.distanceTo(ctrl.target);
    focusStartVal.current.tilt    = curTilt.current;
    focusStartVal.current.azimuth = curAzimuth.current;
    focusStartKey.current = key ?? '';
    focusProgress.current = 0;

    if (key) {
      const store = useWorldStore.getState();
      if (store.focusMode === 'overview') store.setFocusMode('focus');
    }
  }, [focusedCellKey]);

  // ── Per-frame ──
  useFrame((_, delta) => {
    const ctrl = controlsRef.current;
    if (!ctrl) return;

    const isOverview   = focusMode === 'overview';
    const desiredTilt  = viewMode === '2.5d' ? TILT_2_5D : TILT_2D;
    const desiredAzimuth = isOverview
      ? AZIMUTH_SE
      : (viewFlipped ? AZIMUTH_NW : AZIMUTH_SE);

    const dt = Math.min(delta, 0.1);
    let anglesChanged = false;

    // ── detect overview entry ──
    if (isOverview && prevFocusMode.current !== 'overview') {
      overviewStart.current.azimuth = curAzimuth.current;
      overviewStart.current.target.copy(curTarget.current);
      overviewStart.current.dist    = ctrl.object.position.distanceTo(ctrl.target);
      overviewProgress.current = 0;
    }
    prevFocusMode.current = focusMode;

    // ── tilt: always animated ──
    const oldTilt = curTilt.current;
    curTilt.current += (desiredTilt - curTilt.current) * Math.min(dt * SWITCH_SPEED, 1);
    if (Math.abs(curTilt.current - oldTilt) > 0.0001) anglesChanged = true;

    // ── azimuth ──
    const oldAz = curAzimuth.current;
    if (isOverview) {
      overviewProgress.current = Math.min(1, overviewProgress.current + dt * SWITCH_SPEED);
      const t = easeInOutCubic(overviewProgress.current);
      curAzimuth.current = lerp(overviewStart.current.azimuth, AZIMUTH_SE, t);
    } else {
      curAzimuth.current += (desiredAzimuth - curAzimuth.current) * Math.min(dt * SWITCH_SPEED, 1);
    }
    if (Math.abs(curAzimuth.current - oldAz) > 0.0001) anglesChanged = true;

    // ── target & distance ──
    if (isOverview) {
      const t = easeInOutCubic(Math.min(1, overviewProgress.current));
      curTarget.current.lerpVectors(overviewStart.current.target, center, t);
      curDistance.current = lerp(overviewStart.current.dist, OVERVIEW_DIST, t);
    } else {
      curTarget.current.copy(ctrl.target);
      curDistance.current = ctrl.object.position.distanceTo(ctrl.target);
    }

    // ── cell-focus close-up ──
    let focusActive = false;
    if (focusedCellKey) {
      focusActive = true;
      focusProgress.current = Math.min(1, focusProgress.current + dt * 3);
      const t = easeInOutCubic(focusProgress.current);
      const { x, y } = parseCoordKey(focusedCellKey);
      const cellCenter = new THREE.Vector3(x + 0.5, 0, y + 0.5);
      curTarget.current.lerpVectors(focusStartVal.current.target, cellCenter, t);
      curDistance.current = lerp(focusStartVal.current.dist, FOCUS_DIST, t);
      curTilt.current     = lerp(focusStartVal.current.tilt, TILT_2_5D, t);
      if (focusProgress.current < 1) anglesChanged = true;
    } else if (prevFocusedKey.current !== null) {
      // Un-focus: animate back to centre
      focusProgress.current = Math.min(1, focusProgress.current + dt * 3);
      const t = easeInOutCubic(focusProgress.current);
      curTarget.current.lerpVectors(focusStartVal.current.target, center, t);
      curDistance.current = lerp(focusStartVal.current.dist, OVERVIEW_DIST, t);
      curTilt.current     = lerp(focusStartVal.current.tilt, TILT_2_5D, t);
      if (focusProgress.current < 1) anglesChanged = true;
    }

    // ── cell-selection pan (browse) ──
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

    // ── push target & distance constraints ──
    ctrl.target.copy(curTarget.current);
    if (isOverview || focusActive) {
      ctrl.minDistance = Math.max(0.1, curDistance.current - 0.1);
      ctrl.maxDistance = curDistance.current + 0.1;
    } else {
      ctrl.minDistance = 2;
      ctrl.maxDistance = 40;
    }

    // ── if angles changed, re-position the camera ──
    if (anglesChanged) {
      syncCamera(ctrl);
    }
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
