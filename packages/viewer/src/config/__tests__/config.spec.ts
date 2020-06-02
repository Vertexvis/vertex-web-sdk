import * as Config from '../config';

describe(Config.parseConfig, () => {
  it('should default to environment config', () => {
    const config = Config.parseConfig('staging', {});
    expect(config).toMatchObject({
      network: {
        apiHost: 'https://api.staging.vertexvis.io',
        renderingHost: 'wss://rendering.staging.vertexvis.io',
      },
    });
  });

  it('environment defaults should be overridden', () => {
    const config = Config.parseConfig('staging', {
      network: { apiHost: 'host' },
    });
    expect(config).toMatchObject({
      network: {
        apiHost: 'host',
        renderingHost: 'wss://rendering.staging.vertexvis.io',
      },
    });
  });

  it('parses JSON encoded string', () => {
    const json = JSON.stringify({ network: { apiHost: 'host' } });
    const config = Config.parseConfig('staging', json);
    expect(config).toMatchObject({
      network: {
        apiHost: 'host',
        renderingHost: 'wss://rendering.staging.vertexvis.io',
      },
    });
  });
});
