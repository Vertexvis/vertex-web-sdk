import { ColorMaterial } from 'https://cdn.jsdelivr.net/npm/@vertexvis/viewer@0.9.x/dist/esm/index.mjs';
import steps from './steps.js';

/**
 * Applies the operations provided for a specific step number to the result
 * of the queries provided for that step number, as well as the previous steps
 * before it, filtering out any highlight operations to indicate the parts
 * specific to this step.
 *
 * @param {*} scene the scene created through the viewer (await viewer.scene()).
 * @param {*} stepNumber the step number for which the operations should be applied.
 */
export async function applyWorkInstruction(scene, stepNumber) {
  if (stepNumber >= 0 && stepNumber < steps.length) {
    await scene
      .items((op) => op.where((q) => q.all()).clearMaterialOverrides())
      .execute();

    await scene
      .items((op) =>
        steps[stepNumber].operationSets.map((set) =>
          applyOps(
            op.where((q) => applyQuery(q, set.query)),
            set.operations
          )
        )
      )
      .execute();
  }
}

/**
 * Creates the initial scene from the first provided work instruction step.
 *
 * @param {*} viewer the viewer element to use to create the initial scene.
 */
export async function initializeWorkInstructions(viewer) {
  const scene = await viewer.scene();
  await applyWorkInstruction(scene, 0);
}

function applyQuery(builder, query) {
  switch (query.type) {
    case 'all':
      return builder.all();
    case 'itemId':
      return query.values.reduce(
        (result, v) => result.withItemId(v).or(),
        builder
      );
    case 'suppliedId':
      return query.values.reduce(
        (result, v) => result.withSuppliedId(v).or(),
        builder
      );
    default:
      return builder;
  }
}

function applyOps(builder, operations) {
  return operations.reduce((result, op) => {
    switch (op.type) {
      case 'show':
        return result.show();
      case 'hide':
        return result.hide();
      case 'clearMaterialOverrides':
        return result.clearMaterialOverrides();
      case 'materialOverride':
        return result.materialOverride(ColorMaterial.fromHex(op.value));
      default:
        return result;
    }
  }, builder);
}
