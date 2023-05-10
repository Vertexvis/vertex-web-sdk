import { parseCssColorValue } from '../dom';

function createMockStyles(): CSSStyleDeclaration {
  return {
    getPropertyValue: jest.fn(() => ''),
  } as unknown as CSSStyleDeclaration;
}

describe('DOM utils', () => {
  describe(parseCssColorValue, () => {
    it('parses values with double quotes', async () => {
      const styles = createMockStyles();

      (styles.getPropertyValue as jest.Mock).mockImplementation(
        () => '"#ff0000"'
      );

      expect(parseCssColorValue(styles, '--property')).toBe('#ff0000');
    });

    it('parses values with single quotes', async () => {
      const styles = createMockStyles();

      (styles.getPropertyValue as jest.Mock).mockImplementation(
        () => "'#ff0000'"
      );

      expect(parseCssColorValue(styles, '--property')).toBe('#ff0000');
    });
  });
});
