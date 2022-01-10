// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Fragment, FunctionalComponent, h } from '@stencil/core';

import { SceneTreeErrorDetails } from './lib/errors';

interface SceneTreeErrorProps {
  details: SceneTreeErrorDetails;
}

export const SceneTreeError: FunctionalComponent<SceneTreeErrorProps> = (
  { details },
  children
) => {
  return (
    <div class="error">
      <div class="error-section error-message">
        <span>{details.message}</span>
        {details.link && (
          <Fragment>
            <span> See our </span>
            <a href={details.link} target="_blank">
              documentation
            </a>{' '}
            <span> for more information.</span>
          </Fragment>
        )}
      </div>
      <div class="error-section">{children}</div>
    </div>
  );
};
