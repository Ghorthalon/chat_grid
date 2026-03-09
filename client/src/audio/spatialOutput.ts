import { SPATIAL_RAMP_SECONDS, SPATIAL_TIME_CONSTANT_SECONDS, type SpatialMixResult } from './spatial';

export type SpatialOutputMode = 'mono' | 'stereo';
export type SpatialRenderMode = 'classic' | 'hrtf';

export type SpatialOutputRuntime =
  | { kind: 'none' }
  | { kind: 'classic'; node: StereoPannerNode }
  | { kind: 'hrtf'; node: PannerNode };

type CreateSpatialOutputOptions = {
  audioCtx: AudioContext;
  inputNode: AudioNode;
  destination: AudioNode;
  outputMode: SpatialOutputMode;
  spatialMode: SpatialRenderMode;
};

type ApplySpatialOutputOptions = {
  audioCtx: AudioContext;
  runtime: SpatialOutputRuntime;
  gainNode: GainNode;
  mix: SpatialMixResult | null;
  outputMode: SpatialOutputMode;
  transition: 'linear' | 'target';
  dx?: number;
  dy?: number;
};

/** Creates one spatial output stage using either stereo pan or HRTF panning. */
export function createSpatialOutputRuntime(options: CreateSpatialOutputOptions): SpatialOutputRuntime {
  const { audioCtx, inputNode, destination, outputMode, spatialMode } = options;
  if (outputMode === 'mono') {
    inputNode.connect(destination);
    return { kind: 'none' };
  }

  if (spatialMode === 'hrtf' && typeof audioCtx.createPanner === 'function') {
    const panner = audioCtx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 10000;
    panner.rolloffFactor = 0;
    panner.coneInnerAngle = 360;
    panner.coneOuterAngle = 360;
    panner.coneOuterGain = 1;
    panner.positionX.setValueAtTime(0, audioCtx.currentTime);
    panner.positionY.setValueAtTime(0, audioCtx.currentTime);
    panner.positionZ.setValueAtTime(-1, audioCtx.currentTime);
    inputNode.connect(panner).connect(destination);
    return { kind: 'hrtf', node: panner };
  }

  if (typeof audioCtx.createStereoPanner === 'function') {
    const panner = audioCtx.createStereoPanner();
    inputNode.connect(panner).connect(destination);
    return { kind: 'classic', node: panner };
  }

  inputNode.connect(destination);
  return { kind: 'none' };
}

/** Disconnects the current spatial output stage. */
export function disconnectSpatialOutputRuntime(runtime: SpatialOutputRuntime): void {
  if (runtime.kind === 'none') return;
  runtime.node.disconnect();
}

/** Applies one resolved spatial mix to either stereo or HRTF output nodes. */
export function applySpatialOutput(options: ApplySpatialOutputOptions): void {
  const { audioCtx, runtime, gainNode, mix, outputMode, transition, dx = 0, dy = 0 } = options;
  const gainValue = mix?.gain ?? 0;

  if (transition === 'linear') {
    gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(gainValue, audioCtx.currentTime + SPATIAL_RAMP_SECONDS);
  } else {
    gainNode.gain.setTargetAtTime(gainValue, audioCtx.currentTime, SPATIAL_TIME_CONSTANT_SECONDS);
  }

  if (runtime.kind === 'none') {
    return;
  }

  if (runtime.kind === 'classic') {
    const panValue = outputMode === 'mono' ? 0 : Math.max(-1, Math.min(1, mix?.pan ?? 0));
    if (transition === 'linear') {
      runtime.node.pan.cancelScheduledValues(audioCtx.currentTime);
      runtime.node.pan.linearRampToValueAtTime(panValue, audioCtx.currentTime + SPATIAL_RAMP_SECONDS);
    } else {
      runtime.node.pan.setTargetAtTime(panValue, audioCtx.currentTime, SPATIAL_TIME_CONSTANT_SECONDS);
    }
    return;
  }

  const targetX = dx;
  const targetZ = -dy;
  if (transition === 'linear') {
    runtime.node.positionX.cancelScheduledValues(audioCtx.currentTime);
    runtime.node.positionZ.cancelScheduledValues(audioCtx.currentTime);
    runtime.node.positionX.linearRampToValueAtTime(targetX, audioCtx.currentTime + SPATIAL_RAMP_SECONDS);
    runtime.node.positionZ.linearRampToValueAtTime(targetZ, audioCtx.currentTime + SPATIAL_RAMP_SECONDS);
  } else {
    runtime.node.positionX.setTargetAtTime(targetX, audioCtx.currentTime, SPATIAL_TIME_CONSTANT_SECONDS);
    runtime.node.positionZ.setTargetAtTime(targetZ, audioCtx.currentTime, SPATIAL_TIME_CONSTANT_SECONDS);
  }
  runtime.node.positionY.setValueAtTime(0, audioCtx.currentTime);
}
