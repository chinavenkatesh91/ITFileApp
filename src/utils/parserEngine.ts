import type { TaxInput } from './taxEngine';

// Parse number with words like "lakh", "k", "lpa", etc.
export function parseNumberValue(text: string): number {
  // Clean text and extract numbers
  const cleaned = text.toLowerCase().replace(/,/g, '');
  
  // Find matching numbers
  const match = cleaned.match(/(\d+(?:\.\d+)?)\s*(lakh|lakhs|l|k|thousand|cr|crore|lpa)?/);
  if (!match) return 0;
  
  const num = parseFloat(match[1]);
  const unit = match[2];
  
  if (!unit) return num;
  if (unit === 'k' || unit === 'thousand') return num * 1000;
  if (unit === 'lakh' || unit === 'lakhs' || unit === 'l' || unit === 'lpa') return num * 100000;
  if (unit === 'cr' || unit === 'crore') return num * 10000000;
  
  return num;
}

// Extract value associated with a regex pattern
function extractValueForPattern(text: string, pattern: RegExp): number {
  const matches = text.match(pattern);
  if (!matches) return 0;
  // Get the segment with the number, parse it
  return parseNumberValue(matches[0]);
}

export interface ParsedDocumentResult {
  detectedCategory: 'salaried' | 'business' | 'real_estate' | 'trading' | 'agriculture' | 'gst';
  documentType: string;
  extractedData: Partial<TaxInput> & {
    gstDetails?: {
      grossTurnover: number;
      taxableValue: number;
      cgst: number;
      sgst: number;
      igst: number;
      eligibleITC: number;
    }
  };
  rawTextAnalyzed: string;
}

