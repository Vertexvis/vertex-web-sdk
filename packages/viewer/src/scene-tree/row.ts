export interface LoadedRow {
  id: string;
  loading: false;
  selected: boolean;
  name: string;
  expanded: boolean;
  // eslint-disable-next-line @typescript-eslint/ban-types
  data: object;
}

export interface PendingRow {
  id: string;
  loading: true;
}

export type Row = PendingRow | LoadedRow;
