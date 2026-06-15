import { useState } from 'react';
import { type TaxInput, initialTaxInput, compareRegimes } from './utils/taxEngine';
import { DocParser } from './components/DocParser';
import { TaxSimulator } from './components/TaxSimulator';
import { TaxOptimizer } from './components/TaxOptimizer';
import { CalculatorsSuite } from './components/Calculators';
import { FileText, Sparkles, Sliders, Calculator, RefreshCw } from 'lucide-react';

function App() {
  const [activeView, setActiveView] = useState<'parser' | 'simulator' | 'calculators'>('parser');
  const [taxInput, setTaxInput] = useState<TaxInput>(initialTaxInput);

  // Compute regime comparison reactively
  const comparison = compareRegimes(taxInput);

  const handleUpdateInput = (updatedFields: Partial<TaxInput>) => {
    setTaxInput((prev) => ({
      ...prev,
      ...updatedFields,
    }));
  };

  const handleLoadFromParser = (parsedData: Partial<TaxInput>) => {
    // Keep age and merge new fields
    setTaxInput((prev) => ({
      ...prev,
      ...parsedData,
    }));
    // Redirect to simulator
    setActiveView('simulator');
  };

  const handleReset = () => {
    setTaxInput(initialTaxInput);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand">
          <Sliders className="brand-icon" size={24} />
          <span>TaxVantage</span>
          <span style={{ fontSize: '0.75rem', background: 'var(--color-primary-glow)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '10px', marginLeft: '10px', border: '1px solid rgba(16,185,129,0.2)' }}>
            AY 2026-27
          </span>
        </div>
        
        <nav className="nav-links">
          <button
            onClick={() => setActiveView('parser')}
            className={`nav-tab ${activeView === 'parser' ? 'active' : ''}`}
          >
            <FileText size={16} />
            Document & NL Parser
          </button>
          <button
            onClick={() => setActiveView('simulator')}
            className={`nav-tab ${activeView === 'simulator' ? 'active' : ''}`}
          >
            <Sparkles size={16} />
            Tax Simulator
          </button>
          <button
            onClick={() => setActiveView('calculators')}
            className={`nav-tab ${activeView === 'calculators' ? 'active' : ''}`}
          >
            <Calculator size={16} />
            GST & ITC Calculators
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="app-main">
        {/* Dynamic header summary */}
        <div className="view-header">
          <div className="view-title">
            {activeView === 'parser' && (
              <>
                <h1>Document & Natural Language Parser</h1>
                <p>Upload standard tax filings or query in plain text. We will map your declarations instantly.</p>
              </>
            )}
            {activeView === 'simulator' && (
              <>
                <h1>Interactive Tax Return Simulator</h1>
                <p>Simulate returns across all sectors. Compare Old vs New regimes under Indian tax laws u/s 115BAC.</p>
              </>
            )}
            {activeView === 'calculators' && (
              <>
                <h1>GST, ITC & IT Calculators Suite</h1>
                <p>Quick calculators for Goods & Services Tax (GST), credit utilization ledgers, and slabs.</p>
              </>
            )}
          </div>

          {activeView === 'simulator' && (
            <button onClick={handleReset} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={14} /> Reset Simulator
            </button>
          )}
        </div>

        {/* View Switcher */}
        {activeView === 'parser' && (
          <DocParser onLoadIntoSimulator={handleLoadFromParser} />
        )}

        {activeView === 'simulator' && (
          <div className="dashboard-grid">
            <TaxSimulator
              input={taxInput}
              comparison={comparison}
              onUpdateInput={handleUpdateInput}
            />
            <TaxOptimizer
              input={taxInput}
              comparison={comparison}
              onUpdateInput={handleUpdateInput}
            />
          </div>
        )}

        {activeView === 'calculators' && (
          <CalculatorsSuite />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-color)',
        padding: '20px 40px',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        <p>© 2026 TaxVantage Portal. Built for simulating Indian Income Tax (AY 2026-27 / FY 2025-26) and GST/ITC ledgers.</p>
      </footer>
    </div>
  );
}

export default App;
