import { Extension } from '@tiptap/core';

const STYLE_CSS_PROPERTY = {
  fontFamily: 'font-family',
  fontSize: 'font-size',
  lineHeight: 'line-height',
};

function createTextStyleAttributeExtension({ name, styleProperty, attributeName, commandPrefix }) {
  const cssProperty = STYLE_CSS_PROPERTY[styleProperty] ?? styleProperty;

  return Extension.create({
    name,
    addOptions() {
      return {
        types: ['textStyle'],
      };
    },
    addGlobalAttributes() {
      return [
        {
          types: this.options.types,
          attributes: {
            [attributeName]: {
              default: null,
              parseHTML: (element) =>
                element.style[styleProperty]?.replace(/['"]+/g, '') || null,
              renderHTML: (attributes) => {
                const value = attributes[attributeName];
                if (!value) return {};
                return { style: `${cssProperty}: ${value}` };
              },
            },
          },
        },
      ];
    },
    addCommands() {
      const setKey = `set${commandPrefix}`;
      const unsetKey = `unset${commandPrefix}`;
      return {
        [setKey]:
          (value) =>
          ({ chain, editor }) => {
            const current = editor.getAttributes('textStyle');
            return chain()
              .setMark('textStyle', { ...current, [attributeName]: value })
              .run();
          },
        [unsetKey]:
          () =>
          ({ chain, editor }) => {
            const current = editor.getAttributes('textStyle');
            return chain()
              .setMark('textStyle', { ...current, [attributeName]: null })
              .removeEmptyTextStyle()
              .run();
          },
      };
    },
  });
}

export const FontFamily = createTextStyleAttributeExtension({
  name: 'fontFamily',
  styleProperty: 'fontFamily',
  attributeName: 'fontFamily',
  commandPrefix: 'FontFamily',
});

export const FontSize = createTextStyleAttributeExtension({
  name: 'fontSize',
  styleProperty: 'fontSize',
  attributeName: 'fontSize',
  commandPrefix: 'FontSize',
});

export const LineHeight = createTextStyleAttributeExtension({
  name: 'lineHeight',
  styleProperty: 'lineHeight',
  attributeName: 'lineHeight',
  commandPrefix: 'LineHeight',
});