// Parse Natural Language inputs
export function parseNaturalLanguageTax(text: string): Partial<TaxInput> {
  const parsed: Partial<TaxInput> = {};
  const lowerText = text.toLowerCase();

  // 1. Detect Sector
  if (lowerText.includes('salary') || lowerText.includes('salaried') || lowerText.includes('employer') || lowerText.includes('wages')) {
    parsed.sector = 'salaried';
  } else if (lowerText.includes('business') || lowerText.includes('profession') || lowerText.includes('44ad') || lowerText.includes('44ada') || lowerText.includes('receipts')) {
    parsed.sector = 'business';
  } else if (lowerText.includes('rent') || lowerText.includes('rental') || lowerText.includes('real estate') || lowerText.includes('property') || lowerText.includes('let out')) {
    parsed.sector = 'real_estate';
  } else if (lowerText.includes('trade') || lowerText.includes('trading') || lowerText.includes('stcg') || lowerText.includes('ltcg') || lowerText.includes('shares') || lowerText.includes('stocks') || lowerText.includes('options') || lowerText.includes('f&o')) {
    parsed.sector = 'trading';
  } else if (lowerText.includes('agri') || lowerText.includes('agriculture') || lowerText.includes('farm') || lowerText.includes('crops')) {
    parsed.sector = 'agriculture';
  } else if (lowerText.includes('school') || lowerText.includes('college') || lowerText.includes('education') || lowerText.includes('exempt') || lowerText.includes('trust')) {
    parsed.sector = 'exempt';
  }

  // 2. Extract Salaried Professional figures
  if (lowerText.includes('salary') || lowerText.includes('earn') || lowerText.includes('lpa')) {
    // Matches expressions like "salary of 15 lakhs", "earn 12 lpa", "salary: 8,00,000", "salary 1000000"
    parsed.salaryIncome = extractValueForPattern(lowerText, /(?:salary|earn|earning|income)(?:\s+of|\s*[:=]?)?\s*(\d+(?:\.\d+)?\s*(?:lakh|lakhs|l|k|cr|crore|lpa)?)/);
  }
  
  if (lowerText.includes('hra') || lowerText.includes('house rent allowance')) {
    parsed.hraReceived = extractValueForPattern(lowerText, /(?:hra|house rent allowance)(?:\s+of|\s*[:=]?)?\s*(\d+(?:\.\d+)?\s*(?:lakh|lakhs|l|k)?)/);
  }

  if (lowerText.includes('basic') || lowerText.includes('basic salary')) {
    parsed.basicSalary = extractValueForPattern(lowerText, /(?:basic salary|basic)(?:\s+of|\s*[:=]?)?\s*(\d+(?:\.\d+)?\s*(?:lakh|lakhs|l|k)?)/);
  }

  if (lowerText.includes('rent paid') || lowerText.includes('pay rent') || lowerText.includes('paying rent')) {
    // Check for yearly or monthly rent
    const monthlyMatch = lowerText.match(/(?:pay rent of|rent of|paying rent of)\s*(\d+(?:\.\d+)?\s*(?:k|thousand)?)\s*(?:per month|pm|\/month)/);
    if (monthlyMatch) {
      parsed.rentPaid = parseNumberValue(monthlyMatch[1]) * 12;
    } else {
      parsed.rentPaid = extractValueForPattern(lowerText, /(?:rent paid|pay rent|paying rent)(?:\s+of|\s*[:=]?)?\s*(\d+(?:\.\d+)?\s*(?:lakh|lakhs|l|k)?)/);
    }
  }

  if (lowerText.includes('metro') || lowerText.includes('mumbai') || lowerText.includes('delhi') || lowerText.includes('kolkata') || lowerText.includes('chennai')) {
    parsed.metroCity = true;
  }

  // 3. Extract Business figures
  if (lowerText.includes('receipts') || lowerText.includes('turnover') || lowerText.includes('gross receipts') || lowerText.includes('sales')) {
    parsed.businessGrossReceipts = extractValueForPattern(lowerText, /(?:receipts|turnover|gross receipts|sales)(?:\s+of|\s*[:=]?)?\s*(\d+(?:\.\d+)?\s*(?:lakh|lakhs|l|cr|crore)?)/);
  }

  if (lowerText.includes('expense') || lowerText.includes('expenses') || lowerText.includes('spent')) {
    parsed.businessExpenses = extractValueForPattern(lowerText, /(?:expense|expenses|spent|expenditure)(?:\s+of|\s*[:=]?)?\s*(\d+(?:\.\d+)?\s*(?:lakh|lakhs|l|k)?)/);
  }

  if (lowerText.includes('presumptive') || lowerText.includes('44ad') || lowerText.includes('44ada')) {
    parsed.businessPresumptive = true;
    if (lowerText.includes('44ada') || lowerText.includes('professional') || lowerText.includes('consultant') || lowerText.includes('doctor') || lowerText.includes('lawyer')) {
      parsed.professionalPresumptive = true;
    }
  }

  // 4. Extract Real Estate figures
  if (lowerText.includes('rent received') || lowerText.includes('rental income') || lowerText.includes('rented')) {
    const monthlyMatch = lowerText.match(/(?:rent received of|rental income of|rent of)\s*(\d+(?:\.\d+)?\s*(?:k|thousand)?)\s*(?:per month|pm|\/month)/);
    if (monthlyMatch) {
      parsed.rentalIncome = parseNumberValue(monthlyMatch[1]) * 12;
    } else {
      parsed.rentalIncome = extractValueForPattern(lowerText, /(?:rent received|rental income|rent from property)(?:\s+of|\s*[:=]?)?\s*(\d+(?:\.\d+)?\s*(?:lakh|lakhs|l|k)?)/);
    }
  }

  if (lowerText.includes('municipal tax') || lowerText.includes('property tax')) {
    parsed.municipalTaxes = extractValueForPattern(lowerText, /(?:municipal tax|municipal taxes|property tax)(?:\s+of|\s*[:=]?)?\s*(\d+(?:\.\d+)?\s*(?:lakh|lakhs|l|k)?)/);
  }

  if (lowerText.includes('home loan interest') || lowerText.includes('loan interest') || lowerText.includes('interest on loan') || lowerText.includes('housing loan')) {
    parsed.homeLoanInterest = extractValueForPattern(lowerText, /(?:home loan interest|loan interest|interest on loan|interest paid)(?:\s+of|\s*[:=]?)?\s*(\d+(?:\.\d+)?\s*(?:lakh|lakhs|l|k)?)/);
  }
  
  if (lowerText.includes('let out') || lowerText.includes('rented out')) {
    parsed.letOutProperty = true;
  }

  // 5. Extract Trading figures
  if (lowerText.includes('stcg') || lowerText.includes('short term') || lowerText.includes('short-term')) {
    parsed.stcgTrading = extractValueForPattern(lowerText, /(?:stcg|short term gain|short term gains|short term capital gains)(?:\s+of|\s*[:=]?)?\s*(\d+(?:\.\d+)?\s*(?:lakh|lakhs|l|k)?)/);
  }

  if (lowerText.includes('ltcg') || lowerText.includes('long term') || lowerText.includes('long-term')) {
    parsed.ltcgTrading = extractValueForPattern(lowerText, /(?:ltcg|long term gain|long term gains|long term capital gains)(?:\s+of|\s*[:=]?)?\s*(\d+(?:\.\d+)?\s*(?:lakh|lakhs|l|k)?)/);
  }

  if (lowerText.includes('f&o') || lowerText.includes('futures') || lowerText.includes('options')) {
    parsed.foTradingProfit = extractValueForPattern(lowerText, /(?:f&o|futures and options|f&o profit|trading profit)(?:\s+of|\s*[:=]?)?\s*(\d+(?:\.\d+)?\s*(?:lakh|lakhs|l|k)?)/);
  }

  // 6. Extract Agriculture figures
  if (lowerText.includes('agri') || lowerText.includes('agricultural') || lowerText.includes('agriculture')) {
    parsed.agriIncome = extractValueForPattern(lowerText, /(?:agri income|agricultural income|agriculture profit|farming income)(?:\s+of|\s*[:=]?)?\s*(\d+(?:\.\d+)?\s*(?:lakh|lakhs|l|k)?)/);
  }

  // 7. Extract Other Income figures
  if (lowerText.includes('interest') || lowerText.includes('dividend') || lowerText.includes('other income')) {
    parsed.otherIncome = extractValueForPattern(lowerText, /(?:interest income|bank interest|dividend|other income|dividends)(?:\s+of|\s*[:=]?)?\s*(\d+(?:\.\d+)?\s*(?:lakh|lakhs|l|k)?)/);
  }

  // 8. Extract Deductions (Chapter VI-A)
  if (lowerText.includes('80c') || lowerText.includes('ppf') || lowerText.includes('elss') || lowerText.includes('lic')) {
    parsed.deduction80C = extractValueForPattern(lowerText, /(?:80c|ppf|elss|lic|investment in 80c)(?:\s+of|\s*[:=]?)?\s*(\d+(?:\.\d+)?\s*(?:lakh|lakhs|l|k)?)/);
  }

  if (lowerText.includes('80d') || lowerText.includes('health insurance') || lowerText.includes('medical insurance')) {
    parsed.deduction80D = extractValueForPattern(lowerText, /(?:80d|health insurance|medical insurance)(?:\s+of|\s*[:=]?)?\s*(\d+(?:\.\d+)?\s*(?:lakh|lakhs|l|k)?)/);
  }

  if (lowerText.includes('nps') || lowerText.includes('80ccd')) {
    parsed.deduction80CCD1B = extractValueForPattern(lowerText, /(?:nps|80ccd|80ccd\(1b\))(?:\s+of|\s*[:=]?)?\s*(\d+(?:\.\d+)?\s*(?:lakh|lakhs|l|k)?)/);
  }

  if (lowerText.includes('donation') || lowerText.includes('charity') || lowerText.includes('80g')) {
    parsed.deduction80G = extractValueForPattern(lowerText, /(?:donation|charity|80g|donated)(?:\s+of|\s*[:=]?)?\s*(\d+(?:\.\d+)?\s*(?:lakh|lakhs|l|k)?)/);
  }

  return parsed;
}

