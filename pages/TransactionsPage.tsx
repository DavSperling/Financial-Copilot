import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Search, Filter, Download } from 'lucide-react';
import { Button } from '../components/Button';

// Mock Data
const MOCK_TRANSACTIONS = [
    { id: 1, type: 'deposit', amount: 5000, description: 'Salary Deposit', date: '2023-12-15', category: 'Income', status: 'Completed' },
    { id: 2, type: 'withdrawal', amount: 120, description: 'Grocery Store', date: '2023-12-14', category: 'Food', status: 'Completed' },
    { id: 3, type: 'withdrawal', amount: 450, description: 'Utility Bill', date: '2023-12-12', category: 'Utilities', status: 'Completed' },
    { id: 4, type: 'investment', amount: 1000, description: 'ETF Purchase', date: '2023-12-10', category: 'Investment', status: 'Completed' },
    { id: 5, type: 'withdrawal', amount: 65, description: 'Restaurant', date: '2023-12-09', category: 'Dining', status: 'Pending' },
    { id: 6, type: 'deposit', amount: 200, description: 'Refund', date: '2023-12-08', category: 'Income', status: 'Completed' },
    { id: 7, type: 'withdrawal', amount: 1200, description: 'Rent Payment', date: '2023-12-01', category: 'Housing', status: 'Completed' },
];

const TransactionsPage: React.FC = () => {
    return (
        <div className="max-w-7xl mx-auto space-y-8">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 font-display">Transactions</h1>
                    <p className="text-slate-500 mt-1">View and manage your recent financial activity.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" leftIcon={<Download size={18} />}>Export</Button>
                    <Button leftIcon={<Filter size={18} />}>Filter</Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium mb-1">Total Savings</p>
                    <h3 className="text-2xl font-bold text-slate-900">$3,450.00</h3>
                    <span className="text-xs text-emerald-600 font-medium flex items-center mt-2">
                        <ArrowUpRight size={14} className="mr-1" /> +12.5% vs last month
                    </span>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium mb-1">Total Income</p>
                    <h3 className="text-2xl font-bold text-slate-900">$5,200.00</h3>
                    <span className="text-xs text-emerald-600 font-medium flex items-center mt-2">
                        <ArrowUpRight size={14} className="mr-1" /> +2.1% vs last month
                    </span>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium mb-1">Total Expenses</p>
                    <h3 className="text-2xl font-bold text-slate-900">$1,750.00</h3>
                    <span className="text-xs text-red-500 font-medium flex items-center mt-2">
                        <ArrowDownLeft size={14} className="mr-1" /> +5.3% vs last month
                    </span>
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
                            placeholder="Search transactions..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold">Description</th>
                                <th className="px-6 py-4 font-semibold">Category</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {MOCK_TRANSACTIONS.map((tx) => (
                                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {tx.date}
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-slate-900">{tx.description}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                            {tx.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center text-xs font-medium ${tx.status === 'Completed' ? 'text-emerald-600' : 'text-amber-600'
                                            }`}>
                                            {tx.status}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 text-right font-semibold text-sm ${tx.type === 'deposit' ? 'text-emerald-600' : 'text-slate-900'
                                        }`}>
                                        {tx.type === 'deposit' ? '+' : '-'}${tx.amount.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination/Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-center">
                    <button className="text-sm text-slate-500 hover:text-primary-600 font-medium">View All Transactions</button>
                </div>
            </div>

        </div>
    );
};

export default TransactionsPage;
