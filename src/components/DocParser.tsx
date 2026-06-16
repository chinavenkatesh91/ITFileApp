import React, { useState } from 'react';
import type { TaxInput } from '../utils/taxEngine';
import { parseNaturalLanguageTax, parseDocumentContent, SAMPLE_DOCUMENTS, type ParsedDocumentResult } from '../utils/parserEngine';
import { FileText, Upload, Sparkles, Check, ArrowRight, AlertCircle } from 'lucide-react';

interface DocParserProps {
  onLoadIntoSimulator: (parsedData: Partial<TaxInput>) => void;
}

const loadPdfJs = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    if (window.pdfjsLib) {
      // @ts-ignore
      resolve(window.pdfjsLib);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      if (window.pdfjsLib) {
        // @ts-ignore
        resolve(window.pdfjsLib);
      } else {
        reject(new Error('PDF.js loaded but window.pdfjsLib was not found.'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load PDF.js from CDN.'));
    document.head.appendChild(script);
  });
};

const parsePdfFile = async (file: File): Promise<string> => {
  const pdfjsLib = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();

  // Configure worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    // Join text items
    const pageText = textContent.items
      // @ts-ignore
      .map((item) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }

  return fullText;
};

export const DocParser: React.FC<DocParserProps> = ({ onLoadIntoSimulator }) => {
  const [inputText, setInputText] = useState<string>('');
  const [selectedDocTemplate, setSelectedDocTemplate] = useState<keyof typeof SAMPLE_DOCUMENTS | null>(null);
  
  // Parsing results
  const [parseResult, setParseResult] = useState<Partial<TaxInput> | null>(null);
  const [docResult, setDocResult] = useState<ParsedDocumentResult | null>(null);
  const [parsingMode, setParsingMode] = useState<'text' | 'document'>('text');
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  // Drag and drop / file selection state
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleTextAnalyze = () => {
    if (!inputText.trim()) return;
    const parsed = parseNaturalLanguageTax(inputText);
    setParseResult(parsed);
    setDocResult(null);
  };

  const handleTemplateSelect = (key: keyof typeof SAMPLE_DOCUMENTS) => {
    setSelectedDocTemplate(key);
    setInputText(SAMPLE_DOCUMENTS[key]);
    setUploadedFileName(`${key.toUpperCase()}_Simulated_Report.txt`);
    setParseError(null);
    
    // Parse immediately
    const parsedDoc = parseDocumentContent(`${key}.txt`, SAMPLE_DOCUMENTS[key]);
    setDocResult(parsedDoc);
    setParseResult(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setParseError(null);
    setIsParsing(true);
    
    try {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const content = await parsePdfFile(file);
        setInputText(content);
        const parsedDoc = parseDocumentContent(file.name, content);
        setDocResult(parsedDoc);
        setParseResult(null);
      } else {
        // Read local files
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          setInputText(content);
          const parsedDoc = parseDocumentContent(file.name, content);
          setDocResult(parsedDoc);
          setParseResult(null);
        };
        reader.readAsText(file);
      }
    } catch (err: any) {
      console.error(err);
      setParseError(err.message || 'Failed to extract text from PDF. Make sure the file is not password-protected.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleLoadIntoSimulator = () => {
    const dataToLoad = docResult ? docResult.extractedData : parseResult;
    if (dataToLoad) {
      onLoadIntoSimulator(dataToLoad);
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Selector */}
      <div className="glass-card">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Choose Input Mode</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => {
              setParsingMode('text');
              setInputText('');
              setParseResult(null);
              setDocResult(null);
              setSelectedDocTemplate(null);
              setUploadedFileName('');
              setParseError(null);
            }}
            className={`btn ${parsingMode === 'text' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1 }}
          >
            Natural Language Chat / Text
          </button>
          <button
            onClick={() => {
              setParsingMode('document');
              setInputText('');
              setParseResult(null);
              setDocResult(null);
              setSelectedDocTemplate(null);
              setUploadedFileName('');
              setParseError(null);
            }}
            className={`btn ${parsingMode === 'document' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1 }}
          >
            Document Upload / Form Parser
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Left Side: Input Form */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {parsingMode === 'text' ? (
            <>
              <div className="view-title">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Enter Your Tax Details</h3>
                <p style={{ fontSize: '0.85rem' }}>Describe your income, salary, investments, rents, or stock gains in plain English.</p>
              </div>

              <textarea
                className="nlp-textarea"
                placeholder="e.g., 'I earn 18 LPA salary. I paid rent of 25,000 per month in Mumbai. I also invested 1.5 Lakhs in PPF and 25,000 in health insurance.'"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleTextAnalyze} className="btn btn-primary" style={{ flex: 1 }}>
                  <Sparkles size={16} /> Analyze Declared Income
                </button>
                <button
                  onClick={() => {
                    setInputText('');
                    setParseResult(null);
                  }}
                  className="btn btn-secondary"
                >
                  Clear
                </button>
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Quick Tryouts:
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setInputText("I earn 15 LPA from my salary, pay annual rent of 1.8 Lakhs, and invested 1.5L in 80C PPF.");
                      setParsingMode('text');
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                  >
                    Salaried Employee
                  </button>
                  <button
                    onClick={() => {
                      setInputText("I run a software consultancy business. My gross receipts are 24 Lakhs and my actual expenses are 3 Lakhs. I want to look at presumptive taxation options.");
                      setParsingMode('text');
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                  >
                    Consultant/Business
                  </button>
                  <button
                    onClick={() => {
                      setInputText("I made short term trading profit of 2 Lakhs and long term gain of 1.5 Lakhs. I also have F&O derivative trading profit of 80,000.");
                      setParsingMode('text');
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                  >
                    Stock & Option Trader
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="view-title">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Upload Tax Documents</h3>
                <p style={{ fontSize: '0.85rem' }}>Upload Form 16, Form 26AS, GST portal ledger outputs, or rental receipts.</p>
              </div>

              {parseError && (
                <div className="alert-warning-box" style={{ borderColor: 'var(--danger)', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.08)', marginBottom: '16px' }}>
                  <AlertCircle size={16} className="alert-warning-icon" style={{ color: 'var(--danger)' }} />
                  <div>
                    <p style={{ fontWeight: 600 }}>Parsing Error</p>
                    <p style={{ fontSize: '0.8rem', marginTop: '2px' }}>{parseError}</p>
                  </div>
                </div>
              )}

              <div 
                className="upload-container"
                onClick={() => !isParsing && document.getElementById('file-upload-input')?.click()}
                style={{ opacity: isParsing ? 0.7 : 1, cursor: isParsing ? 'not-allowed' : 'pointer' }}
              >
                {isParsing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0' }}>
                    <div className="spinner" style={{
                      width: '36px',
                      height: '36px',
                      border: '3px solid rgba(255,255,255,0.1)',
                      borderTop: '3px solid var(--color-primary)',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginBottom: '12px'
                    }} />
                    <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      Extracting text from PDF...
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Using client-side PDF parser engine
                    </p>
                  </div>
                ) : (
                  <>
                    <Upload size={36} className="upload-icon" style={{ margin: '0 auto 10px' }} />
                    <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>
                      {uploadedFileName ? `Selected: ${uploadedFileName}` : 'Drag & drop your files here or browse'}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Supports PDF, TXT, CSV, JSON
                    </p>
                  </>
                )}
                <input
                  id="file-upload-input"
                  type="file"
                  style={{ display: 'none' }}
                  accept=".txt,.pdf,.csv,.json"
                  onChange={handleFileUpload}
                  disabled={isParsing}
                />
              </div>

              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '10px' }}>
                  Simulate Document Upload (Quick Templates):
                </h4>
                <div className="sample-docs-grid">
                  <div 
                    onClick={() => handleTemplateSelect('form16')}
                    className={`sample-doc-card ${selectedDocTemplate === 'form16' ? 'active' : ''}`}
                  >
                    <FileText size={20} color="#818cf8" style={{ margin: '0 auto 6px' }} />
                    <h4>Form 16</h4>
                    <p>Salary & TDS</p>
                  </div>
                  <div 
                    onClick={() => handleTemplateSelect('form26as')}
                    className={`sample-doc-card ${selectedDocTemplate === 'form26as' ? 'active' : ''}`}
                  >
                    <FileText size={20} color="#34d399" style={{ margin: '0 auto 6px' }} />
                    <h4>Form 26AS</h4>
                    <p>TDS Statement</p>
                  </div>
                  <div 
                    onClick={() => handleTemplateSelect('gstPortal')}
                    className={`sample-doc-card ${selectedDocTemplate === 'gstPortal' ? 'active' : ''}`}
                  >
                    <FileText size={20} color="#fbbf24" style={{ margin: '0 auto 6px' }} />
                    <h4>GST Portal</h4>
                    <p>Outward & ITC</p>
                  </div>
                  <div 
                    onClick={() => handleTemplateSelect('rentalReceipt')}
                    className={`sample-doc-card ${selectedDocTemplate === 'rentalReceipt' ? 'active' : ''}`}
                  >
                    <FileText size={20} color="#f87171" style={{ margin: '0 auto 6px' }} />
                    <h4>Rent Receipt</h4>
                    <p>HRA & Property</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Raw Input Content display for doc templates */}
          {inputText && parsingMode === 'document' && (
            <div style={{ marginTop: '10px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                RAW FILE CONTENT VIEW
              </label>
              <pre style={{ 
                background: 'rgba(8, 12, 20, 0.6)', 
                border: '1px solid var(--border-color)', 
                borderRadius: '8px', 
                padding: '12px', 
                fontFamily: 'monospace', 
                fontSize: '0.75rem', 
                overflowX: 'auto',
                maxHeight: '160px',
                color: 'var(--text-secondary)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxWidth: '100%'
              }}>
                {inputText}
              </pre>
            </div>
          )}
        </div>

        {/* Right Side: Parsing Output Results */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Extracted Entities</h3>
          
          {!(parseResult || docResult) ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <AlertCircle size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
              <p style={{ fontSize: '0.9rem' }}>No data parsed yet.</p>
              <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                {parsingMode === 'text' 
                  ? 'Enter text on the left and click "Analyze Declared Income".'
                  : 'Select a document template or upload a file on the left.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Header Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="sector-tag" style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--color-primary)',
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }}>
                    {docResult ? docResult.documentType : 'Natural Language Statement'}
                  </span>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Detected Sector:{' '}
                    <strong style={{ textTransform: 'capitalize' }}>
                      {docResult ? docResult.detectedCategory : parseResult?.sector || 'Unknown'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Extracted Metadata Card */}
              {docResult && (docResult.employeeName || docResult.pan || docResult.assessmentYear) && (
                <div style={{ 
                  background: 'rgba(99, 102, 241, 0.05)', 
                  border: '1px solid rgba(99, 102, 241, 0.2)', 
                  borderRadius: '8px', 
                  padding: '12px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                    Document Metadata
                  </div>
                  {docResult.employeeName && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Assessee Name:</span>
                      <strong style={{ color: 'var(--text-primary)', textAlign: 'right' }}>{docResult.employeeName}</strong>
                    </div>
                  )}
                  {docResult.pan && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>PAN:</span>
                      <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{docResult.pan}</strong>
                    </div>
                  )}
                  {docResult.assessmentYear && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Assessment Year:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{docResult.assessmentYear}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Parsed Variables List */}
              <div style={{ background: 'rgba(8, 12, 20, 0.4)', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-color)', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  EXTRACTED VARIABLES
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {(() => {
                    const data = docResult ? docResult.extractedData : parseResult;
                    if (!data) return null;
                    const items = Object.entries(data).filter(([k]) => k !== 'sector');
                    
                    if (items.length === 0) {
                      return (
                        <div style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                          No numeric tax variables were detected. Try typing specific amounts (e.g. "I earn 12 Lakhs").
                        </div>
                      );
                    }
                    
                    return items.map(([key, val]) => {
                      if (typeof val === 'number') {
                        return (
                          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.85rem' }}>
                            <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{key}</span>
                            <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                              ₹{val.toLocaleString('en-IN')}
                            </span>
                          </div>
                        );
                      }
                      if (typeof val === 'boolean') {
                        return (
                          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.85rem' }}>
                            <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{key}</span>
                            <span style={{ fontWeight: 600, color: '#3b82f6' }}>{val ? 'TRUE' : 'FALSE'}</span>
                          </div>
                        );
                      }
                      return null;
                    });
                  })()}
                </div>
              </div>

              {/* Action Load Button */}
              <button onClick={handleLoadIntoSimulator} className="btn btn-primary" style={{ width: '100%' }}>
                {copiedSuccess ? (
                  <>
                    <Check size={16} /> Data Loaded Successfully!
                  </>
                ) : (
                  <>
                    Load into Tax Simulator <ArrowRight size={16} />
                  </>
                )}
              </button>
              
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4 }}>
                * Loading will transfer all extracted assets directly into the simulator dashboard, where you can modify details manually and evaluate Old vs New Tax Regimes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
