

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Video, ClipboardList, BrainCircuit, X, Bot, Send, Shield, ListChecks, Target, Plus, Trash2, Dumbbell, UploadCloud, FileUp, Link as LinkIcon, Trophy, MicOff, Mic } from 'lucide-react';
import { GoogleGenAI, Chat, Modality, Type, LiveServerMessage } from '@google/genai';
import { mockPlayers, Play, PlayDiagram, Player, GameFilm } from './Dashboard'; // Import mock players to get stats and new components
import { decode, encode, decodeAudioData } from '../utils/audio';

// --- MOCK DATA & TYPES ---
const rawScoutingReport = `### Offensive Tendencies
- Favors 'Spread' offense, utilizing RPOs on 70% of 1st downs.
- QB #7 is mobile to his right but stares down his primary target.
- Limited route tree, heavily reliant on 'Slant' and 'Go' routes.

### Defensive Tendencies
- Primarily a 'Cover 3' zone defense, vulnerable to underneath passes.
- Susceptible to screen passes, especially to the wide side of the field.
- DE #92 has a slow get-off but a powerful bull rush.`;
const opponentName = 'Northwood Panthers';

interface AnalyzedGamePlan {
  offensiveTendencies: string[];
  defensiveTendencies: string[];
  positionalBriefing: {
    summary: string;
    keyPoints: string[];
  };
}


const mockPlays: Play[] = [
    {
        id: 1, name: 'Flood Concept', type: 'Offense', subType: 'Pass', formation: 'Spread',
        description: 'Floods one side with 3 routes at different depths to stress zone coverage.',
        formationMarkers: [
            { id: 'qb1', type: 'offense', label: 'QB', x: 50, y: 85 },
            { id: 'wr1', type: 'offense', label: 'WR', x: 15, y: 60 },
            { id: 'te1', type: 'offense', label: 'TE', x: 40, y: 62 },
            { id: 'wr2', type: 'offense', label: 'WR', x: 85, y: 60 },
        ],
        paths: [
            { markerId: 'wr1', points: [{x: 15, y: 60}, {x: 15, y: 40}, {x: 35, y: 20}] },
            { markerId: 'te1', points: [{x: 40, y: 62}, {x: 40, y: 50}, {x: 25, y: 50}] },
            { markerId: 'wr2', points: [{x: 85, y: 60}, {x: 70, y: 60}] },
        ]
    },
    {
        id: 2, name: 'HB Dive', type: 'Offense', subType: 'Run', formation: 'I-Form',
        description: 'A direct handoff to the halfback running through an interior gap.',
        formationMarkers: [
            { id: 'qb2', type: 'offense', label: 'QB', x: 50, y: 85 },
            { id: 'rb2', type: 'offense', label: 'RB', x: 50, y: 90 },
        ],
        paths: [
            { markerId: 'rb2', points: [{x: 50, y: 90}, {x: 50, y: 65}] }
        ]
    },
    {
        id: 3, name: 'Cover 3 Buzz', type: 'Defense', subType: 'Zone', formation: '4-3',
        description: 'Zone defense with 3 deep defenders and a safety rotating down to cover short passes.',
        formationMarkers: [
            { id: 's1', type: 'defense', label: 'S', x: 50, y: 20 },
            { id: 's2', type: 'defense', label: 'S', x: 25, y: 35 },
            { id: 'cb1', type: 'defense', label: 'CB', x: 10, y: 30 },
            { id: 'cb2', type: 'defense', label: 'CB', x: 90, y: 30 },
        ],
        paths: [
            { markerId: 's2', points: [{x: 25, y: 35}, {x: 30, y: 50}] }
        ]
    }
];

interface Goal {
    id: number;
    description: string;
    target: number;
    current: number;
}

interface Exercise {
    id: number;
    name: string;
    description: string;
    sets: string;
    reps: string;
    videoUrl?: string;
}

const mockExercises: Exercise[] = [
    { id: 1, name: 'Box Squats', description: 'Focus on explosive power out of the bottom.', sets: '4', reps: '6-8' },
    { id: 2, name: 'Bench Press', description: 'Maintain a stable base, drive with your legs.', sets: '4', reps: '6-8' },
    { id: 3, name: 'Power Cleans', description: 'Focus on triple extension: ankles, knees, and hips.', sets: '5', reps: '3' },
    { id: 4, name: 'Route Tree Drills', description: 'Run the full route tree (0-9). Focus on sharp cuts and sinking hips.', sets: '2', reps: 'Full Tree' },
];

interface PlayerDevelopmentPlan {
    focusAreas: string[];
    drills: {
        name: string;
        description: string;
        whyItHelps: string;
        mockVideoUrl: string;
    }[];
    motivation: string;
}

