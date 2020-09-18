import { NgModule } from '@angular/core';
import { SvgIcon, VertexViewer } from './generated/directives/proxies';

const DECLARATIONS = [
  // proxies
  SvgIcon,
  VertexViewer,
];

@NgModule({
  declarations: DECLARATIONS,
  exports: DECLARATIONS,
  imports: [],
  providers: [],
})
export class VertexViewerModule {}
