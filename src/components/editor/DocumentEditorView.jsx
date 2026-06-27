import AppHeader from '../AppHeader';
import BodyMeasureRoot from './BodyMeasureRoot';
import EditorBanners from './EditorBanners';
import EditorFormPanel from './EditorFormPanel';
import EditorPreviewPanel from './EditorPreviewPanel';

export default function DocumentEditorView({
  profile,
  data,
  setData,
  documentId,
  isLoadingDoc,
  loadError,
  isGuestMode,
  isReadOnlyView,
  isRiskGuide,
  isExporting,
  isDeleting,
  isMobile,
  mobileView,
  setMobileView,
  previewScrollRef,
  previewActive,
  measureRef,
  fileInputRef,
  bodyChunks,
  attachedFile,
  aiError,
  isGenerating,
  set,
  handleCopyAsNewDocument,
  handleLogout,
  handleExportPDF,
  handleDeleteDocument,
  handleTemplateChange,
  handleLoadRiskExample,
  handleClearRiskContent,
  handleFileChange,
  handleRemoveFile,
  handleGenerateAI,
}) {
  return (
    <div className="app-layout">
      <BodyMeasureRoot measureRef={measureRef} bodyHtml={data.body} />

      <AppHeader
        documentId={documentId}
        isGuestMode={isGuestMode}
        isReadOnlyView={isReadOnlyView}
        isRiskGuide={isRiskGuide}
        profile={profile}
        isExporting={isExporting}
        isDeleting={isDeleting}
        onExportPDF={handleExportPDF}
        onLogout={handleLogout}
        onLoadRiskExample={handleLoadRiskExample}
        onClearRiskContent={handleClearRiskContent}
        onDeleteDocument={handleDeleteDocument}
      />

      <EditorBanners
        isGuestMode={isGuestMode}
        isLoadingDoc={isLoadingDoc}
        loadError={loadError}
        isReadOnlyView={isReadOnlyView}
        onCopyAsNewDocument={handleCopyAsNewDocument}
      />

      <div className="app-body">
        <EditorFormPanel
          data={data}
          setData={setData}
          set={set}
          isReadOnlyView={isReadOnlyView}
          isRiskGuide={isRiskGuide}
          isMobile={isMobile}
          mobileView={mobileView}
          setMobileView={setMobileView}
          attachedFile={attachedFile}
          fileInputRef={fileInputRef}
          aiError={aiError}
          isGenerating={isGenerating}
          onFileChange={handleFileChange}
          onRemoveFile={handleRemoveFile}
          onGenerateAI={handleGenerateAI}
          onTemplateChange={handleTemplateChange}
        />

        <EditorPreviewPanel
          isMobile={isMobile}
          mobileView={mobileView}
          setMobileView={setMobileView}
          previewScrollRef={previewScrollRef}
          previewActive={previewActive}
          isExporting={isExporting}
          onExportPDF={handleExportPDF}
          templateId={data.templateId}
          data={data}
          bodyChunks={bodyChunks}
        />
      </div>
    </div>
  );
}
