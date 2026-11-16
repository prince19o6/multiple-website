import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import { useSite } from '@/store/SiteConfigContext';
import { useCurrency, SUPPORTED_CURRENCIES } from './CurrencyContext';
import { TripExpense, DestinationCostGuide, GroupBalanceItem, ExpenseCategory } from '../types';
import { fetchDestinationCostGuide, syncTripExpenses } from '../services/api';
import { storeGetObject, storeSetObject, storeGet, storeSet } from '../src/lib/storage';

interface CategoryBreakdownItem {
  category: ExpenseCategory;
  total: number;
  percentage: number;
  count: number;
}

interface SettlementItem {
  from: string;
  to: string;
  amount: number;
}

interface TripBudgetContextType {
  totalBudget: number;
  expenses: TripExpense[];
  costGuide: DestinationCostGuide | null;
  isLoading: boolean;
  isSyncing: boolean;
  totalSpent: number;
  budgetRemaining: number;
  budgetPercentage: number;
  categoryBreakdown: CategoryBreakdownItem[];
  groupBalances: GroupBalanceItem[];
  settlements: SettlementItem[];
  uniqueTravelers: string[];
  setBudgetLimit: (amount: number) => Promise<void>;
  addExpense: (expense: Omit<TripExpense, 'id' | 'convertedAmount' | 'displayCurrency' | 'createdAt'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  clearAllExpenses: () => Promise<void>;
  syncWithCloud: () => Promise<void>;
  generateWhatsAppReport: () => string;
}

const TripBudgetContext = createContext<TripBudgetContextType | undefined>(undefined);

const getExpensesStorageKey = (siteId: string) => `@toursapp_trip_expenses:${siteId}`;
const getBudgetStorageKey = (siteId: string) => `@toursapp_trip_budget_limit:${siteId}`;

export const TripBudgetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { siteId, siteName } = useSite();
  const { currentCurrency, currencyCode, currencySymbol } = useCurrency();

  const [totalBudget, setTotalBudget] = useState<number>(siteId.includes('techno') ? 5000 : siteId.includes('tripgo') ? 35000 : 50000);
  const [expenses, setExpenses] = useState<TripExpense[]>([]);
  const [costGuide, setCostGuide] = useState<DestinationCostGuide | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Currency conversion helper
  const convertToDisplayCurrency = useCallback((amount: number, fromCurrencyCode: string): number => {
    const fromDef = SUPPORTED_CURRENCIES.find((c) => c.code === fromCurrencyCode) || { rate: 1.0 };
    const toDef = currentCurrency;

    // USD = amount / fromRate
    const amountInUSD = amount / (fromDef.rate || 1.0);
    // Target = amountInUSD * toRate
    return Math.round(amountInUSD * toDef.rate * 100) / 100;
  }, [currentCurrency]);

