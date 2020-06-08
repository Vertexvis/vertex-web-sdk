import * as Uri from '../uri';

describe('Uri', () => {
  const uri =
    'https://www.ics.uci.edu/pub/ietf/uri/?query1=1&query%202=2%2B3#Related';

  describe(Uri.parse, () => {
    it('should parse the scheme', () => {
      const result = Uri.parse(uri);
      expect(result).toMatchObject({ scheme: 'https' });
    });

    it('should parse the authority', () => {
      const result = Uri.parse(uri);
      expect(result).toMatchObject({ authority: 'www.ics.uci.edu' });
    });

    it('should parse the path', () => {
      const result = Uri.parse(uri);
      expect(result).toMatchObject({ path: '/pub/ietf/uri/' });
    });

    it('should parse the query', () => {
      const result = Uri.parse(uri);
      expect(result).toMatchObject({ query: 'query1=1&query%202=2%2B3' });
    });

    it('should parse the fragment', () => {
      const result = Uri.parse(uri);
      expect(result).toMatchObject({ fragment: 'Related' });
    });

    it('should parse as query params if only query params given', () => {
      const result = Uri.parse('?foo=1');
      expect(Uri.queryAsMap(result)).toMatchObject({
        foo: '1',
      });
    });
  });

  describe(Uri.isEqual, () => {
    it('should be equal if scheme is the same', () => {
      const a = { scheme: 'https' };
      const b = { scheme: 'https' };
      expect(Uri.isEqual(a, b)).toBe(true);
    });

    it('should be equal if authority is the same', () => {
      const a = { authority: 'www.foo.com' };
      const b = { authority: 'www.foo.com' };
      expect(Uri.isEqual(a, b)).toBe(true);
    });

    it('should be equal if path is the same', () => {
      const a = { path: '/foo/bar' };
      const b = { path: '/foo/bar' };
      expect(Uri.isEqual(a, b)).toBe(true);
    });

    it('should be equal if query is the same, ordering indifferent', () => {
      const a = { query: 'foo=1&bar=2' };
      const b = { query: 'bar=2&foo=1' };
      expect(Uri.isEqual(a, b)).toBe(true);
    });

    it('should be equal if fragment is the same', () => {
      const a = { fragment: 'foo' };
      const b = { fragment: 'foo' };
      expect(Uri.isEqual(a, b));
    });
  });

  describe(Uri.pathAsArray, () => {
    const subject = Uri.parse(uri);

    it('should split the path by /', () => {
      expect(Uri.pathAsArray(subject)).toEqual(['pub', 'ietf', 'uri']);
    });

    it('should be an empty array if path is undefined', () => {
      expect(Uri.pathAsArray({})).toEqual([]);
    });
  });

  describe(Uri.appendPath, () => {
    const subject = Uri.parse(uri);

    it('should add the input path after the current path', () => {
      const result = Uri.appendPath('/foo/bar', subject);
      expect(result.path).toEqual('/pub/ietf/uri/foo/bar');
    });
  });

  describe(Uri.addQueryEntry, () => {
    const subject = Uri.parse(uri);

    it('should add and encode query param', () => {
      const result = Uri.addQueryEntry(['query 3', 'some value'], subject);
      expect(result.query).toEqual(
        'query1=1&query%202=2%2B3&query%203=some%20value'
      );
    });
  });

  describe(Uri.addQueryEntries, () => {
    const subject = Uri.parse(uri);

    it('should add and encode query param', () => {
      const result = Uri.addQueryEntries([['query 3', 'some value']], subject);
      expect(result.query).toEqual(
        'query1=1&query%202=2%2B3&query%203=some%20value'
      );
    });
  });

  describe(Uri.addQueryParams, () => {
    const subject = Uri.parse(uri);

    it('should add each key/value pair', () => {
      const params = { 'query 3': 3, 'query 4': 4 };
      const result = Uri.addQueryParams(params, subject);
      expect(result.query).toEqual(
        'query1=1&query%202=2%2B3&query%203=3&query%204=4'
      );
    });

    it('should not params for null values', () => {
      const params = { 'query 3': 3, 'query 4': undefined };
      const result = Uri.addQueryParams(params, subject);
      expect(result.query).toEqual('query1=1&query%202=2%2B3&query%203=3');
    });
  });

  describe(Uri.addQueryString, () => {
    const subject = Uri.parse(uri);

    it('should append query string', () => {
      const result = Uri.addQueryString('query3=1', subject);
      expect(result.query).toEqual('query1=1&query%202=2%2B3&query3=1');
    });
  });

  describe(Uri.queryAsArray, () => {
    const subject = Uri.parse(uri);

    it('should return an array of entries for each query param', () => {
      const result = Uri.queryAsArray(subject);
      expect(result).toEqual([
        ['query1', '1'],
        ['query 2', '2+3'],
      ]);
    });
  });

  describe(Uri.queryAsMap, () => {
    const subject = Uri.parse(uri);

    it('should return an array of entries for each query param', () => {
      const result = Uri.queryAsMap(subject);
      expect(result).toMatchObject({ query1: '1', 'query 2': '2+3' });
    });
  });

  describe(Uri.toString, () => {
    const subject = Uri.parse(uri);

    it('should decode/encode to/from a string', () => {
      expect(Uri.toString(subject)).toEqual(uri);
    });
  });
});
