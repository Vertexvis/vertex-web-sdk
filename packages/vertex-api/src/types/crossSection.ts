import { SectionPlane } from './sectionPlane';

export interface CrossSection {
  planes: SectionPlane[];
}

export function create(planes: SectionPlane[]): CrossSection {
  return { planes };
}
