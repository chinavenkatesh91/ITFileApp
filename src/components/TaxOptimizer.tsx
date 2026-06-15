import React from 'react';
import { type TaxInput, type TaxRegimeComparison, generateSuggestions } from '../utils/taxEngine';
import { Sparkles, ArrowRight, CheckCircle2, TrendingDown } from 'lucide-react';

interface TaxOptimizerProps {
  input: TaxInput;
  comparison: TaxRegimeComparison;
  onUpdateInput: (updatedFields: Partial<TaxInput>) => void;
}

export const TaxOptimizer: React.FC<TaxOptimizerProps> = ({
  input,
  comparison,
  onUpdateInput
}) => {
  const suggestions = generateSuggestions(input, comparison);
  const totalPotentialSavings = suggestions.reduce((sum, s) => sum + s.potentialSavings, 0);

  const handleApplySuggestion = (suggestionId: string) => {
    switch (suggestionId) {
      case 'nps_80ccd_1b':
        onUpdateInput({ deduction80CCD1B: 50000 });
        break;
      case 'health_80d':
        const selfLimit = input.age >= 60 ? 50000 : 25000;
        const parentsLimit = input.deduction80DParentsSenior ? 50000 : 25000;
        onUpdateInput({ deduction80D: selfLimit + parentsLimit });
        break;
      case 'investment_80c':
        onUpdateInput({ deduction80C: 150000 });
        break;
      case 'presumptive_44ada':
        onUpdateInput({ businessPresumptive: true, professionalPresumptive: true });
        break;
      case 'regime_switch_info':
        // Highlight that they are changing their active preference or focus
        break;
      default:
        break;
    }
  };

  return (
    <div className="side-panel">
      {/* Overall Savings Banner */}
      <div className="savings-highlight-card">
        <span className="savings-label">Tax Optimization</span>
        <div className="savings-val">
          ₹{totalPotentialSavings.toLocaleString('en-IN')}
        </div>
        <p className="savings-subtext">
          {totalPotentialSavings > 0
            ? `We identified legal ways to reduce your income tax liability under current Indian tax sections.`
            : `Fantastic! Your tax strategy is fully optimized under the current declarations.`}
        </p>
      </div>

      {/* Suggested Actions List */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Sparkles size={20} className="brand-icon" />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Recommendations</h2>
        </div>

        {suggestions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: varColor('text-secondary') }}>
            <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>All optimized!</p>
            <p style={{ fontSize: '0.85rem', color: varColor('text-muted'), marginTop: '4px' }}>
              No additional tax-saving actions are available for your current profile.
            </p>
          </div>
        ) : (
          <div className="suggestions-list">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="suggestion-item">
                <span className="suggestion-tag">{suggestion.section}</span>
                <h3 className="suggestion-title">{suggestion.title}</h3>
                <p className="suggestion-desc">{suggestion.description}</p>
                
                <div className="suggestion-footer">
                  <div>
                    <span className="suggestion-saving-label">Potential Saving: </span>
                    <span className="suggestion-saving-val">
                      ₹{suggestion.potentialSavings.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {suggestion.actionable && (
                    <button
                      onClick={() => handleApplySuggestion(suggestion.id)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      Apply <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Regime Comparison Overview */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <TrendingDown size={20} color="#6366f1" />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Regime Comparison</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
            <span style={{ color: varColor('text-secondary') }}>Old Regime Tax:</span>
            <span style={{ fontWeight: 600 }}>
              ₹{comparison.oldRegime.totalTaxLiability.toLocaleString('en-IN')}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
            <span style={{ color: varColor('text-secondary') }}>New Regime Tax:</span>
            <span style={{ fontWeight: 600 }}>
              ₹{comparison.newRegime.totalTaxLiability.toLocaleString('en-IN')}
            </span>
          </div>
          <div
            style={{
              marginTop: '8px',
              padding: '10px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.02)',
              fontSize: '0.85rem',
              borderLeft: `3px solid ${comparison.recommendedRegime === 'new' ? '#10b981' : '#6366f1'}`,
              lineHeight: 1.4
            }}
          >
            <strong>
              {comparison.recommendedRegime === 'new' ? 'New Tax Regime' : 'Old Tax Regime'}
            </strong>{' '}
            is recommended. You save{' '}
            <strong>₹{comparison.savings.toLocaleString('en-IN')}</strong>.
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper for CSS vars safely inside inline styles
function varColor(name: string): string {
  return `var(--${name})`;
}
