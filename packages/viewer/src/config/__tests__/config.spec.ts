import * as Config from '../config';

describe(Config.parseConfig, () => {
  it('should default to environment config', () => {
    const config = Config.parseConfig('platdev', {});
    expect(config).toMatchObject({
      network: {
        apiHost: 'https://platform.platdev.vertexvis.io',
        renderingHost: 'wss://stream.platdev.vertexvis.io',
      },
    });
  });

  it('environment defaults should be overridden', () => {
    const config = Config.parseConfig('platdev', {
      network: { apiHost: 'host' },
    });
    expect(config).toMatchObject({
      network: {
        apiHost: 'host',
        renderingHost: 'wss://stream.platdev.vertexvis.io',
      },
    });
  });

  it('parses JSON encoded string', () => {
    const json = JSON.stringify({ network: { apiHost: 'host' } });
    const config = Config.parseConfig('platdev', json);
    expect(config).toMatchObject({
      network: {
        apiHost: 'host',
        renderingHost: 'wss://stream.platdev.vertexvis.io',
      },
    });
  });
});
