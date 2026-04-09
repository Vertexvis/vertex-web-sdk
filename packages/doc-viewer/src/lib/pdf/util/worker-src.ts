import { Config } from '../../config';
import { getRelativeUrl, moduleUrlIncludes } from '../../imports';

export const WORKER_ABSOLUTE_PATH = '/dist/doc-viewer/assets/pdf.worker.min.mjs';
export const WORKER_RELATIVE_PATH = './assets/pdf.worker.min.mjs';
export const WORKER_PARENT_PATH = '../doc-viewer/assets/pdf.worker.min.mjs';

export async function getWorkerSrc(config?: Config): Promise<string | undefined> {
  if (config?.pdfJs.workerSrc) {
    return config.pdfJs.workerSrc;
  } else {
    const srcCandidates = getBuildTypeWorkerSrcCandidateProviders();

    for (const srcProvider of srcCandidates) {
      try {
        const src = srcProvider();
        const response = await fetch(src);

        if (response?.ok) {
          return src;
        }
      } catch (e) {
        // Ignore failures to retrieve the worker source, as some failures may be expected depending on the build type.
      }
    }
  }
}

export function getBuildTypeWorkerSrcCandidateProviders(): Array<() => string> {
  // There are a number of possible approaches for loading the worker source, and this set of URLs attempts to
  // cover approaches that work for a few different build tools. A config value can be provided to override this
  // behavior, but the default behavior attempts to work with as many build tools as possible.
  // Note that these are set up as providers to prevent exceptions when attempting to create the URL object.
  const relativeUrlBasedStringProvider = (): string => getRelativeUrl(WORKER_RELATIVE_PATH);
  const absolutePathStringProvider = (): string => WORKER_ABSOLUTE_PATH;
  const parentUrlBasedStringProvider = (): string => getRelativeUrl(WORKER_PARENT_PATH);

  const isEsmBuild = moduleUrlIncludes('/dist/esm/');
  const isCustomElementBuild = moduleUrlIncludes('/dist/components/');
  const isDistBuild = moduleUrlIncludes('/dist/doc-viewer/');

  if (isEsmBuild) {
    return [parentUrlBasedStringProvider, relativeUrlBasedStringProvider, absolutePathStringProvider];
  } else if (isDistBuild) {
    return [absolutePathStringProvider, relativeUrlBasedStringProvider, parentUrlBasedStringProvider];
  } else if (isCustomElementBuild) {
    return [relativeUrlBasedStringProvider, parentUrlBasedStringProvider, absolutePathStringProvider];
  }

  return [relativeUrlBasedStringProvider, parentUrlBasedStringProvider, absolutePathStringProvider];
}
