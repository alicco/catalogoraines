import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Styles for PDF
const styles = StyleSheet.create({
    page: {
        paddingBottom: 65, // Increased for footer
        paddingTop: 40,
        paddingHorizontal: 40,
        backgroundColor: '#FFFFFF',
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 30,
        borderBottomWidth: 2,
        borderBottomColor: '#14b8a6',
        paddingBottom: 15,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 12,
        color: '#64748b',
    },
    dateText: {
        fontSize: 10,
        color: '#94a3b8',
        marginTop: 5,
    },
    summaryBox: {
        backgroundColor: '#f0fdfa',
        padding: 15,
        borderRadius: 8,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#14b8a6',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 12,
        color: '#64748b',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    totalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#14b8a6',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a',
        marginTop: 20,
        marginBottom: 15,
    },
    categorySection: {
        marginBottom: 15,
    },
    categoryTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#475569',
        textTransform: 'uppercase',
        marginBottom: 8,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    productRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
        marginBottom: 4,
        backgroundColor: '#f8fafc',
        borderRadius: 4,
    },
    productEmoji: {
        fontSize: 20,
        marginRight: 10,
        width: 30,
        textAlign: 'center'
    },
    productImage: {
        width: 30,
        height: 30,
        marginRight: 10,
        objectFit: 'contain'
    },
    productDetails: {
        flex: 1,
    },
    productName: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 2,
    },
    productDescription: {
        fontSize: 9,
        color: '#64748b',
    },
    productPrice: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#14b8a6',
    },
    categoryTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    categoryTotalLabel: {
        fontSize: 10,
        color: '#64748b',
    },
    categoryTotalValue: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 9,
        color: '#94a3b8',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 10,
    },
});

export function KitPDFDocument({ kitItems, totalPrice, discount = 0, expirationDate = null }) {

    // Group items by category
    const itemsByCategory = kitItems.reduce((acc, item) => {
        const category = item.category || 'Altro';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {});

    const currentDate = new Date().toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                {/* Header - Fixed enables repetition on every page */}
                <View style={styles.header} fixed>
                    <Text style={styles.title}>AISAC Ghost-Inventory</Text>
                    <Text style={styles.subtitle}>Configurazione Kit Pronto Soccorso</Text>
                    <Text style={styles.dateText}>Generato il {currentDate} - Pagina <Text render={({ pageNumber, totalPages }) => (
                        `${pageNumber} / ${totalPages}`
                    )} fixed /></Text>
                </View>

                {/* Products by Category */}
                <Text style={styles.sectionTitle}>Dettaglio Prodotti</Text>

                {Object.entries(itemsByCategory).map(([category, items]) => {
                    const categoryTotal = items.reduce((sum, item) => sum + item.price, 0);

                    return (
                        <View key={category} style={styles.categorySection}>
                            <Text style={styles.categoryTitle}>{category}</Text>

                            {items.map((item, index) => (
                                <View key={`${item.id}-${index}`} style={styles.productRow}>
                                    {/* Image or ID fallback - ensuring absolute URL */}
                                    {item.image ? (
                                        <Image
                                            src={item.image.startsWith('http') ? item.image : `${window.location.origin}${item.image}`}
                                            style={styles.productImage}
                                        />
                                    ) : (
                                        <Text style={styles.productEmoji}>{item.emoji || '📦'}</Text>
                                    )}

                                    <View style={styles.productDetails}>
                                        <Text style={styles.productName}>{item.quantity > 1 ? `(${item.quantity}x) ` : ''}{item.name}</Text>
                                        <Text style={styles.productDescription}>{item.description}</Text>
                                    </View>
                                    <Text style={styles.productPrice}>€{(item.price * item.quantity).toFixed(2)}</Text>
                                </View>
                            ))}

                            <View style={styles.categoryTotal}>
                                <Text style={styles.categoryTotalLabel}>
                                    Subtotale {category} ({items.length} articoli)
                                </Text>
                                <Text style={styles.categoryTotalValue}>€{categoryTotal.toFixed(2)}</Text>
                            </View>
                        </View>
                    );
                })}

                {/* Summary Box - Validità: 30gg se scadenza presente */}
                <View style={[styles.summaryBox, { marginTop: 20 }]} wrap={false}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Totale Articoli:</Text>
                        <Text style={styles.summaryValue}>{kitItems.reduce((acc, i) => acc + i.quantity, 0)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Categorie:</Text>
                        <Text style={styles.summaryValue}>{Object.keys(itemsByCategory).length}</Text>
                    </View>

                    <View style={[styles.summaryRow, { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#14b8a6' }]}>
                        <Text style={styles.summaryLabel}>TOTALE REALE:</Text>
                        <Text style={styles.totalValue}>€{totalPrice.toFixed(2)}</Text>
                    </View>

                    {discount > 0 && (
                        <>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Sconto ({discount}%):</Text>
                                <Text style={[styles.summaryValue, { color: '#ef4444' }]}>-€{(totalPrice * (discount / 100)).toFixed(2)}</Text>
                            </View>
                            <View style={[styles.summaryRow, { marginTop: 5, paddingTop: 5, borderTopWidth: 1, borderTopColor: '#ccc' }]}>
                                <Text style={[styles.summaryLabel, { fontWeight: 'bold', color: '#0f766e' }]}>TOTALE SCONTATO:</Text>
                                <Text style={[styles.totalValue, { fontSize: 22 }]}>€{(totalPrice * (1 - discount / 100)).toFixed(2)}</Text>
                            </View>
                        </>
                    )}

                    {expirationDate && (
                        <Text style={{ fontSize: 10, color: '#64748b', marginTop: 10, fontStyle: 'italic', textAlign: 'right' }}>
                            Offerta valida fino al: {new Date(expirationDate).toLocaleDateString('it-IT')}
                        </Text>
                    )}
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    AISAC Sistema di Gestione Kit Pronto Soccorso - Documento generato automaticamente
                </Text>
            </Page>
        </Document >
    );
}