// Preloaded mock document files template string contents
export const SAMPLE_DOCUMENTS = {
  form16: `PART B - DETAILS OF SALARY PAID AND ANY OTHER INCOME
============================================================
Employer Name: Tech Solutions India Pvt Ltd
Employee Name: Amit Kumar  (PAN: ABCDE1234F)
Assessment Year: 2026-27

1. Gross Salary under section 17(1):            Rs. 18,50,000
2. Value of perquisites under section 17(2):    Rs. 0
3. Profits in lieu of salary u/s 17(3):         Rs. 0
4. Total Gross Salary:                          Rs. 18,50,000

Allowances exempt under section 10:
- House Rent Allowance u/s 10(13A):             Rs. 1,20,000
- Leave Travel Allowance u/s 10(5):             Rs. 25,000

Deductions under Section 16:
- Standard Deduction u/s 16(ia):                Rs. 75,000
- Professional Tax u/s 16(iii):                 Rs. 2,500

Deductions under Chapter VI-A (Partially Declared):
- Section 80C (EPF/PPF/ELSS):                   Rs. 1,50,000
- Section 80D (Health Insurance):               Rs. 25,000`,

  form26as: `FORM 26AS - TAX CREDIT STATEMENT
============================================================
Financial Year: 2025-26
PAN: AXXXX9999Z
Name of Assessee: Rajesh Patel

PART A - Details of Tax Deducted at Source (TDS)
------------------------------------------------------------
1. Deductor: Star Trading Corp (TAN: BLRS01010A)
   - Transaction Date: 30-Mar-2026
   - Amount Paid/Credited:                     Rs. 12,00,000
   - Tax Deducted (TDS):                        Rs. 95,000
   - Section: 192 (Salary)

2. Deductor: State Bank of India
   - Amount Paid/Credited:                     Rs. 45,000
   - Tax Deducted (TDS):                        Rs. 4,500
   - Section: 194A (Interest other than securities)

3. Deductor: Retailers Real Estate Ltd
   - Amount Paid/Credited:                     Rs. 3,60,000
   - Tax Deducted (TDS):                        Rs. 36,000
   - Section: 194I (Rent on land/building)`,

  gstPortal: `GSTN PORTAL - FINANCIAL YEAR REPORT
============================================================
GSTIN: 27ABCDE1234F1Z0
Legal Name: Zenith Trading Co
Financial Year: 2025-26

SUMMARY OF OUTWARD SUPPLIES (GSTR-1 / GSTR-3B)
------------------------------------------------------------
- Gross Turnover (B2B + B2C):                   Rs. 48,00,000
- Taxable Value:                               Rs. 40,00,000
- Integrated Tax (IGST) Paid:                  Rs. 1,20,000
- Central Tax (CGST) Paid:                     Rs. 3,00,000
- State Tax (SGST) Paid:                       Rs. 3,00,000
- Total Outward Tax:                           Rs. 7,20,000

SUMMARY OF INWARD SUPPLIES & ITC (GSTR-2B)
------------------------------------------------------------
- Total Ineligible ITC (Section 17(5)):        Rs. 45,000
- Total Eligible ITC Available:                 Rs. 4,80,000
  * IGST Credit:                                Rs. 1,80,000
  * CGST Credit:                                Rs. 1,50,000
  * SGST Credit:                                Rs. 1,50,000`,

  rentalReceipt: `RENT RECEIPT
============================================================
Receipt No: RR-2025-12
Date: 05-Dec-2025

Received with thanks from Mr. Sandeep Sharma, a sum of Rs. 35,000
(Rupees Thirty-Five Thousand Only) as rent for Flat No. 1205,
Wing C, Skyline Heights, Sector 62, Gurgaon, Haryana
for the month of December 2025.

Landlord Details:
Name: Vikram Malhotra
PAN: VMALH4321P
Monthly Rent:                                  Rs. 35,000
Annual equivalent:                              Rs. 4,20,000
Municipal Tax paid by Landlord:                Rs. 15,000`
};

