import { Euler, Matrix4, Quaternion, Vector3 } from '@vertexvis/geometry';
import { Color } from '@vertexvis/utils';

import { ColorMaterial } from './lib/scenes/colorMaterial';

export type Color3 = Omit<Color.Color, 'a'> | string | number;

export interface MaterialOverride {
  defaultMaterial: ColorMaterial;
  colorMaterial: ColorMaterial;
}

export type FrameType = 'final' | 'all' | undefined;

export type CameraType = 'perspective' | 'orthographic' | undefined;

export interface FeatureLineOptions {
  width: number;
  color?: Color3;
}

export interface SelectionHighlightingOptions {
  lineWidth: number;
  color?: Color3;
  opacity?: number;
}

export interface FeatureHighlightOptions {
  highlightColor?: Color3;
  occludedOpacity?: number;
  outline?: FeatureLineOptions;
}

export interface PhantomOptions {
  opacity?: number;
}

export interface FrameOptions {
  frameBackgroundColor?: Color3;
}

export interface SceneComparisonOptions {
  streamKeyToCompare?: string;
}

export interface HTMLDomRendererPositionableElement {
  position: Vector3.Vector3;
  positionJson: string;
  rotation?: Euler.Euler;
  rotationJson?: string;
  quaternion: Quaternion.Quaternion;
  quaternionJson: string;
  scale: Vector3.Vector3;
  scaleJson: string;
  matrix: Matrix4.Matrix4;
}

export interface StreamAttributes {
  depthBuffers?: FrameType;
  phantom?: PhantomOptions;
  noDefaultLights?: boolean;
  featureLines?: FeatureLineOptions;
  featureHighlighting?: FeatureHighlightOptions;
  featureMaps?: FrameType;
  experimentalRenderingOptions?: string;
  selectionHighlighting?: SelectionHighlightingOptions;
  frames?: FrameOptions;
  sceneComparison?: SceneComparisonOptions;
}
