import { Extension } from '@tiptap/core';

function createTextStyleAttributeExtension({ name, styleProperty, attributeName, commandPrefix }) {
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
                return { style: `${styleProperty}: ${value}` };
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
          ({ chain }) =>
            chain().setMark('textStyle', { [attributeName]: value }).run(),
        [unsetKey]:
          () =>
          ({ chain }) =>
            chain()
              .setMark('textStyle', { [attributeName]: null })
              .removeEmptyTextStyle()
              .run(),
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
