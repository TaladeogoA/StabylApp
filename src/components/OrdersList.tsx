import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Theme } from '../constants/Theme';
import { OrderRow } from '../types';
import OrderRowItem from './OrderRowItem';
import TabSwitcher from './TabSwitcher';

interface OrdersListProps {
    orders: OrderRow[];
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onCancel: (order: OrderRow) => void;
}

const OrdersList: React.FC<OrdersListProps> = ({ orders, activeTab, setActiveTab, onCancel }) => {
    const filteredOrders = orders.filter(o =>
        activeTab === 'Open Orders' ? o.status === 'open' : o.status !== 'open'
    );

    return (
        <>
            <View style={{ marginTop: 32 }}>
                <TabSwitcher
                    tabs={['Open Orders', 'History']}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />
            </View>

            <View style={styles.listContainer}>
                {filteredOrders.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="list-outline" size={48} color={Theme.colors.surfaceHighlight} />
                        <Text style={styles.emptyText}>No {activeTab.toLowerCase()}</Text>
                    </View>
                )}
                {filteredOrders.map((item, index) => (
                    <OrderRowItem
                        key={item.id}
                        item={item}
                        index={index}
                        onCancel={onCancel}
                    />
                ))}
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    listContainer: {
        marginTop: 16
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
        opacity: 0.5
    },
    emptyText: {
        color: Theme.colors.textSecondary,
        marginTop: 12
    }
});

export default OrdersList;