const getApiErrorMessage = (error: unknown): string => {
    console.error("API Error:", error);
    let message: string;

    if (error instanceof Error) {
        message = error.message;
    } else if (error && typeof error === 'object' && 'message' in error) {
        message = String((error as { message: unknown }).message);
    } else if (typeof error === 'string') {
        message = error;
    } else {
        return "An unknown error occurred. Please check the console for details.";
    }

    if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
        return "You've exceeded your request limit. Please wait a moment before trying again. For more info, check your Google AI Studio plan and billing details.";
    }
    if (message.includes('400') || message.includes('INVALID_ARGUMENT')) {
        return "There was an issue with the request. Please check your input and try again. The API returned: " + message;
    }
    if (message.includes("Requested entity was not found") || message.includes("API key not valid")) {
        return "There's an issue with the API key. Please ensure it's correctly configured and has access to the requested models.";
    }
    
    return message;
};


// --- COMPONENTS ---

interface StatCardProps {
    icon: React.ElementType;
    title: string;
    value: string;
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, color }) => (
    <div className="bg-gray-800 rounded-xl p-6 text-center transition-transform hover:-translate-y-1">
        <Icon className={`w-8 h-8 mx-auto mb-3 ${color}`} />
        <div className="text-gray-400 text-sm">{title}</div>
        <div className={`text-3xl font-bold text-white`}>{value}</div>
    </div>
);

