import * as Headers from '../httpHeaders';

describe('Headers', () => {
  const headers = { foo: '1', bar: '2' };

  describe('addToXmlHttpRequest()', () => {
    it('should add headers for each entry', () => {
      const request = new XMLHttpRequest();
      const spy = jest.spyOn(request, 'setRequestHeader');

      request.open('GET', 'http://foo.com');
      Headers.addToXmlHttpRequest(request, headers);

      expect(spy).toHaveBeenCalledWith('foo', '1');
      expect(spy).toHaveBeenCalledWith('bar', '2');
    });
  });

  describe('from()', () => {
    it('should create headers from a XMLHttpRequest', () => {
      const request = new XMLHttpRequest();
      const spy = jest.spyOn(request, 'getAllResponseHeaders');
      spy.mockReturnValue('foo: 1\r\nbar: 2\r\n');
      const parsed = Headers.fromXhr(request);
      expect(parsed).toEqual(headers);
    });
  });

  describe('toEntries()', () => {
    it('should convert a map to a list of entries', () => {
      const entries = Headers.toEntries(headers);
      expect(entries).toEqual([
        ['foo', '1'],
        ['bar', '2'],
      ]);
    });
  });
});
