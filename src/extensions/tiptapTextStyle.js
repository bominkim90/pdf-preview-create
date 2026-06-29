import { Extension, Mark } from '@tiptap/core';
import TextStyle from '@tiptap/extension-text-style';

const STYLE_CSS_PROPERTY = {
  fontFamily: 'font-family',
  fontSize: 'font-size',
  lineHeight: 'line-height',
  color: 'color',
  backgroundColor: 'background-color',
};

const STYLE_JS_PROPERTY = {
  fontFamily: 'fontFamily',
  fontSize: 'fontSize',
  lineHeight: 'lineHeight',
  color: 'color',
  backgroundColor: 'backgroundColor',
};

/** 블록 태그: p, h1–h3, pre(codeBlock), ul/ol, li, blockquote */
export const BLOCK_STYLE_TYPES = [
  'paragraph',
  'heading',
  'listItem',
  'codeBlock',
  'bulletList',
  'orderedList',
  'blockquote',
];

/** 인라인 태그: span, strong, em, code, u, s, small */
export const MARK_STYLE_TYPES = [
  'textStyle',
  'bold',
  'italic',
  'strike',
  'code',
  'underline',
  'small',
];

export const ALL_STYLE_TYPES = [...BLOCK_STYLE_TYPES, ...MARK_STYLE_TYPES];

export function readStyleValue(element, styleProperty) {
  const cssProperty = STYLE_CSS_PROPERTY[styleProperty] ?? styleProperty;
  const jsProperty = STYLE_JS_PROPERTY[styleProperty] ?? styleProperty;

  let value = element.style?.[jsProperty];
  if (!value && element.style?.getPropertyValue) {
    value = element.style.getPropertyValue(cssProperty);
  }
  if (value) {
    const trimmed = String(value).replace(/['"]+/g, '').trim();
    if (trimmed) return trimmed;
  }

  const styleAttr = element.getAttribute('style');
  if (!styleAttr) return null;

  const escaped = cssProperty.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = styleAttr.match(new RegExp(`(?:^|;)\\s*${escaped}\\s*:\\s*([^;]+)`, 'i'));
  return match?.[1]?.trim().replace(/['"]+/g, '') || null;
}

function createStyleAttributeExtension({
  name,
  styleProperty,
  attributeName,
  commandPrefix,
  types = ALL_STYLE_TYPES,
}) {
  const cssProperty = STYLE_CSS_PROPERTY[styleProperty] ?? styleProperty;

  return Extension.create({
    name,
    addOptions() {
      return { types };
    },
    addGlobalAttributes() {
      return [
        {
          types: this.options.types,
          attributes: {
            [attributeName]: {
              default: null,
              parseHTML: (element) => readStyleValue(element, styleProperty),
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

export const ExtendedTextStyle = TextStyle.extend({
  parseHTML() {
    return [
      {
        tag: 'span',
        getAttrs: (element) => (element.hasAttribute('style') ? {} : false),
      },
      {
        tag: 'font',
        getAttrs: (element) => {
          const color = element.getAttribute('color');
          const face = element.getAttribute('face');
          const size = element.getAttribute('size');
          if (!element.hasAttribute('style') && !color && !face && !size) return false;
          return {};
        },
      },
    ];
  },
});

export const Small = Mark.create({
  name: 'small',
  parseHTML: () => [{ tag: 'small' }],
  renderHTML: () => ['small', 0],
});

export const FontFamily = createStyleAttributeExtension({
  name: 'fontFamily',
  styleProperty: 'fontFamily',
  attributeName: 'fontFamily',
  commandPrefix: 'FontFamily',
});

export const FontSize = createStyleAttributeExtension({
  name: 'fontSize',
  styleProperty: 'fontSize',
  attributeName: 'fontSize',
  commandPrefix: 'FontSize',
});

export const LineHeight = createStyleAttributeExtension({
  name: 'lineHeight',
  styleProperty: 'lineHeight',
  attributeName: 'lineHeight',
  commandPrefix: 'LineHeight',
});

export const TextColor = createStyleAttributeExtension({
  name: 'textColor',
  styleProperty: 'color',
  attributeName: 'color',
  commandPrefix: 'Color',
});

export const BackgroundColor = createStyleAttributeExtension({
  name: 'backgroundColor',
  styleProperty: 'backgroundColor',
  attributeName: 'backgroundColor',
  commandPrefix: 'BackgroundColor',
});