// Parser for simulated documents
export function parseDocumentContent(fileName: string, content: string): ParsedDocumentResult {
  const lowerContent = content.toLowerCase();
  const result: ParsedDocumentResult = {
    detectedCategory: 'salaried',
    documentType: 'Unknown',
    extractedData: {},
    rawTextAnalyzed: content
  };

  if (lowerContent.includes('form 16') || fileName.toLowerCase().includes('form16') || lowerContent.includes('employer name')) {
    result.detectedCategory = 'salaried';
    result.documentType = 'Form 16 (Salaried Certificate)';
    
    // Extract Salary
    const grossSalary = extractValueForPattern(lowerContent, /(?:gross salary under section 17\(1\)|total gross salary)(?:\s*[:=]|\s+rs\.)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/);
    // Extract HRA
    const hra = extractValueForPattern(lowerContent, /(?:house rent allowance u\/s 10\(13a\)|hra)(?:\s*[:=]|\s+rs\.)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/);
    // Extract 80C
    const c80 = extractValueForPattern(lowerContent, /(?:section 80c|80c)(?:\s*[:=]|\s+rs\.)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/);
    // Extract 80D
    const d80 = extractValueForPattern(lowerContent, /(?:section 80d|80d)(?:\s*[:=]|\s+rs\.)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/);
    
    result.extractedData = {
      sector: 'salaried',
      salaryIncome: grossSalary || 0,
      hraReceived: hra || 0,
      basicSalary: grossSalary ? Math.round(grossSalary * 0.45) : 0, // heuristic estimate for basic
      deduction80C: c80 || 0,
      deduction80D: d80 || 0,
    };
  }
  else if (lowerContent.includes('form 26as') || fileName.toLowerCase().includes('26as')) {
    result.detectedCategory = 'trading'; // default check, we'll map fields
    result.documentType = 'Form 26AS (Tax Statement)';
    
    // Extract Section 192 (Salary)
    const salary = extractValueForPattern(lowerContent, /(?:section:\s*192\s*\(salary\)|192).*?amount paid.*?(\d+(?:,\d+)*(?:\.\d+)?)/s) ||
                   extractValueForPattern(lowerContent, /(?:amount paid\/credited|credited).*?(\d+(?:,\d+)*(?:\.\d+)?).*?192/s);
                   
    // Extract Interest
    const interest = extractValueForPattern(lowerContent, /(?:194a|interest other than securities).*?amount paid.*?(\d+(?:,\d+)*(?:\.\d+)?)/s) ||
                     extractValueForPattern(lowerContent, /(?:amount paid\/credited|credited).*?(\d+(?:,\d+)*(?:\.\d+)?).*?194a/s);
                     
    // Extract Rent
    const rent = extractValueForPattern(lowerContent, /(?:194i|rent on land\/building).*?amount paid.*?(\d+(?:,\d+)*(?:\.\d+)?)/s) ||
                 extractValueForPattern(lowerContent, /(?:amount paid\/credited|credited).*?(\d+(?:,\d+)*(?:\.\d+)?).*?194i/s);

    const hasSalary = salary > 0;
    
    result.detectedCategory = hasSalary ? 'salaried' : 'real_estate';
    result.extractedData = {
      sector: hasSalary ? 'salaried' : 'real_estate',
      salaryIncome: salary || 0,
      otherIncome: interest || 0,
      rentalIncome: rent || 0,
    };
  }
  else if (lowerContent.includes('gstin') || lowerContent.includes('gstr-1') || lowerContent.includes('gstr-3b') || fileName.toLowerCase().includes('gst')) {
    result.detectedCategory = 'business';
    result.documentType = 'GST Portal Ledger Summary';
    
    const turnover = extractValueForPattern(lowerContent, /(?:gross turnover|turnover)(?:\s*[:=]|\s+rs\.)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/);
    const taxableVal = extractValueForPattern(lowerContent, /(?:taxable value)(?:\s*[:=]|\s+rs\.)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/);
    const cgst = extractValueForPattern(lowerContent, /(?:central tax|cgst paid)(?:\s*[:=]|\s+rs\.)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/);
    const sgst = extractValueForPattern(lowerContent, /(?:state tax|sgst paid)(?:\s*[:=]|\s+rs\.)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/);
    const igst = extractValueForPattern(lowerContent, /(?:integrated tax|igst paid)(?:\s*[:=]|\s+rs\.)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/);
    const itc = extractValueForPattern(lowerContent, /(?:eligible itc available|eligible itc)(?:\s*[:=]|\s+rs\.)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/);

    result.extractedData = {
      sector: 'business',
      businessGrossReceipts: turnover || taxableVal || 0,
      gstDetails: {
        grossTurnover: turnover || 0,
        taxableValue: taxableVal || 0,
        cgst: cgst || 0,
        sgst: sgst || 0,
        igst: igst || 0,
        eligibleITC: itc || 0,
      }
    };
  }
  else if (lowerContent.includes('rent receipt') || lowerContent.includes('received with thanks from')) {
    result.detectedCategory = 'real_estate';
    result.documentType = 'Rental Receipt';
    
    // Extract annual equivalent or monthly equivalent
    let rent = extractValueForPattern(lowerContent, /(?:annual equivalent|annual rent)(?:\s*[:=]|\s+rs\.)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/);
    if (!rent) {
      const monthly = extractValueForPattern(lowerContent, /(?:monthly rent|rent of)(?:\s*[:=]|\s+rs\.)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/);
      if (monthly) rent = monthly * 12;
    }
    
    const taxes = extractValueForPattern(lowerContent, /(?:municipal tax paid|property tax paid|municipal tax)(?:\s*[:=]|\s+rs\.)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/);
    
    result.extractedData = {
      sector: 'real_estate',
      rentalIncome: rent || 0,
      municipalTaxes: taxes || 0,
    };
  }

  return result;
}
