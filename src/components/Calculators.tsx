import React, { useState } from 'react';
import { AlertCircle, Layers, Info } from 'lucide-react';

export const CalculatorsSuite: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'gst' | 'itc' | 'it-slabs'>('gst');

  // GST Calculator State
  const [gstAmount, setGstAmount] = useState<number>(10000);
  const [gstRate, setGstRate] = useState<number>(18);
  const [gstType, setGstType] = useState<'exclusive' | 'inclusive'>('exclusive');
  const [gstTransactionType, setGstTransactionType] = useState<'intra' | 'inter'>('intra');

  // ITC Calculator State
  const [liabilityIGST, setLiabilityIGST] = useState<number>(50000);
  const [liabilityCGST, setLiabilityCGST] = useState<number>(30000);
  const [liabilitySGST, setLiabilitySGST] = useState<number>(30000);

  const [creditIGST, setCreditIGST] = useState<number>(60000);
  const [creditCGST, setCreditCGST] = useState<number>(20000);
  const [creditSGST, setCreditSGST] = useState<number>(20000);

  // Section 17(5) Blocked Credit State
  const [hasBlockedCredit, setHasBlockedCredit] = useState<boolean>(false);
  const [blockedCreditType, setBlockedCreditType] = useState<string>('motor_vehicle');
  const [blockedCreditAmount, setBlockedCreditAmount] = useState<number>(15000);

  // IT slab estimator
  const [itAnnualIncome, setItAnnualIncome] = useState<number>(1500000);

  // 1. GST calculations
  const calculateGST = () => {
    let basePrice = 0;
    let taxAmount = 0;
    let totalPrice = 0;

    if (gstType === 'exclusive') {
      basePrice = gstAmount;
      taxAmount = (gstAmount * gstRate) / 100;
      totalPrice = basePrice + taxAmount;
    } else {
      totalPrice = gstAmount;
      basePrice = (gstAmount * 100) / (100 + gstRate);
      taxAmount = totalPrice - basePrice;
    }

    const cgst = gstTransactionType === 'intra' ? taxAmount / 2 : 0;
    const sgst = gstTransactionType === 'intra' ? taxAmount / 2 : 0;
    const igst = gstTransactionType === 'inter' ? taxAmount : 0;

    return {
      basePrice: Math.round(basePrice),
      taxAmount: Math.round(taxAmount),
      totalPrice: Math.round(totalPrice),
      cgst: Math.round(cgst),
      sgst: Math.round(sgst),
      igst: Math.round(igst)
    };
  };

  const gstResult = calculateGST();

  // 2. ITC Utilization rules (Section 49 of CGST Act)
  // Utilisation rules:
  // - IGST Credit utilized first:
  //   1. Offsets IGST Liability.
  //   2. Offsets CGST Liability and SGST Liability in any order.
  // - CGST Credit utilized next:
  //   1. Offsets CGST Liability.
  //   2. Offsets IGST Liability (only if CGST liability is fully cleared).
  //   3. CANNOT offset SGST.
  // - SGST Credit utilized last:
  //   1. Offsets SGST Liability.
  //   2. Offsets IGST Liability (only if SGST liability is fully cleared).
  //   3. CANNOT offset CGST.
  const calculateITCOffset = () => {
    // Keep track of remaining liabilities
    let remLiabilityIGST = liabilityIGST;
    let remLiabilityCGST = liabilityCGST;
    let remLiabilitySGST = liabilitySGST;

    // Adjust credits (accounting for blocked credit if applicable)
    let actualCreditIGST = creditIGST;
    let actualCreditCGST = creditCGST;
    let actualCreditSGST = creditSGST;

    let blockedDeductionMsg = '';
    if (hasBlockedCredit) {
      // Deduct the blocked credit amount from the appropriate ledger for computation
      if (blockedCreditType === 'inter_state') {
        actualCreditIGST = Math.max(0, creditIGST - blockedCreditAmount);
        blockedDeductionMsg = `₹${blockedCreditAmount.toLocaleString('en-IN')} removed from IGST ledger (Sec 17(5) Blocked Credit)`;
      } else {
        // Intra-state purchase, split between CGST and SGST
        const halfBlocked = Math.round(blockedCreditAmount / 2);
        actualCreditCGST = Math.max(0, creditCGST - halfBlocked);
        actualCreditSGST = Math.max(0, creditSGST - halfBlocked);
        blockedDeductionMsg = `₹${halfBlocked.toLocaleString('en-IN')} removed from both CGST & SGST ledgers (Sec 17(5) Blocked Credit)`;
      }
    }

    let remCreditIGST = actualCreditIGST;
    let remCreditCGST = actualCreditCGST;
    let remCreditSGST = actualCreditSGST;

    // STEP 1: Utilize IGST Credit
    // First against IGST liability
    const igstAgainstIgst = Math.min(remCreditIGST, remLiabilityIGST);
    remCreditIGST -= igstAgainstIgst;
    remLiabilityIGST -= igstAgainstIgst;

    // Remaining IGST Credit against CGST liability
    const igstAgainstCgst = Math.min(remCreditIGST, remLiabilityCGST);
    remCreditIGST -= igstAgainstCgst;
    remLiabilityCGST -= igstAgainstCgst;

    // Remaining IGST Credit against SGST liability
    const igstAgainstSgst = Math.min(remCreditIGST, remLiabilitySGST);
    remCreditIGST -= igstAgainstSgst;
    remLiabilitySGST -= igstAgainstSgst;

    // STEP 2: Utilize CGST Credit
    // First against CGST liability
    const cgstAgainstCgst = Math.min(remCreditCGST, remLiabilityCGST);
    remCreditCGST -= cgstAgainstCgst;
    remLiabilityCGST -= cgstAgainstCgst;

    // Remaining CGST Credit against IGST liability
    const cgstAgainstIgst = Math.min(remCreditCGST, remLiabilityIGST);
    remCreditCGST -= cgstAgainstIgst;
    remLiabilityIGST -= cgstAgainstIgst;

    // STEP 3: Utilize SGST Credit
    // First against SGST liability
    const sgstAgainstSgst = Math.min(remCreditSGST, remLiabilitySGST);
    remCreditSGST -= sgstAgainstSgst;
    remLiabilitySGST -= sgstAgainstSgst;

    // Remaining SGST Credit against IGST liability
    const sgstAgainstIgst = Math.min(remCreditSGST, remLiabilityIGST);
    remCreditSGST -= sgstAgainstIgst;
    remLiabilityIGST -= sgstAgainstIgst;

    // Totals
    const totalLiability = liabilityIGST + liabilityCGST + liabilitySGST;
    const totalCredit = actualCreditIGST + actualCreditCGST + actualCreditSGST;
    const finalPayable = remLiabilityIGST + remLiabilityCGST + remLiabilitySGST;

    return {
      remLiabilityIGST,
      remLiabilityCGST,
      remLiabilitySGST,
      remCreditIGST,
      remCreditCGST,
      remCreditSGST,
      igstAgainstIgst,
      igstAgainstCgst,
      igstAgainstSgst,
      cgstAgainstCgst,
      cgstAgainstIgst,
      sgstAgainstSgst,
      sgstAgainstIgst,
      totalLiability,
      totalCredit,
      finalPayable,
      blockedDeductionMsg
    };
  };

  const itcResult = calculateITCOffset();

  // 3. Simple Slab estimator for fast check
  const getITCalculations = () => {
    // New regime for AY 2026-27 (Budget 2025):
    // Standard deduction 75,000 for slab check
    const taxable = Math.max(0, itAnnualIncome - 75000);
    let tax = 0;
    
    const slabs = [
      { limit: 400000, rate: 0 },
      { limit: 800000, rate: 0.05 },
      { limit: 1200000, rate: 0.10 },
      { limit: 1600000, rate: 0.15 },
      { limit: 2000000, rate: 0.20 },
      { limit: 2400000, rate: 0.25 },
      { limit: Infinity, rate: 0.30 }
    ];
    
    let remaining = taxable;
    let prev = 0;
    for (const slab of slabs) {
      if (remaining <= 0) break;
      const range = slab.limit - prev;
      const amt = Math.min(remaining, range);
      tax += amt * slab.rate;
      remaining -= amt;
      prev = slab.limit;
    }
    
    let rebate = 0;
    let marginalRelief = 0;
    if (taxable <= 1200000) {
      rebate = tax;
    } else {
      const excess = taxable - 1200000;
      if (tax > excess) {
        marginalRelief = tax - excess;
      }
    }
    
    const baseTax = Math.max(0, tax - rebate - marginalRelief);
    const cess = baseTax * 0.04;
    return {
      taxable,
      grossTax: Math.round(tax),
      rebate: Math.round(rebate),
      marginalRelief: Math.round(marginalRelief),
      cess: Math.round(cess),
      total: Math.round(baseTax + cess)
    };
  };

  const itSlabResult = getITCalculations();

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveSubTab('gst')}
          className={`nav-tab ${activeSubTab === 'gst' ? 'active' : ''}`}
        >
          GST Calculator
        </button>
        <button
          onClick={() => setActiveSubTab('itc')}
          className={`nav-tab ${activeSubTab === 'itc' ? 'active' : ''}`}
        >
          Input Tax Credit (ITC) Ledger
        </button>
        <button
          onClick={() => setActiveSubTab('it-slabs')}
          className={`nav-tab ${activeSubTab === 'it-slabs' ? 'active' : ''}`}
        >
          Quick IT Slab Estimator
        </button>
      </div>

      {/* Tab Panel: GST */}
      {activeSubTab === 'gst' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="view-title">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>GST (Goods & Services Tax) Calculator</h3>
            <p style={{ fontSize: '0.85rem' }}>Estimate CGST, SGST, IGST and total bill price instantly.</p>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Amount / Price</label>
              <div className="input-container">
                <span className="input-prefix">₹</span>
                <input
                  type="number"
                  className="input-control"
                  value={gstAmount || ''}
                  onChange={(e) => setGstAmount(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>GST Rate</label>
              <select
                className="input-control"
                value={gstRate}
                onChange={(e) => setGstRate(parseInt(e.target.value) || 18)}
              >
                <option value="5">5% (Essential Items)</option>
                <option value="12">12% (Standard goods/services)</option>
                <option value="18">18% (Standard commercial rate)</option>
                <option value="28">28% (Luxury & Sin goods)</option>
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Calculation Type</label>
              <select
                className="input-control"
                value={gstType}
                onChange={(e) => setGstType(e.target.value as any)}
              >
                <option value="exclusive">GST Exclusive (Add tax to amount)</option>
                <option value="inclusive">GST Inclusive (Extract tax from amount)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Supply Category</label>
              <select
                className="input-control"
                value={gstTransactionType}
                onChange={(e) => setGstTransactionType(e.target.value as any)}
              >
                <option value="intra">Intra-State (Within same State: CGST + SGST)</option>
                <option value="inter">Inter-State (To another State: IGST)</option>
              </select>
            </div>
          </div>

          {/* Results Display */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="glass-card" style={{ background: 'rgba(255,255,255,0.01)', border: 'none', padding: '16px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Base Taxable Value</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px' }}>
                ₹{gstResult.basePrice.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="glass-card" style={{ background: 'rgba(255,255,255,0.01)', border: 'none', padding: '16px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Invoice Value</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--color-primary)' }}>
                ₹{gstResult.totalPrice.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '16px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase' }}>Tax Breakup</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Tax Amount:</span>
                <span style={{ fontWeight: 600 }}>₹{gstResult.taxAmount.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>CGST (Central GST):</span>
                <span>₹{gstResult.cgst.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>SGST (State GST):</span>
                <span>₹{gstResult.sgst.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>IGST (Integrated GST):</span>
                <span style={{ color: gstResult.igst > 0 ? 'var(--color-primary)' : 'inherit' }}>₹{gstResult.igst.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Tab Panel: ITC Ledger */}
      {activeSubTab === 'itc' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="view-title">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>GST Input Tax Credit (ITC) ledger calculator</h3>
            <p style={{ fontSize: '0.85rem' }}>Determine your final cash tax liability after applying statutory ITC cross-utilization rules.</p>
          </div>

          {/* Slabs grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Output Tax liabilities */}
            <div className="glass-card" style={{ padding: '16px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px', color: '#f87171' }}>Outward Tax Liability (To Pay)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label>IGST Liability</label>
                  <div className="input-container">
                    <span className="input-prefix">₹</span>
                    <input type="number" className="input-control" value={liabilityIGST || ''} onChange={(e) => setLiabilityIGST(parseFloat(e.target.value) || 0)} />
                  </div>
                </div>
                <div className="form-group">
                  <label>CGST Liability</label>
                  <div className="input-container">
                    <span className="input-prefix">₹</span>
                    <input type="number" className="input-control" value={liabilityCGST || ''} onChange={(e) => setLiabilityCGST(parseFloat(e.target.value) || 0)} />
                  </div>
                </div>
                <div className="form-group">
                  <label>SGST Liability</label>
                  <div className="input-container">
                    <span className="input-prefix">₹</span>
                    <input type="number" className="input-control" value={liabilitySGST || ''} onChange={(e) => setLiabilitySGST(parseFloat(e.target.value) || 0)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Input Tax credits ledger */}
            <div className="glass-card" style={{ padding: '16px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px', color: '#60a5fa' }}>Input Tax Credit Ledger (In hand)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label>IGST ITC</label>
                  <div className="input-container">
                    <span className="input-prefix">₹</span>
                    <input type="number" className="input-control" value={creditIGST || ''} onChange={(e) => setCreditIGST(parseFloat(e.target.value) || 0)} />
                  </div>
                </div>
                <div className="form-group">
                  <label>CGST ITC</label>
                  <div className="input-container">
                    <span className="input-prefix">₹</span>
                    <input type="number" className="input-control" value={creditCGST || ''} onChange={(e) => setCreditCGST(parseFloat(e.target.value) || 0)} />
                  </div>
                </div>
                <div className="form-group">
                  <label>SGST ITC</label>
                  <div className="input-container">
                    <span className="input-prefix">₹</span>
                    <input type="number" className="input-control" value={creditSGST || ''} onChange={(e) => setCreditSGST(parseFloat(e.target.value) || 0)} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 17(5) Blocked Credit Checker */}
          <div className="glass-card" style={{ border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <label className="checkbox-control" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={hasBlockedCredit}
                onChange={(e) => setHasBlockedCredit(e.target.checked)}
              />
              Flag / Deduct Blocked Credits under Section 17(5)
            </label>
            
            {hasBlockedCredit && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Blocked Credit Category</label>
                    <select
                      className="input-control"
                      value={blockedCreditType}
                      onChange={(e) => setBlockedCreditType(e.target.value)}
                    >
                      <option value="motor_vehicle">Motor Vehicles for personal passenger transport</option>
                      <option value="food_beverage">Food, Beverages, Outdoor Catering</option>
                      <option value="club_membership">Membership of Club, Health & Fitness Centre</option>
                      <option value="works_contract">Works Contract Services for Immovable Property construction</option>
                      <option value="inter_state">Inter-state Purchases (IGST Blocked)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Ineligible Input Credit Amount</label>
                    <div className="input-container">
                      <span className="input-prefix">₹</span>
                      <input
                        type="number"
                        className="input-control"
                        value={blockedCreditAmount || ''}
                        onChange={(e) => setBlockedCreditAmount(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
                <div className="alert-warning-box">
                  <AlertCircle size={16} className="alert-warning-icon" />
                  <div>
                    <strong>GST Section 17(5) Blocked Credits:</strong> Business expenses on the selected category are legally barred from ITC eligibility. The calculator has automatically deducted this ineligible credit from your ledger.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Offset Breakup sheet */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="var(--color-primary)" />
              ITC Cross-Utilization Results
            </h4>

            {itcResult.blockedDeductionMsg && (
              <p style={{ fontSize: '0.85rem', color: '#fbbf24', fontStyle: 'italic', marginBottom: '12px' }}>
                * {itcResult.blockedDeductionMsg}
              </p>
            )}

            <div style={{ overflowX: 'auto' }}>
              <table className="ledger-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Ledger Type</th>
                    <th>Liability (Initial)</th>
                    <th>IGST Credit Applied</th>
                    <th>CGST Credit Applied</th>
                    <th>SGST Credit Applied</th>
                    <th>Liability (Final Payable in Cash)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>IGST</strong></td>
                    <td>₹{liabilityIGST.toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--color-primary)' }}>-₹{itcResult.igstAgainstIgst.toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--color-primary)' }}>-₹{itcResult.cgstAgainstIgst.toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--color-primary)' }}>-₹{itcResult.sgstAgainstIgst.toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 600 }}>₹{itcResult.remLiabilityIGST.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td><strong>CGST</strong></td>
                    <td>₹{liabilityCGST.toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--color-primary)' }}>-₹{itcResult.igstAgainstCgst.toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--color-primary)' }}>-₹{itcResult.cgstAgainstCgst.toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--text-muted)' }}>N/A (Blocked)</td>
                    <td style={{ fontWeight: 600 }}>₹{itcResult.remLiabilityCGST.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td><strong>SGST</strong></td>
                    <td>₹{liabilitySGST.toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--color-primary)' }}>-₹{itcResult.igstAgainstSgst.toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--text-muted)' }}>N/A (Blocked)</td>
                    <td style={{ color: 'var(--color-primary)' }}>-₹{itcResult.sgstAgainstSgst.toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 600 }}>₹{itcResult.remLiabilitySGST.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="ledger-highlight-total" style={{ fontWeight: 700 }}>
                    <td><strong>Total</strong></td>
                    <td>₹{itcResult.totalLiability.toLocaleString('en-IN')}</td>
                    <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      Adjusted Credit Ledger: ₹{itcResult.totalCredit.toLocaleString('en-IN')}
                    </td>
                    <td>₹{itcResult.finalPayable.toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', lineHeight: 1.4, color: 'var(--text-secondary)' }}>
              <strong>Utilization Order Details:</strong><br />
              1. <strong>IGST Credit</strong> was completely exhausted first against IGST liability, then CGST, and lastly SGST.<br />
              2. <strong>CGST Credit</strong> offset the remaining CGST liability, with surplus applied to IGST (cannot offset SGST).<br />
              3. <strong>SGST Credit</strong> offset the remaining SGST liability, with surplus applied to IGST (cannot offset CGST).
            </div>
          </div>
        </div>
      )}

      {/* Tab Panel: Quick IT Slabs */}
      {activeSubTab === 'it-slabs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="view-title">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Quick Income Tax slab estimator</h3>
            <p style={{ fontSize: '0.85rem' }}>Estimate your taxes under the default New Tax Regime (FY 2025-26 / AY 2026-27 rules) in one second.</p>
          </div>

          <div className="form-group">
            <label>Annual Gross Income</label>
            <div className="input-container">
              <span className="input-prefix">₹</span>
              <input
                type="number"
                className="input-control"
                value={itAnnualIncome || ''}
                onChange={(e) => setItAnnualIncome(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="form-grid" style={{ marginTop: '10px' }}>
            <div className="glass-card" style={{ background: 'rgba(255,255,255,0.01)', border: 'none', padding: '16px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Standard Deduction (Default)</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '4px' }}>
                ₹75,000
              </div>
            </div>
            <div className="glass-card" style={{ background: 'rgba(255,255,255,0.01)', border: 'none', padding: '16px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Estimated Taxable Income</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '4px' }}>
                ₹{itSlabResult.taxable.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase' }}>Tax Breakdown</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Gross Tax on Slabs:</span>
                <span>₹{itSlabResult.grossTax.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Section 87A Rebate:</span>
                <span style={{ color: 'var(--color-primary)' }}>-₹{itSlabResult.rebate.toLocaleString('en-IN')}</span>
              </div>
              {itSlabResult.marginalRelief > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Marginal Relief u/s 87A:</span>
                  <span style={{ color: 'var(--color-primary)' }}>-₹{itSlabResult.marginalRelief.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Health & Education Cess (4%):</span>
                <span>₹{itSlabResult.cess.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', marginTop: '5px', fontSize: '1.2rem', fontWeight: 800 }}>
                <span style={{ color: 'var(--text-primary)' }}>Total Net Tax:</span>
                <span style={{ color: 'var(--color-primary)' }}>₹{itSlabResult.total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {itAnnualIncome <= 1275000 && (
            <div className="alert-warning-box" style={{ background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#6ee7b7', margin: '0' }}>
              <Info size={16} className="alert-warning-icon" />
              <div>
                <strong>Zero Tax Zone:</strong> Under the New Tax Regime for AY 2026-27, any gross income up to ₹12.75 Lakhs is completely tax-free (due to the ₹75,000 standard deduction and the increased ₹60,000 rebate u/s 87A).
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
