import { loadViewerWithQueryParams } from '../helpers.js';
import { defineCustomElements } from 'https://cdn.jsdelivr.net/npm/@vertexvis/viewer@0.23.x/dist/esm/loader.mjs';

// Keep track of selected columns at module scope
const selectedColumns = new Set();

// Keep track of the search input at module scope
let searchInput = '';

document.addEventListener('DOMContentLoaded', () => {
  defineCustomElements(window).then(() => main());
});

async function main() {
  const viewer = document.getElementById('viewer');
  const sceneTree = document.getElementById('scene-tree');
  const expandAllBtn = document.getElementById('expand-all-btn');
  const collapseAllBtn = document.getElementById('collapse-all-btn');
  const searchMetadataBtn = document.getElementById('search-metadata-btn');

  // lookup the keys initially to show up automatically.
  setInterval(() => {
    findAvailableKeys(sceneTree);
  }, 2000);

  sceneTree.addEventListener('search', (event) => {
    searchInput = event.detail;
  });

  expandAllBtn.addEventListener('click', async () => {
    await sceneTree.expandAll();
  });

  collapseAllBtn.addEventListener('click', async () => {
    await sceneTree.collapseAll();
  });

  searchMetadataBtn.addEventListener('click', async () => {
    const scene = await viewer.scene();
    // Get array of selected metadata keys
    const selectedMetadataKeys = Array.from(selectedColumns);

    if (!searchInput || !selectedColumns.size === 0) {
      console.warn('No search input currently, resetting phantom state')
      // If no search value, reset phantom state
      await scene.elements((op) => [op.items.where((q) => q.all()).clearPhantom()]).execute();
    } else if (selectedMetadataKeys.length === 0) {
      console.warn('No metadata columns selected for search');
    } else {
      // Get array of selected metadata keys
      const selectedMetadataKeys = Array.from(selectedColumns);

      await scene
        .elements((op) => [
          op.items.where((q) => q.all()).setPhantom(true),
          op.items.where((q) => q.withMetadata(searchInput, selectedMetadataKeys, false)).setPhantom(false)
        ])
        .execute();
    }
  });

  sceneTree.rowData = (row) => {
    return {
      ...row,
      handleClick: async () => {
        const selectionContent = document.getElementById('selection-content');

        // note: this is paginated, but we'll just get the first page.
        const itemMetadata = await viewer.sceneItems.listSceneItemMetadata(row.node.id.hex, {});

        if (row) {
          const metadataHtml = itemMetadata.entries
            .map(entry => `
              <tr class="metadata-item">
                <td class="metadata-key">${entry.key.name}</td>
                <td class="metadata-value">${entry.value.value}</td>
              </tr>
            `)
            .join('');

          selectionContent.innerHTML = `
            <div class="selection-item">
              <div class="item-id">
                <strong>Item ID:</strong> ${row.node.id.hex}
              </div>
              <div class="metadata-section">
                <h5>Metadata</h5>
                <table class="metadata-table">
                  <tbody>
                    ${metadataHtml || '<tr><td colspan="2" class="no-metadata">No metadata available</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>
          `;
        } else {
          selectionContent.innerHTML = '<p>No item selected</p>';
        }
      }
    }
  }

  await loadViewerWithQueryParams(viewer);
}

async function findAvailableKeys(sceneTree) {
  // Use the scene tree's fetchMetadataKeys API
  const keys = await sceneTree.fetchMetadataKeys();

  // Update the UI with the fetched keys
  updateAvailableColumnsUI(keys, sceneTree);
}

function updateAvailableColumnsUI(keys, sceneTree) {
  const columnsBody = document.querySelector('.available-columns-body');
  columnsBody.innerHTML = '';

  // Add metadata keys
  keys.forEach(key => {
    const columnDiv = document.createElement('div');
    columnDiv.className = 'available-column' + (selectedColumns.has(key) ? ' selected' : '');
    columnDiv.innerHTML = `
      <h3>${key}</h3>
    `;
    columnDiv.dataset.columnKey = key;
    columnDiv.addEventListener('click', () => {
      // Toggle selection
      if (columnDiv.classList.contains('selected')) {
        columnDiv.classList.remove('selected');
        selectedColumns.delete(key);
      } else {
        columnDiv.classList.add('selected');
        selectedColumns.add(key);
      }

      // Update the table layout and metadata keys
      updateTableLayout(sceneTree, selectedColumns);
      updateMetadataKeys(sceneTree, selectedColumns);
    });
    columnsBody.appendChild(columnDiv);
  });
}

function updateTableLayout(sceneTree, selectedColumns) {
  const tableLayout = sceneTree.querySelector('vertex-scene-tree-table-layout');

  // Remove any existing metadata columns (keeping the first name column)
  while (tableLayout.children.length > 1) {
    tableLayout.removeChild(tableLayout.lastChild);
  }

  // Add selected metadata columns
  selectedColumns.forEach(key => {
    const column = document.createElement('vertex-scene-tree-table-column');
    const template = document.createElement('template');
    template.innerHTML = `
      <vertex-scene-tree-table-cell prop:value="{{row.metadata.${key}}}"></vertex-scene-tree-table-cell>
    `;
    column.appendChild(template);
    tableLayout.appendChild(column);
  });
}

function updateMetadataKeys(sceneTree, selectedColumns) {
  // Convert Set to Array for the metadataKeys property
  sceneTree.metadataKeys = Array.from(selectedColumns);
  sceneTree.metadataSearchKeys = Array.from(selectedColumns);
}
