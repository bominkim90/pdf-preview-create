import { marked } from 'marked';

marked.setOptions({ breaks: true, gfm: true });

export function toHtml(text) {
  return marked.parse(text);
}
