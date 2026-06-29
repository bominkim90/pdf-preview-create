import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import {
  BackgroundColor,
  ExtendedTextStyle,
  FontFamily,
  FontSize,
  LineHeight,
  Small,
  TextColor,
} from '../extensions/tiptapTextStyle';
import { useEffect, useRef, useState } from 'react';
import './RichEditor.css';

const FONT_OPTIONS = [
  { label: '기본', value: '' },
  { label: '맑은 고딕', value: "'Malgun Gothic', sans-serif" },
  { label: 'Noto Sans KR', value: "'Noto Sans KR', sans-serif" },
  { label: '나눔고딕', value: "'Nanum Gothic', sans-serif" },
  { label: 'Noto Serif KR', value: "'Noto Serif KR', serif" },
  { label: '나눔명조', value: "'Nanum Myeongjo', serif" },
  { label: '바탕', value: "'Batang', serif" },
  { label: 'Chiron Sung HK', value: "'Chiron Sung HK', serif" },
];

function normalizeFontValue(fontAttr) {
  if (!fontAttr) return '';
  const normalized = fontAttr.replace(/['"]/g, '').toLowerCase();
  const matched = FONT_OPTIONS.find(
    (opt) => opt.value && opt.value.replace(/['"]/g, '').toLowerCase() === normalized
  );
  return matched?.value ?? '';
}

const FONT_SIZE_OPTIONS = [
  { label: '크기', value: '' },
  { label: '9pt', value: '9pt' },
  { label: '10pt', value: '10pt' },
  { label: '10.5pt', value: '10.5pt' },
  { label: '11pt', value: '11pt' },
  { label: '12pt', value: '12pt' },
  { label: '13pt', value: '13pt' },
  { label: '15pt', value: '15pt' },
];

const FONT_SIZE_DEFAULT = '10pt';
const FONT_SIZE_MIN_PT = 8;
const FONT_SIZE_STEP_PT = 0.5;

const LINE_HEIGHT_OPTIONS = [
  { label: '줄간격', value: '' },
  { label: '1.6', value: '1.6' },
  { label: '1.8', value: '1.8' },
  { label: '2.0', value: '2.0' },
  { label: '2.2', value: '2.2' },
];

const LINE_HEIGHT_DEFAULT = '1.8';
const LINE_HEIGHT_MIN = 1;
const LINE_HEIGHT_STEP = 0.1;

function parseFontSizePt(value) {
  if (!value) return parseFloat(FONT_SIZE_DEFAULT);
  const match = String(value).match(/^([\d.]+)\s*pt$/i);
  return match ? parseFloat(match[1]) : parseFloat(FONT_SIZE_DEFAULT);
}

function formatFontSizePt(pt) {
  const rounded = Math.round(pt * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}pt` : `${rounded}pt`;
}

function parseLineHeight(value) {
  if (!value) return parseFloat(LINE_HEIGHT_DEFAULT);
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : parseFloat(LINE_HEIGHT_DEFAULT);
}

function formatLineHeight(lh) {
  return String(Math.round(lh * 10) / 10);
}

function stepFontSizeByDelta(current, delta) {
  const nextPt = Math.round((parseFontSizePt(current) + delta * FONT_SIZE_STEP_PT) * 10) / 10;
  if (nextPt < FONT_SIZE_MIN_PT) return null;
  return formatFontSizePt(nextPt);
}

function stepLineHeightByDelta(current, delta) {
  const next = Math.round((parseLineHeight(current) + delta * LINE_HEIGHT_STEP) * 10) / 10;
  if (next < LINE_HEIGHT_MIN) return null;
  return formatLineHeight(next);
}

function withCurrentSelectOption(options, current) {
  if (!current || options.some((o) => o.value === current)) return options;
  return [options[0], { label: current, value: current }, ...options.slice(1)];
}

function cssColorToHex(color) {
  if (!color) return null;
  const trimmed = color.trim();
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed;
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    const [, r, g, b] = trimmed.match(/^#(.)(.)(.)$/i);
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  const rgb = trimmed.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) {
    const hex = [rgb[1], rgb[2], rgb[3]]
      .map((n) => Number(n).toString(16).padStart(2, '0'))
      .join('');
    return `#${hex}`;
  }
  return null;
}

const ToolbarBtn = ({ onClick, active, disabled, title, children }) => (
  <button
    type="button"
    onMouseDown={(e) => {
      e.preventDefault();
      onClick();
    }}
    className={`re-btn${active ? ' active' : ''}${disabled ? ' disabled' : ''}`}
    title={title}
    disabled={disabled}
  >
    {children}
  </button>
);

const ToolbarSelect = ({ value, onChange, onPointerDown, title, options }) => (
  <select
    className="re-select"
    value={value}
    title={title}
    onPointerDown={onPointerDown}
    onChange={(e) => onChange(e.target.value)}
  >
    {options.map((opt) => (
      <option key={opt.label} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

const Divider = () => <span className="re-divider" />;

const ToolbarStepper = ({ onDecrease, onIncrease, canDecrease, decreaseTitle, increaseTitle, children }) => (
  <div className="re-stepper">
    <ToolbarBtn onClick={onDecrease} disabled={!canDecrease} title={decreaseTitle}>
      −
    </ToolbarBtn>
    {children}
    <ToolbarBtn onClick={onIncrease} title={increaseTitle}>
      +
    </ToolbarBtn>
  </div>
);

const ToolbarColor = ({ value, onChange, onPointerDown, title, fallback }) => (
  <label className="re-color-wrap" title={title}>
    <input
      type="color"
      className="re-color-input"
      value={cssColorToHex(value) || fallback}
      onPointerDown={onPointerDown}
      onChange={(e) => onChange(e.target.value)}
    />
    <span className="re-color-swatch" style={{ background: value || fallback }} aria-hidden />
  </label>
);

export default function RichEditor({ value, onChange, placeholder, readOnly = false }) {
  const isExternalUpdate = useRef(false);
  const savedSelection = useRef(null);
  const [, setToolbarTick] = useState(0);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [htmlSource, setHtmlSource] = useState('');

  const editor = useEditor({
    editable: !readOnly,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Small,
      ExtendedTextStyle.configure({ mergeNestedSpanStyles: true }),
      FontFamily,
      FontSize,
      LineHeight,
      TextColor,
      BackgroundColor,
      TextAlign.configure({
        types: ['heading', 'paragraph', 'listItem', 'codeBlock', 'blockquote'],
      }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      if (!isExternalUpdate.current) {
        onChange(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class: 're-content',
        'data-placeholder':
          placeholder || '본문을 직접 입력하거나, 파일을 첨부하여 AI로 생성하세요.',
      },
    },
  });

  useEffect(() => {
    if (!editor || isHtmlMode) return;
    if (editor.isFocused) return;

    const current = editor.getHTML();
    if (value !== current) {
      isExternalUpdate.current = true;
      editor.commands.setContent(value || '', false);
      isExternalUpdate.current = false;
    }
  }, [value, editor, isHtmlMode]);

  useEffect(() => {
    if (!isHtmlMode) return;
    setHtmlSource((prev) => (value !== prev ? value || '' : prev));
  }, [value, isHtmlMode]);

  useEffect(() => {
    if (!editor) return;
    const refreshToolbar = () => setToolbarTick((n) => n + 1);
    editor.on('selectionUpdate', refreshToolbar);
    editor.on('transaction', refreshToolbar);
    return () => {
      editor.off('selectionUpdate', refreshToolbar);
      editor.off('transaction', refreshToolbar);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readOnly && !isHtmlMode);
  }, [editor, readOnly, isHtmlMode]);

  if (!editor) return null;

  const textStyle = editor.getAttributes('textStyle');
  const currentFont = normalizeFontValue(textStyle.fontFamily);
  const currentSize = textStyle.fontSize || '';
  const currentLineHeight = textStyle.lineHeight || '';
  const currentColor = textStyle.color || '';
  const currentBackgroundColor = textStyle.backgroundColor || '';

  const saveSelection = () => {
    const { from, to } = editor.state.selection;
    savedSelection.current = { from, to };
  };

  const applyWithSavedSelection = (apply) => {
    let chain = editor.chain().focus();
    const saved = savedSelection.current;
    if (saved && saved.from !== saved.to) {
      chain = chain.setTextSelection({ from: saved.from, to: saved.to });
    }
    apply(chain).run();
    savedSelection.current = null;
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const handleFontFamily = (val) => {
    applyWithSavedSelection((chain) => {
      if (!val) return chain.unsetFontFamily();
      return chain.setFontFamily(val);
    });
  };

  const handleFontSize = (val) => {
    applyWithSavedSelection((chain) => {
      if (!val) return chain.unsetFontSize();
      return chain.setFontSize(val);
    });
  };

  const handleLineHeight = (val) => {
    applyWithSavedSelection((chain) => {
      if (!val) return chain.unsetLineHeight();
      return chain.setLineHeight(val);
    });
  };

  const handleTextColor = (val) => {
    applyWithSavedSelection((chain) => {
      if (!val) return chain.unsetColor();
      return chain.setColor(val);
    });
  };

  const handleBackgroundColor = (val) => {
    applyWithSavedSelection((chain) => {
      if (!val) return chain.unsetBackgroundColor();
      return chain.setBackgroundColor(val);
    });
  };

  const fontSizePt = parseFontSizePt(currentSize);
  const lineHeightNum = parseLineHeight(currentLineHeight);
  const canDecreaseFontSize = fontSizePt > FONT_SIZE_MIN_PT + 0.001;
  const canDecreaseLineHeight = lineHeightNum > LINE_HEIGHT_MIN + 0.001;

  const stepFontSize = (delta) => {
    const next = stepFontSizeByDelta(currentSize, delta);
    if (next) handleFontSize(next);
  };

  const stepLineHeight = (delta) => {
    const next = stepLineHeightByDelta(currentLineHeight, delta);
    if (next) handleLineHeight(next);
  };

  const fontSizeSelectOptions = withCurrentSelectOption(FONT_SIZE_OPTIONS, currentSize);
  const lineHeightSelectOptions = withCurrentSelectOption(LINE_HEIGHT_OPTIONS, currentLineHeight);

  const clearFormatting = () => {
    editor
      .chain()
      .focus()
      .unsetFontFamily()
      .unsetFontSize()
      .unsetLineHeight()
      .unsetColor()
      .unsetBackgroundColor()
      .clearNodes()
      .unsetAllMarks()
      .run();
  };

  const switchToDesignMode = () => {
    if (!isHtmlMode) return;
    const nextHtml = htmlSource || '';
    isExternalUpdate.current = true;
    editor.commands.setContent(nextHtml, false);
    isExternalUpdate.current = false;
    onChange(editor.getHTML());
    setIsHtmlMode(false);
  };

  const switchToHtmlMode = () => {
    if (isHtmlMode) return;
    setHtmlSource(editor.getHTML());
    setIsHtmlMode(true);
  };

  const handleHtmlSourceChange = (e) => {
    const next = e.target.value;
    setHtmlSource(next);
    onChange(next);
  };

  return (
    <div className="rich-editor">
      {!readOnly && !isHtmlMode && (
      <div className="re-toolbar">
        <ToolbarBtn
          onClick={() => editor.chain().focus().undo().run()}
          title="실행 취소 (Ctrl+Z)"
          disabled={!editor.can().undo()}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 14 4 9l5-5" />
            <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
          </svg>
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().redo().run()}
          title="다시 실행 (Ctrl+Y)"
          disabled={!editor.can().redo()}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="m15 14 5-5-5-5" />
            <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
          </svg>
        </ToolbarBtn>

        <Divider />

        {[1, 2, 3].map((level) => (
          <ToolbarBtn
            key={level}
            onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
            active={editor.isActive('heading', { level })}
            title={`제목 ${level}`}
          >
            H{level}
          </ToolbarBtn>
        ))}

        <Divider />

        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="굵게 (Ctrl+B)"
        >
          <strong>B</strong>
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="기울임 (Ctrl+I)"
        >
          <em>I</em>
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="밑줄 (Ctrl+U)"
        >
          <span style={{ textDecoration: 'underline' }}>U</span>
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="취소선"
        >
          <span style={{ textDecoration: 'line-through' }}>S</span>
        </ToolbarBtn>

        <Divider />

        <ToolbarSelect
          value={currentFont}
          onChange={handleFontFamily}
          onPointerDown={saveSelection}
          title="글꼴"
          options={FONT_OPTIONS}
        />
        <ToolbarStepper
          onDecrease={() => stepFontSize(-1)}
          onIncrease={() => stepFontSize(1)}
          canDecrease={canDecreaseFontSize}
          decreaseTitle="글자 크기 줄이기"
          increaseTitle="글자 크기 키우기"
        >
          <ToolbarSelect
            value={currentSize}
            onChange={handleFontSize}
            onPointerDown={saveSelection}
            title="글자 크기"
            options={fontSizeSelectOptions}
          />
        </ToolbarStepper>
        <ToolbarStepper
          onDecrease={() => stepLineHeight(-1)}
          onIncrease={() => stepLineHeight(1)}
          canDecrease={canDecreaseLineHeight}
          decreaseTitle="줄간격 줄이기"
          increaseTitle="줄간격 넓히기"
        >
          <ToolbarSelect
            value={currentLineHeight}
            onChange={handleLineHeight}
            onPointerDown={saveSelection}
            title="줄간격"
            options={lineHeightSelectOptions}
          />
        </ToolbarStepper>

        <Divider />

        <span className="re-color-group">
          <ToolbarColor
            value={currentColor}
            onChange={handleTextColor}
            onPointerDown={saveSelection}
            title="글자색"
            fallback="#111827"
          />
          <ToolbarBtn
            onClick={() => handleTextColor('')}
            disabled={!currentColor}
            title="글자색 제거"
          >
            A̸
          </ToolbarBtn>
        </span>
        <span className="re-color-group">
          <ToolbarColor
            value={currentBackgroundColor}
            onChange={handleBackgroundColor}
            onPointerDown={saveSelection}
            title="배경색"
            fallback="#fef08a"
          />
          <ToolbarBtn
            onClick={() => handleBackgroundColor('')}
            disabled={!currentBackgroundColor}
            title="배경색 제거"
          >
            ▢̸
          </ToolbarBtn>
        </span>

        <Divider />

        <ToolbarBtn
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          title="왼쪽 정렬"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="15" y2="12" />
            <line x1="3" y1="18" x2="18" y2="18" />
          </svg>
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          title="가운데 정렬"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="6" y1="12" x2="18" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          title="오른쪽 정렬"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="9" y1="12" x2="21" y2="12" />
            <line x1="6" y1="18" x2="21" y2="18" />
          </svg>
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="글머리 목록"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="9" y1="6" x2="20" y2="6" />
            <line x1="9" y1="12" x2="20" y2="12" />
            <line x1="9" y1="18" x2="20" y2="18" />
            <circle cx="4" cy="6" r="1.5" fill="currentColor" />
            <circle cx="4" cy="12" r="1.5" fill="currentColor" />
            <circle cx="4" cy="18" r="1.5" fill="currentColor" />
          </svg>
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="번호 목록"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="10" y1="6" x2="21" y2="6" />
            <line x1="10" y1="12" x2="21" y2="12" />
            <line x1="10" y1="18" x2="21" y2="18" />
            <path d="M4 6h1v4" />
            <path d="M4 10h2" />
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
          </svg>
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={insertTable} title="표 삽입">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="1" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="15" x2="21" y2="15" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
          </svg>
        </ToolbarBtn>

        {editor.isActive('table') && (
          <>
            <ToolbarBtn
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              title="열 추가"
            >
              열+
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().addRowAfter().run()} title="행 추가">
              행+
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().deleteColumn().run()} title="열 삭제">
              열-
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().deleteRow().run()} title="행 삭제">
              행-
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().deleteTable().run()} title="표 삭제">
              표✕
            </ToolbarBtn>
          </>
        )}

        <Divider />

        <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="구분선">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
          </svg>
        </ToolbarBtn>

        <ToolbarBtn onClick={clearFormatting} title="서식 지우기">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" />
            <line x1="18" y1="9" x2="12" y2="15" />
            <line x1="12" y1="9" x2="18" y2="15" />
          </svg>
        </ToolbarBtn>
      </div>
      )}

      <div className="re-body">
        <textarea
          className={`re-html-source${isHtmlMode ? '' : ' re-html-source--hidden'}`}
          value={htmlSource}
          onChange={handleHtmlSourceChange}
          spellCheck={false}
          aria-hidden={!isHtmlMode}
          tabIndex={isHtmlMode ? 0 : -1}
          aria-label="HTML 소스 편집"
        />
        <EditorContent
          editor={editor}
          className={`re-editor-wrap${isHtmlMode ? ' re-editor-wrap--hidden' : ''}`}
        />
      </div>

      {!readOnly && (
        <div className="re-mode-footer" role="tablist" aria-label="작성 모드">
          <button
            type="button"
            role="tab"
            aria-selected={!isHtmlMode}
            className={`re-mode-tab${!isHtmlMode ? ' active' : ''}`}
            onClick={switchToDesignMode}
          >
            디자인
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isHtmlMode}
            className={`re-mode-tab${isHtmlMode ? ' active' : ''}`}
            onClick={switchToHtmlMode}
          >
            HTML
          </button>
        </div>
      )}
    </div>
  );
}
