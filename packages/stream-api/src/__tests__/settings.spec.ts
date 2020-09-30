import { appendSettingsToUrl, Settings } from '../settings';

describe(appendSettingsToUrl, () => {
  const url = 'wss://example.com';
  const settings: Settings = {
    EXPERIMENTAL_frameDelivery: {
      rateLimitingEnabled: true,
      packetLossThreshold: 1,
    },
  };

  it('appends each setting as url param to input url', () => {
    expect(appendSettingsToUrl(url, settings)).toBe(
      'wss://example.com?frame-delivery.rate-limit-enabled=on&frame-delivery.packet-loss-threshold=1'
    );
  });

  it('appends nothing if settings are empty', () => {
    expect(appendSettingsToUrl(url, {})).toBe(url);
  });
});
