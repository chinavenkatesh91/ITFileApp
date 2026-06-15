import React, { useState } from 'react';
import { type TaxInput, type TaxRegimeComparison } from '../utils/taxEngine';
import { Info, HelpCircle as HelpIcon, Briefcase, User, Home, TrendingUp, Sun, Landmark } from 'lucide-react';

interface TaxSimulatorProps {
  input: TaxInput;
  comparison: TaxRegimeComparison;
  onUpdateInput: (updatedFields: Partial<TaxInput>) => void;
}

export const TaxSimulator: React.FC<TaxSimulatorProps> = ({
  input,
  comparison,
  onUpdateInput
}) => {
  const [activeTab, setActiveTab] = useState<'income' | 'deductions'>('income');
  const [showHelp, setShowHelp] = useState<string | null>(null);

  const handleSectorChange = (sector: TaxInput['sector']) => {
    // Reset inputs logically for the new sector to avoid pollution, or keep age
    onUpdateInput({
      sector,
      salaryIncome: 0,
      hraReceived: 0,
      basicSalary: 0,
      rentPaid: 0,
      businessGrossReceipts: 0,
      businessExpenses: 0,
      businessPresumptive: true,
      professionalPresumptive: false,
      rentalIncome: 0,
      municipalTaxes: 0,
      homeLoanInterest: 0,
      stcgTrading: 0,
      ltcgTrading: 0,
      foTradingProfit: 0,
      foTradingExpenses: 0,
      agriIncome: 0,
      otherIncome: 0,
    });
  };

  const handleInputChange = (field: keyof TaxInput, value: any) => {
    let parsedVal = value;
    if (typeof value === 'string' && value !== '') {
      parsedVal = parseFloat(value) || 0;
    }
    onUpdateInput({ [field]: parsedVal });
  };

  const toggleHelp = (helpId: string) => {
    setShowHelp(showHelp === helpId ? null : helpId);
  };

  const sectorList: { id: TaxInput['sector']; label: string; icon: React.ReactNode; description: string }[] = [
    { 
      id: 'salaried', 
      label: 'Salaried Professional', 
      icon: <User size={18} />, 
      description: 'Working professional receiving monthly salary, form 16, HRA benefits.'
    },
    { 
      id: 'business', 
      label: 'Business Owner / Profession', 
      icon: <Briefcase size={18} />, 
      description: 'Individual run business, retail, service providers, or doctors, consultants (Section 44AD/ADA).'
    },
    { 
      id: 'real_estate', 
      label: 'Real Estate / Landlord', 
      icon: <Home size={18} />, 
      description: 'Property owners earning rental income or having interest on home loans (Section 24).'
    },
    { 
      id: 'trading', 
      label: 'Trader / Investor', 
      icon: <TrendingUp size={18} />, 
      description: 'Trading in stocks, mutual funds, or derivative F&O (Capital Gains tax rules).'
    },
    { 
      id: 'agriculture', 
      label: 'Agriculture', 
      icon: <Sun size={18} />, 
      description: 'Farming income (exempt under 10(1) but partially integrated for tax slabs).'
    },
    { 
      id: 'exempt', 
      label: 'Educational / Trust', 
      icon: <Landmark size={18} />, 
      description: 'Charitable trusts, educational institutions (Exempt status u/s 10(23C)).'
    }
  ];

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Category Selection Grid */}
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '12px' }}>Choose Taxpayer Category</h2>
        <div className="wizard-header-tabs">
          {sectorList.map((sect) => (
            <button
              key={sect.id}
              onClick={() => handleSectorChange(sect.id)}
              className={`wizard-tab-btn ${input.sector === sect.id ? 'active' : ''}`}
            >
              {sect.icon}
              {sect.label}
            </button>
          ))}
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '-12px', marginBottom: '16px' }}>
          {sectorList.find(s => s.id === input.sector)?.description}
        </p>
      </div>

      {/* Inputs tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '16px' }}>
        <button
          onClick={() => setActiveTab('income')}
          className="nav-tab"
          style={{
            borderBottom: activeTab === 'income' ? '2px solid var(--color-primary)' : 'none',
            borderRadius: '0',
            padding: '12px 6px',
            color: activeTab === 'income' ? 'var(--text-primary)' : 'var(--text-secondary)'
          }}
        >
          1. Income & Sector Details
        </button>
        {input.sector !== 'exempt' && (
          <button
            onClick={() => setActiveTab('deductions')}
            className="nav-tab"
            style={{
              borderBottom: activeTab === 'deductions' ? '2px solid var(--color-primary)' : 'none',
              borderRadius: '0',
              padding: '12px 6px',
              color: activeTab === 'deductions' ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}
          >
            2. Deductions (Old Regime)
          </button>
        )}
      </div>

      {/* Tab Panel 1: Income */}
      {activeTab === 'income' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Sector-Specific Fields */}
          {input.sector === 'salaried' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-primary)' }}>Salaried Details</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Gross Salary (Annual)</label>
                  <div className="input-container">
                    <span className="input-prefix">₹</span>
                    <input
                      type="number"
                      className="input-control"
                      value={input.salaryIncome || ''}
                      placeholder="e.g. 1200000"
                      onChange={(e) => handleInputChange('salaryIncome', e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>
                    HRA Received 
                    <HelpIcon size={12} className="input-prefix" style={{ position: 'relative', left: '6px', top: '1px', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => toggleHelp('hra')} />
                  </label>
                  <div className="input-container">
                    <span className="input-prefix">₹</span>
                    <input
                      type="number"
                      className="input-control"
                      value={input.hraReceived || ''}
                      placeholder="e.g. 300000"
                      onChange={(e) => handleInputChange('hraReceived', e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Basic Salary (Annual)</label>
                  <div className="input-container">
                    <span className="input-prefix">₹</span>
                    <input
                      type="number"
                      className="input-control"
                      value={input.basicSalary || ''}
                      placeholder="e.g. 600000"
                      onChange={(e) => handleInputChange('basicSalary', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {showHelp === 'hra' && (
                <div className="alert-warning-box" style={{ background: 'rgba(99, 102, 241, 0.08)', borderColor: 'rgba(99, 102, 241, 0.3)', color: '#a5b4fc' }}>
                  <Info size={16} className="alert-warning-icon" />
                  <div>
                    <strong>House Rent Allowance (HRA) Exemption u/s 10(13A):</strong> Calculated as the minimum of:<br/>
                    1. Actual HRA received.<br/>
                    2. 50% of Basic salary (Metro city) or 40% (Non-metro).<br/>
                    3. Rent paid minus 10% of Basic salary.
                  </div>
                </div>
              )}

              <div className="form-grid">
                <div className="form-group">
                  <label>Rent Paid (Annual)</label>
                  <div className="input-container">
                    <span className="input-prefix">₹</span>
                    <input
                      type="number"
                      className="input-control"
                      value={input.rentPaid || ''}
                      placeholder="e.g. 180000"
                      onChange={(e) => handleInputChange('rentPaid', e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group" style={{ justifyContent: 'center' }}>
                  <label className="checkbox-control">
                    <input
                      type="checkbox"
                      checked={input.metroCity}
                      onChange={(e) => onUpdateInput({ metroCity: e.target.checked })}
                    />
                    Rent in Metro City (Delhi, Mumbai, Chennai, Kolkata)
                  </label>
                </div>
              </div>
            </div>
          )}

          {input.sector === 'business' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-primary)' }}>Business / Professional Details</h3>
                <label className="checkbox-control">
                  <input
                    type="checkbox"
                    checked={input.businessPresumptive}
                    onChange={(e) => onUpdateInput({ businessPresumptive: e.target.checked })}
                  />
                  Opt for Presumptive Taxation (Sec 44AD / 44ADA)
                </label>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Gross Receipts / Annual Turnover</label>
                  <div className="input-container">
                    <span className="input-prefix">₹</span>
                    <input
                      type="number"
                      className="input-control"
                      value={input.businessGrossReceipts || ''}
                      placeholder="e.g. 2500000"
                      onChange={(e) => handleInputChange('businessGrossReceipts', e.target.value)}
                    />
                  </div>
                </div>

                {!input.businessPresumptive ? (
                  <div className="form-group">
                    <label>Actual Business Expenses</label>
                    <div className="input-container">
                      <span className="input-prefix">₹</span>
                      <input
                        type="number"
                        className="input-control"
                        value={input.businessExpenses || ''}
                        placeholder="e.g. 1000000"
                        onChange={(e) => handleInputChange('businessExpenses', e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="form-group" style={{ justifyContent: 'center' }}>
                    <label className="checkbox-control">
                      <input
                        type="checkbox"
                        checked={input.professionalPresumptive}
                        onChange={(e) => onUpdateInput({ professionalPresumptive: e.target.checked })}
                      />
                      Is Profession? (Doctor, Lawyer, Engineer, Consultant u/s 44ADA)
                    </label>
                  </div>
                )}
              </div>

              {input.businessPresumptive && (
                <div className="alert-warning-box" style={{ background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#6ee7b7' }}>
                  <Info size={16} className="alert-warning-icon" />
                  <div>
                    <strong>Presumptive Taxation Schemes:</strong><br />
                    • <strong>Section 44AD (Business):</strong> Income is assumed at 6% of digital turnover, or 8% of cash turnover. No need to maintain account books.<br />
                    • <strong>Section 44ADA (Professionals):</strong> Income is assumed at 50% of gross receipts. Max receipts limit is ₹75 Lakhs.
                  </div>
                </div>
              )}

              {input.businessPresumptive && !input.professionalPresumptive && (
                <div className="form-group">
                  <label>Digital Transactions: {input.businessDigitalPercent}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    className="input-control"
                    style={{ padding: '0', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                    value={input.businessDigitalPercent}
                    onChange={(e) => handleInputChange('businessDigitalPercent', e.target.value)}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Declaring digital receipts enables the lower tax rate of 6% instead of 8% under Sec 44AD.
                  </span>
                </div>
              )}
            </div>
          )}

          {input.sector === 'real_estate' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-primary)' }}>Rental Property Details</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Gross Rent Received (Annual)</label>
                  <div className="input-container">
                    <span className="input-prefix">₹</span>
                    <input
                      type="number"
                      className="input-control"
                      value={input.rentalIncome || ''}
                      placeholder="e.g. 360000"
                      onChange={(e) => handleInputChange('rentalIncome', e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Municipal Taxes Paid</label>
                  <div className="input-container">
                    <span className="input-prefix">₹</span>
                    <input
                      type="number"
                      className="input-control"
                      value={input.municipalTaxes || ''}
                      placeholder="e.g. 15000"
                      onChange={(e) => handleInputChange('municipalTaxes', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Home Loan Interest Paid u/s 24(b)</label>
                  <div className="input-container">
                    <span className="input-prefix">₹</span>
                    <input
                      type="number"
                      className="input-control"
                      value={input.homeLoanInterest || ''}
                      placeholder="e.g. 150000"
                      onChange={(e) => handleInputChange('homeLoanInterest', e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group" style={{ justifyContent: 'center' }}>
                  <label className="checkbox-control">
                    <input
                      type="checkbox"
                      checked={input.letOutProperty}
                      onChange={(e) => onUpdateInput({ letOutProperty: e.target.checked })}
                    />
                    Is Let-Out Property? (If unchecked, self-occupied is capped at ₹2L max interest)
                  </label>
                </div>
              </div>
            </div>
          )}

          {input.sector === 'trading' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-primary)' }}>Capital Gains & F&O Details</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Short-Term Capital Gains (STCG - Shares)</label>
                  <div className="input-container">
                    <span className="input-prefix">₹</span>
                    <input
                      type="number"
                      className="input-control"
                      value={input.stcgTrading || ''}
                      placeholder="e.g. 100000"
                      onChange={(e) => handleInputChange('stcgTrading', e.target.value)}
                    />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Taxed at flat 20% (Section 111A).</span>
                </div>
                <div className="form-group">
                  <label>Long-Term Capital Gains (LTCG - Shares)</label>
                  <div className="input-container">
                    <span className="input-prefix">₹</span>
                    <input
                      type="number"
                      className="input-control"
                      value={input.ltcgTrading || ''}
                      placeholder="e.g. 200000"
                      onChange={(e) => handleInputChange('ltcgTrading', e.target.value)}
                    />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Taxed at flat 12.5% u/s 112A (first ₹1.25L is exempt).</span>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>F&O Trading Profit</label>
                  <div className="input-container">
                    <span className="input-prefix">₹</span>
                    <input
                      type="number"
                      className="input-control"
                      value={input.foTradingProfit || ''}
                      placeholder="e.g. 120000"
                      onChange={(e) => handleInputChange('foTradingProfit', e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>F&O Expenses (Brokerage, Internet, etc.)</label>
                  <div className="input-container">
                    <span className="input-prefix">₹</span>
                    <input
                      type="number"
                      className="input-control"
                      value={input.foTradingExpenses || ''}
                      placeholder="e.g. 20000"
                      onChange={(e) => handleInputChange('foTradingExpenses', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '-10px' }}>
                Note: Futures & Options (F&O) trading is treated as non-speculative business income in India. Profits are added to regular income and taxed at slab rates, allowing deduction of all trading expenses.
              </span>
            </div>
          )}

          {input.sector === 'agriculture' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-primary)' }}>Agricultural Income Details</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Net Agricultural Income</label>
                  <div className="input-container">
                    <span className="input-prefix">₹</span>
                    <input
                      type="number"
                      className="input-control"
                      value={input.agriIncome || ''}
                      placeholder="e.g. 400000"
                      onChange={(e) => handleInputChange('agriIncome', e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Non-Agricultural Taxable Income</label>
                  <div className="input-container">
                    <span className="input-prefix">₹</span>
                    <input
                      type="number"
                      className="input-control"
                      value={input.salaryIncome || ''}
                      placeholder="e.g. 500000"
                      onChange={(e) => handleInputChange('salaryIncome', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="alert-warning-box" style={{ background: 'rgba(34, 197, 94, 0.08)', borderColor: 'rgba(34, 197, 94, 0.3)', color: '#86efac' }}>
                <Info size={16} className="alert-warning-icon" />
                <div>
                  <strong>Partial Integration of Agricultural Income:</strong><br />
                  While agricultural income is 100% tax-free under Section 10(1), it is used to calculate the tax rate on your non-agricultural income if:<br />
                  1. Agricultural income exceeds ₹5,000.<br />
                  2. Non-agricultural income exceeds basic exemption limit.<br />
                  This leads to a slightly higher slab rate on non-agricultural income.
                </div>
              </div>
            </div>
          )}

          {input.sector === 'exempt' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-primary)' }}>Exempt Category (Trusts / Educational Institutions)</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Gross Educational Receipts / Donations Received</label>
                  <div className="input-container">
                    <span className="input-prefix">₹</span>
                    <input
                      type="number"
                      className="input-control"
                      value={input.salaryIncome || ''}
                      placeholder="e.g. 5000000"
                      onChange={(e) => handleInputChange('salaryIncome', e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Capital Gains (Optional)</label>
                  <div className="input-container">
                    <span className="input-prefix">₹</span>
                    <input
                      type="number"
                      className="input-control"
                      value={input.stcgTrading || ''}
                      placeholder="e.g. 150000"
                      onChange={(e) => handleInputChange('stcgTrading', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="alert-warning-box" style={{ background: 'rgba(59, 130, 246, 0.08)', borderColor: 'rgba(59, 130, 246, 0.3)', color: '#93c5fd' }}>
                <Info size={16} className="alert-warning-icon" />
                <div>
                  <strong>Exempt Status under Section 10(23C):</strong><br />
                  Approved educational institutions, trusts, and universities are fully exempt from income tax on receipts applied towards educational activities. Tax is zero on regular income, but special capital gains may still be assessed if not reinvested.
                </div>
              </div>
            </div>
          )}

          {/* Common General Fields */}
          {input.sector !== 'exempt' && (
            <>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '10px' }}>General Income & Age</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Other Taxable Income (Bank Interest, Dividends)</label>
                  <div className="input-container">
                    <span className="input-prefix">₹</span>
                    <input
                      type="number"
                      className="input-control"
                      value={input.otherIncome || ''}
                      placeholder="e.g. 40000"
                      onChange={(e) => handleInputChange('otherIncome', e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Taxpayer Age (Years)</label>
                  <input
                    type="number"
                    className="input-control"
                    value={input.age || ''}
                    placeholder="e.g. 30"
                    onChange={(e) => handleInputChange('age', e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

        </div>
      )}

      {/* Tab Panel 2: Deductions (Chapter VI-A) */}
      {activeTab === 'deductions' && input.sector !== 'exempt' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-primary)' }}>Chapter VI-A Deductions (Old Regime Only)</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '-10px' }}>
            Note: These deductions only lower your tax under the <strong>Old Tax Regime</strong>. They are not allowed under the New Tax Regime default.
          </p>

          <div className="form-grid">
            <div className="form-group">
              <label>Section 80C (PPF, ELSS, EPF, Life Insurance)</label>
              <div className="input-container">
                <span className="input-prefix">₹</span>
                <input
                  type="number"
                  className="input-control"
                  value={input.deduction80C || ''}
                  placeholder="Max 1,50,000"
                  onChange={(e) => handleInputChange('deduction80C', e.target.value)}
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Capped at ₹1,50,000 maximum.</span>
            </div>

            <div className="form-group">
              <label>Section 80D (Health Insurance Premium)</label>
              <div className="input-container">
                <span className="input-prefix">₹</span>
                <input
                  type="number"
                  className="input-control"
                  value={input.deduction80D || ''}
                  placeholder="Max 25k self + parents"
                  onChange={(e) => handleInputChange('deduction80D', e.target.value)}
                />
              </div>
              <label className="checkbox-control" style={{ marginTop: '4px' }}>
                <input
                  type="checkbox"
                  checked={input.deduction80DParentsSenior}
                  onChange={(e) => onUpdateInput({ deduction80DParentsSenior: e.target.checked })}
                />
                Parents are Senior Citizens? (Adds ₹25k limit)
              </label>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Section 80CCD(1B) (NPS Extra contribution)</label>
              <div className="input-container">
                <span className="input-prefix">₹</span>
                <input
                  type="number"
                  className="input-control"
                  value={input.deduction80CCD1B || ''}
                  placeholder="Max 50,000"
                  onChange={(e) => handleInputChange('deduction80CCD1B', e.target.value)}
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Additional deduction up to ₹50,000.</span>
            </div>

            <div className="form-group">
              <label>Section 80G (Charitable Donations)</label>
              <div className="input-container">
                <span className="input-prefix">₹</span>
                <input
                  type="number"
                  className="input-control"
                  value={input.deduction80G || ''}
                  placeholder="Donations"
                  onChange={(e) => handleInputChange('deduction80G', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="form-grid">
            {input.age >= 60 ? (
              <div className="form-group">
                <label>Section 80TTB (Interest Income for Seniors)</label>
                <div className="input-container">
                  <span className="input-prefix">₹</span>
                  <input
                    type="number"
                    className="input-control"
                    value={input.deduction80TTB || ''}
                    placeholder="Max 50,000"
                    onChange={(e) => handleInputChange('deduction80TTB', e.target.value)}
                  />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Capped at ₹50,000. Interest on savings & FDs.</span>
              </div>
            ) : (
              <div className="form-group">
                <label>Section 80TTA (Savings Interest for Non-Seniors)</label>
                <div className="input-container">
                  <span className="input-prefix">₹</span>
                  <input
                    type="number"
                    className="input-control"
                    value={input.deduction80TTA || ''}
                    placeholder="Max 10,000"
                    onChange={(e) => handleInputChange('deduction80TTA', e.target.value)}
                  />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Capped at ₹10,000. Interest on savings accounts.</span>
              </div>
            )}
            <div className="form-group"></div>
          </div>
        </div>
      )}

      {/* Dynamic Detailed Slab Computations */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Detailed Calculation Sheet</h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="ledger-table" style={{ fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th>Particulars</th>
                <th>Old Tax Regime (AY 2026-27)</th>
                <th>New Tax Regime (AY 2026-27)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Gross Total Income (Excl. Agri)</strong></td>
                <td>₹{comparison.oldRegime.grossTotalIncome.toLocaleString('en-IN')}</td>
                <td>₹{comparison.newRegime.grossTotalIncome.toLocaleString('en-IN')}</td>
              </tr>
              {input.sector === 'salaried' && (
                <>
                  <tr>
                    <td>Less: HRA Exemption (Sec 10(13A))</td>
                    <td style={{ color: 'var(--color-primary)' }}>-₹{comparison.oldRegime.hraExempted.toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--text-muted)' }}>N/A</td>
                  </tr>
                  <tr>
                    <td>Less: Standard Deduction (Salaried)</td>
                    <td style={{ color: 'var(--color-primary)' }}>-₹{comparison.oldRegime.standardDeductionSalaried.toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--color-primary)' }}>-₹{comparison.newRegime.standardDeductionSalaried.toLocaleString('en-IN')}</td>
                  </tr>
                </>
              )}
              {input.sector === 'real_estate' && (
                <tr>
                  <td>Rental Net Income (Sec 24 NAV - 30% standard)</td>
                  <td>₹{comparison.oldRegime.rentalNetIncome.toLocaleString('en-IN')}</td>
                  <td>₹{comparison.newRegime.rentalNetIncome.toLocaleString('en-IN')}</td>
                </tr>
              )}
              {input.sector === 'trading' && (
                <>
                  <tr>
                    <td>STCG (Equity) Taxable (20%)</td>
                    <td>₹{comparison.oldRegime.taxableSTCG.toLocaleString('en-IN')}</td>
                    <td>₹{comparison.newRegime.taxableSTCG.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td>LTCG u/s 112A (Taxable &gt; ₹1.25L @ 12.5%)</td>
                    <td>₹{comparison.oldRegime.taxableLTCG.toLocaleString('en-IN')}</td>
                    <td>₹{comparison.newRegime.taxableLTCG.toLocaleString('en-IN')}</td>
                  </tr>
                </>
              )}
              {input.sector === 'agriculture' && (
                <tr>
                  <td>Exempt Agriculture Income (u/s 10(1))</td>
                  <td style={{ color: 'var(--text-secondary)' }}>₹{comparison.oldRegime.exemptIncome.toLocaleString('en-IN')}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>₹{comparison.newRegime.exemptIncome.toLocaleString('en-IN')}</td>
                </tr>
              )}
              {input.sector === 'exempt' && (
                <tr>
                  <td>Exempt Educational Receipts (u/s 10(23C))</td>
                  <td style={{ color: 'var(--text-secondary)' }}>₹{comparison.oldRegime.exemptIncome.toLocaleString('en-IN')}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>₹{comparison.newRegime.exemptIncome.toLocaleString('en-IN')}</td>
                </tr>
              )}
              <tr>
                <td><strong>Less: Total Deductions u/s 80</strong></td>
                <td style={{ color: 'var(--color-primary)' }}>-₹{comparison.oldRegime.totalDeductions.toLocaleString('en-IN')}</td>
                <td style={{ color: 'var(--text-muted)' }}>N/A</td>
              </tr>
              <tr style={{ background: 'rgba(255,255,255,0.01)', fontWeight: 600 }}>
                <td><strong>Net Taxable Income (Slab)</strong></td>
                <td>₹{comparison.oldRegime.netTaxableIncome.toLocaleString('en-IN')}</td>
                <td>₹{comparison.newRegime.netTaxableIncome.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>Tax on Slabs</td>
                <td>₹{comparison.oldRegime.taxOnSlabs.toLocaleString('en-IN')}</td>
                <td>₹{comparison.newRegime.taxOnSlabs.toLocaleString('en-IN')}</td>
              </tr>
              {input.sector === 'trading' && (
                <>
                  <tr>
                    <td>Tax on STCG (@ 20%)</td>
                    <td>₹{comparison.oldRegime.taxOnSTCG.toLocaleString('en-IN')}</td>
                    <td>₹{comparison.newRegime.taxOnSTCG.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td>Tax on LTCG (@ 12.5%)</td>
                    <td>₹{comparison.oldRegime.taxOnLTCG.toLocaleString('en-IN')}</td>
                    <td>₹{comparison.newRegime.taxOnLTCG.toLocaleString('en-IN')}</td>
                  </tr>
                </>
              )}
              <tr style={{ fontWeight: 600 }}>
                <td>Gross Tax Payable</td>
                <td>₹{comparison.oldRegime.grossTax.toLocaleString('en-IN')}</td>
                <td>₹{comparison.newRegime.grossTax.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>Less: Tax Rebate u/s 87A</td>
                <td style={{ color: 'var(--color-primary)' }}>-₹{comparison.oldRegime.rebate87A.toLocaleString('en-IN')}</td>
                <td style={{ color: 'var(--color-primary)' }}>-₹{comparison.newRegime.rebate87A.toLocaleString('en-IN')}</td>
              </tr>
              {comparison.newRegime.marginalRelief > 0 && (
                <tr>
                  <td>Less: Marginal Relief (Sec 87A)</td>
                  <td>N/A</td>
                  <td style={{ color: 'var(--color-primary)' }}>-₹{comparison.newRegime.marginalRelief.toLocaleString('en-IN')}</td>
                </tr>
              )}
              <tr>
                <td>Surcharges</td>
                <td>₹{comparison.oldRegime.surcharge.toLocaleString('en-IN')}</td>
                <td>₹{comparison.newRegime.surcharge.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>Health & Education Cess (4%)</td>
                <td>₹{comparison.oldRegime.cess.toLocaleString('en-IN')}</td>
                <td>₹{comparison.newRegime.cess.toLocaleString('en-IN')}</td>
              </tr>
              <tr className="ledger-highlight-total" style={{ fontSize: '1rem' }}>
                <td><strong>Final Net Tax Liability</strong></td>
                <td><strong>₹{comparison.oldRegime.totalTaxLiability.toLocaleString('en-IN')}</strong></td>
                <td><strong>₹{comparison.newRegime.totalTaxLiability.toLocaleString('en-IN')}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};