  // Load stored budget & expenses
  useEffect(() => {
    let isMounted = true;
    const expensesKey = getExpensesStorageKey(siteId);
    const budgetKey = getBudgetStorageKey(siteId);

    Promise.all([
      storeGetObject<TripExpense[]>(expensesKey),
      storeGet(budgetKey),
      fetchDestinationCostGuide(siteId).catch(() => null),
    ])
      .then(([storedExpenses, storedBudget, guide]) => {
        if (!isMounted) return;

        if (guide) {
          setCostGuide(guide);
        }

        if (storedBudget) {
          const parsed = parseFloat(storedBudget);
          if (!isNaN(parsed) && parsed > 0) {
            setTotalBudget(parsed);
          }
        } else {
          // Default initial budget based on site currency
          const defaultLimit = siteId.includes('techno') ? 5000 : siteId.includes('tripgo') ? 35000 : 50000;
          setTotalBudget(defaultLimit);
        }

        if (storedExpenses && storedExpenses.length > 0) {
          setExpenses(storedExpenses);
        } else {
          // Seed realistic sample expenses
          const today = new Date().toISOString().split('T')[0];
          const sampleExpenses: TripExpense[] = siteId.includes('tripgo')
            ? [
                {
                  id: 'exp_tg_1',
                  title: 'Longtail Speedboat Fuel & Captain Surcharge',
                  amount: 1800,
                  currency: 'THB',
                  convertedAmount: convertToDisplayCurrency(1800, 'THB'),
                  displayCurrency: currencyCode,
                  category: 'transport',
                  paymentMethod: 'cash',
                  paidBy: 'Alex',
                  splitWith: ['Alex', 'Maya', 'Sam'],
                  date: today,
                  location: 'Phi Phi Pier',
                  createdAt: new Date().toISOString(),
                },
                {
                  id: 'exp_tg_2',
                  title: 'Seafood Dinner & Fresh Coconut Drinks',
                  amount: 1450,
                  currency: 'THB',
                  convertedAmount: convertToDisplayCurrency(1450, 'THB'),
                  displayCurrency: currencyCode,
                  category: 'dining',
                  paymentMethod: 'credit_card',
                  paidBy: 'Maya',
                  splitWith: ['Alex', 'Maya', 'Sam'],
                  date: today,
                  location: 'Ao Nang Night Market',
                  createdAt: new Date().toISOString(),
                },
              ]
            : siteId.includes('techno')
            ? [
                {
                  id: 'exp_th_1',
                  title: 'Atmosphere Level 122 Lounge Drinks',
                  amount: 480,
                  currency: 'AED',
                  convertedAmount: convertToDisplayCurrency(480, 'AED'),
                  displayCurrency: currencyCode,
                  category: 'dining',
                  paymentMethod: 'credit_card',
                  paidBy: 'David',
                  splitWith: ['David', 'Elena'],
                  date: today,
                  location: 'Burj Khalifa Downtown',
                  createdAt: new Date().toISOString(),
                },
                {
                  id: 'exp_th_2',
                  title: 'Private Chauffeur Gratuity',
                  amount: 100,
                  currency: 'AED',
                  convertedAmount: convertToDisplayCurrency(100, 'AED'),
                  displayCurrency: currencyCode,
                  category: 'tipping',
                  paymentMethod: 'cash',
                  paidBy: 'David',
                  splitWith: ['David', 'Elena'],
                  date: today,
                  location: 'The Palm Jumeirah',
                  createdAt: new Date().toISOString(),
                },
              ]
            : [
                {
                  id: 'exp_gj_1',
                  title: 'Pure Gujarati Kathiyawadi Thali Lunch',
                  amount: 1400,
                  currency: 'INR',
                  convertedAmount: convertToDisplayCurrency(1400, 'INR'),
                  displayCurrency: currencyCode,
                  category: 'dining',
                  paymentMethod: 'upi',
                  paidBy: 'Pravin Bhai',
                  splitWith: ['Pravin Bhai', 'Bhavna Ben', 'Rohan'],
                  date: today,
                  location: 'Dwarka Gomti Ghat',
                  createdAt: new Date().toISOString(),
                },
                {
                  id: 'exp_gj_2',
                  title: 'VIP Darshan Pass & Prasad',
                  amount: 1500,
                  currency: 'INR',
                  convertedAmount: convertToDisplayCurrency(1500, 'INR'),
                  displayCurrency: currencyCode,
                  category: 'activities',
                  paymentMethod: 'cash',
                  paidBy: 'Rohan',
                  splitWith: ['Pravin Bhai', 'Bhavna Ben', 'Rohan'],
                  date: today,
                  location: 'Somnath Temple Complex',
                  createdAt: new Date().toISOString(),
                },
                {
                  id: 'exp_gj_3',
                  title: 'Authentic Patola Silk Scarf & Handicrafts',
                  amount: 4500,
                  currency: 'INR',
                  convertedAmount: convertToDisplayCurrency(4500, 'INR'),
                  displayCurrency: currencyCode,
                  category: 'shopping',
                  paymentMethod: 'credit_card',
                  paidBy: 'Bhavna Ben',
                  splitWith: ['Bhavna Ben'],
                  date: today,
                  location: 'Patan Emporium',
                  createdAt: new Date().toISOString(),
                },
              ];

          setExpenses(sampleExpenses);
          storeSetObject(expensesKey, sampleExpenses);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [siteId, convertToDisplayCurrency, currencyCode]);

  // Recalculate converted amounts when display currency changes
  useEffect(() => {
    if (expenses.length > 0) {
      const updated = expenses.map((exp) => ({
        ...exp,
        convertedAmount: convertToDisplayCurrency(exp.amount, exp.currency),
        displayCurrency: currencyCode,
      }));
      setExpenses(updated);
    }
  }, [currentCurrency, convertToDisplayCurrency, currencyCode]);

  const setBudgetLimit = useCallback(
    async (amount: number) => {
      setTotalBudget(amount);
      const budgetKey = getBudgetStorageKey(siteId);
      await storeSet(budgetKey, amount.toString());

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    },
    [siteId]
  );

  const addExpense = useCallback(
    async (raw: Omit<TripExpense, 'id' | 'convertedAmount' | 'displayCurrency' | 'createdAt'>) => {
      const expensesKey = getExpensesStorageKey(siteId);
      const converted = convertToDisplayCurrency(raw.amount, raw.currency);

      const newExp: TripExpense = {
        ...raw,
        id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        convertedAmount: converted,
        displayCurrency: currencyCode,
        createdAt: new Date().toISOString(),
      };

      const updated = [newExp, ...expenses];
      setExpenses(updated);
      await storeSetObject(expensesKey, updated);

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    },
    [expenses, siteId, convertToDisplayCurrency, currencyCode]
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      const expensesKey = getExpensesStorageKey(siteId);
      const updated = expenses.filter((e) => e.id !== id);
      setExpenses(updated);
      await storeSetObject(expensesKey, updated);

      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    },
    [expenses, siteId]
  );

  const clearAllExpenses = useCallback(async () => {
    const expensesKey = getExpensesStorageKey(siteId);
    setExpenses([]);
    await storeSetObject(expensesKey, []);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}
  }, [siteId]);

  const syncWithCloud = useCallback(async () => {
    setIsSyncing(true);
    try {
      await syncTripExpenses(
        {
          totalBudget,
          currency: currencyCode,
          expenses,
        },
        siteId
      );

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    } catch {
      // offline fallback
    } finally {
      setIsSyncing(false);
    }
  }, [expenses, totalBudget, currencyCode, siteId]);

  // Total spent in active display currency
  const totalSpent = useMemo(() => {
    return Math.round(expenses.reduce((sum, e) => sum + e.convertedAmount, 0) * 100) / 100;
  }, [expenses]);

  const budgetRemaining = useMemo(() => {
    return Math.max(0, Math.round((totalBudget - totalSpent) * 100) / 100);
  }, [totalBudget, totalSpent]);

  const budgetPercentage = useMemo(() => {
    if (totalBudget <= 0) return 0;
    return Math.min(100, Math.round((totalSpent / totalBudget) * 100));
  }, [totalBudget, totalSpent]);

  // Category breakdown
  const categoryBreakdown = useMemo((): CategoryBreakdownItem[] => {
    const map: Record<string, { total: number; count: number }> = {};

    expenses.forEach((e) => {
      if (!map[e.category]) {
        map[e.category] = { total: 0, count: 0 };
      }
      map[e.category].total += e.convertedAmount;
      map[e.category].count += 1;
    });

    return Object.keys(map).map((cat) => {
      const catTotal = Math.round(map[cat].total * 100) / 100;
      const pct = totalSpent > 0 ? Math.round((catTotal / totalSpent) * 100) : 0;
      return {
        category: cat as ExpenseCategory,
        total: catTotal,
        percentage: pct,
        count: map[cat].count,
      };
    }).sort((a, b) => b.total - a.total);
  }, [expenses, totalSpent]);

  // Unique travelers in expenses
  const uniqueTravelers = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      if (e.paidBy) set.add(e.paidBy.trim());
      (e.splitWith || []).forEach((t) => set.add(t.trim()));
    });
    return Array.from(set).filter(Boolean);
  }, [expenses]);

  // Group balances & settlement logic
  const groupBalances = useMemo((): GroupBalanceItem[] => {
    if (uniqueTravelers.length === 0) return [];

    const paidMap: Record<string, number> = {};
    const shareMap: Record<string, number> = {};

    uniqueTravelers.forEach((t) => {
      paidMap[t] = 0;
      shareMap[t] = 0;
    });

    expenses.forEach((e) => {
      const payer = e.paidBy.trim();
      const splitters = (e.splitWith && e.splitWith.length > 0) ? e.splitWith.map(s => s.trim()) : [payer];
      const perPerson = e.convertedAmount / splitters.length;

      paidMap[payer] = (paidMap[payer] || 0) + e.convertedAmount;

      splitters.forEach((s) => {
        shareMap[s] = (shareMap[s] || 0) + perPerson;
      });
    });

    return uniqueTravelers.map((t) => {
      const totalPaid = Math.round((paidMap[t] || 0) * 100) / 100;
      const fairShare = Math.round((shareMap[t] || 0) * 100) / 100;
      const net = Math.round((totalPaid - fairShare) * 100) / 100;
      return {
        traveler: t,
        totalPaid,
        fairShare,
        netBalance: net,
      };
    }).sort((a, b) => b.netBalance - a.netBalance);
  }, [expenses, uniqueTravelers]);

  // Settlements ("Alex pays Maria")
  const settlements = useMemo((): SettlementItem[] => {
    const debtors: { traveler: string; amount: number }[] = [];
    const creditors: { traveler: string; amount: number }[] = [];

    groupBalances.forEach((b) => {
      if (b.netBalance < -0.01) {
        debtors.push({ traveler: b.traveler, amount: Math.abs(b.netBalance) });
      } else if (b.netBalance > 0.01) {
        creditors.push({ traveler: b.traveler, amount: b.netBalance });
      }
    });

    const result: SettlementItem[] = [];
    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];
      const settled = Math.min(debtor.amount, creditor.amount);

      if (settled > 0.01) {
        result.push({
          from: debtor.traveler,
          to: creditor.traveler,
          amount: Math.round(settled * 100) / 100,
        });
      }

      debtor.amount -= settled;
      creditor.amount -= settled;

      if (debtor.amount <= 0.01) dIdx++;
      if (creditor.amount <= 0.01) cIdx++;
    }

    return result;
  }, [groupBalances]);

  // Format WhatsApp shareable summary report
  const generateWhatsAppReport = useCallback((): string => {
    const header = `*Trip Budget & Expense Report* • _${siteName}_\n\n`;
    const budgetSummary = `*Total Budget:* ${currencySymbol}${totalBudget.toLocaleString()}\n*Total Spent:* ${currencySymbol}${totalSpent.toLocaleString()}\n*Remaining:* ${currencySymbol}${budgetRemaining.toLocaleString()} (${100 - budgetPercentage}% left)\n\n`;

    let categoryText = `*Spending by Category:*\n`;
    categoryBreakdown.forEach((c) => {
      categoryText += `• ${c.category.toUpperCase()}: ${currencySymbol}${c.total.toLocaleString()} (${c.percentage}%)\n`;
    });

    let settlementText = `\n*Group Settlement Plan:*\n`;
    if (settlements.length === 0) {
      settlementText += `All group balances are settled up! 🎉\n`;
    } else {
      settlements.forEach((s) => {
        settlementText += `• *${s.from}* owes *${s.to}*: ${currencySymbol}${s.amount.toLocaleString()}\n`;
      });
    }

    return `${header}${budgetSummary}${categoryText}${settlementText}\n_Generated on ${new Date().toLocaleDateString()}_`;
  }, [siteName, totalBudget, totalSpent, budgetRemaining, budgetPercentage, categoryBreakdown, settlements, currencySymbol]);

  return (
    <TripBudgetContext.Provider
      value={{
        totalBudget,
        expenses,
        costGuide,
        isLoading,
        isSyncing,
        totalSpent,
        budgetRemaining,
        budgetPercentage,
        categoryBreakdown,
        groupBalances,
        settlements,
        uniqueTravelers,
        setBudgetLimit,
        addExpense,
        deleteExpense,
        clearAllExpenses,
        syncWithCloud,
        generateWhatsAppReport,
      }}
    >
      {children}
    </TripBudgetContext.Provider>
  );
};

export const useTripBudget = (): TripBudgetContextType => {
  const context = useContext(TripBudgetContext);
  if (!context) {
    throw new Error('useTripBudget must be used within a TripBudgetProvider');
  }
  return context;
};
