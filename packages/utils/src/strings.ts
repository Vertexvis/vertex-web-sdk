const trimStartRegex = /^\W+/;
const trimEndRegex = /\W+$/;
const trimStartAndEndRegex = /^\W+|\W+$/g;

export function trimStart(str: string): string {
  return str.replace(trimStartRegex, '');
}

export function trimEnd(str: string): string {
  return str.replace(trimEndRegex, '');
}

export function trim(str: string): string {
  return str.replace(trimStartAndEndRegex, '');
}
