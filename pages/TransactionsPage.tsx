import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, Search, Download, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';
import { getTransactions, Transaction, TransactionsResponse } from '../services/transactionService';
import { supabase } from '../supabaseClient';

const TransactionsPage: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalRealizedGains, setTotalRealizedGains] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const response = await getTransactions(user.id);
                setTransactions(response.transactions);
                setTotalRealizedGains(response.total_realized_gains);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = transactions.filter(tx =>
        tx.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalProfit = transactions.filter(tx => tx.profit_loss > 0).reduce((sum, tx) => sum + tx.profit_loss, 0);
    const totalLoss = Math.abs(transactions.filter(tx => tx.profit_loss < 0).reduce((sum, tx) => sum + tx.profit_loss, 0));

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 font-display">Transaction History</h1>
                    <p className="text-slate-500 mt-1">Track your closed positions and realized gains/losses.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" leftIcon={<Download size={18} />}>Export</Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium mb-1">Total Transactions</p>
                    <h3 className="text-2xl font-bold text-slate-900">{transactions.length}</h3>
                    <span className="text-xs text-slate-400 mt-2 block">Closed positions</span>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium mb-1">Total Realized Gains</p>
                    <h3 className={`text-2xl font-bold ${totalRealizedGains >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {totalRealizedGains >= 0 ? '+' : ''}${totalRealizedGains.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                    <span className={`text-xs font-medium flex items-center mt-2 ${totalRealizedGains >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {totalRealizedGains >= 0 ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownLeft size={14} className="mr-1" />}
                        Net realized P/L
                    </span>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-slate-500 text-sm font-medium mb-1">Winning Trades</p>
                            <h3 className="text-xl font-bold text-emerald-600">+${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                        </div>
                        <div className="text-right">
                            <p className="text-slate-500 text-sm font-medium mb-1">Losing Trades</p>
                            <h3 className="text-xl font-bold text-red-500">-${totalLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Search Bar */}
                <div className="p-4 border-b border-slate-100 flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by symbol or name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 flex flex-col items-center justify-center">
                        <Loader2 className="animate-spin text-slate-400 mb-2" size={32} />
                        <p className="text-slate-500">Loading transactions...</p>
                    </div>
                ) : filteredTransactions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-4 font-semibold">Asset</th>
                                    <th className="px-6 py-4 font-semibold">Quantity</th>
                                    <th className="px-6 py-4 font-semibold">Buy Price</th>
                                    <th className="px-6 py-4 font-semibold">Sell Price</th>
                                    <th className="px-6 py-4 font-semibold">Profit/Loss</th>
                                    <th className="px-6 py-4 font-semibold">Dates</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredTransactions.map((tx) => {
                                    const isProfit = tx.profit_loss >= 0;
                                    return (
                                        <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">
                                                        {tx.symbol.substring(0, 2)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900">{tx.symbol}</p>
                                                        <p className="text-xs text-slate-500">{tx.name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-medium text-slate-900">{tx.quantity}</p>
                                                <p className="text-xs text-slate-400">{tx.type}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-medium text-slate-600">
                                                    ${tx.purchase_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                                <p className="text-xs text-slate-400">per unit</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className={`text-sm font-semibold ${isProfit ? 'text-emerald-600' : 'text-red-500'}`}>
                                                    ${tx.sale_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                                <p className="text-xs text-slate-400">per unit</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center text-sm font-bold ${isProfit ? 'text-emerald-600' : 'text-red-500'}`}>
                                                    {isProfit ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                                                    {isProfit ? '+' : ''}${tx.profit_loss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                                <p className={`text-xs font-medium ${isProfit ? 'text-emerald-500' : 'text-red-400'}`}>
                                                    {isProfit ? '+' : ''}{tx.profit_loss_percent.toFixed(2)}%
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-slate-600">{formatDate(tx.sale_date)}</p>
                                                <p className="text-xs text-slate-400">Bought: {formatDate(tx.purchase_date)}</p>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <TrendingUp size={32} className="text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 mb-1">No transactions yet</h3>
                        <p className="text-slate-500 max-w-sm">
                            When you close a position by selling an asset, it will appear here with your realized gains or losses.
                        </p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default TransactionsPage;
