export type DeviceSize = 'small' | 'large';

export function getDeviceSize(): DeviceSize {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(max-width: 640px)').matches ? 'small' : 'large';
  }
  return 'small';
}
