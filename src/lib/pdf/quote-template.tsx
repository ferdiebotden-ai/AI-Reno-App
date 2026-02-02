/**
 * Quote PDF Template
 * Professional PDF quote generation using @react-pdf/renderer
 * [DEV-057]
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { Lead, QuoteDraft, QuoteLineItem } from '@/types/database';

// Red White Reno brand colors
const COLORS = {
  primary: '#D32F2F', // Red
  secondary: '#1a1a1a',
  muted: '#666666',
  border: '#e5e5e5',
  background: '#f8f8f8',
  white: '#ffffff',
};

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: COLORS.secondary,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  brandSection: {
    flex: 1,
  },
  brandName: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 10,
    color: COLORS.muted,
  },
  quoteInfo: {
    alignItems: 'flex-end',
  },
  quoteLabel: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.secondary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 9,
    color: COLORS.muted,
    marginBottom: 2,
  },
  // Customer section
  customerSection: {
    flexDirection: 'row',
    marginBottom: 25,
    gap: 40,
  },
  infoBox: {
    flex: 1,
    padding: 15,
    backgroundColor: COLORS.background,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  customerName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  customerDetail: {
    fontSize: 9,
    color: COLORS.muted,
    marginBottom: 2,
  },
  projectType: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  // Line items table
  tableSection: {
    marginBottom: 20,
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    padding: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableRowAlt: {
    backgroundColor: COLORS.background,
  },
  colDescription: {
    flex: 3,
    paddingRight: 10,
  },
  colCategory: {
    flex: 1,
    paddingRight: 10,
  },
  colQty: {
    width: 50,
    textAlign: 'center' as const,
  },
  colUnit: {
    width: 50,
    textAlign: 'center' as const,
  },
  colPrice: {
    width: 70,
    textAlign: 'right' as const,
  },
  colTotal: {
    width: 80,
    textAlign: 'right' as const,
  },
  cellText: {
    fontSize: 9,
  },
  categoryBadge: {
    fontSize: 8,
    color: COLORS.muted,
    textTransform: 'capitalize',
  },
  // Totals section
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 25,
  },
  totalsBox: {
    width: 250,
    padding: 15,
    backgroundColor: COLORS.background,
    borderRadius: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 10,
    color: COLORS.muted,
  },
  totalValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 6,
    borderTopWidth: 2,
    borderTopColor: COLORS.primary,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
  },
  grandTotalValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
  },
  depositRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  depositLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
  },
  depositValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
  },
  // Assumptions and exclusions
  termsSection: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 25,
  },
  termsBox: {
    flex: 1,
    padding: 15,
    backgroundColor: COLORS.background,
    borderRadius: 4,
  },
  termsList: {
    paddingLeft: 10,
  },
  termItem: {
    fontSize: 8,
    color: COLORS.muted,
    marginBottom: 4,
    paddingLeft: 8,
  },
  bullet: {
    position: 'absolute',
    left: 0,
    fontSize: 8,
    color: COLORS.primary,
  },
  // Disclaimer
  disclaimerSection: {
    marginBottom: 25,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
  },
  disclaimerText: {
    fontSize: 8,
    color: COLORS.muted,
    lineHeight: 1.5,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    fontSize: 8,
    color: COLORS.muted,
  },
  footerContact: {
    fontSize: 8,
    color: COLORS.primary,
    fontFamily: 'Helvetica-Bold',
  },
  validityBadge: {
    backgroundColor: COLORS.primary,
    padding: '4 8',
    borderRadius: 3,
  },
  validityText: {
    fontSize: 8,
    color: COLORS.white,
    fontFamily: 'Helvetica-Bold',
  },
});

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(amount);
}

// Format date
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Category display names
const CATEGORY_LABELS: Record<string, string> = {
  materials: 'Materials',
  labor: 'Labour',
  contract: 'Contract',
  permit: 'Permits',
  other: 'Other',
};

// Project type display names
const PROJECT_TYPE_LABELS: Record<string, string> = {
  kitchen: 'Kitchen Renovation',
  bathroom: 'Bathroom Renovation',
  basement: 'Basement Finishing',
  flooring: 'Flooring Installation',
  painting: 'Painting',
  exterior: 'Exterior Work',
  other: 'General Renovation',
};

export interface QuotePdfProps {
  lead: Lead;
  quote: QuoteDraft;
}

export function QuotePdfDocument({ lead, quote }: QuotePdfProps) {
  const lineItems = (quote.line_items as unknown as QuoteLineItem[]) || [];
  const assumptions = quote.assumptions || [];
  const exclusions = quote.exclusions || [];
  const expiresAt = quote.expires_at ? new Date(quote.expires_at) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const quoteDate = new Date(quote.created_at);
  const quoteNumber = `RWR-${quoteDate.getFullYear()}-${String(lead.id).slice(0, 8).toUpperCase()}`;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandSection}>
            <Text style={styles.brandName}>Red White Reno</Text>
            <Text style={styles.tagline}>Quality Renovations in Stratford, Ontario</Text>
          </View>
          <View style={styles.quoteInfo}>
            <Text style={styles.quoteLabel}>QUOTE</Text>
            <Text style={styles.infoText}>Quote #: {quoteNumber}</Text>
            <Text style={styles.infoText}>Date: {formatDate(quoteDate)}</Text>
            <Text style={styles.infoText}>Version: {quote.version}</Text>
          </View>
        </View>

        {/* Customer and Project Info */}
        <View style={styles.customerSection}>
          <View style={styles.infoBox}>
            <Text style={styles.sectionTitle}>Customer Information</Text>
            <Text style={styles.customerName}>{lead.name}</Text>
            <Text style={styles.customerDetail}>{lead.email}</Text>
            {lead.phone && <Text style={styles.customerDetail}>{lead.phone}</Text>}
            {lead.address && <Text style={styles.customerDetail}>{lead.address}</Text>}
            {lead.city && (
              <Text style={styles.customerDetail}>
                {lead.city}, {lead.province} {lead.postal_code}
              </Text>
            )}
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.sectionTitle}>Project Details</Text>
            <Text style={styles.projectType}>
              {PROJECT_TYPE_LABELS[lead.project_type || 'other'] || 'Renovation Project'}
            </Text>
            {lead.area_sqft && (
              <Text style={styles.customerDetail}>Area: ~{lead.area_sqft} sq ft</Text>
            )}
            {lead.finish_level && (
              <Text style={styles.customerDetail}>
                Finish Level: {lead.finish_level.charAt(0).toUpperCase() + lead.finish_level.slice(1)}
              </Text>
            )}
            {lead.goals_text && (
              <Text style={styles.customerDetail}>{lead.goals_text}</Text>
            )}
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.tableSection}>
          <Text style={styles.sectionTitle}>Scope of Work</Text>
          <View style={styles.table}>
            {/* Header */}
            <View style={styles.tableHeader}>
              <View style={styles.colDescription}>
                <Text style={styles.tableHeaderText}>Description</Text>
              </View>
              <View style={styles.colCategory}>
                <Text style={styles.tableHeaderText}>Category</Text>
              </View>
              <View style={styles.colQty}>
                <Text style={styles.tableHeaderText}>Qty</Text>
              </View>
              <View style={styles.colUnit}>
                <Text style={styles.tableHeaderText}>Unit</Text>
              </View>
              <View style={styles.colPrice}>
                <Text style={styles.tableHeaderText}>Price</Text>
              </View>
              <View style={styles.colTotal}>
                <Text style={styles.tableHeaderText}>Total</Text>
              </View>
            </View>

            {/* Rows */}
            {lineItems.map((item, index) => (
              <View
                key={index}
                style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}
              >
                <View style={styles.colDescription}>
                  <Text style={styles.cellText}>{item.description}</Text>
                </View>
                <View style={styles.colCategory}>
                  <Text style={styles.categoryBadge}>
                    {CATEGORY_LABELS[item.category] || item.category}
                  </Text>
                </View>
                <View style={styles.colQty}>
                  <Text style={styles.cellText}>{item.quantity}</Text>
                </View>
                <View style={styles.colUnit}>
                  <Text style={styles.cellText}>{item.unit}</Text>
                </View>
                <View style={styles.colPrice}>
                  <Text style={styles.cellText}>{formatCurrency(item.unit_price)}</Text>
                </View>
                <View style={styles.colTotal}>
                  <Text style={styles.cellText}>{formatCurrency(item.total)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatCurrency(quote.subtotal || 0)}</Text>
            </View>
            {(quote.contingency_percent || 0) > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Contingency ({quote.contingency_percent}%)</Text>
                <Text style={styles.totalValue}>{formatCurrency(quote.contingency_amount || 0)}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>HST ({quote.hst_percent}%)</Text>
              <Text style={styles.totalValue}>{formatCurrency(quote.hst_amount || 0)}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(quote.total || 0)}</Text>
            </View>
            <View style={styles.depositRow}>
              <Text style={styles.depositLabel}>Deposit Required ({quote.deposit_percent}%)</Text>
              <Text style={styles.depositValue}>{formatCurrency(quote.deposit_required || 0)}</Text>
            </View>
          </View>
        </View>

        {/* Assumptions and Exclusions */}
        <View style={styles.termsSection}>
          {assumptions.length > 0 && (
            <View style={styles.termsBox}>
              <Text style={styles.sectionTitle}>Assumptions</Text>
              <View style={styles.termsList}>
                {assumptions.map((item, index) => (
                  <View key={index} style={{ position: 'relative' }}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.termItem}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          {exclusions.length > 0 && (
            <View style={styles.termsBox}>
              <Text style={styles.sectionTitle}>Exclusions</Text>
              <View style={styles.termsList}>
                {exclusions.map((item, index) => (
                  <View key={index} style={{ position: 'relative' }}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.termItem}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerSection}>
          <Text style={styles.sectionTitle}>Terms & Conditions</Text>
          <Text style={styles.disclaimerText}>
            This quote is valid for {quote.validity_days} days from the date of issue. Prices are subject to change after the expiry date.
            A {quote.deposit_percent}% deposit is required to secure your project start date. The remaining balance is due upon completion.
            Any changes to the scope of work may result in price adjustments. This quote is based on the information provided and is subject
            to a final site assessment. Red White Reno is fully insured and WSIB compliant. Payment terms: deposit upon acceptance,
            balance upon completion or as otherwise agreed in writing. All work is guaranteed for 1 year from completion date.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <View>
            <Text style={styles.footerText}>Red White Reno | Stratford, Ontario</Text>
            <Text style={styles.footerContact}>quotes@redwhitereno.ca | (519) 555-RENO</Text>
          </View>
          <View style={styles.validityBadge}>
            <Text style={styles.validityText}>Valid until {formatDate(expiresAt)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
