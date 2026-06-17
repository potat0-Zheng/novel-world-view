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

import { useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
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
const SWITCH_SPEED    = 1 / 0.8;   // tilt / overview transitions
const AZIMUTH_SPEED     = 1 / 0.35;  // azimuth (flip) — faster tail
const ENTRANCE_DURATION = 1.5;       // initial entrance animation (s)
const ENTRANCE_SPEED    = 1 / ENTRANCE_DURATION;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export default function CameraController() {
  const controlsRef = useRef<any>(null);
  const { gl } = useThree();

  const viewMode        = useWorldStore(s => s.viewMode);
  const focusMode       = useWorldStore(s => s.focusMode);
  const viewFlipped     = useWorldStore(s => s.viewFlipped);
  const selectedCellKey = useWorldStore(s => s.selectedCellKey);
  const focusedCellKey  = useWorldStore(s => s.focusedCellKey);
  const gridSize        = useWorldStore(s => s.world.config.gridSize);

  const center = useMemo(() => new THREE.Vector3(gridSize / 2, 0, gridSize / 2), [gridSize]);

  // Animated spherical coords — curDistance is only used in overview / cell-focus;
  // in free-focus we read distance from MapControls live.
  // Entrance start values — match the init effect so frames before
  // useLayoutEffect donʼt flash with wrong lerp origin.
  const ENTRANCE_START_DIST = 30;
  const ENTRANCE_START_TILT = TILT_2D;

  const curTilt     = useRef(ENTRANCE_START_TILT);
  const curAzimuth  = useRef(AZIMUTH_SE);
  const curTarget   = useRef(center.clone());
  const curDistance = useRef(ENTRANCE_START_DIST);

  // Overview transition
  const prevFocusMode    = useRef(focusMode);
  const overviewStart    = useRef({
    azimuth: AZIMUTH_SE,
    target: center.clone(),
    dist: ENTRANCE_START_DIST,
    tilt: ENTRANCE_START_TILT,
  });
  const overviewProgress = useRef(0);
  // 'steady'    — already at overview preset, all values locked
  // 'entering'  — animation in progress (focus → overview transition)
  // 'entrance'  — initial fly-in from high altitude (first load only)
  const overviewPhase    = useRef<'steady' | 'entering' | 'entrance'>(
    useWorldStore.getState().focusMode === 'overview' ? 'entrance' : 'entering',
  );

  const entranceProgress = useRef(0); // 0 → 1 over ENTRANCE_DURATION

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

  // ── Initialise (useLayoutEffect: runs before first paint, no flash frames) ──
  useLayoutEffect(() => {
    const ctrl = controlsRef.current;
    if (!ctrl) return;

    // Entrance animation: start from high altitude / flat tilt
    curTilt.current     = ENTRANCE_START_TILT;
    curAzimuth.current  = AZIMUTH_SE;
    curTarget.current.copy(center);
    curDistance.current = ENTRANCE_START_DIST;
    ctrl.target.copy(center);
    ctrl.minDistance = ENTRANCE_START_DIST - 0.1;
    ctrl.maxDistance = ENTRANCE_START_DIST + 0.1;

    overviewStart.current.azimuth = AZIMUTH_SE;
    overviewStart.current.target.copy(center);
    overviewStart.current.dist    = ENTRANCE_START_DIST;
    overviewStart.current.tilt    = ENTRANCE_START_TILT;
    overviewProgress.current = 0;
    entranceProgress.current = 0;
    overviewPhase.current    = 'entrance';

    syncCamera(ctrl);
  }, [center]);

  // ── Auto-focus when user drags / scrolls in overview ──
  // useCallback with [] deps: only reads getState() so deps are stable.
  // STABLE REFERENCE IS CRITICAL — prevents drei MapControls' useEffect
  // from calling dispose()/connect() when this callback fires, which would
  // kill the dynamically-registered pointermove listener mid-drag.
  const handleInteractionStart = useCallback(() => {
    if (useWorldStore.getState().focusMode === 'overview') {
      useWorldStore.getState().setFocusMode('focus');
    }
  }, []);

  // ── Browse: cell-selection → focus + pan ──
  useEffect(() => {
    const key = selectedCellKey;
    const prev = prevSelectedKey.current;
    prevSelectedKey.current = key;
    if (!key || key === prev) return;

    const store = useWorldStore.getState();
    if (store.focusMode === 'overview') store.setFocusMode('focus');
    if (store.viewMode === '2d') return;

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

    const fm         = useWorldStore.getState().focusMode;
    const isOverview = fm === 'overview';
    const dt         = Math.min(delta, 0.1);
    let anglesChanged = false;

    // ══════════════════════════════════════════════════════════
    //  Overview state machine
    // ══════════════════════════════════════════════════════════
    if (isOverview && prevFocusMode.current !== 'overview') {
      // ── entering overview from focus ──
      overviewStart.current.azimuth = curAzimuth.current;
      overviewStart.current.target.copy(curTarget.current);
      overviewStart.current.dist    = ctrl.object.position.distanceTo(ctrl.target);
      overviewStart.current.tilt    = curTilt.current;
      overviewProgress.current = 0;
      overviewPhase.current    = 'entering';
    } else if (!isOverview) {
      // ── left overview — mark so next entry triggers a fresh transition ──
      overviewPhase.current = 'entering';
    }
    prevFocusMode.current = fm;

    const inSteadyOverview   = isOverview && overviewPhase.current === 'steady';
    const inEnteringOverview = isOverview && overviewPhase.current === 'entering';
    const inEntrance         = isOverview && overviewPhase.current === 'entrance';

    // ── entrance progress (separate tracker, not shared with entering) ──
    if (inEntrance) {
      entranceProgress.current = Math.min(1, entranceProgress.current + dt * ENTRANCE_SPEED);
    }

    // ── tilt ──
    const desiredTilt = viewMode === '2.5d' ? TILT_2_5D : TILT_2D;
    const oldTilt = curTilt.current;
    if (inSteadyOverview) {
      curTilt.current = desiredTilt; // lock — no drift
    } else if (inEntrance) {
      const t = easeInOutCubic(entranceProgress.current);
      curTilt.current = lerp(overviewStart.current.tilt, desiredTilt, t);
    } else {
      curTilt.current += (desiredTilt - curTilt.current) * Math.min(dt * SWITCH_SPEED, 1);
    }
    if (Math.abs(curTilt.current - oldTilt) > 0.0001) anglesChanged = true;

    // ── azimuth ──
    const oldAz = curAzimuth.current;
    if (viewMode !== '2d') {
      if (inSteadyOverview || inEntrance) {
        curAzimuth.current = AZIMUTH_SE; // lock
      } else if (inEnteringOverview) {
        overviewProgress.current = Math.min(1, overviewProgress.current + dt * SWITCH_SPEED);
        const t = easeInOutCubic(overviewProgress.current);
        curAzimuth.current = lerp(overviewStart.current.azimuth, AZIMUTH_SE, t);
      } else {
        const desiredAzimuth = viewFlipped ? AZIMUTH_NW : AZIMUTH_SE;
        curAzimuth.current += (desiredAzimuth - curAzimuth.current) * Math.min(dt * AZIMUTH_SPEED, 1);
      }
    }
    if (Math.abs(curAzimuth.current - oldAz) > 0.0001) anglesChanged = true;

    // ── target & distance ──
    if (inSteadyOverview) {
      curTarget.current.copy(center);
      curDistance.current = OVERVIEW_DIST;
    } else if (inEntrance) {
      const t = easeInOutCubic(entranceProgress.current);
      curTarget.current.copy(center);
      curDistance.current = lerp(overviewStart.current.dist, OVERVIEW_DIST, t);
      if (entranceProgress.current >= 1) {
        overviewPhase.current = 'steady'; // fly-in complete → lock
      }
    } else if (inEnteringOverview) {
      const t = easeInOutCubic(Math.min(1, overviewProgress.current));
      curTarget.current.lerpVectors(overviewStart.current.target, center, t);
      curDistance.current = lerp(overviewStart.current.dist, OVERVIEW_DIST, t);
      if (overviewProgress.current >= 1) {
        overviewPhase.current = 'steady'; // transition complete → lock
      }
    } else {
      // ── focus mode: follow MapControls, but project target onto
      //     the Y=0 ground plane so pan never drags the camera underground. ──
      const cam  = ctrl.object.position as THREE.Vector3;
      const tgt  = ctrl.target as THREE.Vector3;

      // Ray from camera through MapControls' target → intersect with Y=0
      const dirY = tgt.y - cam.y;
      if (Math.abs(dirY) > 0.0001) {
        const t = -cam.y / dirY;
        if (t > 0 && isFinite(t)) {
          curTarget.current.set(
            cam.x + t * (tgt.x - cam.x),
            0,
            cam.z + t * (tgt.z - cam.z),
          );
        } else {
          // degenerate — fall back to y-clamp
          curTarget.current.copy(tgt);
          curTarget.current.y = 0;
        }
      } else {
        // camera nearly horizontal (2D mode) — just clamp
        curTarget.current.copy(tgt);
        curTarget.current.y = 0;
      }
      curDistance.current = ctrl.object.position.distanceTo(curTarget.current);
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

    // ── reposition camera if angles changed, or whenever we are in
    //     overview (entering animation / steady lock both need it). ──
    if (isOverview || anglesChanged) {
      syncCamera(ctrl);
    }
  });

  useEffect(() => {
    const el = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const ctrl = controlsRef.current;
      if (!ctrl) return;
      const store = useWorldStore.getState();
      if (store.focusMode === 'overview') store.setFocusMode('focus');
      const cam = ctrl.object as THREE.Camera;
      const dist = cam.position.distanceTo(ctrl.target);
      const zoomSpeed = 0.08;
      const d = e.deltaY > 0 ? 1 + zoomSpeed : 1 - zoomSpeed;
      const nd = Math.max(2, Math.min(40, dist * d));
      const dir = cam.position.clone().sub(ctrl.target).normalize();
      cam.position.copy(ctrl.target).add(dir.multiplyScalar(nd));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [gl]);

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
