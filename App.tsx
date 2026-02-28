import React, { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import { FileUploader } from './components/FileUploader';
import { AnalysisResult } from './components/AnalysisResult';
import { ChatInterface } from './components/ChatInterface';
import { Icons } from './components/ui/Icons';
import { AppState, DocumentAnalysis, UploadedFile } from './types';
import { analyzeDocument } from './services/aiService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFullImage, setShowFullImage] = useState(false);

  // Helper: Process different file types
  const processFile = async (file: File) => {
    setState(AppState.ANALYZING);
    setError(null);
    setUploadedFile(null); // Clear previous

    try {
      let resultFile: UploadedFile;

      // 1. Handle Images and PDFs (Base64)
      if (file.type.startsWith('image/')) {
        const base64Data = await readFileAsBase64(file);
        resultFile = {
          file,
          mimeType: file.type,
          base64: base64Data,
          previewUrl: URL.createObjectURL(file) 
        };
      } 
      // Handle PDF specifically - extract base64 for analysis but avoid iframe preview to prevent browser blocks
      else if (file.type === 'application/pdf') {
        const base64Data = await readFileAsBase64(file);
        resultFile = {
          file,
          mimeType: file.type,
          base64: base64Data,
          previewUrl: URL.createObjectURL(file)
        };
      }
      // 2. Handle DOCX (Extract Text using Mammoth)
      else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const { value: extractedText } = await mammoth.extractRawText({ arrayBuffer });
        resultFile = {
          file,
          mimeType: file.type,
          textContent: extractedText,
          // No preview URL for docx, we will show icon
        };
      }
      // 3. Handle Text/HTML/RTF (Read as Text)
      else if (
          file.type === 'text/plain' || 
          file.type === 'text/html' || 
          file.type === 'application/rtf' || 
          file.type.includes('text') ||
          file.name.endsWith('.txt') ||
          file.name.endsWith('.md')
        ) {
        const text = await readFileAsText(file);
        resultFile = {
          file,
          mimeType: file.type || 'text/plain',
          textContent: text
        };
      }
      // 4. Fallback for others (Try reading as text, might be garbage)
      else {
         // Attempt text read as fallback
         try {
           const text = await readFileAsText(file);
           resultFile = {
             file,
             mimeType: file.type || 'application/octet-stream',
             textContent: text
           };
         } catch (e) {
           throw new Error("Unsupported file format for browser analysis.");
         }
      }

      setUploadedFile(resultFile);

      // Perform Analysis
      const analysisResult = await analyzeDocument({
        base64: resultFile.base64,
        textContent: resultFile.textContent,
        mimeType: resultFile.mimeType
      });

      setAnalysis(analysisResult);
      setState(AppState.VIEWING);

    } catch (err: any) {
      console.error(err);
      const errorMessage = err?.message || "Unknown error";
      setError(`Analysis failed: ${errorMessage}. Please try a supported format (PDF, DOCX, TXT, Images).`);
      setState(AppState.ERROR);
    }
  };

  // File Reading Helpers
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        resolve(res.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleReset = () => {
    setState(AppState.IDLE);
    setUploadedFile(null);
    setAnalysis(null);
    setError(null);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="flex-none bg-white border-b border-slate-200 px-6 py-4 z-10 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
             <Icons.Scan className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
            DocuLens
          </h1>
        </div>
        <div>
           {uploadedFile && (
             <button 
                onClick={handleReset}
                className="text-sm font-medium text-slate-500 hover:text-red-500 transition-colors flex items-center gap-1"
             >
               <Icons.Close className="w-4 h-4" />
               Reset
             </button>
           )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {state === AppState.IDLE && (
          <div className="h-full flex flex-col items-center justify-center p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="max-w-md w-full space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-slate-800">Analyze Documents Instantly</h2>
                <p className="text-slate-500">Upload PDF, DOCX, TXT, or Images to extract insights, data, and chat with your content.</p>
              </div>
              <FileUploader onFileSelect={processFile} />
              
              <div className="pt-8 grid grid-cols-3 gap-4 text-center">
                 <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <Icons.File className="w-6 h-6 mx-auto mb-2 text-indigo-500" />
                    <span className="text-xs font-semibold text-slate-600">Extract Data</span>
                 </div>
                 <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <Icons.Scan className="w-6 h-6 mx-auto mb-2 text-violet-500" />
                    <span className="text-xs font-semibold text-slate-600">Summarize</span>
                 </div>
                 <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <Icons.Chat className="w-6 h-6 mx-auto mb-2 text-fuchsia-500" />
                    <span className="text-xs font-semibold text-slate-600">Q&A</span>
                 </div>
              </div>
            </div>
          </div>
        )}

        {state === AppState.ANALYZING && (
          <div className="h-full flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
             <div className="relative">
                <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                <div className="relative bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center max-w-sm w-full">
                  <Icons.Spinner className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">Analyzing Document</h3>
                  <p className="text-sm text-slate-500">DocuLens is processing your file...</p>
                </div>
             </div>
          </div>
        )}

        {state === AppState.ERROR && (
           <div className="h-full flex flex-col items-center justify-center p-6">
             <div className="bg-red-50 p-8 rounded-2xl border border-red-100 text-center max-w-sm">
               <Icons.Alert className="w-10 h-10 text-red-500 mx-auto mb-4" />
               <h3 className="text-lg font-semibold text-red-800 mb-2">Analysis Failed</h3>
               <p className="text-sm text-red-600 mb-6">{error}</p>
               <button 
                 onClick={handleReset}
                 className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
               >
                 Try Again
               </button>
             </div>
           </div>
        )}

        {state === AppState.VIEWING && uploadedFile && analysis && (
          <div className="h-full flex flex-col lg:flex-row overflow-hidden">
            {/* Left Panel: Document Preview */}
            <div className={`
               lg:w-1/2 flex flex-col bg-slate-100 border-r border-slate-200 relative transition-all duration-300
               ${showFullImage ? 'fixed inset-0 z-50 w-full' : 'h-1/2 lg:h-full'}
            `}>
               <div className="absolute top-4 right-4 z-10 flex gap-2">
                 <button 
                   onClick={() => setShowFullImage(!showFullImage)}
                   className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg backdrop-blur-sm transition-colors"
                   title={showFullImage ? "Minimize" : "Maximize"}
                 >
                   {showFullImage ? <Icons.Minimize className="w-5 h-5" /> : <Icons.Maximize className="w-5 h-5" />}
                 </button>
               </div>
               <div className="flex-1 overflow-auto flex items-center justify-center p-8">
                 {uploadedFile.mimeType.startsWith('image/') ? (
                    <img 
                      src={uploadedFile.previewUrl} 
                      alt="Document Preview" 
                      className="max-w-full max-h-full object-contain shadow-2xl rounded-lg ring-1 ring-black/5"
                    />
                 ) : (
                    <div className="flex flex-col items-center text-slate-400">
                      <Icons.GenericFile className="w-24 h-24 mb-4 opacity-50 text-indigo-400" />
                      <p className="text-lg font-medium text-slate-600 mb-1">{uploadedFile.file.name}</p>
                      <p className="text-sm text-slate-400 mb-4">{uploadedFile.file.type || 'Unknown Type'}</p>
                      
                      {uploadedFile.mimeType === 'application/pdf' && uploadedFile.previewUrl && (
                        <a 
                          href={uploadedFile.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
                        >
                          <Icons.Scan className="w-4 h-4" />
                          Open PDF in New Tab
                        </a>
                      )}
                      
                      {uploadedFile.mimeType !== 'application/pdf' && (
                         <p className="text-xs text-slate-400">Preview not available for this format</p>
                      )}
                    </div>
                 )}
               </div>
            </div>

            {/* Right Panel: Analysis & Chat */}
            <div className={`
              lg:w-1/2 flex flex-col bg-slate-50 h-1/2 lg:h-full overflow-hidden
              ${showFullImage ? 'hidden' : ''}
            `}>
              <div className="flex-1 p-4 lg:p-6 overflow-hidden flex flex-col gap-4 lg:gap-6">
                
                {/* Top Half of Right Panel: Analysis */}
                <div className="flex-1 min-h-0">
                   <AnalysisResult data={analysis} />
                </div>

                {/* Bottom Half of Right Panel: Chat */}
                <div className="flex-1 min-h-0">
                   <ChatInterface uploadedFile={uploadedFile} />
                </div>

              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;