export interface UrlDescriptor {
  url: string;
  protocols?: string | string[];
}

export type UrlProvider = () => UrlDescriptor;
