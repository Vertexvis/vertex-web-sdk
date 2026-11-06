import { loadViewerWithQueryParams } from '../helpers.js';

const MAX_SELECTION = 2;
const GRPC_STATUS = {
  3: 'INVALID_ARGUMENT',
  5: 'NOT_FOUND',
  7: 'PERMISSION_DENIED',
  16: 'UNAUTHENTICATED',
};

document.addEventListener('DOMContentLoaded', () => {
  main();
});

async function main() {
  await Promise.all([
    window.customElements.whenDefined('vertex-viewer'),
    window.customElements.whenDefined('vertex-scene-tree'),
    window.customElements.whenDefined('vertex-viewer-measurement-precise'),
    window.customElements.whenDefined('vertex-viewer-measurement-details'),
  ]);

  const viewer = document.getElementById('viewer');
  const sceneTree = document.getElementById('scene-tree');
  const details = document.getElementById('details');
  const toggle = document.getElementById('toggle');
  const reset = document.getElementById('reset');
  const message = document.getElementById('message');
  const error = document.getElementById('error');
  const status = document.getElementById('status');
  const metadataKeys = document.getElementById('metadata-keys');
  const configEnv = import.meta.env.VITE_CONFIG_ENV || 'platdev';

  viewer.configEnv = configEnv;
  sceneTree.configEnv = configEnv;

  const usingFileKey = Boolean(import.meta.env.VITE_STREAM_KEY?.trim());
  status.textContent = usingFileKey
    ? `Environment: ${configEnv}`
    : `Environment: ${configEnv}. Set VITE_STREAM_KEY in .env, then restart the examples server.`;

  let editing = false;
  let measurement;
  let entitiesListener;

  toggle.addEventListener('click', async () => {
    if (editing) {
      await disablePreciseMeasurement();
    } else {
      await enablePreciseMeasurement();
    }
  });

  reset.addEventListener('click', () => {
    measurement?.measurementController?.clearEntities();
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (!editing) return;
    showError(describeError(event.reason));
  });

  viewer.addEventListener('sceneReady', () => {
    loadMetadataKeys();
  });

  await loadViewerWithQueryParams(viewer, { env: configEnv });

  async function enablePreciseMeasurement() {
    editing = true;
    toggle.setAttribute('aria-pressed', 'true');
    toggle.textContent = 'Exit precise measurement';
    viewer.featureMaps = 'final';
    showError('');

    measurement = document.createElement('vertex-viewer-measurement-precise');
    measurement.setAttribute('config-env', configEnv);
    viewer.append(measurement);
    await measurement.componentOnReady();

    details.measurementModel = measurement.measurementModel;
    details.measurementOverlays = measurement.measurementOverlays;
    entitiesListener = measurement.measurementModel.onEntitiesChanged(
      (entities) => {
        showError('');
        if (entities.length > MAX_SELECTION) {
          const latest = entities[MAX_SELECTION];
          measurement.measurementController?.setEntities(new Set([latest]));
          return;
        }

        message.textContent = entities.length === 0 ? 'Select a surface' : '';
        reset.hidden = entities.length === 0;
      },
    );
    message.textContent = 'Select a surface';
  }

  async function disablePreciseMeasurement() {
    editing = false;
    toggle.setAttribute('aria-pressed', 'false');
    toggle.textContent = 'Precise measurement';
    entitiesListener?.dispose();
    entitiesListener = undefined;
    await measurement?.measurementController?.clearEntities();
    measurement?.remove();
    measurement = undefined;
    message.textContent = '';
    showError('');
    reset.hidden = true;
  }

  async function loadMetadataKeys() {
    let reason;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const keys = await sceneTree.fetchMetadataKeys();
        metadataKeys.textContent = keys.length
          ? keys.join(', ')
          : 'No property metadata keys were returned.';
        return;
      } catch (error) {
        reason = error;
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }

    metadataKeys.textContent = `Metadata request failed. ${describeError(reason)}`;
  }

  function showError(text) {
    error.hidden = text === '';
    error.textContent = text;
  }
}

function describeError(reason) {
  if (reason == null) return 'Request failed.';

  const code = reason.code;
  const status = GRPC_STATUS[code] ?? (code == null ? '' : `code ${code}`);
  const message =
    typeof reason.message === 'string' && reason.message !== '[object Object]'
      ? reason.message
      : '';

  if (status && message) return `${status}: ${message}`;
  if (message) return message;
  if (status) return status;
  return String(reason);
}
