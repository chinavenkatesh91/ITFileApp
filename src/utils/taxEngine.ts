export interface TaxInput {
  // Sector
  sector: 'salaried' | 'business' | 'real_estate' | 'trading' | 'agriculture' | 'exempt';
  
  // Salaried Professional
  salaryIncome: number;
  hraReceived: number;
  basicSalary: number;
  rentPaid: number;
  metroCity: boolean;
  
  // Business/Professional
  businessGrossReceipts: number;
  businessExpenses: number;
  businessPresumptive: boolean; // true for 44AD / 44ADA
  professionalPresumptive: boolean; // true for 44ADA (50%), false for 44AD (6%/8%)
  businessDigitalPercent: number; // percentage of digital transactions (e.g. 100 means 6% tax rate, 0 means 8%)

  // Real Estate
  rentalIncome: number;
  municipalTaxes: number;
  homeLoanInterest: number; // Sec 24(b)
  letOutProperty: boolean; // If let out, 24(b) has no limit. If self-occupied, limit is 2L.
  
  // Trading
  stcgTrading: number; // short term capital gains on equity (taxed at 20%)
  ltcgTrading: number; // long term capital gains on equity (taxed at 12.5% after 1.25L exemption)
  foTradingProfit: number; // F&O trading profit (non-speculative business income)
  foTradingExpenses: number;
  
  // Agriculture
  agriIncome: number; // Net agricultural income (exempt under 10(1) but used for rate computation)

  // Other Income
  otherIncome: number; // interest, dividends, etc.
  
  // Deductions (for Old Regime)
  deduction80C: number;     // max 1.5L
  deduction80D: number;     // max 25k (self/family) + parents (25k or 50k if senior)
  deduction80DParentsSenior: boolean;
  deduction80CCD1B: number; // NPS max 50k
  deduction80G: number;     // Charitable donations
  deduction80TTA: number;   // Savings interest max 10k (non-senior)
  deduction80TTB: number;   // Senior savings interest max 50k
  
  // General Info
  age: number;
}

export interface TaxResultSummary {
  grossTotalIncome: number;
  exemptIncome: number;
  hraExempted: number;
  standardDeductionSalaried: number;
  businessNetIncome: number;
  rentalNetIncome: number;
  tradingNetIncome: number;
  totalDeductions: number;
  netTaxableIncome: number; // Net taxable income under slabs (excluding special rate CG)
  taxableLTCG: number;      // LTCG gains
  taxableSTCG: number;      // STCG gains
  taxOnSlabs: number;
  taxOnLTCG: number;
  taxOnSTCG: number;
  grossTax: number;
  rebate87A: number;
  marginalRelief: number;
  taxAfterRebate: number;
  surcharge: number;
  cess: number;
  totalTaxLiability: number;
}

export interface TaxRegimeComparison {
  oldRegime: TaxResultSummary;
  newRegime: TaxResultSummary;
  recommendedRegime: 'old' | 'new';
  savings: number;
}

// Default Input state
export const initialTaxInput: TaxInput = {
  sector: 'salaried',
  salaryIncome: 0,
  hraReceived: 0,
  basicSalary: 0,
  rentPaid: 0,
  metroCity: false,
  businessGrossReceipts: 0,
  businessExpenses: 0,
  businessPresumptive: true,
  professionalPresumptive: false,
  businessDigitalPercent: 100,
  rentalIncome: 0,
  municipalTaxes: 0,
  homeLoanInterest: 0,
  letOutProperty: false,
  stcgTrading: 0,
  ltcgTrading: 0,
  foTradingProfit: 0,
  foTradingExpenses: 0,
  agriIncome: 0,
  otherIncome: 0,
  deduction80C: 0,
  deduction80D: 0,
  deduction80DParentsSenior: false,
  deduction80CCD1B: 0,
  deduction80G: 0,
  deduction80TTA: 0,
  deduction80TTB: 0,
  age: 30,
};

// Calculate HRA Exemption
export function calculateHRAExemption(
  basicSalary: number,
  hraReceived: number,
  rentPaid: number,
  metroCity: boolean
): number {
  if (basicSalary <= 0 || hraReceived <= 0 || rentPaid <= 0) return 0;
  
  // 1. Actual HRA received
  // 2. 50% of basic salary for metro cities, 40% for non-metro cities
  // 3. Rent paid minus 10% of basic salary
  const limit1 = hraReceived;
  const limit2 = basicSalary * (metroCity ? 0.5 : 0.4);
  const limit3 = Math.max(0, rentPaid - basicSalary * 0.1);
  
  return Math.min(limit1, limit2, limit3);
}

