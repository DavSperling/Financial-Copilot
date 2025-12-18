import React, { useState } from 'react';
import { getPortfolioRecommendation, PortfolioRecommendation } from '../../services/portfolioService';
import AllocationChart from '../../components/Portfolio/AllocationChart';
import { Loader2 } from 'lucide-react';

const PROFILE_NAMES: Record<number, string> = {
    1: "Conservative",
    2: "Balanced",
    3: "Dynamic",
    4: "Aggressive"
};

const RecommendationsPage: React.FC = () => {
    const [riskProfile, setRiskProfile] = useState<number>(2);
    const [loading, setLoading] = useState<boolean>(false);
    const [recommendation, setRecommendation] = useState<PortfolioRecommendation | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGetRecommendation = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getPortfolioRecommendation(riskProfile);
            setRecommendation(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch recommendation. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937' }}>
                Portfolio Recommendation
            </h1>

            {/* Input Section */}
            <div style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                marginBottom: '32px'
            }}>
                <div style={{ marginBottom: '20px' }}>
                    <label
                        htmlFor="risk-slider"
                        style={{ display: 'block', marginBottom: '8px', fontSize: '1.125rem', fontWeight: 500 }}
                    >
                        Risk Profile: <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{PROFILE_NAMES[riskProfile]}</span>
                    </label>
                    <input
                        id="risk-slider"
                        type="range"
                        min="1"
                        max="4"
                        step="1"
                        value={riskProfile}
                        onChange={(e) => setRiskProfile(parseInt(e.target.value))}
                        className="slider-input"
                        style={{ width: '100%', maxWidth: '400px', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '400px', fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>
                        <span>Conservative</span>
                        <span>Aggressive</span>
                    </div>
                </div>

                <button
                    onClick={handleGetRecommendation}
                    disabled={loading}
                    style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '1rem',
                        fontWeight: 500,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        opacity: loading ? 0.7 : 1,
                        transition: 'background-color 0.2s'
                    }}
                >
                    {loading && <Loader2 className="animate-spin" size={20} />}
                    {loading ? 'Analyzing...' : 'Get Recommendation'}
                </button>

                {error && (
                    <div style={{
                        marginTop: '16px',
                        padding: '12px',
                        backgroundColor: '#fee2e2',
                        color: '#991b1b',
                        borderRadius: '6px'
                    }}>
                        {error}
                    </div>
                )}
            </div>

            {/* Results Section */}
            {recommendation && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px'
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '24px'
                    }}>
                        {/* Allocation Chart */}
                        <div style={{
                            backgroundColor: 'white',
                            padding: '24px',
                            borderRadius: '8px',
                            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                        }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Target Allocation</h2>
                            <AllocationChart
                                stocks={recommendation.stocks}
                                bonds={recommendation.bonds}
                                cash={recommendation.cash}
                            />
                        </div>

                        {/* Allocation Table & Details */}
                        <div style={{
                            backgroundColor: 'white',
                            padding: '24px',
                            borderRadius: '8px',
                            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                        }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Portfolio Details</h2>

                            <table style={{ width: '100%', marginBottom: '24px', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <th style={{ textAlign: 'left', padding: '12px 0', color: '#6b7280' }}>Asset Class</th>
                                        <th style={{ textAlign: 'right', padding: '12px 0', color: '#6b7280' }}>Allocation</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#22c55e' }}></div>
                                            Stocks
                                        </td>
                                        <td style={{ textAlign: 'right', padding: '12px 0', fontWeight: 600 }}>{recommendation.stocks}%</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></div>
                                            Bonds
                                        </td>
                                        <td style={{ textAlign: 'right', padding: '12px 0', fontWeight: 600 }}>{recommendation.bonds}%</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#6b7280' }}></div>
                                            Cash
                                        </td>
                                        <td style={{ textAlign: 'right', padding: '12px 0', fontWeight: 600 }}>{recommendation.cash}%</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '6px' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>Strategy</h3>
                                <p style={{ color: '#4b5563', lineHeight: '1.5' }}>
                                    {recommendation.explanation}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecommendationsPage;
