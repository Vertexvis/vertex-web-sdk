interface UrlResource {
  type: 'url';
  url: string;
}

export type LoadableResource = UrlResource;

export interface Resource {
  resource: LoadableResource;
}

export function fromUri(uri: string): Resource {
  const isUrl = uri.startsWith('http');

  if (isUrl) {
    return fromUrl(uri);
  }
  throw new Error(`Invalid URI. Provided URI must be a valid URL or URN.`);
}

export function fromUrl(url: string): Resource {
  return {
    resource: {
      type: 'url',
      url,
    },
  };
}
