export type SpatialMixOptions = {
  dx: number;
  dy: number;
  range: number;
  baseGain?: number;
  nearFieldDistance?: number;
  nearFieldGain?: number;
  nearFieldCenterPan?: boolean;
};

export type SpatialMixResult = {
  distance: number;
  gain: number;
  pan: number;
};

export function resolveSpatialMix(options: SpatialMixOptions): SpatialMixResult | null {
  const {
    dx,
    dy,
    range,
    baseGain = 1,
    nearFieldDistance,
    nearFieldGain = 1,
    nearFieldCenterPan = false,
  } = options;
  if (!(range > 0)) {
    return null;
  }

  const distance = Math.hypot(dx, dy);
  if (distance > range) {
    return null;
  }

  const volumeRatio = Math.max(0, 1 - distance / range);
  let gain = baseGain * Math.pow(volumeRatio, 2);
  const clampedX = Math.max(-range, Math.min(range, dx));
  let pan = Math.sin((clampedX / range) * (Math.PI / 2));

  if (nearFieldDistance !== undefined && distance < nearFieldDistance) {
    gain = baseGain * nearFieldGain;
    if (nearFieldCenterPan) {
      pan = 0;
    }
  }

  return { distance, gain, pan };
}
