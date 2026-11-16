import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
  Share,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSite } from '@/store/SiteConfigContext';
import { useColors } from '@/store/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import { useTripBudget } from '../context/TripBudgetContext';
import { TripExpense, ExpenseCategory } from '../types';
import { AddExpenseModal } from '../components/AddExpenseModal';
import { SetBudgetModal } from '../components/SetBudgetModal';

type BudgetTab = 'expenses' | 'analytics' | 'splitter';

const CATEGORY_META: Record<
  ExpenseCategory,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  dining: { label: 'Dining', icon: 'restaurant', color: '#EF4444' },
  transport: { label: 'Transport', icon: 'car', color: '#3B82F6' },
  activities: { label: 'Activities', icon: 'compass', color: '#8B5CF6' },
  shopping: { label: 'Shopping', icon: 'bag-handle', color: '#EC4899' },
  tipping: { label: 'Tipping', icon: 'heart', color: '#10B981' },
  lodging: { label: 'Lodging', icon: 'bed', color: '#F59E0B' },
  other: { label: 'Other', icon: 'receipt', color: '#6B7280' },
};

export default function TripBudgetScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { siteName } = useSite();
  const colors = useColors();
  const { currencyCode, currencySymbol } = useCurrency();

  const {
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
    deleteExpense,
    syncWithCloud,
    generateWhatsAppReport,
  } = useTripBudget();

  const [activeTab, setActiveTab] = useState<BudgetTab>('expenses');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('all');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);

  // WhatsApp and Native Share
  const handleShareReport = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    const report = generateWhatsAppReport();
    const encoded = encodeURIComponent(report);
    const whatsappUrl = `whatsapp://send?text=${encoded}`;

    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
        return;
      }
    } catch {}

    // Fallback to Native Share Sheet
    Share.share({
      title: `${siteName} Trip Budget & Expense Report`,
      message: report,
    });
  };

  const handleCloudSync = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await syncWithCloud();
      Alert.alert('Sync Complete', 'Your trip expenses and budget are securely synced with cloud.');
    } catch {
      Alert.alert('Sync Offline', 'Expenses are saved locally on-device. Cloud sync will retry once online.');
    }
  };

  const handleDeleteExpense = (expense: TripExpense) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${expense.title}" (${expense.currency} ${expense.amount.toLocaleString()})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteExpense(expense.id),
        },
      ]
    );
  };

  const handleSendSettlementReminder = (from: string, to: string, amount: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    const msg = `Hi ${from}, here is a quick note regarding our ${siteName} trip expenses! The shared group balance shows ${currencySymbol}${amount.toLocaleString()} due to ${to}. Whenever convenient, please settle up! ✈️`;
    const encoded = encodeURIComponent(msg);
    const whatsappUrl = `whatsapp://send?text=${encoded}`;

    Linking.canOpenURL(whatsappUrl)
      .then((canOpen) => {
        if (canOpen) {
          Linking.openURL(whatsappUrl);
        } else {
          Share.share({ message: msg });
        }
      })
      .catch(() => {
        Share.share({ message: msg });
      });
  };

  // Filter expenses by selected category
  const filteredExpenses = selectedFilterCategory === 'all'
    ? expenses
    : expenses.filter((e) => e.category === selectedFilterCategory);

  // Status color based on percentage spent
  const progressColor =
    budgetPercentage >= 90 ? '#EF4444' : budgetPercentage >= 70 ? '#F59E0B' : '#10B981';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 12),
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity testID="btn-navigate"
            style={[styles.backBtn, { borderColor: colors.border }]}
            onPress={() => {
              try {
                Haptics.selectionAsync();
              } catch {}
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/bookings');
              }
            }}
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={20} color={colors.heading} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: colors.heading }]}>Trip Budget & Tracker</Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
              {expenses.length} Expenses • {siteName}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity testID="btn-cloud-upload-outline"
              style={[styles.actionBtn, { borderColor: colors.border }]}
              onPress={handleCloudSync}
              disabled={isSyncing}
              accessibilityLabel="Sync Cloud"
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="cloud-upload-outline" size={18} color={colors.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity testID="btn-logo-whatsapp"
              style={[styles.actionBtn, { backgroundColor: '#25D366', borderColor: '#25D366' }]}
              onPress={handleShareReport}
              accessibilityLabel="Share on WhatsApp"
            >
              <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Segment Controls */}
        <View style={[styles.segmentContainer, { backgroundColor: colors.background }]}>
          <TouchableOpacity testID="btn-receipt-outline" accessibilityLabel="receipt outline"
            style={[
              styles.segmentTab,
              activeTab === 'expenses' && [styles.segmentTabActive, { backgroundColor: colors.surface }],
            ]}
            onPress={() => {
              try {
                Haptics.selectionAsync();
              } catch {}
              setActiveTab('expenses');
            }}
          >
            <Ionicons
              name="receipt-outline"
              size={15}
              color={activeTab === 'expenses' ? colors.primary : colors.mutedText}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.segmentTabText,
                { color: activeTab === 'expenses' ? colors.primary : colors.mutedText },
              ]}
            >
              Expenses ({expenses.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity testID="btn-pie-chart-outline" accessibilityLabel="pie chart outline"
            style={[
              styles.segmentTab,
              activeTab === 'analytics' && [styles.segmentTabActive, { backgroundColor: colors.surface }],
            ]}
            onPress={() => {
              try {
                Haptics.selectionAsync();
              } catch {}
              setActiveTab('analytics');
            }}
          >
            <Ionicons
              name="pie-chart-outline"
              size={15}
              color={activeTab === 'analytics' ? colors.primary : colors.mutedText}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.segmentTabText,
                { color: activeTab === 'analytics' ? colors.primary : colors.mutedText },
              ]}
            >
              Analytics
            </Text>
          </TouchableOpacity>

          <TouchableOpacity testID="btn-people-outline" accessibilityLabel="people outline"
            style={[
              styles.segmentTab,
              activeTab === 'splitter' && [styles.segmentTabActive, { backgroundColor: colors.surface }],
            ]}
            onPress={() => {
              try {
                Haptics.selectionAsync();
              } catch {}
              setActiveTab('splitter');
            }}
          >
            <Ionicons
              name="people-outline"
              size={15}
              color={activeTab === 'splitter' ? colors.primary : colors.mutedText}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.segmentTabText,
                { color: activeTab === 'splitter' ? colors.primary : colors.mutedText },
              ]}
            >
              Group Split ({uniqueTravelers.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={[styles.mainScroll, { paddingBottom: Math.max(insets.bottom, 24) + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Master Budget Card */}
        <View style={[styles.masterCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.masterHeader}>
            <View>
              <Text style={[styles.masterSubtitle, { color: colors.mutedText }]}>TOTAL TRIP BUDGET</Text>
              <Text style={[styles.masterAmount, { color: colors.heading }]}>
                {currencySymbol}{totalBudget.toLocaleString()} <Text style={styles.masterCurrencyCode}>{currencyCode}</Text>
              </Text>
            </View>

            <TouchableOpacity testID="btn-pencil" accessibilityLabel="pencil"
              style={[styles.editLimitBtn, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` }]}
              onPress={() => setBudgetModalVisible(true)}
            >
              <Ionicons name="pencil" size={14} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.editLimitText, { color: colors.primary }]}>Edit Limit</Text>
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressTrack, { backgroundColor: `${colors.border}50` }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(100, budgetPercentage)}%`,
                  backgroundColor: progressColor,
                },
              ]}
            />
          </View>

          {/* Spending Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: colors.mutedText }]}>Spent So Far</Text>
              <Text style={[styles.statValue, { color: colors.heading }]}>
                {currencySymbol}{totalSpent.toLocaleString()}
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: colors.mutedText }]}>Remaining</Text>
              <Text style={[styles.statValue, { color: budgetRemaining > 0 ? '#10B981' : '#EF4444' }]}>
                {currencySymbol}{budgetRemaining.toLocaleString()}
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: colors.mutedText }]}>Budget Used</Text>
              <Text style={[styles.statValue, { color: progressColor }]}>
                {budgetPercentage}%
              </Text>
            </View>
          </View>
        </View>

        {/* TAB 1: EXPENSES LIST */}
        {activeTab === 'expenses' && (
          <View>
            {/* Category Filter Horizontal Scroll */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <TouchableOpacity testID="btn-trip-budget-373" accessibilityLabel="trip-budget action"
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: selectedFilterCategory === 'all' ? colors.primary : colors.surface,
                    borderColor: selectedFilterCategory === 'all' ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch {}
                  setSelectedFilterCategory('all');
                }}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: selectedFilterCategory === 'all' ? '#FFFFFF' : colors.text },
                  ]}
                >
                  All ({expenses.length})
                </Text>
              </TouchableOpacity>

              {Object.keys(CATEGORY_META).map((key) => {
                const meta = CATEGORY_META[key as ExpenseCategory];
                const count = expenses.filter((e) => e.category === key).length;
                const isSelected = selectedFilterCategory === key;

                return (
                  <TouchableOpacity testID="btn-trip-budget-404" accessibilityLabel="trip-budget action"
                    key={key}
                    style={[
                      styles.filterPill,
                      {
                        backgroundColor: isSelected ? meta.color : colors.surface,
                        borderColor: isSelected ? meta.color : colors.border,
                      },
                    ]}
                    onPress={() => {
                      try {
                        Haptics.selectionAsync();
                      } catch {}
                      setSelectedFilterCategory(key);
                    }}
                  >
                    <Ionicons
                      name={meta.icon}
                      size={13}
                      color={isSelected ? '#FFFFFF' : meta.color}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.filterPillText,
                        { color: isSelected ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {meta.label} {count > 0 ? `(${count})` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Expenses Cards */}
            {filteredExpenses.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="receipt-outline" size={48} color={colors.mutedText} style={{ marginBottom: 12 }} />
                <Text style={[styles.emptyTitle, { color: colors.heading }]}>No Expenses Recorded</Text>
                <Text style={[styles.emptySubtitle, { color: colors.mutedText }]}>
                  {selectedFilterCategory === 'all'
                    ? 'Start tracking your tour activities, meals, transport, and souvenirs.'
                    : `No expenses logged under ${CATEGORY_META[selectedFilterCategory as ExpenseCategory]?.label || selectedFilterCategory}.`}
                </Text>
                <TouchableOpacity testID="btn-add-circle" accessibilityLabel="add circle"
                  style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setAddModalVisible(true)}
                >
                  <Ionicons name="add-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.emptyBtnText}>Add First Expense</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredExpenses.map((exp) => {
                const meta = CATEGORY_META[exp.category] || CATEGORY_META.other;
                const isForeign = exp.currency !== currencyCode;

                return (
                  <View
                    key={exp.id}
                    style={[styles.expenseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <View style={styles.expenseTopRow}>
                      <View style={[styles.categoryCircle, { backgroundColor: `${meta.color}18` }]}>
                        <Ionicons name={meta.icon} size={20} color={meta.color} />
                      </View>

                      <View style={styles.expenseMainInfo}>
                        <Text style={[styles.expenseTitle, { color: colors.heading }]}>{exp.title}</Text>
                        <View style={styles.expenseMetaRow}>
                          <Text style={[styles.expenseDate, { color: colors.mutedText }]}>{exp.date}</Text>
                          {exp.location && (
                            <>
                              <Text style={[styles.dotSep, { color: colors.mutedText }]}>•</Text>
                              <Ionicons name="location" size={11} color={colors.mutedText} style={{ marginRight: 2 }} />
                              <Text style={[styles.expenseLocation, { color: colors.mutedText }]} numberOfLines={1}>
                                {exp.location}
                              </Text>
                            </>
                          )}
                        </View>
                      </View>

                      <View style={styles.expenseAmountWrap}>
                        <Text style={[styles.expenseConvertedAmount, { color: colors.heading }]}>
                          {currencySymbol}{exp.convertedAmount.toLocaleString()}
                        </Text>
                        {isForeign && (
                          <Text style={[styles.expenseOriginalAmount, { color: colors.mutedText }]}>
                            {exp.currency} {exp.amount.toLocaleString()}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Split & Payer Footer */}
                    <View style={[styles.expenseFooter, { borderTopColor: `${colors.border}60` }]}>
                      <View style={styles.footerChipsRow}>
                        <View style={[styles.payerBadge, { backgroundColor: `${colors.primary}12` }]}>
                          <Ionicons name="wallet-outline" size={11} color={colors.primary} style={{ marginRight: 4 }} />
                          <Text style={[styles.payerText, { color: colors.primary }]}>Paid by {exp.paidBy}</Text>
                        </View>

                        {exp.splitWith && exp.splitWith.length > 1 && (
                          <View style={[styles.splitBadge, { backgroundColor: `${colors.border}40` }]}>
                            <Ionicons name="people" size={11} color={colors.mutedText} style={{ marginRight: 4 }} />
                            <Text style={[styles.splitText, { color: colors.mutedText }]}>
                              Split with {exp.splitWith.length}
                            </Text>
                          </View>
                        )}
                      </View>

                      <TouchableOpacity testID="btn-trash-outline" accessibilityLabel="trash outline"
                        onPress={() => handleDeleteExpense(exp)}
                        style={styles.deleteExpenseBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* TAB 2: ANALYTICS & DESTINATION BENCHMARKS */}
        {activeTab === 'analytics' && (
          <View>
            {/* Category Breakdown Card */}
            <View style={[styles.cardSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="pie-chart" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.sectionTitle, { color: colors.heading }]}>Spending by Category</Text>
              </View>

              {categoryBreakdown.length === 0 ? (
                <Text style={[styles.noDataText, { color: colors.mutedText }]}>
                  Log expenses to see dynamic category visual charts.
                </Text>
              ) : (
                categoryBreakdown.map((item) => {
                  const meta = CATEGORY_META[item.category] || CATEGORY_META.other;
                  return (
                    <View key={item.category} style={styles.categoryProgressRow}>
                      <View style={styles.categoryProgressLabelRow}>
                        <View style={styles.categoryNameWrap}>
                          <Ionicons name={meta.icon} size={15} color={meta.color} style={{ marginRight: 6 }} />
                          <Text style={[styles.categoryRowName, { color: colors.heading }]}>
                            {meta.label} ({item.count})
                          </Text>
                        </View>
                        <Text style={[styles.categoryRowAmount, { color: colors.heading }]}>
                          {currencySymbol}{item.total.toLocaleString()} ({item.percentage}%)
                        </Text>
                      </View>

                      <View style={[styles.categoryBarTrack, { backgroundColor: `${colors.border}40` }]}>
                        <View
                          style={[
                            styles.categoryBarFill,
                            { width: `${Math.min(100, item.percentage)}%`, backgroundColor: meta.color },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* Destination Cost Guide */}
            {costGuide && (
              <View style={[styles.cardSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="compass" size={18} color="#D97706" style={{ marginRight: 8 }} />
                  <Text style={[styles.sectionTitle, { color: colors.heading }]}>
                    {costGuide.destinationName} Cost Guide & Etiquette
                  </Text>
                </View>

                {/* Benchmark box */}
                <View style={[styles.benchmarkBox, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                  <Ionicons name="bulb-outline" size={20} color="#D97706" style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.benchmarkTitle}>Typical Daily Spending Benchmark</Text>
                    <Text style={styles.benchmarkValue}>
                      ≈ {costGuide.baseCurrency} {costGuide.estimatedDailyBudget.toLocaleString()} / day / traveler
                    </Text>
                  </View>
                </View>

                {/* Tipping etiquette */}
                <View style={styles.guideRow}>
                  <View style={[styles.guideIconWrap, { backgroundColor: '#10B98118' }]}>
                    <Ionicons name="heart" size={16} color="#10B981" />
                  </View>
                  <View style={styles.guideInfo}>
                    <Text style={[styles.guideHeading, { color: colors.heading }]}>Tipping Culture</Text>
                    <Text style={[styles.guideBody, { color: colors.text }]}>{costGuide.tippingEtiquette}</Text>
                  </View>
                </View>

                {/* Bargaining culture */}
                <View style={styles.guideRow}>
                  <View style={[styles.guideIconWrap, { backgroundColor: '#3B82F618' }]}>
                    <Ionicons name="chatbubbles" size={16} color="#3B82F6" />
                  </View>
                  <View style={styles.guideInfo}>
                    <Text style={[styles.guideHeading, { color: colors.heading }]}>Bargaining & Markets</Text>
                    <Text style={[styles.guideBody, { color: colors.text }]}>{costGuide.bargainingCulture}</Text>
                  </View>
                </View>

                {/* Accepted Payment methods */}
                {costGuide.popularPaymentMethods && costGuide.popularPaymentMethods.length > 0 && (
                  <View style={styles.guideRow}>
                    <View style={[styles.guideIconWrap, { backgroundColor: '#8B5CF618' }]}>
                      <Ionicons name="card" size={16} color="#8B5CF6" />
                    </View>
                    <View style={styles.guideInfo}>
                      <Text style={[styles.guideHeading, { color: colors.heading }]}>Payment Methods Accepted</Text>
                      <View style={styles.paymentPillsWrap}>
                        {costGuide.popularPaymentMethods.map((pm, i) => (
                          <View key={i} style={[styles.guidePaymentPill, { backgroundColor: `${colors.border}40` }]}>
                            <Text style={[styles.guidePaymentText, { color: colors.text }]}>{pm}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* TAB 3: GROUP SPLIT & SETTLEMENTS */}
        {activeTab === 'splitter' && (
          <View>
            {/* Info notice */}
            <View style={[styles.infoBanner, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}25` }]}>
              <Ionicons name="information-circle-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.infoBannerText, { color: colors.text }]}>
                Expenses are automatically split equally between designated travelers. Check net balances and settlement advice below.
              </Text>
            </View>

            {/* Individual Traveler Balance Cards */}
            <View style={[styles.cardSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="people" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.sectionTitle, { color: colors.heading }]}>Traveler Net Balances</Text>
              </View>

              {groupBalances.length === 0 ? (
                <Text style={[styles.noDataText, { color: colors.mutedText }]}>
                  No group expenses recorded yet.
                </Text>
              ) : (
                groupBalances.map((b) => {
                  const isPositive = b.netBalance > 0.01;
                  const isZero = Math.abs(b.netBalance) <= 0.01;

                  return (
                    <View
                      key={b.traveler}
                      style={[styles.travelerBalanceRow, { borderBottomColor: `${colors.border}40` }]}
                    >
                      <View style={styles.travelerAvatarWrap}>
                        <View style={[styles.travelerAvatar, { backgroundColor: colors.primary }]}>
                          <Text style={styles.travelerAvatarLetter}>{b.traveler.charAt(0).toUpperCase()}</Text>
                        </View>
                        <View>
                          <Text style={[styles.travelerRowName, { color: colors.heading }]}>{b.traveler}</Text>
                          <Text style={[styles.travelerBreakdown, { color: colors.mutedText }]}>
                            Paid: {currencySymbol}{b.totalPaid.toLocaleString()} • Share: {currencySymbol}{b.fairShare.toLocaleString()}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.netBalanceBadge}>
                        <Text
                          style={[
                            styles.netBalanceText,
                            {
                              color: isZero ? colors.mutedText : isPositive ? '#10B981' : '#EF4444',
                              fontWeight: '700',
                            },
                          ]}
                        >
                          {isZero
                            ? 'Settled'
                            : isPositive
                            ? `+${currencySymbol}${b.netBalance.toLocaleString()}`
                            : `-${currencySymbol}${Math.abs(b.netBalance).toLocaleString()}`}
                        </Text>
                        <Text style={[styles.netStatusLabel, { color: colors.mutedText }]}>
                          {isZero ? 'all good' : isPositive ? 'gets back' : 'owes group'}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* Smart Settlement Plan ("Alex pays Maria") */}
            <View style={[styles.cardSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="swap-horizontal" size={18} color="#10B981" style={{ marginRight: 8 }} />
                <Text style={[styles.sectionTitle, { color: colors.heading }]}>Settlement Roadmap</Text>
              </View>

              {settlements.length === 0 ? (
                <View style={styles.settledBanner}>
                  <Ionicons name="checkmark-circle" size={32} color="#10B981" style={{ marginBottom: 6 }} />
                  <Text style={[styles.settledTitle, { color: '#10B981' }]}>Everyone is All Settled Up!</Text>
                  <Text style={[styles.settledSubtitle, { color: colors.mutedText }]}>
                    No outstanding group debts remain across travelers.
                  </Text>
                </View>
              ) : (
                settlements.map((s, index) => (
                  <View
                    key={index}
                    style={[styles.settlementItem, { backgroundColor: colors.background, borderColor: colors.border }]}
                  >
                    <View style={styles.settlementLeft}>
                      <View style={styles.settlementNameRow}>
                        <Text style={[styles.settlementFrom, { color: '#EF4444' }]}>{s.from}</Text>
                        <Ionicons name="arrow-forward" size={14} color={colors.mutedText} style={{ marginHorizontal: 6 }} />
                        <Text style={[styles.settlementTo, { color: '#10B981' }]}>{s.to}</Text>
                      </View>
                      <Text style={[styles.settlementAmount, { color: colors.heading }]}>
                        {currencySymbol}{s.amount.toLocaleString()}
                      </Text>
                    </View>

                    <TouchableOpacity testID="btn-logo-whatsapp" accessibilityLabel="logo whatsapp"
                      style={[styles.remindBtn, { backgroundColor: '#25D366' }]}
                      onPress={() => handleSendSettlementReminder(s.from, s.to, s.amount)}
                    >
                      <Ionicons name="logo-whatsapp" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.remindBtnText}>Remind</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button (FAB) for Add Expense */}
      <TouchableOpacity testID="btn-add"
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch {}
          setAddModalVisible(true);
        }}
        activeOpacity={0.8}
        accessibilityLabel="Add In-Trip Expense"
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add Expense Modal */}
      <AddExpenseModal visible={addModalVisible} onClose={() => setAddModalVisible(false)} />

      {/* Set Budget Modal */}
      <SetBudgetModal visible={budgetModalVisible} onClose={() => setBudgetModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
  },
  segmentTabActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  segmentTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  mainScroll: {
    padding: 16,
  },
  masterCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  masterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  masterSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  masterAmount: {
    fontSize: 26,
    fontWeight: '800',
  },
  masterCurrencyCode: {
    fontSize: 14,
    fontWeight: '600',
  },
  editLimitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  editLimitText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
  },
  filterScroll: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  expenseCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  expenseTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expenseMainInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  expenseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseDate: {
    fontSize: 11,
  },
  dotSep: {
    marginHorizontal: 4,
    fontSize: 11,
  },
  expenseLocation: {
    fontSize: 11,
    flex: 1,
  },
  expenseAmountWrap: {
    alignItems: 'flex-end',
  },
  expenseConvertedAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  expenseOriginalAmount: {
    fontSize: 11,
    marginTop: 1,
  },
  expenseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 10,
    paddingTop: 8,
  },
  footerChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  payerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  payerText: {
    fontSize: 11,
    fontWeight: '600',
  },
  splitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  splitText: {
    fontSize: 11,
    fontWeight: '500',
  },
  deleteExpenseBtn: {
    padding: 4,
  },
  cardSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  noDataText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },
  categoryProgressRow: {
    marginBottom: 12,
  },
  categoryProgressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryRowName: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryRowAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  categoryBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  benchmarkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  benchmarkTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  benchmarkValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78350F',
    marginTop: 1,
  },
  guideRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  guideIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  guideInfo: {
    flex: 1,
  },
  guideHeading: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  guideBody: {
    fontSize: 12,
    lineHeight: 17,
  },
  paymentPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  guidePaymentPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  guidePaymentText: {
    fontSize: 11,
    fontWeight: '600',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoBannerText: {
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  travelerBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  travelerAvatarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  travelerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  travelerAvatarLetter: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  travelerRowName: {
    fontSize: 14,
    fontWeight: '700',
  },
  travelerBreakdown: {
    fontSize: 11,
    marginTop: 2,
  },
  netBalanceBadge: {
    alignItems: 'flex-end',
  },
  netBalanceText: {
    fontSize: 14,
  },
  netStatusLabel: {
    fontSize: 10,
    marginTop: 1,
  },
  settledBanner: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  settledTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  settledSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  settlementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  settlementLeft: {
    flex: 1,
  },
  settlementNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  settlementFrom: {
    fontSize: 13,
    fontWeight: '700',
  },
  settlementTo: {
    fontSize: 13,
    fontWeight: '700',
  },
  settlementAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  remindBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  remindBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});
