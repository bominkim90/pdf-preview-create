import DocumentEditorView from './components/editor/DocumentEditorView';
import useReportEditor from './hooks/useReportEditor';
import './document.css';
import './pages/AuthPage.css';
import './App.css';

export default function App() {
  const editor = useReportEditor();
  return <DocumentEditorView {...editor} />;
}
