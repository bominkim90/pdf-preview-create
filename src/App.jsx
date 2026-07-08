import DocumentEditorView from './components/editor/DocumentEditorView';
import ErrorBoundary from './components/ErrorBoundary';
import useReportEditor from './hooks/useReportEditor';
import './document.css';
import './pages/AuthPage.css';
import './App.css';

function ReportEditorShell() {
  const editor = useReportEditor();
  return <DocumentEditorView {...editor} />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ReportEditorShell />
    </ErrorBoundary>
  );
}
