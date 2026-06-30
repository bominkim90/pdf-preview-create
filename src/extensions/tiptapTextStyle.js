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

/** 툴바 스타일 적용 대상 (리스트 컨테이너 제외) */
export const BLOCK_STYLE_TARGET_TYPES = [
  'paragraph',
  'heading',
  'listItem',
  'codeBlock',
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

function clearTextStyleAttributeInRange(tr, state, from, to, attributeName) {
  state.doc.nodesBetween(from, to, (node, pos) => {
    if (!node.isText) return;
    node.marks.forEach((mark) => {
      if (mark.type.name !== 'textStyle') return;
      if (mark.attrs[attributeName] == null) return;
      const newAttrs = { ...mark.attrs, [attributeName]: null };
      const remaining = Object.fromEntries(
        Object.entries(newAttrs).filter(([, v]) => v != null && v !== '')
      );
      tr.removeMark(pos, pos + node.nodeSize, mark.type);
      if (Object.keys(remaining).length > 0) {
        tr.addMark(pos, pos + node.nodeSize, mark.type.create(remaining));
      }
    });
  });
}

function createBlockStyleCommands(attributeName, commandPrefix) {
  const setKey = `set${commandPrefix}`;
  const unsetKey = `unset${commandPrefix}`;

  return {
    [setKey]:
      (value) =>
      ({ tr, state, dispatch }) => {
        const { from, to } = state.selection;

        state.doc.nodesBetween(from, to, (node, pos) => {
          if (BLOCK_STYLE_TARGET_TYPES.includes(node.type.name)) {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, [attributeName]: value });
          }
        });

        clearTextStyleAttributeInRange(tr, state, from, to, attributeName);

        if (dispatch) dispatch(tr);
        return true;
      },
    [unsetKey]:
      () =>
      ({ tr, state, dispatch }) => {
        const { from, to } = state.selection;

        state.doc.nodesBetween(from, to, (node, pos) => {
          if (BLOCK_STYLE_TARGET_TYPES.includes(node.type.name)) {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, [attributeName]: null });
          }
        });

        clearTextStyleAttributeInRange(tr, state, from, to, attributeName);

        if (dispatch) dispatch(tr);
        return true;
      },
  };
}

function createBlockStyleAttributeExtension({
  name,
  styleProperty,
  attributeName,
  commandPrefix,
}) {
  const cssProperty = STYLE_CSS_PROPERTY[styleProperty] ?? styleProperty;

  return Extension.create({
    name,
    addOptions() {
      return { types: BLOCK_STYLE_TARGET_TYPES };
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
      return createBlockStyleCommands(attributeName, commandPrefix);
    },
  });
}

export function getActiveStyleAttribute(editor, attributeName) {
  const { $from } = editor.state.selection;
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth);
    if (BLOCK_STYLE_TARGET_TYPES.includes(node.type.name)) {
      const value = node.attrs[attributeName];
      if (value) return value;
    }
  }
  return editor.getAttributes('textStyle')[attributeName] || '';
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

export const FontFamily = createBlockStyleAttributeExtension({
  name: 'fontFamily',
  styleProperty: 'fontFamily',
  attributeName: 'fontFamily',
  commandPrefix: 'FontFamily',
});

export const FontSize = createBlockStyleAttributeExtension({
  name: 'fontSize',
  styleProperty: 'fontSize',
  attributeName: 'fontSize',
  commandPrefix: 'FontSize',
});

export const LineHeight = createBlockStyleAttributeExtension({
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
