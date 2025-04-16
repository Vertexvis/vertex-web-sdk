import * as Config from '../config';

describe(Config.parseAndValidateConfig, () => {
  it('should trim whitespace', () => {
    const expectedNetwork = {
      apiHost: 'https://valid-api-host.vertex3d.com',
      renderingHost: 'wss://valid-rendering-host.vertex3d.com',
      sceneTreeHost: 'https://valid-scene-tree-host.vertex3d.com',
      sceneViewHost: 'https://valid-scene-viewhost.vertex3d.com',
    };
    const json = JSON.stringify({
      network: {
        apiHost: `  ${expectedNetwork.apiHost}  `,
        renderingHost: `  ${expectedNetwork.renderingHost}  `,
        sceneTreeHost: `  ${expectedNetwork.sceneTreeHost}  `,
        sceneViewHost: `  ${expectedNetwork.sceneViewHost}  `,
      },
    });
    const config = Config.parseAndValidateConfig('platdev', json);
    expect(config).toMatchObject({
      network: expectedNetwork,
    });
  });

  it('should throw errors if any host is invalid', () => {
    const invalidApiHost = 'http://invalid-api-host.vertex3d.com';
    const invalidRenderingHost = 'ws://invalid-rendering-host.vertex3d.com';
    const invalidSceneTreeHost = 'invalid-scene-tree-host.vertex3d.com';
    const invalidSceneViewHost = 'https:/invalid-scene-viewhost.vertex3d.com';

    const invalidApiHostConfig = {
      network: {
        apiHost: invalidApiHost,
      },
    };
    const invalidRenderingHostConfig = {
      network: {
        renderingHost: invalidRenderingHost,
      },
    };
    const invalidSceneTreeHostConfig = {
      network: {
        sceneTreeHost: invalidSceneTreeHost,
      },
    };
    const invalidSceneViewHostConfig = {
      network: {
        sceneViewHost: invalidSceneViewHost,
      },
    };

    expect(() =>
      Config.parseAndValidateConfig(
        'platdev',
        JSON.stringify(invalidApiHostConfig)
      )
    ).toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          `Invalid apiHost "${invalidApiHost}" specified.`
        ),
      })
    );
    expect(() =>
      Config.parseAndValidateConfig(
        'platdev',
        JSON.stringify(invalidRenderingHostConfig)
      )
    ).toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          `Invalid renderingHost "${invalidRenderingHost}" specified.`
        ),
      })
    );
    expect(() =>
      Config.parseAndValidateConfig(
        'platdev',
        JSON.stringify(invalidSceneTreeHostConfig)
      )
    ).toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          `Invalid sceneTreeHost "${invalidSceneTreeHost}" specified.`
        ),
      })
    );
    expect(() =>
      Config.parseAndValidateConfig(
        'platdev',
        JSON.stringify(invalidSceneViewHostConfig)
      )
    ).toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          `Invalid sceneViewHost "${invalidSceneViewHost}" specified.`
        ),
      })
    );
  });

  it('should resolve a valid configuration', () => {
    const expectedNetwork = {
      apiHost: 'https://valid-api-host.vertex3d.com',
      renderingHost: 'wss://valid-rendering-host.vertex3d.com',
      sceneTreeHost: 'https://valid-scene-tree-host.vertex3d.com',
      sceneViewHost: 'https://valid-scene-viewhost.vertex3d.com',
    };

    expect(
      Config.parseAndValidateConfig(
        'platdev',
        JSON.stringify({ network: expectedNetwork })
      )
    ).toMatchObject({
      network: expectedNetwork,
    });
  });
});

describe(Config.parseConfig, () => {
  it('should default to environment config', () => {
    const config = Config.parseConfig('platdev', {} as Config.Config);
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
    } as Config.Config);
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

describe(Config.sanitizeConfig, () => {
  it('should trim whitespace from network URLs', () => {
    const expectedNetwork = {
      apiHost: 'api-host',
      renderingHost: 'rendering-host',
      sceneTreeHost: 'scene-tree-host',
      sceneViewHost: 'scene-view-host',
    };
    const json = JSON.stringify({
      network: {
        apiHost: `  ${expectedNetwork.apiHost}  `,
        renderingHost: `  ${expectedNetwork.renderingHost}  `,
        sceneTreeHost: `  ${expectedNetwork.sceneTreeHost}  `,
        sceneViewHost: `  ${expectedNetwork.sceneViewHost}  `,
      },
    });
    const config = Config.parseConfig('platdev', json);
    const sanitized = Config.sanitizeConfig(config);
    expect(sanitized).toMatchObject({
      network: expectedNetwork,
    });
  });
});

describe(Config.validateConfig, () => {
  it('should throw an error for an invalid api host', () => {
    const invalidHost = `http://invalid-host.vertex3d.com`;
    const json = JSON.stringify({
      network: {
        apiHost: invalidHost,
      },
    });
    const config = Config.parseConfig('platdev', json);

    expect(() => Config.validateConfig(config)).toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          `Invalid apiHost "${invalidHost}" specified.`
        ),
      })
    );
  });

  it('should throw an error for an invalid rendering host', () => {
    const invalidHost = `https://invalid-host.vertex3d.com`;
    const json = JSON.stringify({
      network: {
        renderingHost: invalidHost,
      },
    });
    const config = Config.parseConfig('platdev', json);

    expect(() => Config.validateConfig(config)).toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          `Invalid renderingHost "${invalidHost}" specified.`
        ),
      })
    );
  });

  it('should throw an error for an invalid scene tree host', () => {
    const invalidHost = `invalid-host.vertex3d.com`;
    const json = JSON.stringify({
      network: {
        sceneTreeHost: invalidHost,
      },
    });
    const config = Config.parseConfig('platdev', json);

    expect(() => Config.validateConfig(config)).toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          `Invalid sceneTreeHost "${invalidHost}" specified.`
        ),
      })
    );
  });

  it('should throw an error for an invalid scene view host', () => {
    const invalidHost = `https:/invalid-host.vertex3d.com`;
    const json = JSON.stringify({
      network: {
        sceneViewHost: `https:/invalid-host.vertex3d.com`,
      },
    });
    const config = Config.parseConfig('platdev', json);

    expect(() => Config.validateConfig(config)).toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          `Invalid sceneViewHost "${invalidHost}" specified.`
        ),
      })
    );
  });

  it('should not throw for valid host values', () => {
    const expectedNetwork = {
      apiHost: 'https://valid-api-host.vertex3d.com',
      renderingHost: 'wss://valid-rendering-host.vertex3d.com',
      sceneTreeHost: 'https://valid-scene-tree-host.vertex3d.com',
      sceneViewHost: 'https://valid-scene-viewhost.vertex3d.com',
    };
    const json = JSON.stringify({
      network: expectedNetwork,
    });
    const config = Config.parseConfig('platdev', json);

    expect(Config.validateConfig(config)).toMatchObject({
      network: expectedNetwork,
    });
  });
});
