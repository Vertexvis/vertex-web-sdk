export interface LoadedRow {
  loading: false;
  selected: boolean;
  name: string;
  expanded: boolean;
  // eslint-disable-next-line @typescript-eslint/ban-types
  data: object;
}

export interface PendingRow {
  loading: true;
}

export type Row = PendingRow | LoadedRow;