// Calculate Presumptive Business Income
export function calculatePresumptiveBusinessIncome(
  grossReceipts: number,
  isProfessional: boolean,
  digitalPercent: number
): number {
  if (grossReceipts <= 0) return 0;
  if (isProfessional) {
    // Section 44ADA: 50% of gross receipts is treated as net taxable income
    return grossReceipts * 0.5;
  } else {
    // Section 44AD: 6% for digital receipts, 8% for cash/non-digital receipts
    const digitalFraction = digitalPercent / 100;
    const cashFraction = 1 - digitalFraction;
    const digitalIncome = grossReceipts * digitalFraction * 0.06;
    const cashIncome = grossReceipts * cashFraction * 0.08;
    return digitalIncome + cashIncome;
  }
}

// Calculate Rental Net Income (Sec 24)
export function calculateRentalIncome(
  rentalIncome: number,
  municipalTaxes: number,
  homeLoanInterest: number,
  letOutProperty: boolean
): number {
  const grossAnnualValue = Math.max(0, rentalIncome);
  const netAnnualValue = Math.max(0, grossAnnualValue - municipalTaxes);
  // Sec 24(a) Standard Deduction = 30% of NAV
  const standardDeduction = netAnnualValue * 0.3;
  
  // Sec 24(b) Home Loan Interest deduction
  // Self-occupied property limit is ₹2,00,000. Let-out property has no limit.
  const interestDeduction = letOutProperty 
    ? homeLoanInterest 
    : Math.min(200000, homeLoanInterest);
    
  return Math.max(0, netAnnualValue - standardDeduction) - interestDeduction;
}

// Helper to calculate slab tax
function getSlabTax(income: number, slabs: { limit: number; rate: number }[]): number {
  let tax = 0;
  let remainingIncome = income;
  let previousLimit = 0;

  for (const slab of slabs) {
    if (remainingIncome <= 0) break;
    const currentSlabRange = slab.limit - previousLimit;
    const taxableInThisSlab = Math.min(remainingIncome, currentSlabRange);
    
    tax += taxableInThisSlab * slab.rate;
    remainingIncome -= taxableInThisSlab;
    previousLimit = slab.limit;
  }

  // If there's remaining income above the last slab limit, it gets taxed at the last rate
  if (remainingIncome > 0 && slabs.length > 0) {
    tax += remainingIncome * slabs[slabs.length - 1].rate;
  }

  return tax;
}

// Slabs definition
const OLD_REGIME_SLABS = [
  { limit: 250000, rate: 0.0 },
  { limit: 500000, rate: 0.05 },
  { limit: 1000000, rate: 0.20 },
  { limit: Infinity, rate: 0.30 },
];

const NEW_REGIME_SLABS = [
  { limit: 400000, rate: 0.0 },
  { limit: 800000, rate: 0.05 },
  { limit: 1200000, rate: 0.10 },
  { limit: 1600000, rate: 0.15 },
  { limit: 2000000, rate: 0.20 },
  { limit: 2400000, rate: 0.25 },
  { limit: Infinity, rate: 0.30 },
];

// Calculate tax for one regime
export function calculateRegimeTax(
  input: TaxInput,
  regime: 'old' | 'new'
): TaxResultSummary {
  // 1. Calculate exempt income
  let exemptIncome = 0;
  let hraExempted = 0;
  let standardDeductionSalaried = 0;
  
  if (input.sector === 'agriculture') {
    exemptIncome += input.agriIncome;
  } else if (input.sector === 'exempt') {
    // educational institution, trust etc.
    exemptIncome += input.salaryIncome + input.businessGrossReceipts + input.rentalIncome;
  }

  // Salaried deductions
  if (input.sector === 'salaried') {
    if (regime === 'old') {
      hraExempted = calculateHRAExemption(
        input.basicSalary,
        input.hraReceived,
        input.rentPaid,
        input.metroCity
      );
      standardDeductionSalaried = input.salaryIncome > 0 ? 50000 : 0;
    } else {
      // New regime: no HRA exemption allowed
      hraExempted = 0;
      standardDeductionSalaried = input.salaryIncome > 0 ? 75000 : 0; // FY 2025-26 Budget
    }
  }

  // 2. Gross Total Income calculation
  // Salaried Salary
  const netSalary = Math.max(0, input.salaryIncome - hraExempted - standardDeductionSalaried);
  
  // Business Income
  let businessNetIncome = 0;
  if (input.sector === 'business') {
    if (input.businessPresumptive) {
      businessNetIncome = calculatePresumptiveBusinessIncome(
        input.businessGrossReceipts,
        input.professionalPresumptive,
        input.businessDigitalPercent
      );
    } else {
      businessNetIncome = Math.max(0, input.businessGrossReceipts - input.businessExpenses);
    }
  }
  // F&O is also non-speculative business income
  const foNetIncome = Math.max(0, input.foTradingProfit - input.foTradingExpenses);
  const totalBusinessNetIncome = businessNetIncome + foNetIncome;

  // Real estate
  let rentalNetIncome = 0;
  if (input.rentalIncome > 0) {
    if (regime === 'old') {
      rentalNetIncome = calculateRentalIncome(
        input.rentalIncome,
        input.municipalTaxes,
        input.homeLoanInterest,
        input.letOutProperty
      );
    } else {
      // New regime: Municipal taxes & 30% deduction is allowed, home loan interest on self-occupied is NOT, 
      // but let-out home loan interest CAN be set off, but wait, loss from house property cannot be set off against other heads.
      // We will allow let out property interest to set off up to net rent, or allow it. For simplicity, we calculate NAV - 30% standard deduction, 
      // and home loan interest is only allowed if it is let-out.
      rentalNetIncome = calculateRentalIncome(
        input.rentalIncome,
        input.municipalTaxes,
        input.letOutProperty ? input.homeLoanInterest : 0,
        input.letOutProperty
      );
    }
  }

  // Capital Gains Net Income (calculated separately from slabs)
  const tradingNetIncome = input.stcgTrading + input.ltcgTrading;

  // Other Income
  const otherIncome = input.otherIncome;

  // Gross Total Income (excluding agriculture and exempt, including capital gains)
  const grossTotalIncome = (input.sector === 'exempt' ? 0 : (netSalary + totalBusinessNetIncome + rentalNetIncome + otherIncome)) + tradingNetIncome;

  // 3. Deductions (Chapter VI-A) - only applicable for Old Regime
  let totalDeductions = 0;
  if (regime === 'old' && input.sector !== 'exempt') {
    // 80C: limit 1.5L
    const cDeduction = Math.min(150000, Math.max(0, input.deduction80C));
    
    // 80D: health insurance. Max 25k (self/family) + parents (25k or 50k if senior)
    const selfDeductionLimit = input.age >= 60 ? 50000 : 25000;
    const parentsDeductionLimit = input.deduction80DParentsSenior ? 50000 : 25000;
    
    // Split the user's 80D input logically (e.g. assume they input total, cap it at maximum possible)
    const dDeduction = Math.min(selfDeductionLimit + parentsDeductionLimit, Math.max(0, input.deduction80D));
    
    // 80CCD(1B): NPS deduction up to 50k
    const npsDeduction = Math.min(50000, Math.max(0, input.deduction80CCD1B));
    
    // 80G: charity
    const gDeduction = Math.max(0, input.deduction80G);
    
    // 80TTA / 80TTB: Interest income deduction
    let interestDeduction = 0;
    if (input.age >= 60) {
      interestDeduction = Math.min(50000, Math.max(0, input.deduction80TTB));
    } else {
      interestDeduction = Math.min(10000, Math.max(0, input.deduction80TTA));
    }
    
    totalDeductions = cDeduction + dDeduction + npsDeduction + gDeduction + interestDeduction;
    // Deductions cannot exceed gross total income minus capital gains (deductions can't be set off against CG)
    const maxAllowedDeductions = Math.max(0, grossTotalIncome - tradingNetIncome);
    totalDeductions = Math.min(totalDeductions, maxAllowedDeductions);
  }

  // 4. Net Taxable Income on Slabs (Gross Total Income - Deductions - Capital Gains)
  const netSlabIncome = Math.max(0, grossTotalIncome - totalDeductions - tradingNetIncome);

  // 5. Special rate Capital Gains tax
  const taxableSTCG = input.stcgTrading;
  // LTCG: 1.25L exemption applies on LTCG. Tax on LTCG is 12.5%
  const taxableLTCG = Math.max(0, input.ltcgTrading - 125000);
  
  const taxOnSTCG = taxableSTCG * 0.20; // 20% STCG
  const taxOnLTCG = taxableLTCG * 0.125; // 12.5% LTCG

  // 6. Slab Tax Calculation (incorporating partial integration of Agricultural income if applicable)
  let taxOnSlabs = 0;
  const hasAgriIntegration = input.sector === 'agriculture' && input.agriIncome > 5000 && netSlabIncome > (regime === 'old' ? 250000 : 400000);
  
  const slabs = regime === 'old' ? OLD_REGIME_SLABS : NEW_REGIME_SLABS;
  const basicExemption = regime === 'old' ? 250000 : 400000;

  if (hasAgriIntegration) {
    // Step 1: Tax on (Net Slab Income + Agri Income)
    const step1Tax = getSlabTax(netSlabIncome + input.agriIncome, slabs);
    // Step 2: Tax on (Basic Exemption + Agri Income)
    const step2Tax = getSlabTax(basicExemption + input.agriIncome, slabs);
    // Step 3: Net Tax on Slabs
    taxOnSlabs = Math.max(0, step1Tax - step2Tax);
  } else {
    taxOnSlabs = getSlabTax(netSlabIncome, slabs);
  }

  const grossTax = taxOnSlabs + taxOnSTCG + taxOnLTCG;

  // 7. Rebate under Section 87A & Marginal Relief
  let rebate87A = 0;
  let marginalRelief = 0;

  const totalTaxableIncomeWithCG = netSlabIncome + tradingNetIncome;

  if (regime === 'new') {
    // New Regime: Taxable income up to 12L is tax-free (rebate of up to 60k)
    if (totalTaxableIncomeWithCG <= 1200000) {
      rebate87A = grossTax; // Rebate covers the entire tax
    } else {
      // Marginal Relief: tax cannot exceed the income in excess of 12L
      const excessIncome = totalTaxableIncomeWithCG - 1200000;
      if (grossTax > excessIncome) {
        marginalRelief = grossTax - excessIncome;
      }
    }
  } else {
    // Old Regime: Taxable income up to 5L is tax-free (rebate up to 12.5k)
    if (totalTaxableIncomeWithCG <= 500000) {
      rebate87A = grossTax;
    }
  }

  const taxAfterRebate = Math.max(0, grossTax - rebate87A - marginalRelief);

  // 8. Surcharges (simplified for standard limits)
  let surchargeRate = 0;
  const surchargeBaseIncome = totalTaxableIncomeWithCG;
  if (surchargeBaseIncome > 20000000) {
    surchargeRate = 0.25;
  } else if (surchargeBaseIncome > 10000000) {
    surchargeRate = 0.15;
  } else if (surchargeBaseIncome > 5000000) {
    surchargeRate = 0.10;
  }
  const surcharge = taxAfterRebate * surchargeRate;

  // 9. Cess: 4% of (Tax + Surcharge)
  const cess = (taxAfterRebate + surcharge) * 0.04;

  const totalTaxLiability = taxAfterRebate + surcharge + cess;

  return {
    grossTotalIncome,
    exemptIncome,
    hraExempted,
    standardDeductionSalaried,
    businessNetIncome: totalBusinessNetIncome,
    rentalNetIncome,
    tradingNetIncome,
    totalDeductions,
    netTaxableIncome: netSlabIncome,
    taxableLTCG,
    taxableSTCG,
    taxOnSlabs,
    taxOnLTCG,
    taxOnSTCG,
    grossTax,
    rebate87A,
    marginalRelief,
    taxAfterRebate,
    surcharge,
    cess,
    totalTaxLiability: Math.round(totalTaxLiability),
  };
}

// Compare Old vs New Regimes
export function compareRegimes(input: TaxInput): TaxRegimeComparison {
  const oldRegime = calculateRegimeTax(input, 'old');
  const newRegime = calculateRegimeTax(input, 'new');
  
  const recommendedRegime = oldRegime.totalTaxLiability < newRegime.totalTaxLiability ? 'old' : 'new';
  const savings = Math.abs(oldRegime.totalTaxLiability - newRegime.totalTaxLiability);

  return {
    oldRegime,
    newRegime,
    recommendedRegime,
    savings,
  };
}

// Generate Optimizer Suggestions
export interface OptimizationSuggestion {
  id: string;
  section: string;
  title: string;
  description: string;
  potentialSavings: number;
  actionable: boolean;
}

export function generateSuggestions(
  input: TaxInput,
  comparison: TaxRegimeComparison
): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];
  
  const isNewRegimeBetter = comparison.recommendedRegime === 'new';
  
  // 1. NPS deduction under Sec 80CCD(1B)
  const currentNPS = input.deduction80CCD1B;
  if (currentNPS < 50000) {
    const additionalNPS = 50000 - currentNPS;
    const slabIncome = comparison.oldRegime.netTaxableIncome;
    let slabRate = 0;
    if (slabIncome > 1000000) slabRate = 0.30;
    else if (slabIncome > 500000) slabRate = 0.20;
    else if (slabIncome > 250000) slabRate = 0.05;
    
    const potentialSaving = additionalNPS * slabRate * 1.04;
    
    if (potentialSaving > 0) {
      suggestions.push({
        id: 'nps_80ccd_1b',
        section: 'Section 80CCD(1B)',
        title: 'Invest in National Pension Scheme (NPS)',
        description: `Invest an additional ₹${additionalNPS.toLocaleString('en-IN')} in NPS to claim deduction under Section 80CCD(1B). This is over and above the ₹1.5 Lakh limit of Section 80C.`,
        potentialSavings: Math.round(potentialSaving),
        actionable: true,
      });
    }
  }

  // 2. Health Insurance under Sec 80D
  const currentHealthIns = input.deduction80D;
  const selfLimit = input.age >= 60 ? 50000 : 25000;
  const parentsLimit = input.deduction80DParentsSenior ? 50000 : 25000;
  const maxPossibleHealthDeduction = selfLimit + parentsLimit;
  
  if (currentHealthIns < maxPossibleHealthDeduction) {
    const additionalD = maxPossibleHealthDeduction - currentHealthIns;
    const slabIncome = comparison.oldRegime.netTaxableIncome;
    let slabRate = 0;
    if (slabIncome > 1000000) slabRate = 0.30;
    else if (slabIncome > 500000) slabRate = 0.20;
    else if (slabIncome > 250000) slabRate = 0.05;
    
    const potentialSaving = additionalD * slabRate * 1.04;
    
    if (potentialSaving > 0) {
      suggestions.push({
        id: 'health_80d',
        section: 'Section 80D',
        title: 'Get Health Insurance for Self & Parents',
        description: `Get health insurance coverage or pay for preventive health checkups. You can claim up to ₹${selfLimit.toLocaleString('en-IN')} for self/family and up to ₹${parentsLimit.toLocaleString('en-IN')} for senior citizen parents.`,
        potentialSavings: Math.round(potentialSaving),
        actionable: true,
      });
    }
  }

  // 3. Section 80C check
  const current80C = input.deduction80C;
  if (current80C < 150000) {
    const additional80C = 150000 - current80C;
    const slabIncome = comparison.oldRegime.netTaxableIncome;
    let slabRate = 0;
    if (slabIncome > 1000000) slabRate = 0.30;
    else if (slabIncome > 500000) slabRate = 0.20;
    else if (slabIncome > 250000) slabRate = 0.05;
    
    const potentialSaving = additional80C * slabRate * 1.04;
    
    if (potentialSaving > 0) {
      suggestions.push({
        id: 'investment_80c',
        section: 'Section 80C',
        title: 'Maximize Section 80C Investments',
        description: `Invest in ELSS tax-saving mutual funds, PPF, EPF, National Savings Certificate (NSC), or life insurance premiums to exhaust the ₹1.5 Lakh limit. You need ₹${additional80C.toLocaleString('en-IN')} more to maximize this.`,
        potentialSavings: Math.round(potentialSaving),
        actionable: true,
      });
    }
  }

  // 4. Presumptive Taxation Section 44ADA / 44AD for Businesses/Professionals
  if (input.sector === 'business' && !input.businessPresumptive) {
    const actualExpensePercent = input.businessGrossReceipts > 0 ? (input.businessExpenses / input.businessGrossReceipts) : 0;
    
    if (input.professionalPresumptive && actualExpensePercent < 0.5) {
      const presumptiveProfit = input.businessGrossReceipts * 0.5;
      const actualProfit = input.businessGrossReceipts - input.businessExpenses;
      const profitDifference = actualProfit - presumptiveProfit;
      
      const activeRegime = comparison.recommendedRegime === 'new' ? comparison.newRegime : comparison.oldRegime;
      let slabRate = 0;
      const slabIncome = activeRegime.netTaxableIncome;
      if (comparison.recommendedRegime === 'new') {
        if (slabIncome > 2400000) slabRate = 0.30;
        else if (slabIncome > 2000000) slabRate = 0.25;
        else if (slabIncome > 1600000) slabRate = 0.20;
        else if (slabIncome > 1200000) slabRate = 0.15;
        else if (slabIncome > 800000) slabRate = 0.10;
        else if (slabIncome > 400000) slabRate = 0.05;
      } else {
        if (slabIncome > 1000000) slabRate = 0.30;
        else if (slabIncome > 500000) slabRate = 0.20;
        else if (slabIncome > 250000) slabRate = 0.05;
      }
      
      const potentialSaving = profitDifference * slabRate * 1.04;
      if (potentialSaving > 0) {
        suggestions.push({
          id: 'presumptive_44ada',
          section: 'Section 44ADA',
          title: 'Opt for Presumptive Taxation (Professionals)',
          description: `As a professional, you can legally declare 50% of your gross receipts as income under Section 44ADA. Since your actual expenses are low, this will reduce your taxable business income by ₹${profitDifference.toLocaleString('en-IN')}.`,
          potentialSavings: Math.round(potentialSaving),
          actionable: true,
        });
      }
    }
  }

  // 5. HRA restructure (for salaried)
  if (input.sector === 'salaried' && input.rentPaid > 0 && input.hraReceived === 0) {
    suggestions.push({
      id: 'hra_restructure',
      section: 'HRA Restructuring',
      title: 'Restructure Salary to Include HRA',
      description: 'You pay rent but do not receive HRA in your salary structure. Request your employer to restructure your salary component to include HRA (up to 40-50% of basic salary) to make rent payments tax-deductible.',
      potentialSavings: Math.round(input.rentPaid * 0.2),
      actionable: false,
    });
  }

  // 6. Capital gains offset suggestion (for traders)
  if (input.sector === 'trading' && input.stcgTrading > 0) {
    suggestions.push({
      id: 'capital_gains_harvesting',
      section: 'Tax Harvesting',
      title: 'Tax Loss Harvesting',
      description: 'You have short term capital gains. You can sell underperforming shares/mutual funds before the financial year ends to book capital losses, which can offset your gains and reduce your tax liability.',
      potentialSavings: Math.round(input.stcgTrading * 0.20),
      actionable: false,
    });
  }

  // 7. General suggestion if New regime is better but user has high deductions
  if (isNewRegimeBetter && (input.deduction80C > 0 || input.deduction80D > 0 || input.homeLoanInterest > 0)) {
    suggestions.push({
      id: 'regime_switch_info',
      section: 'Regime Selection',
      title: 'Switch completely to New Tax Regime',
      description: `Even with your deductions (₹${(input.deduction80C + input.deduction80D).toLocaleString('en-IN')}), the New Tax Regime is cheaper by ₹${comparison.savings.toLocaleString('en-IN')} due to its wider slabs and higher tax-free limits (up to ₹12 Lakhs rebate).`,
      potentialSavings: comparison.savings,
      actionable: true,
    });
  } else if (!isNewRegimeBetter) {
    suggestions.push({
      id: 'regime_switch_new',
      section: 'Regime Selection',
      title: 'Consider New Regime if Investments are Low',
      description: `The Old Regime is currently cheaper by ₹${comparison.savings.toLocaleString('en-IN')} because of your deductions. If you cannot maintain these investments in the future, the New Regime offers lower tax rates without requiring any investments.`,
      potentialSavings: 0,
      actionable: false,
    });
  }

  return suggestions.sort((a, b) => b.potentialSavings - a.potentialSavings);
}