const GamePlanSection: React.FC<{
    opponentName: string;
    gamePlan: AnalyzedGamePlan | null;
    isLoading: boolean;
}> = ({ opponentName, gamePlan, isLoading }) => {
    if (isLoading) {
        return (
            <div className="bg-gray-800 rounded-xl p-6 animate-pulse">
                <div className="h-8 bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <div className="h-6 bg-gray-700 rounded w-1/2 mb-3"></div>
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-700 rounded w-full"></div>
                            <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                            <div className="h-4 bg-gray-700 rounded w-full"></div>
                        </div>
                    </div>
                    <div className="bg-gray-900/50 p-6 rounded-lg">
                        <div className="h-6 bg-gray-700 rounded w-1/2 mb-3"></div>
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-700 rounded w-full"></div>
                            <div className="h-4 bg-gray-700 rounded w-full"></div>
                            <div className="h-4 bg-gray-700 rounded w-4/6"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!gamePlan) {
        return (
            <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-2xl font-bold mb-4">Game Plan vs. {opponentName}</h2>
                <p className="text-red-400">Could not load AI-generated game plan. Please try refreshing.</p>
            </div>
        );
    }
    
    return (
        <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4">Game Plan vs. {opponentName}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><Shield /> Opponent Intel</h3>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-bold text-green-400 mb-2">Offensive Tendencies</h4>
                            <ul className="list-disc list-inside space-y-1 text-gray-300">
                                {gamePlan.offensiveTendencies.map((t, i) => <li key={i}>{t}</li>)}
                            </ul>
                        </div>
                         <div>
                            <h4 className="font-bold text-red-400 mb-2">Defensive Tendencies</h4>
                            <ul className="list-disc list-inside space-y-1 text-gray-300">
                               {gamePlan.defensiveTendencies.map((t, i) => <li key={i}>{t}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-900/50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><ListChecks /> My Positional Briefing</h3>
                    <p className="text-gray-200 leading-relaxed italic mb-4">
                        "{gamePlan.positionalBriefing.summary}"
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-300">
                        {gamePlan.positionalBriefing.keyPoints.map((point, i) => (
                            <li key={i}>{point}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};


const AIPlayAnalystModal: React.FC<{ play: Play; ai: GoogleGenAI; closeModal: () => void; playerPosition: string; }> = ({ play, ai, closeModal, playerPosition }) => {
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const getAnalysis = async () => {
            setIsLoading(true);
            setAnalysis('');
            const prompt = `You are an expert football coach. Analyze the following play called '${play.name}' for a ${playerPosition}. Here is the description: '${play.description}'. Explain the player's primary responsibilities, key reads against common defenses, and common mistakes to avoid. Structure your response with clear headings for: 1. Key Objective, 2. My Responsibilities, 3. Reads & Progressions, 4. Coaching Points. Keep it concise and actionable for a high school player.`;

            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-pro',
                    contents: prompt,
                });
                setAnalysis(response.text);
            } catch (error) {
                setAnalysis(getApiErrorMessage(error));
            } finally {
                setIsLoading(false);
            }
        };

        getAnalysis();
    }, [ai, play, playerPosition]); // Dependencies for useEffect

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 w-full max-w-2xl h-[80vh] rounded-xl shadow-2xl flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><BrainCircuit /> AI Play Analyst: {play.name}</h2>
                    <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-700"><X size={20} /></button>
                </div>
                <div className="p-6 flex-grow overflow-y-auto">
                    <div className="mb-4">
                        <h3 className="font-semibold mb-2">Play Diagram:</h3>
                        <PlayDiagram formationMarkers={play.formationMarkers} paths={play.paths} />
                    </div>
                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="w-8 h-8 border-4 border-t-transparent border-brand-primary rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-400">AI is breaking down the play for you...</p>
                        </div>
                    ) : (
                        <div className="bg-gray-900/50 p-4 rounded-lg">
                            <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed">{analysis}</pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// FIX: PlayerDevelopmentPlanCard and associated types are already defined in Dashboard.tsx
// To avoid duplication and potential type conflicts, we'll assume they are imported or not needed here directly.
// If they were intended to be redefined, the types would also need to be here.
// For now, removing the re-definition and assuming usage is compatible with Dashboard.tsx's definitions.

const PlayerDashboard: React.FC = () => {
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [modalData, setModalData] = useState<any>(null);
    const [ai, setAi] = useState<GoogleGenAI | null>(null);
    const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null); // Mock for logged-in player
    const [playerPlays, setPlayerPlays] = useState<Play[]>(mockPlays);
    const [playerGoals, setPlayerGoals] = useState<Goal[]>([
        { id: 1, description: 'Increase 40-yard dash time', target: 4.6, current: 4.8 },
        { id: 2, description: 'Improve completion percentage', target: 75, current: 72 },
        { id: 3, description: 'Reduce missed tackles', target: 5, current: 8 },
    ]);
    const [trainingPlan, setTrainingPlan] = useState<Exercise[]>(mockExercises);
    const [developmentPlan, setDevelopmentPlan] = useState<PlayerDevelopmentPlan | null>(null);
    const [gamePlan, setGamePlan] = useState<AnalyzedGamePlan | null>(null);
    const [isGamePlanLoading, setIsGamePlanLoading] = useState(true);

    useEffect(() => {
        // Mock player login - replace with actual auth logic
        // For demo, we'll use the first player from mockPlayers
        setCurrentPlayer(mockPlayers[0]); 

        if (process.env.API_KEY) {
            setAi(new GoogleGenAI({ apiKey: process.env.API_KEY }));
        }
    }, []);
    
    useEffect(() => {
        const generateGamePlan = async () => {
            if (!ai || !currentPlayer) return;

            setIsGamePlanLoading(true);
            const prompt = `You are an AI football coach analyzing a raw scouting report for our upcoming game. Extract key tendencies and create a personalized briefing for one of our players. The player is a ${currentPlayer.position}.

            Raw Scouting Report:
            ---
            ${rawScoutingReport}
            ---

            Based on this report, generate a JSON object with the following structure:
            {
              "offensiveTendencies": ["List of opponent's offensive tendencies."],
              "defensiveTendencies": ["List of opponent's defensive tendencies."],
              "positionalBriefing": {
                "summary": "A concise one-sentence summary of the player's main focus for the game.",
                "keyPoints": [
                    "A list of 2-3 specific, actionable bullet points for the ${currentPlayer.position}.",
                    "Each point should tell them what to watch for or how to exploit a weakness."
                ]
              }
            }`;

            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-pro',
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                offensiveTendencies: {
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING }
                                },
                                defensiveTendencies: {
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING }
                                },
                                positionalBriefing: {
                                    type: Type.OBJECT,
                                    properties: {
                                        summary: { type: Type.STRING },
                                        keyPoints: {
                                            type: Type.ARRAY,
                                            items: { type: Type.STRING }
                                        }
                                    },
                                    required: ['summary', 'keyPoints']
                                }
                            },
                            required: ['offensiveTendencies', 'defensiveTendencies', 'positionalBriefing']
                        }
                    }
                });
                const analyzedPlan: AnalyzedGamePlan = JSON.parse(response.text);
                setGamePlan(analyzedPlan);
            } catch (error) {
                console.error("Error generating game plan:", error);
                setGamePlan(null);
            } finally {
                setIsGamePlanLoading(false);
            }
        };

        if (ai && currentPlayer) {
            generateGamePlan();
        }
    }, [ai, currentPlayer]);


    const handleOpenModal = (modalName: string, data: any = null) => {
        setModalData(data);
        setActiveModal(modalName);
    };
    
    const handleCloseModal = () => {
        setActiveModal(null);
        setModalData(null);
    };

    const handleUpdateGoal = (id: number, newCurrent: number) => {
        setPlayerGoals(prev => prev.map(goal => 
            goal.id === id ? { ...goal, current: newCurrent } : goal
        ));
    };

    const handleAddGoal = (description: string, target: number) => {
        const newGoal = { id: Date.now(), description, target, current: 0 };
        setPlayerGoals(prev => [...prev, newGoal]);
    };

    const handleDeleteGoal = (id: number) => {
        setPlayerGoals(prev => prev.filter(goal => goal.id !== id));
    };

    const handleGenerateDevPlan = useCallback((player: Player, plan: PlayerDevelopmentPlan) => {
        setDevelopmentPlan(plan);
    }, []);


    if (!currentPlayer) {
        return (
            <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
                    <Link to="/login" className="text-brand-primary hover:underline">Go to Login Page</Link>
                </div>
            </div>
        );
    }

    const renderModal = () => {
        if (!ai && activeModal !== 'settings' && activeModal !== 'addGoal' && activeModal !== 'playbook' && activeModal !== 'trainingPlan' && activeModal !== 'developmentPlan') {
             return (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-8 rounded-lg text-center">
                        <h2 className="text-2xl font-bold text-red-500 mb-4">API Key Not Found</h2>
                        <p className="text-gray-300">Please set your API_KEY environment variable.</p>
                        <button onClick={handleCloseModal} className="mt-6 bg-brand-primary px-6 py-2 rounded-lg">Close</button>
                    </div>
                </div>
            );
        }
        switch (activeModal) {
            case 'playAnalyst':
                return modalData && <AIPlayAnalystModal play={modalData} ai={ai!} closeModal={handleCloseModal} playerPosition={currentPlayer.position} />;
            case 'addGoal':
                return <AddGoalModal onAddGoal={handleAddGoal} closeModal={handleCloseModal} />;
            case 'playbook':
                return <PlayerPlaybookModal plays={playerPlays} playerPosition={currentPlayer.position} onAnalyzePlay={handleOpenModal} closeModal={handleCloseModal} />;
            case 'trainingPlan':
                return <PlayerTrainingPlanModal trainingPlan={trainingPlan} closeModal={handleCloseModal} />;
            case 'developmentPlan':
                return <PlayerDevelopmentPlanModal player={currentPlayer} goals={playerGoals} ai={ai!} initialPlan={developmentPlan} onGenerate={handleGenerateDevPlan} closeModal={handleCloseModal} />;
            default:
                return null;
        }
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen">
            <nav className="bg-gray-800 border-b-4 border-brand-primary shadow-lg">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-4">
                            <div className="text-2xl font-bold text-white">🏈 GRIDIRON INTEL</div>
                            <div className="text-gray-400">|</div>
                            <div className="text-gray-300">Player Dashboard</div>
                        </div>
                        <Link to="/login" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">Log Out</Link>
                    </div>
                </div>
            </nav>
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="text-center mb-10">
                    <div className="w-24 h-24 bg-brand-primary rounded-full flex items-center justify-center font-bold text-4xl mx-auto mb-3 border-4 border-gray-700">{currentPlayer.avatar}</div>
                    <h1 className="text-4xl font-bold">{currentPlayer.name}</h1>
                    <p className="text-lg text-brand-accent font-semibold">{currentPlayer.position}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard icon={BarChart} title="Total TDs" value="18" color="text-green-400" />
                    <StatCard icon={Target} title="Yards/Game" value="95.2" color="text-blue-400" />
                    <StatCard icon={Video} title="Film Reviewed" value="12 hrs" color="text-purple-400" />
                    <StatCard icon={Trophy} title="Player Rating" value="8.7" color="text-yellow-400" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <GamePlanSection 
                            opponentName={opponentName} 
                            gamePlan={gamePlan} 
                            isLoading={isGamePlanLoading} 
                        />

                        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><ClipboardList /> My Plays</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {playerPlays.slice(0, 4).map(play => (
                                    <div key={play.id} className="bg-gray-700 p-4 rounded-lg flex flex-col justify-between">
                                        <div>
                                            <p className="font-bold text-white">{play.name} <span className={`text-xs ml-2 px-2 py-0.5 rounded-full ${play.type === 'Offense' ? 'bg-blue-500/50' : 'bg-red-500/50'}`}>{play.type}</span></p>
                                            <p className="text-sm text-gray-400 mt-1">{play.formation} - {play.subType}</p>
                                        </div>
                                        <button onClick={() => handleOpenModal('playAnalyst', play)} className="mt-3 bg-brand-primary hover:bg-brand-dark py-2 px-3 rounded-lg text-sm font-semibold">
                                            Analyze with AI
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => handleOpenModal('playbook')} className="w-full mt-4 bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-bold flex items-center justify-center gap-2">
                                <Plus size={18} /> View All Plays
                            </button>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Target /> My Performance Goals</h2>
                            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                                {playerGoals.map(goal => {
                                    const progress = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
                                    const isComplete = goal.current >= goal.target;

                                    return (
                                        <div key={goal.id} className="bg-gray-700 p-4 rounded-lg">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="font-semibold text-white">{goal.description}</p>
                                                <button onClick={() => handleDeleteGoal(goal.id)} className="text-gray-500 hover:text-red-500 flex-shrink-0 ml-2"><Trash2 size={16} /></button>
                                            </div>
                                            
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="flex-grow bg-gray-600 rounded-full h-3 relative">
                                                    <div 
                                                        className={`${isComplete ? 'bg-green-500' : 'bg-brand-primary'} h-3 rounded-full transition-all duration-500`} 
                                                        style={{ width: `${progress}%` }}
                                                    ></div>
                                                </div>
                                                <div className={`text-sm font-bold ${isComplete ? 'text-green-400' : 'text-white'}`}>
                                                    {Math.round(progress)}%
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center justify-between text-sm text-gray-300">
                                                <div>
                                                    <span>Current: </span>
                                                    <input 
                                                        type="number" 
                                                        value={goal.current} 
                                                        onChange={e => handleUpdateGoal(goal.id, Number(e.target.value))} 
                                                        className="w-20 ml-1 bg-gray-600 rounded-md text-center border border-gray-500"
                                                    />
                                                </div>
                                                <span className="font-semibold">Target: {goal.target}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <button onClick={() => handleOpenModal('addGoal')} className="w-full mt-4 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg font-bold flex items-center justify-center gap-2">
                                <Plus size={18} /> Add New Goal
                            </button>
                        </div>

                        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Dumbbell /> Training Plan</h2>
                            <div className="space-y-3 max-h-48 overflow-y-auto">
                                {trainingPlan.map(exercise => (
                                    <div key={exercise.id} className="bg-gray-700 p-3 rounded-lg">
                                        <p className="font-bold text-white">{exercise.name}</p>
                                        <p className="text-sm text-brand-accent">{exercise.sets} sets of {exercise.reps}</p>
                                        <p className="text-xs text-gray-400 mt-1">{exercise.description}</p>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => handleOpenModal('trainingPlan')} className="w-full mt-4 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg font-bold flex items-center justify-center gap-2">
                                <Video size={18} /> View Detailed Plan
                            </button>
                        </div>

                         <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-2xl font-bold flex items-center gap-2"><BrainCircuit /> AI Development Plan</h2>
                                {developmentPlan && (
                                    <button onClick={() => handleOpenModal('developmentPlan')} className="bg-gray-700 hover:bg-gray-600 text-sm py-1 px-3 rounded-lg font-semibold">
                                        View Details
                                    </button>
                                )}
                            </div>
                            {developmentPlan ? (
                                <div className="space-y-3">
                                    <div>
                                        <h3 className="font-semibold text-brand-accent mb-1">Key Focus Areas:</h3>
                                        <ul className="list-disc list-inside text-gray-300 text-sm">
                                            {developmentPlan.focusAreas.map((area, i) => <li key={i}>{area}</li>)}
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-brand-accent mt-3 mb-1">Top Drill Recommendation:</h3>
                                        {developmentPlan.drills && developmentPlan.drills.length > 0 ? (
                                            <div className="bg-gray-700/50 p-3 rounded-md text-sm">
                                                <p className="font-bold text-white">{developmentPlan.drills[0].name}</p>
                                                <p className="text-gray-400 text-xs">{developmentPlan.drills[0].description}</p>
                                            </div>
                                        ) : (
                                            <p className="text-gray-400 text-sm">No specific drills generated.</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <p className="text-gray-400 mb-4">Generate a personalized development plan to enhance your skills.</p>
                                    <button onClick={() => handleOpenModal('developmentPlan')} disabled={!ai} className="bg-brand-primary hover:bg-brand-dark py-2 px-4 rounded-lg font-bold disabled:bg-gray-600">
                                        Generate Plan
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {renderModal()}
                <PlayerChatbot ai={ai} playerName={currentPlayer.name} playerPosition={currentPlayer.position} />
            </main>
        </div>
    );
};

// --- MODAL COMPONENTS FOR PLAYER DASHBOARD ---

interface PlayerModalProps {
    closeModal: () => void;
}

const AddGoalModal: React.FC<{ onAddGoal: (description: string, target: number) => void } & PlayerModalProps> = ({ onAddGoal, closeModal }) => {
    const [description, setDescription] = useState('');
    const [target, setTarget] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (description.trim() && target) {
            onAddGoal(description, Number(target));
            closeModal();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 w-full max-w-md rounded-xl shadow-2xl">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><Plus /> Add New Goal</h2>
                    <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-700"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Goal Description</label>
                        <input type="text" value={description} onChange={e => setDescription(e.target.value)} required className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600" placeholder="e.g., Increase bench press max" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Target Value</label>
                        <input type="number" value={target} onChange={e => setTarget(e.target.value)} required className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600" placeholder="e.g., 225" />
                    </div>
                    <div className="pt-2">
                        <button type="submit" className="w-full bg-brand-primary hover:bg-brand-dark py-3 rounded-lg font-bold">Add Goal</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const PlayerPlaybookModal: React.FC<{ plays: Play[]; playerPosition: string; onAnalyzePlay: (modalName: string, data: any) => void } & PlayerModalProps> = ({ plays, playerPosition, onAnalyzePlay, closeModal }) => {
    const [filter, setFilter] = useState('All');
    
    const filteredPlays = plays.filter(p => 
        (filter === 'All' || p.type === filter) && 
        (p.formationMarkers.some(m => m.label.toUpperCase() === playerPosition.toUpperCase()) || filter !== 'All') // Only show plays where player is involved if filter is not 'All'
    );

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 w-full max-w-4xl h-[90vh] rounded-xl shadow-2xl flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><ClipboardList /> My Playbook</h2>
                    <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-700"><X size={20} /></button>
                </div>
                <div className="p-6 flex-grow overflow-hidden flex flex-col">
                     <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-1 bg-gray-700 p-1 rounded-lg">
                            <button onClick={() => setFilter('All')} className={`px-3 py-1 text-sm rounded-md ${filter === 'All' ? 'bg-brand-primary' : ''}`}>All</button>
                            <button onClick={() => setFilter('Offense')} className={`px-3 py-1 text-sm rounded-md ${filter === 'Offense' ? 'bg-brand-primary' : ''}`}>Offense</button>
                            <button onClick={() => setFilter('Defense')} className={`px-3 py-1 text-sm rounded-md ${filter === 'Defense' ? 'bg-brand-primary' : ''}`}>Defense</button>
                         </div>
                    </div>
                    <div className="flex-grow bg-gray-900/50 rounded-lg p-3 space-y-2 overflow-y-auto">
                        {filteredPlays.map(play => (
                            <div key={play.id} className="bg-gray-700 p-3 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-white">{play.name} <span className={`text-xs ml-2 px-2 py-0.5 rounded-full ${play.type === 'Offense' ? 'bg-blue-500/50' : 'bg-red-500/50'}`}>{play.type}</span></p>
                                        <p className="text-xs text-gray-400">{play.formation} - {play.subType}</p>
                                        <p className="text-sm text-gray-300 mt-2">{play.description}</p>
                                    </div>
                                    <button onClick={() => onAnalyzePlay('playAnalyst', play)} className="p-2 text-brand-primary hover:text-white flex-shrink-0 ml-4"><BrainCircuit size={18} /></button>
                                </div>
                                <div className="mt-2">
                                    <PlayDiagram formationMarkers={play.formationMarkers} paths={play.paths} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const PlayerTrainingPlanModal: React.FC<{ trainingPlan: Exercise[] } & PlayerModalProps> = ({ trainingPlan, closeModal }) => {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 w-full max-w-4xl h-[90vh] rounded-xl shadow-2xl flex flex-col">
                 <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><Dumbbell /> My Training Plan</h2>
                    <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-700"><X size={20} /></button>
                </div>
                 <div className="p-6 flex-grow overflow-y-auto space-y-4">
                    {trainingPlan.map(ex => (
                        <div key={ex.id} className="bg-gray-700 p-4 rounded-lg">
                            <h3 className="font-bold text-white text-lg">{ex.name}</h3>
                            <p className="text-sm text-brand-accent">{ex.sets} sets of {ex.reps}</p>
                            <p className="text-gray-300 mt-2">{ex.description}</p>
                            {ex.videoUrl && (
                                <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm mt-2 flex items-center gap-1">
                                    <Video size={16} /> Watch Demo
                                </a>
                            )}
                        </div>
                    ))}
                 </div>
            </div>
        </div>
    );
};


const PlayerDevelopmentPlanModal: React.FC<{ player: Player; goals: Goal[]; ai: GoogleGenAI; initialPlan?: PlayerDevelopmentPlan | null; onGenerate: (player: Player, plan: PlayerDevelopmentPlan) => void } & PlayerModalProps> = ({ player, goals, ai, initialPlan, onGenerate, closeModal }) => {
    const [plan, setPlan] = useState<PlayerDevelopmentPlan | null>(initialPlan || null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generatePlan = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setPlan(null);

        const playerGoalsString = goals.map(g => `${g.description} (Current: ${g.current}, Target: ${g.target})`).join('; ');
        const playerStatsString = player.stats.map(s => `${s.name}: ${s.value}`).join(', ');
        const radarString = player.radarData.map(d => `${d.subject}: ${d.value} (vs League Avg: ${d.avg})`).join('; ');

        const prompt = `You are an expert high school football coach and a player development AI. Create a personalized development plan for ${player.name}, a ${player.position}.
        
        Player's Stated Goals: ${playerGoalsString}.
        Player Stats: ${playerStatsString}.
        Performance Radar: ${radarString}.
        
        Based on all of this data, generate a JSON object with the following structure:
        {
          "focusAreas": ["area1", "area2"],
          "drills": [
            {"name": "Drill Name", "description": "Short description", "whyItHelps": "How this drill addresses a goal or weakness", "mockVideoUrl": "https://www.youtube.com/watch?v=mockvideoid"},
            // ... more drills
          ],
          "motivation": "Encouraging message"
        }
        
        Provide 2-3 specific "focusAreas" that directly address the player's goals or weaknesses shown in the data. For "drills", include 3-5 unique drill recommendations. Each drill should have a unique 'mockVideoUrl' which is a valid YouTube URL (you can use placeholders like 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' for now). Ensure the 'whyItHelps' directly relates to a focus area. The 'motivation' should be a brief, uplifting message.`;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            focusAreas: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                            },
                            drills: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        description: { type: Type.STRING },
                                        whyItHelps: { type: Type.STRING },
                                        mockVideoUrl: { type: Type.STRING }
                                    },
                                    required: ['name', 'description', 'whyItHelps', 'mockVideoUrl']
                                }
                            },
                            motivation: { type: Type.STRING }
                        },
                        required: ['focusAreas', 'drills', 'motivation']
                    }
                }
            });
            const generatedPlan: PlayerDevelopmentPlan = JSON.parse(response.text);
            setPlan(generatedPlan);
            onGenerate(player, generatedPlan);
        } catch (e) {
            setError(getApiErrorMessage(e));
        } finally {
            setIsLoading(false);
        }
    }, [ai, player, onGenerate, goals]);

    useEffect(() => {
        if (!initialPlan) {
            generatePlan();
        }
    }, [initialPlan, generatePlan]);

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 w-full max-w-4xl h-[90vh] rounded-xl shadow-2xl flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><Trophy /> AI Development Plan for {player.name}</h2>
                    <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-700"><X size={20} /></button>
                </div>
                <div className="p-6 flex-grow overflow-y-auto">
                    {error && <div className="bg-red-500/20 text-red-300 text-sm p-3 rounded-lg mb-4">{error}</div>}
                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="w-8 h-8 border-4 border-t-transparent border-brand-primary rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-400">AI is crafting a personalized plan...</p>
                        </div>
                    ) : plan ? (
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-brand-accent mb-2">Key Focus Areas:</h3>
                                <ul className="list-disc list-inside space-y-1 text-gray-300">
                                    {plan.focusAreas.map((area, i) => <li key={i}>{area}</li>)}
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-brand-accent mb-2">Personalized Drills:</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {plan.drills.map((drill, i) => (
                                        <div key={i} className="bg-gray-700 p-3 rounded-lg">
                                            <h4 className="font-bold text-white">{drill.name}</h4>
                                            <p className="text-sm text-gray-300">{drill.description}</p>
                                            <p className="text-xs text-brand-accent mt-1">Why it helps: {drill.whyItHelps}</p>
                                            <a href={drill.mockVideoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm mt-2 block">Watch Video</a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="pt-2 border-t border-gray-700">
                                <p className="text-lg font-semibold text-gray-200">{plan.motivation}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-400 mb-4">Generate an AI-powered development plan for {player.name}.</p>
                            <button onClick={generatePlan} className="bg-brand-primary hover:bg-brand-dark py-2 px-4 rounded-lg font-bold">Generate Plan</button>
                        </div>
                    )}
                    {!isLoading && <button onClick={generatePlan} className="w-full mt-4 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg font-bold">Regenerate Plan</button>}
                </div>
            </div>
        </div>
    );
};


// --- PLAYER CHATBOT ---

interface PlayerChatMessage {
    sender: 'user' | 'bot';
    text: string;
}

const PLAYER_CHAT_HISTORY_KEY = 'gridironIntelPlayerChatHistory';

const PlayerChatbot: React.FC<{ ai: GoogleGenAI | null; playerName: string; playerPosition: string; }> = ({ ai, playerName, playerPosition }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<PlayerChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [chat, setChat] = useState<Chat | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const stopListening = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }
        setIsListening(false);
    }, []);

    const startListening = useCallback(async () => {
        if (!ai) return;
        setIsListening(true);
        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: { 
                inputAudioTranscription: {},
                responseModalities: [Modality.AUDIO]
            },
            callbacks: {
                onopen: async () => {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                    const source = inputAudioContext.createMediaStreamSource(stream);
                    const processor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                    source.connect(processor);
                    processor.connect(inputAudioContext.destination);
                    processor.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        const int16 = new Int16Array(inputData.length);
                        for (let i = 0; i < inputData.length; i++) { int16[i] = inputData[i] * 32768; }
                        const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
                        sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                    };
                },
                onmessage: async (message: LiveServerMessage) => {
                    if (message.serverContent?.inputTranscription) {
                        setInput(prev => (prev ? prev + ' ' : '') + message.serverContent.inputTranscription.text);
                    }
                },
                onerror: (e) => { console.error("Live session error:", e); stopListening(); },
                onclose: () => setIsListening(false),
            }
        });
        sessionPromiseRef.current = sessionPromise;
    }, [ai, stopListening]);

    useEffect(() => { return () => { if (isListening) stopListening(); }; }, [isListening, stopListening]);

    useEffect(() => {
        try {
            const storedHistory = localStorage.getItem(PLAYER_CHAT_HISTORY_KEY);
            if (storedHistory) {
                setMessages(JSON.parse(storedHistory));
            } else {
                setMessages([{ sender: 'bot', text: `Hey ${playerName}! I'm Grid, your AI assistant. Ask me anything about plays, opponent tendencies, or training.` }]);
            }
        } catch (error) {
            console.error("Failed to load player chat history:", error);
            setMessages([{ sender: 'bot', text: `Hey ${playerName}! I'm Grid, your AI assistant.` }]);
        }
    }, [playerName]);

    useEffect(() => {
        if (messages.length > 1) {
            localStorage.setItem(PLAYER_CHAT_HISTORY_KEY, JSON.stringify(messages));
        }
    }, [messages]);

    useEffect(() => {
        if (ai && !chat) {
            const historyForAI = messages.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model' as 'user' | 'model',
                parts: [{ text: msg.text }],
            }));
            const genaiHistory = messages.length > 1 ? historyForAI : [];
            const newChat = ai.chats.create({ 
                model: 'gemini-2.5-flash',
                history: genaiHistory,
                config: {
                    systemInstruction: `You are Grid, an expert AI football assistant designed for high school players. Your name is Grid. You are speaking to ${playerName}, a ${playerPosition}. Provide clear, encouraging, and actionable advice related to plays, opponent strategies, and personal development plans. Keep explanations simple and direct.`
                }
            });
            setChat(newChat);
        }
    }, [ai, chat, playerName, playerPosition, messages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !chat || isLoading) return;
        if (isListening) stopListening();

        const userMessage: PlayerChatMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await chat.sendMessage({ message: input });
            const botMessage: PlayerChatMessage = { sender: 'bot', text: response.text };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            const errorMessage: PlayerChatMessage = { sender: 'bot', text: getApiErrorMessage(error) };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button onClick={() => setIsOpen(true)} className="fixed bottom-8 right-8 bg-brand-primary text-white p-4 rounded-full shadow-lg hover:bg-brand-dark transition-transform hover:scale-110">
                <Bot size={28} />
            </button>
        );
    }
    
    return (
        <div className="fixed bottom-8 right-8 w-96 h-[600px] bg-gray-800 rounded-xl shadow-2xl flex flex-col z-40 overflow-hidden">
            <div className="p-4 bg-gray-700 flex justify-between items-center flex-shrink-0">
                <h3 className="text-lg font-bold">Grid AI Assistant</h3>
                <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-600"><X size={18} /></button>
            </div>
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-xl ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700'}`}>{msg.text}</div>
                    </div>
                ))}
                 {isLoading && <div className="flex justify-start"><div className="bg-gray-700 p-3 rounded-xl animate-pulse">...</div></div>}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-gray-700 bg-gray-800 flex-shrink-0">
                <div className="flex items-center gap-2 p-2 bg-gray-700 rounded-lg">
                    <button onClick={isListening ? stopListening : startListening} className={`p-2 rounded-full hover:bg-gray-600 transition ${isListening ? 'text-red-500' : 'text-gray-400 hover:text-white'}`} title={isListening ? 'Stop Listening' : 'Use Voice'}>
                        {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                    <input 
                        type="text" 
                        value={input} 
                        onChange={e => setInput(e.target.value)} 
                        onKeyDown={e => e.key === 'Enter' && handleSend()} 
                        placeholder="Ask a question..." 
                        className="w-full bg-transparent focus:outline-none text-white"
                    />
                    <button onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-brand-primary p-2 rounded-lg hover:bg-brand-dark disabled:bg-gray-500 disabled:cursor-not-allowed text-white">
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlayerDashboard;