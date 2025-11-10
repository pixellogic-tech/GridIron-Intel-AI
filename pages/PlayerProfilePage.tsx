
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { GoogleGenAI } from '@google/genai';
import { ArrowLeft, BrainCircuit, BarChart3, Star, User } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Tooltip, Legend, Radar } from 'recharts';
import { mockPlayers, Player } from './Dashboard';

const PlayerProfilePage: React.FC = () => {
    const { playerId } = useParams<{ playerId: string }>();
    const [player, setPlayer] = useState<Player | null>(null);
    const [ai, setAi] = useState<GoogleGenAI | null>(null);
    const [scoutingReport, setScoutingReport] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const selectedPlayer = mockPlayers.find(p => p.id === parseInt(playerId || ''));
        setPlayer(selectedPlayer || null);
    }, [playerId]);

    useEffect(() => {
        if (process.env.API_KEY) {
            setAi(new GoogleGenAI({ apiKey: process.env.API_KEY }));
        }
    }, []);

    const generateReport = async () => {
        if (!ai || !player) return;

        setIsLoading(true);
        setScoutingReport('');
        const statsString = player.stats.map(s => `${s.name}: ${s.value}`).join(', ');
        const radarString = player.radarData.map(d => `${d.subject}: ${d.value} (vs League Avg: ${d.avg})`).join('; ');

        const prompt = `You are an elite NFL scout. Analyze the performance of high school football player ${player.name}, a ${player.position}.
        
        **Key Stats:** ${statsString}.
        **Performance Radar Insights:** ${radarString}.
        
        Based on all this data, provide a detailed, professional scouting report. Structure your response with the following sections using markdown headings:
        
        ### **Strengths**
        (List 3-4 key strengths with brief explanations, referencing specific stats or radar values where applicable)
        
        ### **Areas for Improvement**
        (List 2-3 specific, actionable areas for improvement, referencing specific stats or radar values where applicable)
        
        ### **Player Comparison**
        (Provide a realistic comparison to a current or former college/pro player whose style matches the data)

        ### **Overall Summary**
        (A concluding paragraph on their potential and what they need to do to reach the next level.)`;


        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
            });
            setScoutingReport(response.text);
        } catch (error) {
            console.error("Error generating scouting report:", error);
            setScoutingReport("An error occurred while generating the report. Please check your API key and try again.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const DetailRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
        <div className="flex justify-between items-baseline bg-gray-700 p-3 rounded-lg">
            <span className="text-gray-400">{label}</span>
            <span className="font-semibold text-lg">{value}</span>
        </div>
    );
    
    const NotesRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
         <div className="bg-gray-700 p-3 rounded-lg">
            <span className="text-gray-400 text-sm">{label}</span>
            <p className="font-semibold mt-1 whitespace-pre-wrap">{value}</p>
        </div>
    );

    if (!player) {
        return (
            <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Player Not Found</h2>
                    <Link to="/dashboard" className="text-brand-accent hover:underline">Return to Dashboard</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 text-white min-h-screen">
            <nav className="bg-gray-800 border-b-4 border-brand-primary shadow-lg">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between items-center h-16">
                        <Link to="/dashboard" className="flex items-center gap-2 text-gray-300 hover:text-white transition">
                            <ArrowLeft size={20} />
                            Back to Coach Dashboard
                        </Link>
                        <div className="text-2xl font-bold text-white">🏈 Player Profile</div>
                    </div>
                </div>
            </nav>
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Player Info & Stats */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-gray-800 rounded-xl p-6 text-center shadow-lg">
                            <div className="w-24 h-24 bg-brand-primary rounded-full flex items-center justify-center font-bold text-4xl mx-auto mb-4 border-4 border-gray-700">{player.avatar}</div>
                            <h1 className="text-3xl font-bold">{player.name}</h1>
                            <p className="text-lg text-brand-accent font-semibold">{player.position}</p>
                        </div>
                        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
                             <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><User /> Player Details</h2>
                             <div className="space-y-3">
                                {player.age && <DetailRow label="Age" value={player.age} />}
                                {player.height && <DetailRow label="Height" value={player.height} />}
                                {player.parentsName && <DetailRow label="Parent/Guardian" value={player.parentsName} />}
                                {player.phone && <DetailRow label="Phone" value={player.phone} />}
                                {player.notes && <NotesRow label="Coach's Notes" value={player.notes} />}
                            </div>
                        </div>
                        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><BarChart3 /> Key Season Stats</h2>
                            <div className="space-y-3">
                                {player.stats.map(stat => (
                                    <div key={stat.name} className="flex justify-between items-baseline bg-gray-700 p-3 rounded-lg">
                                        <span className="text-gray-400">{stat.name}</span>
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-bold text-lg">{stat.value}</span>
                                            {stat.trend && <span className="text-xs text-green-400">{stat.trend}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Radar Chart & AI Report */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Star /> Performance Radar vs. League Average</h2>
                            <div className="h-96">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={player.radarData}>
                                        <PolarGrid gridType="circle" stroke="rgba(255,255,255,0.2)" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#cbd5e1', fontSize: 14 }} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                                        <Legend />
                                        <Radar name="League Average" dataKey="avg" stroke="#8884d8" fill="#8884d8" fillOpacity={0.4} />
                                        <Radar name={player.name} dataKey="value" stroke="var(--color-brand-accent)" fill="var(--color-brand-accent)" fillOpacity={0.6} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><BrainCircuit /> AI Scouting Report</h2>
                            {scoutingReport ? (
                                <div className="bg-gray-900/50 p-4 rounded-lg">
                                    <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed">{scoutingReport}</pre>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <p className="text-gray-400 mb-4">Generate an in-depth analysis of this player's strengths and weaknesses using AI.</p>
                                    <button onClick={generateReport} disabled={isLoading || !ai} className="bg-brand-primary hover:bg-brand-dark text-white font-bold py-3 px-6 rounded-lg transition disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto">
                                        {isLoading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                                                Generating Report...
                                            </>
                                        ) : "Generate AI Report"}
                                    </button>
                                     {!ai && <p className="text-xs text-red-400 mt-2">API Key not configured.</p>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PlayerProfilePage;
