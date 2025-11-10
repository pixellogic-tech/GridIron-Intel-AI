

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI, LiveServerMessage, Modality, Type, GenerateContentResponse, Chat, FunctionDeclaration } from '@google/genai';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { FileImage, Mic, Bot, BrainCircuit, Search, Speech, X, Send, Paperclip, Target, Shield, Zap, TrendingUp, Presentation, PlusCircle, CheckCircle, Trash2, UserPlus, ListTodo, Users, Settings, ClipboardList, Video, UploadCloud, Dumbbell, Tally4, Lightbulb, BarChart, MapPin, GitCompareArrows, MicOff, Check, Link as LinkIcon, FileUp, AlertTriangle, Wand2, ImagePlay, Clapperboard, VideoIcon, Sparkles, Map, Edit, MousePointer, Move, Eraser, FilePlus, Download, Sun, Cloud, CloudRain, Snowflake, Wind, Droplets, Trophy, GraduationCap } from 'lucide-react';
import { decode, encode, decodeAudioData } from '../utils/audio';

// --- MOCK DATA & TYPES ---

const initialScoutingReport = {
  opponentName: 'Northwood Panthers',
  reportBody: `### Offensive Tendencies
- Favors 'Spread' offense, utilizing RPOs on 70% of 1st downs.
- QB #7 is mobile to his right but stares down his primary target.
- Limited route tree, heavily reliant on 'Slant' and 'Go' routes.

### Defensive Tendencies
- Primarily a 'Cover 3' zone defense, vulnerable to underneath passes.
- Susceptible to screen passes, especially to the wide side of the field.
- DE #92 has a slow get-off but a powerful bull rush.`
};


const performanceData = [
    { name: 'Game 1', offYards: 380, defStops: 8 },
    { name: 'Game 2', offYards: 420, defStops: 10 },
    { name: 'Game 3', offYards: 350, defStops: 7 },
    { name: 'Game 4', offYards: 480, defStops: 12 },
    { name: 'Game 5', offYards: 520, defStops: 14 },
    { name: 'Game 6', offYards: 450, defStops: 11 },
];

export interface PlayerStat {
    name: string;
    value: string | number;
    trend?: string;
}
export interface RadarDataPoint {
    subject: string;
    value: number;
    avg: number;
    fullMark: number;
}
export interface Player {
    id: number;
    name: string;
    position: string;
    avatar: string;
    stats: PlayerStat[];
    radarData: RadarDataPoint[];
    mainMetricName: string;
    age?: number;
    height?: string;
    parentsName?: string;
    phone?: string;
    notes?: string;
    academicInfo?: string; // Added for recruiting
}

export interface PlayerMarker {
    id: string;
    type: 'offense' | 'defense';
    label: string;
    x: number; // percentage
    y: number; // percentage
}
export interface PlayerPath {
    markerId: string;
    points: { x: number; y: number }[];
}
export interface Play {
  id: number;
  name: string;
  type: 'Offense' | 'Defense';
  subType: string; // e.g., 'Pass', 'Run', 'Zone', 'Man'
  formation: string;
  description: string;
  formationMarkers: PlayerMarker[];
  paths: PlayerPath[];
}

export interface OpponentClip {
    id: number;
    title: string;
}
export interface OpponentPlayer {
    id: number;
    name: string;
    position: string;
    avatar: string;
    notes: string;
    clips: OpponentClip[];
}


export const mockPlayers: Player[] = [
    { id: 1, name: 'J. Williams', position: 'QB', avatar: 'JW', mainMetricName: 'Completion %',
      age: 17, height: `6'2"`, parentsName: 'Sarah Williams', phone: '555-123-4567', notes: 'Natural leader, film junkie. Needs work on reading blitz packages.', academicInfo: '3.8 GPA, interested in Engineering',
      stats: [{ name: 'Completion %', value: '72%', trend: '+4%' }, { name: 'Passer Rating', value: 108.5 }, { name: 'Passing TDs', value: 18 }],
      radarData: [
        { subject: 'Pass Yards', value: 85, avg: 70, fullMark: 100 },
        { subject: 'Completion %', value: 72, avg: 65, fullMark: 100 },
        { subject: 'TDs', value: 90, avg: 60, fullMark: 100 },
        { subject: 'Rating', value: 80, avg: 75, fullMark: 100 },
        { subject: 'Decision Making', value: 75, avg: 65, fullMark: 100 },
      ]
    },
    { id: 2, name: 'M. Davis', position: 'WR', avatar: 'MD', mainMetricName: 'Yards After Catch',
      academicInfo: '3.5 GPA, interested in Business',
      stats: [{ name: 'Receptions', value: 45 }, { name: 'YAC', value: '8.2 avg' }, { name: 'Receiving TDs', value: 7 }],
      radarData: [
        { subject: 'Routes', value: 90, avg: 75, fullMark: 100 },
        { subject: 'Hands', value: 95, avg: 80, fullMark: 100 },
        { subject: 'YAC', value: 82, avg: 70, fullMark: 100 },
        { subject: 'Blocking', value: 65, avg: 60, fullMark: 100 },
        { subject: 'Separation', value: 88, avg: 75, fullMark: 100 },
      ]
    },
    { id: 3, name: 'T. Rodriguez', position: 'MLB', avatar: 'TR', mainMetricName: 'Tackle Success Rate',
      academicInfo: '3.2 GPA, interested in Sports Medicine',
      stats: [{ name: 'Tackles', value: 88 }, { name: 'Tackle Success %', value: '92%', trend: '+2%' }, { name: 'Sacks', value: 4 }],
      radarData: [
        { subject: 'Tackling', value: 92, avg: 80, fullMark: 100 },
        { subject: 'Play Recognition', value: 88, avg: 75, fullMark: 100 },
        { subject: 'Coverage', value: 70, avg: 65, fullMark: 100 },
        { subject: 'Pass Rush', value: 75, avg: 60, fullMark: 100 },
        { subject: 'Instincts', value: 90, avg: 80, fullMark: 100 },
      ]
    },
];

const mockOpponentPlayers: OpponentPlayer[] = [
    { id: 101, name: 'K. Anderson', position: 'QB', avatar: 'KA', notes: "Stares down primary receiver. Not comfortable under pressure.", clips: [{id: 1, title: "vs. Central High (Week 6)"}] },
    { id: 102, name: 'L. Chen', position: 'RB', avatar: 'LC', notes: "Powerful downhill runner, but limited lateral speed.", clips: [] },
    { id: 103, name: 'B. Miller', position: 'DE', avatar: 'BM', notes: "Excellent bull rush, but susceptible to cut blocks.", clips: [{id: 1, title: "vs. Central High (Week 6)"}, {id: 2, title: "vs. Roosevelt High (Week 5)"}] },
];

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


interface Task {
    id: number;
    text: string;
    completed: boolean;
    justCompleted?: boolean;
}

export interface GameFilm {
    id: number;
    title: string;
    status: 'uploading' | 'pending' | 'analyzing' | 'complete';
    summary?: string;
    detailedAnalysis?: string;
    errorDetection?: ExecutionError[]; // New field for error detection
    errorDetectionError?: string;
    uploadProgress?: number;
    analysisProgress?: number;
    uploadEta?: number; // in seconds
    fileSize?: number; // in MB
}

export interface ExecutionError {
    id: string;
    category: string; // e.g., 'Offensive Line', 'DB Coverage', 'QB Reads'
    description: string;
    suggestedDrill: string;
    mockClipLink: string; // Placeholder for a link to the specific moment in film
}

export interface Exercise {
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


const mockGameFilms: GameFilm[] = [
    { id: 1, title: "vs. Central High (Week 6)", status: 'complete', summary: "Our offensive line's pass protection against their 3-man rush was a liability. The 'HB Screen' play was highly effective, averaging 9.5 yards. We must adjust our protection schemes immediately.", detailedAnalysis: "### Offensive Performance\n- **Strengths:** High success rate on 1st down runs (5.8 YPC).\n- **Weaknesses:** Struggled in red zone, converting only 1 of 4 attempts. Pass protection against 3-man rush was poor.\n\n### Defensive Performance\n- **Strengths:** Excellent containment of mobile QBs.\n- **Weaknesses:** Vulnerable to play-action passes, gave up 3 explosive plays >20 yards.\n\n### Key Player Notes\n- **Standout Performer:** RB #22, consistently broke tackles.\n- **Needs Improvement:** RT #74, struggled with speed rushers.\n\n### Actionable Insights\n- Implement new pass protection scheme for 3-man fronts.\n- Focus on red zone play execution in practice.", 
    errorDetection: [
        { id: 'err1', category: 'Offensive Line', description: 'Left Tackle missed block on crucial 3rd down.', suggestedDrill: 'Pass Protection Fundamentals', mockClipLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { id: 'err2', category: 'QB Reads', description: 'Quarterback held ball too long, missed open receiver in flat.', suggestedDrill: 'Quick Game Reads', mockClipLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    ]},
    { id: 2, title: "vs. Roosevelt High (Week 5)", status: 'complete', summary: "Dominated the line of scrimmage, with our RB gaining 180 yards. Their offense was predictable, relying on QB runs in 3rd-and-short situations. Special teams coverage was a weakness, allowing a 60-yard kick return.", detailedAnalysis: "Detailed analysis available." },
    { id: 3, title: "vs. Eastside Eagles (Week 4)", status: 'pending' },
];


// --- HELPER FUNCTIONS ---
const darkenColor = (hex: string, percent: number): string => {
    let R = parseInt(hex.substring(1, 3), 16);
    let G = parseInt(hex.substring(3, 5), 16);
    let B = parseInt(hex.substring(5, 7), 16);

    R = Math.floor(R * (100 - percent) / 100);
    G = Math.floor(G * (100 - percent) / 100);
    B = Math.floor(B * (100 - percent) / 100);

    R = (R < 0) ? 0 : R;
    G = (G < 0) ? 0 : G;
    B = (B < 0) ? 0 : B;

    const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
    const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
    const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));

    return "#" + RR + GG + BB;
};

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};
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
        return "There's an issue with the API key. Please ensure it's correctly configured and has access to the requested models. You might need to re-select your API key in settings if using Veo models.";
    }
    
    return message;
};


// --- NEW COMPONENTS ---

export const PlayDiagram: React.FC<{
    formationMarkers: PlayerMarker[];
    paths: PlayerPath[];
    onMarkerMouseDown?: (e: React.MouseEvent, id: string) => void;
    activePath?: PlayerPath | null;
}> = ({ formationMarkers, paths, onMarkerMouseDown, activePath }) => (
    <div className="relative w-full aspect-[5/3] bg-green-800 bg-opacity-50 border-2 border-gray-600 rounded-md overflow-hidden select-none">
        {/* Yard Lines */}
        {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(line => (
             <div key={line} className="absolute h-full border-r border-white/20" style={{ left: `${line}%` }}></div>
        ))}
       
        <svg width="100%" height="100%" className="absolute top-0 left-0">
            {/* Committed Paths */}
            {paths.map(path => {
                const pointsString = path.points.map(p => `${p.x}%,${p.y}%`).join(' ');
                return <polyline key={path.markerId} points={pointsString} stroke="yellow" strokeWidth="2" fill="none" strokeDasharray="4 4" />;
            })}
            {/* Active Path being drawn */}
            {activePath && (
                 <polyline points={activePath.points.map(p => `${p.x}%,${p.y}%`).join(' ')} stroke="yellow" strokeWidth="2.5" fill="none" />
            )}
        </svg>

        {formationMarkers.map(marker => (
            <div
                key={marker.id}
                onMouseDown={onMarkerMouseDown ? (e) => onMarkerMouseDown(e, marker.id) : undefined}
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${marker.type === 'offense' ? 'bg-blue-500 border-blue-300' : 'bg-red-600 border-red-300'} ${onMarkerMouseDown ? 'cursor-grab' : ''}`}
                style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
            >
                {marker.label}
            </div>
        ))}
    </div>
);


const LivePlayPredictor: React.FC<{ ai: GoogleGenAI | null }> = ({ ai }) => {
    const [down, setDown] = useState(1);
    const [distance, setDistance] = useState(10);
    const [fieldPosition, setFieldPosition] = useState(25); // Own 25 yard line
    const [timeRemaining, setTimeRemaining] = useState('12:00');
    const [prediction, setPrediction] = useState<{ playType: string; confidence: number; analysis: string; } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGetPrediction = async () => {
        if (!ai) return;
        setIsLoading(true);
        setPrediction(null);
        setError('');

        const prompt = `You are an expert football play-caller AI. Given the following game situation, predict the opponent's most likely play call.
        
        Game State:
        - Down: ${down}
        - Distance: ${distance} yards
        - Field Position: Own ${fieldPosition} yard line
        - Time Remaining in Quarter: ${timeRemaining}
        
        Based on standard football strategy and situational tendencies, provide your analysis. Return your response as a JSON object with the following structure: { "playType": "Run" or "Pass", "confidence": number (0-100), "analysis": "Your brief reasoning here." }.`;
        
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            playType: { type: Type.STRING },
                            confidence: { type: Type.NUMBER },
                            analysis: { type: Type.STRING },
                        },
                        required: ['playType', 'confidence', 'analysis']
                    }
                }
            });
            const parsedPrediction = JSON.parse(response.text);
            setPrediction(parsedPrediction);
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 space-y-4">
            <h2 className="text-xl font-bold text-white border-b border-gray-700 pb-3 mb-3 flex items-center gap-2"><Zap /> Live Play Predictor</h2>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-center">
                <div>
                    <label className="text-xs text-gray-400">Down</label>
                    <select value={down} onChange={(e) => setDown(Number(e.target.value))} className="w-full bg-gray-700 p-2 rounded-lg text-center font-bold">
                        <option>1</option><option>2</option><option>3</option><option>4</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs text-gray-400">Distance</label>
                    <input type="number" value={distance} onChange={(e) => setDistance(Number(e.target.value))} className="w-full bg-gray-700 p-2 rounded-lg text-center font-bold" />
                </div>
                <div>
                     <label className="text-xs text-gray-400">Yard Line</label>
                    <div className="flex items-center bg-gray-700 rounded-lg">
                        <span className="text-gray-400 pl-2 text-sm">Own</span>
                        <input type="number" value={fieldPosition} onChange={(e) => setFieldPosition(Number(e.target.value))} className="w-full bg-transparent p-2 text-center font-bold focus:outline-none" />
                    </div>
                </div>
                <div>
                     <label className="text-xs text-gray-400">Time Left</label>
                     <input type="text" value={timeRemaining} onChange={(e) => setTimeRemaining(e.target.value)} placeholder="e.g., 2:30" className="w-full bg-gray-700 p-2 rounded-lg text-center font-bold" />
                </div>
            </div>

            <button onClick={handleGetPrediction} disabled={isLoading || !ai} className="w-full bg-brand-primary hover:bg-brand-dark font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition disabled:bg-gray-600">
                {isLoading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                        Getting Prediction...
                    </>
                ) : "Get AI Prediction" }
            </button>
            
            {error && <div className="bg-red-500/20 text-red-300 text-sm p-3 rounded-lg">{error}</div>}

            {prediction && (
                <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 animate-[fadeIn_0.5s_ease-in-out]">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-lg">Predicted Play: <span className={prediction.playType === 'Pass' ? 'text-blue-400' : 'text-green-400'}>{prediction.playType}</span></h3>
                        <div className="text-right">
                            <p className="font-bold text-2xl text-brand-accent">{prediction.confidence}%</p>
                            <p className="text-xs text-gray-400 -mt-1">Confidence</p>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm text-gray-300 flex items-center gap-1"><Lightbulb size={14}/> Analysis:</h4>
                        <p className="text-sm text-gray-400 mt-1">{prediction.analysis}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const WeatherWidget: React.FC<{ ai: GoogleGenAI | null }> = ({ ai }) => {
    const [weatherData, setWeatherData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getWeatherIcon = (condition: string, size: number = 24) => {
        const lowerCaseCondition = condition.toLowerCase();
        if (lowerCaseCondition.includes('sun') || lowerCaseCondition.includes('clear')) {
            return <Sun size={size} className="text-yellow-400" />;
        }
        if (lowerCaseCondition.includes('cloud')) {
            return <Cloud size={size} className="text-gray-400" />;
        }
        if (lowerCaseCondition.includes('rain') || lowerCaseCondition.includes('shower')) {
            return <CloudRain size={size} className="text-blue-400" />;
        }
        if (lowerCaseCondition.includes('snow')) {
            return <Snowflake size={size} className="text-white" />;
        }
        if (lowerCaseCondition.includes('wind')) {
            return <Wind size={size} className="text-gray-300" />;
        }
        return <Cloud size={size} className="text-gray-400" />;
    };

    useEffect(() => {
        if (!ai) {
            setError("AI client not available.");
            setIsLoading(false);
            return;
        }

        const fetchWeather = (lat: number, lon: number) => {
            const prompt = `Provide the current weather and a 3-day forecast for latitude ${lat} and longitude ${lon}. Your response must be in JSON format and adhere to the provided schema. Use abbreviated day names (e.g., 'Mon', 'Tue').`;
            
            ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            current: {
                                type: Type.OBJECT,
                                properties: {
                                    temp: { type: Type.NUMBER, description: "Temperature in Fahrenheit" },
                                    condition: { type: Type.STRING },
                                    wind: { type: Type.NUMBER, description: "Wind speed in mph" },
                                    humidity: { type: Type.NUMBER, description: "Humidity in percentage" }
                                },
                                required: ["temp", "condition", "wind", "humidity"]
                            },
                            forecast: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        day: { type: Type.STRING },
                                        high: { type: Type.NUMBER, description: "High temperature in Fahrenheit" },
                                        low: { type: Type.NUMBER, description: "Low temperature in Fahrenheit" },
                                        condition: { type: Type.STRING }
                                    },
                                    required: ["day", "high", "low", "condition"]
                                }
                            }
                        },
                        required: ["current", "forecast"]
                    }
                }
            }).then(response => {
                try {
                    const parsedData = JSON.parse(response.text);
                    setWeatherData(parsedData);
                } catch (e) {
                    setError("Failed to parse weather data.");
                }
            }).catch(err => {
                setError(getApiErrorMessage(err));
            }).finally(() => {
                setIsLoading(false);
            });
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                fetchWeather(position.coords.latitude, position.coords.longitude);
            },
            () => {
                setError("Geolocation is required for the weather forecast.");
                setIsLoading(false);
            }
        );
    }, [ai]);

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 space-y-4">
            <h2 className="text-xl font-bold text-white border-b border-gray-700 pb-3 mb-3 flex items-center gap-2"><Cloud /> Weather Forecast</h2>
            {isLoading && <div className="text-center text-gray-400">Fetching weather...</div>}
            {error && <div className="bg-red-500/20 text-red-300 text-sm p-3 rounded-lg">{error}</div>}
            {weatherData && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            {getWeatherIcon(weatherData.current.condition, 48)}
                            <div>
                                <p className="text-4xl font-bold">{Math.round(weatherData.current.temp)}°F</p>
                                <p className="text-gray-400">{weatherData.current.condition}</p>
                            </div>
                        </div>
                        <div className="text-right text-sm">
                            <p className="flex items-center justify-end gap-2"><Wind size={16} /> {weatherData.current.wind} mph</p>
                            <p className="flex items-center justify-end gap-2"><Droplets size={16} /> {weatherData.current.humidity}% humidity</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                        {weatherData.forecast.slice(0, 3).map((day: any, index: number) => (
                            <div key={index} className="bg-gray-700/50 p-3 rounded-lg">
                                <p className="font-bold">{day.day}</p>
                                <div className="my-2 mx-auto w-fit">
                                    {getWeatherIcon(day.condition, 32)}
                                </div>
                                <p className="font-semibold">{Math.round(day.high)}° / {Math.round(day.low)}°</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


const StatCard: React.FC<{ title: string; value: string; trend: string; color: string }> = ({ title, value, trend, color }) => (
    <div className="bg-gray-800 rounded-xl p-6 text-center transition-transform hover:-translate-y-1">
        <div className={`text-3xl font-bold ${color}`}>{value}</div>
        <div className="text-gray-400 text-sm mt-2">{title}</div>
        <div className={`${color} text-xs mt-1`}>{trend}</div>
    </div>
);

const PerformanceChart: React.FC = () => (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-white mb-6">Team Performance Trends</h2>
        <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" tick={{ fill: '#9ca3af' }} />
                    <YAxis tick={{ fill: '#9ca3af' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                    <Legend wrapperStyle={{ color: '#fff' }} />
                    <Line type="monotone" dataKey="offYards" name="Offensive Yards" stroke="var(--color-brand-accent)" strokeWidth={2} />
                    <Line type="monotone" dataKey="defStops" name="Defensive Stops" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    </div>
);

const PlayerRoster: React.FC<{
    players: Player[];
    onAddPlayer: () => void;
    onComparePlayers: () => void;
    onCreateAccounts: () => void;
    onDeletePlayer: (id: number) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    positionFilter: string;
    setPositionFilter: (position: string) => void;
    positions: string[];
}> = ({ players, onAddPlayer, onComparePlayers, onCreateAccounts, onDeletePlayer, searchQuery, setSearchQuery, positionFilter, setPositionFilter, positions }) => {
    const navigate = useNavigate();
    return (
        <div className="bg-gray-800 rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><Users /> Player Roster</h2>
                <div className="flex items-center gap-2">
                    <button onClick={onComparePlayers} title="Compare Players" className="p-2 rounded-full hover:bg-gray-700 transition"><GitCompareArrows size={20} /></button>
                    <button onClick={onCreateAccounts} title="Create Player Accounts" className="p-2 rounded-full hover:bg-gray-700 transition"><Users size={20} /></button>
                    <button onClick={onAddPlayer} title="Add Player" className="p-2 rounded-full hover:bg-gray-700 transition"><UserPlus size={20} /></button>
                </div>
            </div>
            <div className="p-4 border-b border-gray-700">
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-700 p-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                    <select
                        value={positionFilter}
                        onChange={(e) => setPositionFilter(e.target.value)}
                        className="w-full sm:w-40 bg-gray-700 p-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    >
                        {positions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                    </select>
                </div>
            </div>
            <div className="p-6 space-y-3 max-h-60 overflow-y-auto">
                {players.length > 0 ? players.map(player => (
                    <div key={player.id} className="w-full flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition group">
                        <button onClick={() => navigate(`/player/${player.id}`)} className="flex-grow flex items-center gap-3 text-left">
                            <div className="w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center font-bold">{player.avatar}</div>
                            <div>
                                <div className="font-semibold text-white">{player.name}</div>
                                <div className="text-xs text-gray-400">{player.position}</div>
                            </div>
                        </button>
                        <div className="flex items-center gap-4">
                             <div className="text-right hidden sm:block">
                                <div className="text-lg font-bold text-brand-accent">{player.stats[0].value}</div>
                                <div className="text-xs text-gray-400">{player.stats[0].name}</div>
                            </div>
                            <button onClick={() => onDeletePlayer(player.id)} className="text-gray-500 hover:text-red-500 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={18}/>
                            </button>
                        </div>
                    </div>
                )) : <p className="text-gray-400 text-center">No players match the current filters.</p>}
            </div>
        </div>
    );
};


const TaskManager: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([
        { id: 1, text: "Review film from Central High game", completed: false },
        { id: 2, text: "Prepare scout for Roosevelt High", completed: false },
        { id: 3, text: "Finalize practice plan for Tuesday", completed: true },
    ]);
    const [newTask, setNewTask] = useState('');
    const [taskToConfirm, setTaskToConfirm] = useState<Task | null>(null);

    const addTask = () => {
        if (newTask.trim() === '') return;
        const newTaskObject: Task = {
            id: Date.now(),
            text: newTask,
            completed: false,
        };
        setTasks([...tasks, newTaskObject]);
        setNewTask('');
    };
    
    const deleteTask = (id: number) => {
        setTasks(tasks.filter(task => task.id !== id));
    };

    const handleConfirmCompletion = () => {
        if (!taskToConfirm) return;
        const id = taskToConfirm.id;
        
        setTasks(tasks.map(task => 
            task.id === id ? { ...task, completed: true, justCompleted: true } : task
        ));
        
        setTimeout(() => {
            setTasks(currentTasks => currentTasks.map(t => t.id === id ? { ...t, justCompleted: false } : t));
        }, 1000);

        setTaskToConfirm(null);
    };

    const toggleTask = (id: number) => {
        const taskToToggle = tasks.find(task => task.id === id);
        if (!taskToToggle) return;

        // If task is not completed, show confirmation before marking as complete
        if (!taskToToggle.completed) {
            setTaskToConfirm(taskToToggle);
        } else {
            // If task is already completed, allow un-checking it instantly
            setTasks(tasks.map(task => 
                task.id === id ? { ...task, completed: false, justCompleted: false } : task
            ));
        }
    };
    
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            addTask();
        }
    }

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg relative">
            <div className="px-6 py-4 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><ListTodo /> Task Management</h2>
            </div>
            <div className="p-6 space-y-3">
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={newTask} 
                        onChange={(e) => setNewTask(e.target.value)} 
                        onKeyPress={handleKeyPress}
                        placeholder="Add new task..." 
                        className="w-full bg-gray-700 p-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                    <button onClick={addTask} className="bg-brand-primary p-2 rounded-lg hover:bg-brand-dark"><PlusCircle /></button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                    {tasks.map(task => (
                        <div key={task.id} className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-300 group ${task.justCompleted ? '!bg-green-500/20' : ''}`}>
                             <div onClick={() => toggleTask(task.id)} className={`flex items-center gap-3 flex-grow cursor-pointer ${task.completed ? 'bg-gray-700/50 text-gray-500' : 'bg-gray-700 hover:bg-gray-600'} p-1 rounded-md`}>
                                <div className="relative w-5 h-5">
                                    <CheckCircle className={`w-5 h-5 transition-colors ${task.completed ? 'text-green-500' : 'text-gray-500'}`} />
                                    {task.justCompleted && <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>}
                                </div>
                                <span className={`${task.completed ? 'line-through' : ''}`}>{task.text}</span>
                            </div>
                            <button onClick={() => deleteTask(task.id)} className="ml-auto text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={16}/>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {taskToConfirm && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center rounded-xl z-10 p-4">
                    <div className="bg-gray-900 p-6 rounded-lg shadow-xl border border-gray-700 max-w-sm text-center animate-[fadeIn_0.2s_ease-in-out]">
                        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                        <h3 className="font-bold text-lg mb-2">Confirm Completion</h3>
                        <p className="text-gray-400 mb-6">Are you sure you want to mark this task as complete?</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => setTaskToConfirm(null)} className="px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-md font-semibold transition">Cancel</button>
                            <button onClick={handleConfirmCompletion} className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-md font-semibold transition">Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const OpponentRoster: React.FC<{
    players: OpponentPlayer[];
    onViewDetails: (player: OpponentPlayer) => void;
    onAddOpponent: (name: string, position: string) => void;
    onDeleteOpponent: (id: number) => void;
}> = ({ players, onViewDetails, onAddOpponent, onDeleteOpponent }) => {
    const [search, setSearch] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPosition, setNewPosition] = useState('');

    const filteredPlayers = players.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    
    const handleAdd = () => {
        if(newName && newPosition) {
            onAddOpponent(newName, newPosition);
            setNewName('');
            setNewPosition('');
            setIsAdding(false);
        }
    };

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><Shield /> Opponent Roster</h2>
                <button onClick={() => setIsAdding(!isAdding)} className="p-2 rounded-full hover:bg-gray-700 transition">
                    {isAdding ? <X size={20} /> : <UserPlus size={20} />}
                </button>
            </div>
            <div className="p-4 border-b border-gray-700">
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search opponent players..." className="w-full bg-gray-700 p-2 rounded-lg border border-gray-600" />
            </div>
             {isAdding && (
                <div className="p-4 border-b border-gray-700 space-y-2 bg-gray-700/50">
                    <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Player Name" className="w-full bg-gray-600 p-2 rounded-lg" />
                    <input type="text" value={newPosition} onChange={e => setNewPosition(e.target.value)} placeholder="Position" className="w-full bg-gray-600 p-2 rounded-lg" />
                    <button onClick={handleAdd} className="w-full bg-brand-primary hover:bg-brand-dark p-2 rounded-lg font-semibold">Add Opponent</button>
                </div>
            )}
            <div className="p-6 space-y-3 max-h-48 overflow-y-auto">
                {filteredPlayers.map(player => (
                    <div key={player.id} className="flex items-center justify-between p-2 bg-gray-700 rounded-lg group">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-red-600 rounded-full flex items-center justify-center font-bold">{player.avatar}</div>
                            <div>
                                <div className="font-semibold">{player.name}</div>
                                <div className="text-xs text-gray-400">{player.position}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => onViewDetails(player)} className="text-sm bg-gray-600 hover:bg-brand-primary px-3 py-1 rounded-md transition">
                                Details
                            </button>
                            <button onClick={() => onDeleteOpponent(player.id)} className="text-gray-500 hover:text-red-500 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={16}/>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const GameFilmManager: React.FC<{
    films: GameFilm[];
    onUpload: () => void;
    onAnalyze: (filmId: number) => void;
    onCancel: (filmId: number) => void;
    onViewDetails: (film: GameFilm) => void;
    onDelete: (filmId: number) => void;
    onDetectErrors: (film: GameFilm) => void; // New prop for error detection
}> = ({ films, onUpload, onAnalyze, onCancel, onViewDetails, onDelete, onDetectErrors }) => {
    const [filmToConfirm, setFilmToConfirm] = useState<GameFilm | null>(null);

    const statusStyles: { [key: string]: string } = {
        uploading: 'bg-blue-500/20 text-blue-400',
        pending: 'bg-yellow-500/20 text-yellow-400',
        analyzing: 'bg-purple-500/20 text-purple-400',
        complete: 'bg-green-500/20 text-green-400',
    };

    const handleConfirmAnalysis = () => {
        if (filmToConfirm) {
            onAnalyze(filmToConfirm.id);
            setFilmToConfirm(null);
        }
    };

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 space-y-4 relative">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3"><Video /> Game Film Hub</h2>
                <button onClick={onUpload} className="bg-brand-primary hover:bg-brand-dark text-white font-bold py-2 px-4 rounded-lg transition flex items-center gap-2">
                    <UploadCloud size={18} /> Import Film
                </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {films.map(film => (
                    <div key={film.id} className="bg-gray-700/50 p-3 rounded-lg group">
                        <div className="flex items-center justify-between">
                            <p className="font-semibold text-white truncate pr-4">{film.title}</p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {film.status === 'pending' && (
                                    <button onClick={() => setFilmToConfirm(film)} className="bg-gray-600 hover:bg-brand-primary text-sm px-3 py-1 rounded-md transition">Analyze</button>
                                )}
                                {film.status === 'complete' && (
                                     <>
                                        <button onClick={() => onDetectErrors(film)} className="bg-yellow-600 hover:bg-yellow-700 text-sm px-3 py-1 rounded-md transition">Detect Errors</button>
                                        <button onClick={() => onViewDetails(film)} className="bg-gray-600 hover:bg-brand-primary text-sm px-3 py-1 rounded-md transition">View Details</button>
                                     </>
                                )}
                                {['uploading', 'analyzing'].includes(film.status) && (
                                     <div className="flex items-center gap-2">
                                        <p className={`text-xs px-2 py-0.5 rounded-full inline-block capitalize ${statusStyles[film.status]}`}>{film.status}...</p>
                                        <button onClick={() => onCancel(film.id)} title="Cancel" className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-red-500/50 transition"><X size={16} /></button>
                                    </div>
                                )}
                                 <button onClick={() => onDelete(film.id)} className="text-gray-500 hover:text-red-500 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        </div>
                        {film.status === 'uploading' && (
                            <div className="mt-2">
                                <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                                    <span>{film.fileSize} MB - {film.uploadProgress}%</span>
                                    <span>ETA: {film.uploadEta}s</span>
                                </div>
                                <div className="w-full bg-gray-600 rounded-full h-1.5">
                                    <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${film.uploadProgress}%` }}></div>
                                </div>
                            </div>
                        )}
                        {film.status === 'analyzing' && (
                           <div className="mt-2">
                                <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                                    <span>Analyzing Film...</span>
                                </div>
                                <div className="w-full bg-gray-600 rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-purple-500 h-1.5 rounded-full animate-pulse" style={{ width: `${film.analysisProgress}%` }}></div>
                                </div>
                            </div>
                        )}
                         {film.status === 'complete' && film.summary && (
                            <div className="mt-3 pt-3 border-t border-gray-600/50">
                                <p className="text-sm text-gray-300"><span className="font-semibold text-brand-accent">Tactical Summary:</span> {film.summary}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {filmToConfirm && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center rounded-xl z-10 p-4">
                    <div className="bg-gray-900 p-6 rounded-lg shadow-xl border border-gray-700 max-w-sm text-center animate-[fadeIn_0.2s_ease-in-out]">
                        <BrainCircuit className="w-12 h-12 text-brand-primary mx-auto mb-4" />
                        <h3 className="font-bold text-lg mb-2">Confirm AI Analysis</h3>
                        <p className="text-gray-400 mb-6">Are you sure you want to analyze "<span className="font-semibold text-white">{filmToConfirm.title}</span>"? This action will use AI to break down the film.</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => setFilmToConfirm(null)} className="px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-md font-semibold transition">Cancel</button>
                            <button onClick={handleConfirmAnalysis} className="px-6 py-2 bg-brand-primary hover:bg-brand-dark rounded-md font-semibold transition">Confirm & Analyze</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const PlayCreatorModal: React.FC<{ onSave: (play: Omit<Play, 'id'>) => void, closeModal: () => void }> = ({ onSave, closeModal }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<'Offense' | 'Defense'>('Offense');
    const [subType, setSubType] = useState('');
    const [formation, setFormation] = useState('');
    const [description, setDescription] = useState('');
    const [markers, setMarkers] = useState<PlayerMarker[]>([]);
    const [paths, setPaths] = useState<PlayerPath[]>([]);
    
    const [selectedTool, setSelectedTool] = useState<'move' | 'add-offense' | 'add-defense' | 'draw-path' | 'erase'>('move');
    const [draggingMarker, setDraggingMarker] = useState<{ id: string;
        offsetX: number;
        offsetY: number; } | null>(null);
    const [drawingPath, setDrawingPath] = useState<PlayerPath | null>(null);

    const diagramRef = useRef<HTMLDivElement>(null);

    const handleSave = () => {
        if (!name || !formation) {
            alert("Please provide at least a play name and formation.");
            return;
        }
        onSave({ name, type, subType, formation, description, formationMarkers: markers, paths });
    };

    const getCoords = (e: React.MouseEvent): { x: number; y: number } => {
        if (!diagramRef.current) return { x: 0, y: 0 };
        const rect = diagramRef.current.getBoundingClientRect();
        const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
        const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
        return { x, y };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        const coords = getCoords(e);
        const clickedMarker = markers.find(m => {
            if (!diagramRef.current) return false;
            const rect = diagramRef.current.getBoundingClientRect();
            const markerRadius = 16; // approx half of w-8 in pixels
            const markerX = (m.x / 100) * rect.width;
            const markerY = (m.y / 100) * rect.height;
            const clickX = coords.x / 100 * rect.width;
            const clickY = coords.y / 100 * rect.height;
            return Math.hypot(markerX - clickX, markerY - clickY) < markerRadius;
        });

        if (clickedMarker) {
            if (selectedTool === 'move') {
                e.preventDefault();
                setDraggingMarker({
                    id: clickedMarker.id,
                    offsetX: coords.x - clickedMarker.x,
                    offsetY: coords.y - clickedMarker.y,
                });
            } else if (selectedTool === 'draw-path') {
                e.preventDefault();
                setDrawingPath({ markerId: clickedMarker.id, points: [{ x: clickedMarker.x, y: clickedMarker.y }, coords] });
            }
        }
    };
    
    const handleMouseMove = (e: React.MouseEvent) => {
        const coords = getCoords(e);
        if (draggingMarker) {
            setMarkers(prev => prev.map(m =>
                m.id === draggingMarker.id ? { ...m, x: coords.x - draggingMarker.offsetX, y: coords.y - draggingMarker.offsetY } : m
            ));
        } else if (drawingPath) {
            setDrawingPath(prev => prev ? { ...prev, points: [...prev.points, coords] } : null);
        }
    };

    const handleMouseUp = () => {
        if (drawingPath) {
            setPaths(prev => {
                // Remove any previous path for this marker to replace it
                const otherPaths = prev.filter(p => p.markerId !== drawingPath.markerId);
                return [...otherPaths, drawingPath];
            });
            setDrawingPath(null);
        }
        setDraggingMarker(null);
    };

    const handleDiagramClick = (e: React.MouseEvent) => {
         if (draggingMarker || drawingPath) return; // Don't add/erase if a drag just ended
         const coords = getCoords(e);
        
        if (['add-offense', 'add-defense'].includes(selectedTool)) {
            const label = prompt("Enter player label (e.g., QB, WR, C):");
            if (label && label.trim()) {
                const newMarker: PlayerMarker = {
                    id: `marker-${Date.now()}`,
                    label: label.trim().toUpperCase(),
                    type: selectedTool === 'add-offense' ? 'offense' : 'defense',
                    ...coords,
                };
                setMarkers(prev => [...prev, newMarker]);
            }
        } else if (selectedTool === 'erase') {
             if (!diagramRef.current) return;
             const rect = diagramRef.current.getBoundingClientRect();
             const markerToRemove = markers.find(m => Math.hypot((m.x - coords.x) * (rect.width/100), (m.y - coords.y) * (rect.height/100)) < 16);
            if (markerToRemove) {
                setMarkers(markers.filter(m => m.id !== markerToRemove.id));
                setPaths(paths.filter(p => p.markerId !== markerToRemove.id));
            }
        }
    };

    const ToolButton = ({ icon: Icon, tool, label }: { icon: React.ElementType, tool: typeof selectedTool, label: string }) => (
        <button onClick={() => setSelectedTool(tool)} title={label} className={`p-2 rounded-lg transition ${selectedTool === tool ? 'bg-brand-primary text-white' : 'bg-gray-600 hover:bg-gray-500'}`}>
            <Icon size={20} />
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><FilePlus /> Create New Play</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={handleSave} className="bg-green-600 hover:bg-green-700 py-2 px-4 rounded-lg font-semibold">Save Play</button>
                        <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-700"><X size={20} /></button>
                    </div>
                </div>
                <div className="flex-grow p-6 grid md:grid-cols-3 gap-6 overflow-hidden">
                    {/* Left: Form */}
                    <div className="md:col-span-1 flex flex-col gap-4 overflow-y-auto pr-2">
                         <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Play Name (e.g., HB Dive)" className="w-full p-3 bg-gray-700 rounded-lg" />
                         <div className="flex gap-2">
                            <button onClick={() => setType('Offense')} className={`w-1/2 p-2 rounded-md ${type === 'Offense' ? 'bg-blue-600' : 'bg-gray-700'}`}>Offense</button>
                            <button onClick={() => setType('Defense')} className={`w-1/2 p-2 rounded-md ${type === 'Defense' ? 'bg-red-600' : 'bg-gray-700'}`}>Defense</button>
                         </div>
                         <input type="text" value={formation} onChange={e => setFormation(e.target.value)} placeholder="Formation (e.g., Spread)" className="w-full p-3 bg-gray-700 rounded-lg" />
                         <input type="text" value={subType} onChange={e => setSubType(e.target.value)} placeholder="Play Sub-Type (e.g., Pass, Run)" className="w-full p-3 bg-gray-700 rounded-lg" />
                         <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description..." rows={5} className="w-full p-3 bg-gray-700 rounded-lg resize-none" />
                         <div className="text-xs text-gray-400 p-2 bg-gray-900/50 rounded-md">
                            **Draw Path Tool**: Click and drag from a player to draw their route. A new drag will replace the old path for that player.
                         </div>
                    </div>
                    {/* Right: Diagram */}
                    <div className="md:col-span-2 flex flex-col gap-4">
                        <div className="flex justify-center items-center gap-3 bg-gray-900/50 p-2 rounded-lg">
                            <ToolButton icon={Move} tool="move" label="Move Player" />
                            <ToolButton icon={PlusCircle} tool="add-offense" label="Add Offense Player" />
                            <ToolButton icon={PlusCircle} tool="add-defense" label="Add Defense Player" />
                            <ToolButton icon={GitCompareArrows} tool="draw-path" label="Draw Path" />
                            <ToolButton icon={Eraser} tool="erase" label="Erase Player" />
                        </div>
                        <div 
                            ref={diagramRef} 
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp} // End drag if mouse leaves area
                            onClick={handleDiagramClick}
                            className={`flex-grow bg-gray-900 rounded-lg cursor-crosshair`}
                        >
                            <PlayDiagram formationMarkers={markers} paths={paths} activePath={drawingPath} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- MAIN DASHBOARD COMPONENT ---

interface NewPlayerInfo {
    name: string;
    position: string;
    age?: number;
    height?: string;
    parentsName?: string;
    phone?: string;
    notes?: string;
    academicInfo?: string; // Added for recruiting
}
// FIX: Dummy components to resolve "Cannot find name" errors.
interface ModalProps {
    ai: GoogleGenAI;
    closeModal: () => void;
}
const DummyModal: React.FC<{ closeModal: () => void; title: string }> = ({ closeModal, title }) => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 w-full max-w-lg rounded-xl shadow-2xl">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">{title}</h2>
                <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-700"><X size={20} /></button>
            </div>
            <div className="p-8 text-center">
                <p className="text-gray-400">This feature is not yet implemented.</p>
                 <button onClick={closeModal} className="mt-6 bg-brand-primary px-6 py-2 rounded-lg">Close</button>
            </div>
        </div>
    </div>
);

const ImportPlaysModal: React.FC<any> = ({ closeModal }) => <DummyModal closeModal={closeModal} title="Import Plays" />;
const OpponentProfileModal: React.FC<any> = ({ closeModal }) => <DummyModal closeModal={closeModal} title="Opponent Profile" />;
const DrillVisualizerModal: React.FC<any> = ({ closeModal }) => <DummyModal closeModal={closeModal} title="Drill Visualizer" />;
const PlayDiagramGeneratorModal: React.FC<any> = ({ closeModal }) => <DummyModal closeModal={closeModal} title="Play Diagram Generator" />;
const TelestratorModal: React.FC<any> = ({ closeModal }) => <DummyModal closeModal={closeModal} title="AI Telestrator" />;
const VisualClipAnalyzerModal: React.FC<any> = ({ closeModal }) => <DummyModal closeModal={closeModal} title="Visual Clip Analysis" />;
const RecruitingAssistantModal: React.FC<any> = ({ closeModal }) => <DummyModal closeModal={closeModal} title="Recruiting Assistant" />;
const QuickTacticModal: React.FC<any> = ({ closeModal }) => <DummyModal closeModal={closeModal} title="Quick Tactic Generator" />;
const RecruitingMatchmakingModal: React.FC<any> = ({ closeModal }) => <DummyModal closeModal={closeModal} title="AI Recruiting Matchmaking" />;


export const Dashboard: React.FC = () => {
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [modalData, setModalData] = useState<any>(null);
    const [players, setPlayers] = useState<Player[]>(mockPlayers);
    const [opponentPlayers, setOpponentPlayers] = useState<OpponentPlayer[]>(mockOpponentPlayers);
    const [ai, setAi] = useState<GoogleGenAI | null>(null);
    const [aiName, setAiName] = useState('AI Assistant');
    const [teamColor, setTeamColor] = useState('#4f46e5');
    const [searchQuery, setSearchQuery] = useState('');
    const [positionFilter, setPositionFilter] = useState('All');
    const [gameFilms, setGameFilms] = useState<GameFilm[]>(mockGameFilms);
    const [scoutingReport, setScoutingReport] = useState(initialScoutingReport);
    const [isReportLoading, setIsReportLoading] = useState(false);
    const [plays, setPlays] = useState<Play[]>(mockPlays);
    const [exercises, setExercises] = useState<Exercise[]>(mockExercises);

    const generateScoutingReport = async () => {
        if (!ai) return;
        setIsReportLoading(true);
        const prompt = `You are an elite football scouting AI. Based on film analysis of our next opponent, the ${scoutingReport.opponentName}, generate a detailed scouting report. Provide specific, actionable tendencies.
        
        Structure your response with the following markdown headings:
        ### **Offensive Tendencies**
        (List 3-4 key offensive tendencies including favored formations, common plays on certain downs, and player-specific habits.)
        
        ### **Defensive Tendencies**
        (List 3-4 key defensive tendencies including primary coverage schemes, blitz packages, and individual player weaknesses.)
        
        Make the analysis sound like it came from a professional coach.`;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
            });
            setScoutingReport(prev => ({ ...prev, reportBody: response.text }));
        } catch (error) {
            setScoutingReport(prev => ({ ...prev, reportBody: getApiErrorMessage(error) }));
        } finally {
            setIsReportLoading(false);
        }
    };


    const handleFilmUpload = (source: File | string) => {
        let title = '';
        if (typeof source === 'string') {
            try {
                const url = new URL(source);
                title = `Film from ${url.hostname}`;
            } catch {
                title = 'Imported Web Film';
            }
        } else {
            title = source.name;
        }

        const fileSize = typeof source === 'string' ? Math.floor(Math.random() * 500) + 100 : Math.round(source.size / 1024 / 1024); // Simulate size for URL

        const newFilm: GameFilm = {
            id: Date.now(),
            title: title,
            status: 'uploading',
            uploadProgress: 0,
            fileSize: fileSize,
            uploadEta: 999
        };
        setGameFilms(prev => [newFilm, ...prev]);
        setActiveModal(null);
    
        let uploaded = 0;
        const uploadSpeed = Math.random() * 5 + 2; // Simulate 2-7 MB/s

        const uploadInterval = setInterval(() => {
            uploaded += uploadSpeed;
            const progress = Math.min(Math.round((uploaded / fileSize) * 100), 100);
            const eta = Math.round((fileSize - uploaded) / uploadSpeed);

            setGameFilms(currentFilms => {
                const filmExists = currentFilms.some(f => f.id === newFilm.id);
                if (!filmExists) {
                    clearInterval(uploadInterval);
                    return currentFilms;
                }

                return currentFilms.map(f => {
                    if (f.id === newFilm.id) {
                        if (progress >= 100) {
                            clearInterval(uploadInterval);
                            return { ...f, uploadProgress: 100, status: 'pending', uploadEta: 0 };
                        }
                        return { ...f, uploadProgress: progress, uploadEta: eta > 0 ? eta : 0 };
                    }
                    return f;
                });
            });
        }, 1000);
    };

    const handleDeleteFilm = (filmId: number) => {
        if (window.confirm("Are you sure you want to permanently delete this film? This action cannot be undone.")) {
            setGameFilms(films => films.filter(f => f.id !== filmId));
        }
    };

    const handleCancelProcess = (filmId: number) => {
        setGameFilms(films => films.filter(f => f.id !== filmId));
    };

    const handleViewDetails = (film: GameFilm) => {
        setModalData(film);
        setActiveModal('detailedAnalysis');
    };

    const handleAnalyzeFilm = async (filmId: number) => {
        const filmToAnalyze = gameFilms.find(f => f.id === filmId);
        if (!filmToAnalyze) return;

        setGameFilms(films => films.map(f => f.id === filmId ? { ...f, status: 'analyzing', analysisProgress: 0 } : f));

        const progressPromise = new Promise<boolean>(resolve => { // resolves with `wasCancelled`
            const analysisInterval = setInterval(() => {
                setGameFilms(currentFilms => {
                    const currentFilm = currentFilms.find(f => f.id === filmId);
                    
                    if (!currentFilm || currentFilm.status !== 'analyzing') {
                        clearInterval(analysisInterval);
                        resolve(true); // Cancelled
                        return currentFilms;
                    }
                    
                    const newProgress = Math.min((currentFilm.analysisProgress ?? 0) + 20, 100);
                    
                    if (newProgress >= 100) {
                        clearInterval(analysisInterval);
                        resolve(false); // Finished, not cancelled
                    }
                    
                    return currentFilms.map(f => f.id === filmId ? { ...f, analysisProgress: newProgress } : f);
                });
            }, 500);
        });

        const wasCancelled = await progressPromise;
        if (wasCancelled) return;


        let analysisSummary = `AI analysis complete for ${filmToAnalyze.title}.`;
        let detailedAnalysis = `No detailed analysis available.`;

        if (ai) {
            try {
                const summaryPrompt = `You are an expert AI football strategist providing a direct, tactical analysis of a game film titled "${filmToAnalyze.title}". 
                Your audience is a head coach who needs actionable insights, not fluff.
                Provide a concise, hard-hitting summary (2-3 sentences). 
                Focus on:
                1.  The single most exploitable weakness we showed.
                2.  The most effective offensive concept we ran.
                3.  A critical adjustment needed for the next game.
                Be direct. Example: "Our offensive line's pass protection against their 3-man rush was a liability. The 'HB Screen' play was highly effective, averaging 9.5 yards. We must adjust our protection schemes immediately."`;
                
                const summaryResponse = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: summaryPrompt });
                analysisSummary = summaryResponse.text;

                const detailedPrompt = `You are an expert AI football analyst creating a detailed breakdown of the game film "${filmToAnalyze.title}".
                Provide a structured report using markdown for a head coach. Cover the following sections:
                
                ### **Offensive Performance**
                - **Strengths:** (List 2-3 specific strengths with data, e.g., "High success rate on 1st down runs (5.8 YPC).")
                - **Weaknesses:** (List 2-3 specific weaknesses, e.g., "Struggled in red zone, converting only 1 of 4 attempts.")
                
                ### **Defensive Performance**
                - **Strengths:** (e.g., "Excellent containment of mobile QBs, allowing only 15 rushing yards.")
                - **Weaknesses:** (e.g., "Vulnerable to play-action passes, gave up 3 explosive plays >20 yards.")
                
                ### **Key Player Notes**
                - **Standout Performer:** (Name a position or player # and why.)
                - **Needs Improvement:** (Name a position or player # and why.)
                
                ### **Actionable Insights**
                - (Provide two concrete, tactical adjustments the team should implement in practice this week based on this film.)`;

                const detailedResponse = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: detailedPrompt });
                detailedAnalysis = detailedResponse.text;
                
            } catch (error) {
                const errorMessage = getApiErrorMessage(error);
                analysisSummary = errorMessage;
                detailedAnalysis = errorMessage;
            }
        }
        
        setGameFilms(finalFilms => finalFilms.map(finalFilm =>
            finalFilm.id === filmId
            ? { ...finalFilm, analysisProgress: 100, status: 'complete', summary: analysisSummary, detailedAnalysis: detailedAnalysis }
            : finalFilm
        ));
    };

    const handleDetectErrors = async (film: GameFilm) => {
        if (!ai || !film.detailedAnalysis) return;
        setModalData({ ...film, loadingErrors: true, detectedErrors: [] });
        setActiveModal('detailedAnalysis'); // Open modal to show loading state

        try {
            const prompt = `You are an elite football analyst tasked with identifying specific missed assignments and execution errors from a detailed film analysis.
            Given the following detailed analysis for the game "${film.title}":
            ---
            ${film.detailedAnalysis}
            ---
            Extract specific errors, categorize them (e.g., 'Offensive Line', 'DB Coverage', 'QB Reads', 'Receiver Route'), provide a brief description, and suggest a simple drill name to correct it.
            Return the output as a JSON array of objects, where each object has 'category', 'description', 'suggestedDrill', and 'mockClipLink' (a placeholder YouTube URL).`;

// FIX: Added explicit GenerateContentResponse type to ensure response.text is treated as a string.
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                category: { type: Type.STRING },
                                description: { type: Type.STRING },
                                suggestedDrill: { type: Type.STRING },
                                mockClipLink: { type: Type.STRING, format: 'uri' }
                            },
                            required: ['category', 'description', 'suggestedDrill', 'mockClipLink']
                        }
                    }
                }
            });
            const detectedErrors: ExecutionError[] = JSON.parse(response.text);
            
            setGameFilms(prevFilms => prevFilms.map(f => 
                f.id === film.id ? { ...f, errorDetection: detectedErrors } : f
            ));
            setModalData((prev:any) => ({ ...prev, detectedErrors: detectedErrors, loadingErrors: false }));

        } catch (error) {
            console.error("Error detecting errors:", error);
            setModalData((prev:any) => ({ ...prev, errorDetectionError: getApiErrorMessage(error), loadingErrors: false }));
        }
    };


    const handleOpenModal = (modalName: string, data: any = null) => {
        setModalData(data);
        setActiveModal(modalName);
    };
    
    const handleCloseModal = () => {
        setActiveModal(null);
        setModalData(null);
    };


    useEffect(() => {
        if (process.env.API_KEY) {
            setAi(new GoogleGenAI({ apiKey: process.env.API_KEY }));
        }
    }, []);

    useEffect(() => {
        document.documentElement.style.setProperty('--color-brand-primary', teamColor);
        document.documentElement.style.setProperty('--color-brand-dark', darkenColor(teamColor, 10));
    }, [teamColor]);
    
    const handleAddPlayer = (newPlayerInfo: NewPlayerInfo) => {
        const newPlayerFull: Player = {
            id: Date.now(),
            name: newPlayerInfo.name,
            position: newPlayerInfo.position,
            age: newPlayerInfo.age,
            height: newPlayerInfo.height,
            parentsName: newPlayerInfo.parentsName,
            phone: newPlayerInfo.phone,
            notes: newPlayerInfo.notes,
            academicInfo: newPlayerInfo.academicInfo,
            avatar: newPlayerInfo.name.split(' ').map(n => n[0]).join('').toUpperCase(),
            stats: [{ name: 'New Player', value: 'N/A', trend: '' }],
            radarData: [
                { subject: 'Stat 1', value: 50, avg: 50, fullMark: 100 },
                { subject: 'Stat 2', value: 50, avg: 50, fullMark: 100 },
                { subject: 'Stat 3', value: 50, avg: 50, fullMark: 100 },
                { subject: 'Stat 4', value: 50, avg: 50, fullMark: 100 },
                { subject: 'Stat 5', value: 50, avg: 50, fullMark: 100 },
            ],
            mainMetricName: 'N/A'
        }
        setPlayers(prev => [newPlayerFull, ...prev]);
        handleCloseModal();
    };

     const handleDeletePlayer = (id: number) => {
        if (window.confirm("Are you sure you want to delete this player from the roster?")) {
            setPlayers(players => players.filter(p => p.id !== id));
        }
    };

    const handleAddOpponent = (name: string, position: string) => {
        const newOpponent: OpponentPlayer = {
            id: Date.now(),
            name,
            position,
            avatar: name.split(' ').map(n => n[0]).join('').toUpperCase(),
            notes: '',
            clips: [],
        };
        setOpponentPlayers(prev => [newOpponent, ...prev]);
    };

    const handleDeleteOpponent = (id: number) => {
        setOpponentPlayers(prev => prev.filter(p => p.id !== id));
    };

    const handleSavePlay = (play: Omit<Play, 'id'>) => {
        const newPlay = { ...play, id: Date.now() };
        setPlays(prev => [newPlay, ...prev]);
        handleCloseModal();
    };
    
    const handleImportPlays = (importedPlays: Play[]) => {
        // Simple merge, could add logic to avoid duplicates
        const playsWithNewIds = importedPlays.map(p => ({ ...p, id: Date.now() + Math.random() }));
        setPlays(prev => [...prev, ...playsWithNewIds]);
        alert(`${importedPlays.length} plays imported successfully!`);
        handleCloseModal();
    };

    const handleUpdateOpponent = (updatedPlayer: OpponentPlayer) => {
        setOpponentPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
    };

    const filteredPlayers = players.filter(player =>
        player.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (positionFilter === 'All' || player.position === positionFilter)
    );

    const positions = ['All', ...new Set(players.map(p => p.position))];

    const renderModal = () => {
        if (!ai && activeModal && activeModal !== 'settings' && activeModal !== 'addPlayer' && activeModal !== 'playbook' && activeModal !== 'importPlays' && activeModal !== 'comparePlayers' && activeModal !== 'uploadFilm' && activeModal !== 'createPlayerAccounts' && activeModal !== 'manageTraining') {
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
            case 'live':
                return <LiveConversationModal ai={ai!} closeModal={handleCloseModal} />;
            case 'enhancedLiveSideline':
                return <EnhancedLiveSidelineAssistantModal ai={ai!} closeModal={handleCloseModal} players={players} />;
            case 'image':
                return <ImageAnalysisModal ai={ai!} closeModal={handleCloseModal} />;
            case 'complex':
                return <ComplexAnalysisModal ai={ai!} closeModal={handleCloseModal} />;
            case 'grounded':
                return <GroundedSearchModal ai={ai!} closeModal={handleCloseModal} />;
            case 'addPlayer':
                 return <AddPlayerModal onAdd={handleAddPlayer} closeModal={handleCloseModal} />;
            case 'playbook':
                return <PlaybookManagementModal plays={plays} setPlays={setPlays} openPlayCreator={() => handleOpenModal('playCreator')} openImporter={() => handleOpenModal('importPlays')} closeModal={handleCloseModal} />;
            case 'playCreator':
                return <PlayCreatorModal onSave={handleSavePlay} closeModal={() => handleOpenModal('playbook')} />;
            case 'importPlays':
                return <ImportPlaysModal onImport={handleImportPlays} closeModal={handleCloseModal} />;
            case 'comparePlayers':
                return <PlayerComparisonModal players={players} closeModal={handleCloseModal} />;
            case 'uploadFilm':
                return <UploadFilmModal onUpload={handleFilmUpload} closeModal={handleCloseModal} />;
            case 'createPlayerAccounts':
                return <CreatePlayerAccountsModal closeModal={handleCloseModal} />;
            case 'detailedAnalysis':
                return modalData && <DetailedAnalysisModal film={modalData} ai={ai!} closeModal={handleCloseModal} onDetectErrors={handleDetectErrors} />;
            case 'opponentProfile':
                return modalData && <OpponentProfileModal player={modalData} allFilms={gameFilms} ai={ai!} onUpdate={handleUpdateOpponent} closeModal={handleCloseModal} />;
            case 'settings':
                return <SettingsModal
                    aiName={aiName}
                    onAiNameChange={setAiName}
                    teamColor={teamColor}
                    onTeamColorChange={setTeamColor}
                    closeModal={handleCloseModal}
                />;
             case 'drillVisualizer':
                return <DrillVisualizerModal ai={ai!} closeModal={handleCloseModal} />;
            case 'playDiagramGenerator':
                return <PlayDiagramGeneratorModal ai={ai!} closeModal={handleCloseModal} />;
            case 'telestrator':
                return <TelestratorModal ai={ai!} closeModal={handleCloseModal} />;
            case 'visualClipAnalysis':
                return <VisualClipAnalyzerModal ai={ai!} closeModal={handleCloseModal} />;
            case 'recruitingAssistant':
                return <RecruitingAssistantModal ai={ai!} closeModal={handleCloseModal} />;
            case 'quickTactic':
                return <QuickTacticModal ai={ai!} closeModal={handleCloseModal} />;
            case 'manageTraining':
                return <ManageTrainingModal exercises={exercises} setExercises={setExercises} closeModal={handleCloseModal} />;
            case 'recruitingMatchmaking':
                return <RecruitingMatchmakingModal ai={ai!} closeModal={handleCloseModal} players={players} />;
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
                            <div className="text-gray-300">Coach Dashboard</div>
                        </div>
                    </div>
                </div>
            </nav>
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard title="SEASON RECORD" value="8-2" trend="+3 from last season" color="text-green-400" />
                    <StatCard title="PLAYS ANALYZED" value="642" trend="95% AI accuracy" color="text-blue-400" />
                    <StatCard title="ACTIVE PLAYERS" value={String(players.length)} trend="Roster count" color="text-purple-400" />
                    <StatCard title="FILMS ANALYZED" value={String(gameFilms.filter(f => f.status === 'complete').length)} trend={`${gameFilms.filter(f => f.status !== 'complete').length} pending`} color="text-yellow-400" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <GameFilmManager 
                            films={gameFilms} 
                            onUpload={() => handleOpenModal('uploadFilm')} 
                            onAnalyze={handleAnalyzeFilm}
                            onCancel={handleCancelProcess}
                            onViewDetails={handleViewDetails}
                            onDelete={handleDeleteFilm}
                            onDetectErrors={handleDetectErrors}
                        />
                        
                         <div className="bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-3"><Lightbulb /> AI Scouting Report: {scoutingReport.opponentName}</h2>
                                <button 
                                    onClick={generateScoutingReport} 
                                    disabled={isReportLoading || !ai}
                                    className="bg-brand-primary hover:bg-brand-dark text-white font-bold py-2 px-4 rounded-lg transition flex items-center gap-2 disabled:bg-gray-600 disabled:cursor-not-allowed"
                                >
                                    {isReportLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <BrainCircuit size={18} /> Regenerate
                                        </>
                                    )}
                                </button>
                            </div>
                            <div className="bg-gray-900/50 p-4 rounded-lg">
                                {isReportLoading ? (
                                    <div className="animate-pulse space-y-4">
                                        <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                                        <div className="h-3 bg-gray-700 rounded w-full"></div>
                                        <div className="h-3 bg-gray-700 rounded w-5/6"></div>
                                        <div className="h-4 bg-gray-700 rounded w-1/3 mt-4"></div>
                                        <div className="h-3 bg-gray-700 rounded w-full"></div>
                                        <div className="h-3 bg-gray-700 rounded w-5/6"></div>
                                    </div>
                                ) : (
                                    <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed">{scoutingReport.reportBody}</pre>
                                )}
                            </div>
                        </div>
                        
                        <PerformanceChart />
                    </div>
                    <div className="space-y-8">
                         <div className="bg-gray-800 rounded-xl shadow-lg p-6 space-y-3">
                            <h2 className="text-xl font-bold text-white border-b border-gray-700 pb-3 mb-3">Core AI Tools</h2>
                             <button onClick={() => handleOpenModal('playbook')} className="w-full flex items-center gap-3 p-4 bg-gray-700 hover:bg-green-600 rounded-lg transition group">
                                <ClipboardList className="text-gray-400 group-hover:text-white" /> <span className="text-gray-300 group-hover:text-white">Manage Playbook</span>
                            </button>
                             <button onClick={() => handleOpenModal('manageTraining')} className="w-full flex items-center gap-3 p-4 bg-gray-700 hover:bg-green-600 rounded-lg transition group">
                                <Dumbbell className="text-gray-400 group-hover:text-white" /> <span className="text-gray-300 group-hover:text-white">Manage Training Plan</span>
                            </button>
                            <button onClick={() => handleOpenModal('enhancedLiveSideline')} className="w-full flex items-center gap-3 p-4 bg-gray-700 hover:bg-red-600 rounded-lg transition group">
                                <Mic className="text-gray-400 group-hover:text-white" /> <span className="text-gray-300 group-hover:text-white">Live Sideline Assistant</span>
                            </button>
                             <button onClick={() => handleOpenModal('complex')} className="w-full flex items-center gap-3 p-4 bg-gray-700 hover:bg-purple-600 rounded-lg transition group">
                                <BrainCircuit className="text-gray-400 group-hover:text-white" /> <span className="text-gray-300 group-hover:text-white">Deep Strategy Analysis</span>
                            </button>
                             <button onClick={() => handleOpenModal('settings')} className="w-full flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition group">
                                <Settings className="text-gray-400 group-hover:text-white" /> <span className="text-gray-300 group-hover:text-white">Team Settings</span>
                            </button>
                        </div>

                         <div className="bg-gray-800 rounded-xl shadow-lg p-6 space-y-3">
                            <h2 className="text-xl font-bold text-white border-b border-gray-700 pb-3 mb-3">Advanced AI Tools</h2>
                             <button onClick={() => handleOpenModal('drillVisualizer')} className="w-full flex items-center gap-3 p-4 bg-gray-700 hover:bg-indigo-600 rounded-lg transition group">
                                <Clapperboard className="text-gray-400 group-hover:text-white" /> <span className="text-gray-300 group-hover:text-white">Drill Visualizer (Veo)</span>
                            </button>
                            <button onClick={() => handleOpenModal('playDiagramGenerator')} className="w-full flex items-center gap-3 p-4 bg-gray-700 hover:bg-teal-600 rounded-lg transition group">
                                <Wand2 className="text-gray-400 group-hover:text-white" /> <span className="text-gray-300 group-hover:text-white">Play Diagram Generator</span>
                            </button>
                            <button onClick={() => handleOpenModal('telestrator')} className="w-full flex items-center gap-3 p-4 bg-gray-700 hover:bg-pink-600 rounded-lg transition group">
                                <Edit className="text-gray-400 group-hover:text-white" /> <span className="text-gray-300 group-hover:text-white">AI Telestrator</span>
                            </button>
                            <button onClick={() => handleOpenModal('visualClipAnalysis')} className="w-full flex items-center gap-3 p-4 bg-gray-700 hover:bg-blue-600 rounded-lg transition group">
                                <VideoIcon className="text-gray-400 group-hover:text-white" /> <span className="text-gray-300 group-hover:text-white">Visual Clip Analysis</span>
                            </button>
                             <button onClick={() => handleOpenModal('quickTactic')} className="w-full flex items-center gap-3 p-4 bg-gray-700 hover:bg-orange-600 rounded-lg transition group">
                                <Sparkles className="text-gray-400 group-hover:text-white" /> <span className="text-gray-300 group-hover:text-white">Quick Tactic Generator</span>
                            </button>
                             <button onClick={() => handleOpenModal('recruitingAssistant')} className="w-full flex items-center gap-3 p-4 bg-gray-700 hover:bg-yellow-600 rounded-lg transition group">
                                <Map className="text-gray-400 group-hover:text-white" /> <span className="text-gray-300 group-hover:text-white">Recruiting Assistant</span>
                            </button>
                            <button onClick={() => handleOpenModal('recruitingMatchmaking')} className="w-full flex items-center gap-3 p-4 bg-gray-700 hover:bg-green-600 rounded-lg transition group">
                                <GraduationCap className="text-gray-400 group-hover:text-white" /> <span className="text-gray-300 group-hover:text-white">AI Recruiting Matchmaking</span>
                            </button>
                        </div>


                        <LivePlayPredictor ai={ai} />
                        <WeatherWidget ai={ai} />
                        <TaskManager />
                        <PlayerRoster
                            players={filteredPlayers}
                            onAddPlayer={() => handleOpenModal('addPlayer')}
                            onComparePlayers={() => handleOpenModal('comparePlayers')}
                            onCreateAccounts={() => handleOpenModal('createPlayerAccounts')}
                            onDeletePlayer={handleDeletePlayer}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            positionFilter={positionFilter}
                            setPositionFilter={setPositionFilter}
                            positions={positions}
                        />
                        <OpponentRoster 
                            players={opponentPlayers} 
                            onViewDetails={(player) => handleOpenModal('opponentProfile', player)}
                            onAddOpponent={handleAddOpponent}
                            onDeleteOpponent={handleDeleteOpponent}
                        />
                    </div>
                </div>
                {renderModal()}
                <AIChatbot ai={ai} aiName={aiName} gameFilms={gameFilms.filter(f => f.status === 'complete')} />
            </main>
        </div>
    );
};

// --- MODAL COMPONENTS ---

interface ModalProps {
    ai: GoogleGenAI;
    closeModal: () => void;
}

const PlayerDevelopmentPlanCard: React.FC<{ player: Player; ai: GoogleGenAI; onGenerate: (player: Player, plan: PlayerDevelopmentPlan) => void; initialPlan?: PlayerDevelopmentPlan | null }> = ({ player, ai, onGenerate, initialPlan }) => {
    const [plan, setPlan] = useState<PlayerDevelopmentPlan | null>(initialPlan || null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generatePlan = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setPlan(null);

        const playerStatsString = player.stats.map(s => `${s.name}: ${s.value}`).join(', ');
        const radarString = player.radarData.map(d => `${d.subject}: ${d.value} (vs League Avg: ${d.avg})`).join('; ');

        const prompt = `You are an expert high school football coach and a player development AI. Create a personalized development plan for ${player.name}, a ${player.position}.
        
        Player Stats: ${playerStatsString}.
        Performance Radar: ${radarString}.
        
        Based on this, generate a JSON object with the following structure:
        {
          "focusAreas": ["area1", "area2"],
          "drills": [
            {"name": "Drill Name", "description": "Short description", "whyItHelps": "How this drill addresses a focus area", "mockVideoUrl": "https://www.youtube.com/watch?v=mockvideoid"},
            // ... more drills
          ],
          "motivation": "Encouraging message"
        }
        
        Provide 2-3 specific "focusAreas". For "drills", include 3-5 unique drill recommendations. Each drill should have a unique 'mockVideoUrl' which is a valid YouTube URL (you can use placeholders like 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' for now). Ensure the 'whyItHelps' directly relates to a focus area. The 'motivation' should be a brief, uplifting message.`;

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
    }, [ai, player, onGenerate]);

    useEffect(() => {
        if (!initialPlan) {
            generatePlan();
        }
    }, [initialPlan, generatePlan]);

    return (
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Trophy /> AI Development Plan for {player.name}</h2>
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
    );
};

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

const ManageTrainingModal: React.FC<{ exercises: Exercise[], setExercises: (e: Exercise[]) => void, closeModal: () => void }> = ({ exercises, setExercises, closeModal }) => {
    const [newExercise, setNewExercise] = useState({ name: '', description: '', sets: '', reps: '' });

    const handleAddExercise = () => {
        if (!newExercise.name || !newExercise.sets || !newExercise.reps) {
            alert("Please fill out at least Name, Sets, and Reps.");
            return;
        }
        const exerciseToAdd: Exercise = {
            id: Date.now(),
            ...newExercise,
        };
        setExercises([exerciseToAdd, ...exercises]);
        setNewExercise({ name: '', description: '', sets: '', reps: '' }); // Reset form
    };
    
    const handleDeleteExercise = (id: number) => {
        setExercises(exercises.filter(ex => ex.id !== id));
    };

    const inputClass = "w-full p-2 bg-gray-600 rounded-lg border border-gray-500";
    
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 w-full max-w-4xl h-[90vh] rounded-xl shadow-2xl flex flex-col">
                 <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><Dumbbell /> Manage Training Plan</h2>
                    <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-700"><X size={20} /></button>
                </div>
                 <div className="p-6 flex-grow grid md:grid-cols-2 gap-6 overflow-hidden">
                    {/* Left: Add Form */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-lg font-semibold">Add New Exercise</h3>
                        <input type="text" placeholder="Exercise Name" value={newExercise.name} onChange={e => setNewExercise(p => ({...p, name: e.target.value}))} className={inputClass} />
                         <div className="grid grid-cols-2 gap-4">
                            <input type="text" placeholder="Sets" value={newExercise.sets} onChange={e => setNewExercise(p => ({...p, sets: e.target.value}))} className={inputClass} />
                            <input type="text" placeholder="Reps" value={newExercise.reps} onChange={e => setNewExercise(p => ({...p, reps: e.target.value}))} className={inputClass} />
                        </div>
                        <textarea placeholder="Description or coaching points..." value={newExercise.description} onChange={e => setNewExercise(p => ({...p, description: e.target.value}))} rows={4} className={`${inputClass} resize-none`} />
                        <button onClick={handleAddExercise} className="w-full py-3 bg-brand-primary hover:bg-brand-dark rounded-lg font-bold">Add to Plan</button>
                    </div>
                     {/* Right: List of Exercises */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-lg font-semibold">Current Plan ({exercises.length})</h3>
                        <div className="flex-grow bg-gray-900/50 rounded-lg p-3 space-y-2 overflow-y-auto">
                            {exercises.map(ex => (
                                <div key={ex.id} className="bg-gray-700 p-3 rounded-lg group">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-white">{ex.name}</p>
                                            <p className="text-sm text-brand-accent">{ex.sets} sets of {ex.reps}</p>
                                            <p className="text-xs text-gray-400 mt-1">{ex.description}</p>
                                        </div>
                                         <button onClick={() => handleDeleteExercise(ex.id)} className="p-1 text-gray-500 hover:text-red-500 flex-shrink-0 ml-4 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DetailedAnalysisModal: React.FC<{ film: GameFilm, ai: GoogleGenAI, closeModal: () => void; onDetectErrors: (film: GameFilm) => void }> = ({ film, ai, closeModal, onDetectErrors }) => {
    const [activeTab, setActiveTab] = useState('analysis');

    const handleTTS = async (textToSpeak: string) => {
        if (!textToSpeak) return;
        try {
// FIX: Added explicit GenerateContentResponse type to ensure response type is correctly inferred.
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: textToSpeak }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
                }
            });
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                const source = outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContext.destination);
                source.start();
            }
        } catch (error) {
            console.error("TTS Error:", error);
            alert("Failed to play audio. Error: " + getApiErrorMessage(error));
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 w-full max-w-3xl h-[90vh] rounded-xl shadow-2xl flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><BrainCircuit /> Detailed AI Breakdown</h2>
                    <div className="flex items-center gap-2">
                        {film.detailedAnalysis && activeTab === 'analysis' && <button onClick={() => handleTTS(film.detailedAnalysis || '')} className="p-2 rounded-full hover:bg-gray-700"><Speech size={20} /></button>}
                        {film.errorDetection && activeTab === 'errors' && film.errorDetection.length > 0 && <button onClick={() => handleTTS(film.errorDetection?.map(e => e.description).join('. ') || '')} className="p-2 rounded-full hover:bg-gray-700"><Speech size={20} /></button>}
                        <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-700"><X size={20} /></button>
                    </div>
                </div>
                <div className="p-4 flex-shrink-0">
                    <div className="flex bg-gray-900/50 rounded-lg p-1">
                        <button onClick={() => setActiveTab('analysis')} className={`flex-grow py-2 rounded-md font-semibold ${activeTab === 'analysis' ? 'bg-brand-primary' : 'hover:bg-gray-700'}`}>Full Analysis</button>
                        <button onClick={() => { setActiveTab('errors'); if (!film.errorDetection) onDetectErrors(film); }} className={`flex-grow py-2 rounded-md font-semibold ${activeTab === 'errors' ? 'bg-brand-primary' : 'hover:bg-gray-700'}`}>Detected Errors</button>
                    </div>
                </div>
                <div className="p-6 flex-grow overflow-y-auto">
                    <h3 className="text-lg font-semibold text-brand-accent mb-4">{film.title}</h3>
                    {activeTab === 'analysis' && (
                        <div className="bg-gray-900/50 p-4 rounded-lg">
                            <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed">{film.detailedAnalysis}</pre>
                        </div>
                    )}
                    {activeTab === 'errors' && (
                        <div className="bg-gray-900/50 p-4 rounded-lg min-h-[200px] relative">
                            {!film.errorDetection && !film.errorDetectionError && (
                                <div className="text-center py-8">
                                    <div className="w-8 h-8 border-4 border-t-transparent border-brand-accent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-gray-400">AI is scanning film for missed assignments and execution errors...</p>
                                </div>
                            )}
                            {film.errorDetectionError && (
                                <div className="bg-red-500/20 text-red-300 text-sm p-3 rounded-lg">{film.errorDetectionError}</div>
                            )}
                            {film.errorDetection && film.errorDetection.length > 0 && (
                                <ul className="space-y-4">
                                    {film.errorDetection.map((error, i) => (
                                        <li key={i} className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                                            <p className="font-bold text-red-400 mb-1 flex items-center gap-2"><AlertTriangle size={18} /> {error.category}</p>
                                            <p className="text-gray-300">{error.description}</p>
                                            <p className="text-sm text-brand-accent mt-2">Corrective Drill: {error.suggestedDrill}</p>
                                            <a href={error.mockClipLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm mt-1 flex items-center gap-1">
                                                <VideoIcon size={14} /> View Clip
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {film.errorDetection && film.errorDetection.length === 0 && (
                                <p className="text-gray-400 text-center py-8">No specific errors detected in this film. Good job!</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const CreatePlayerAccountsModal: React.FC<{ closeModal: () => void }> = ({ closeModal }) => {
    const [playerInfo, setPlayerInfo] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!playerInfo.trim()) return;
        // In a real app, this would parse the text and send API requests
        console.log("Simulating account creation for:", playerInfo);
        setIsSubmitted(true);
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 w-full max-w-lg rounded-xl shadow-2xl">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><Users /> Create Player Accounts</h2>
                    <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-700"><X size={20} /></button>
                </div>
                {isSubmitted ? (
                    <div className="p-8 text-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold mb-2">Invites Sent!</h3>
                        <p className="text-gray-400 mb-6">Players will receive an email to set up their accounts and join the team portal.</p>
                        <button onClick={closeModal} className="w-full bg-brand-primary hover:bg-brand-dark py-3 rounded-lg font-bold">Done</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Player Information</label>
                            <textarea
                                value={playerInfo}
                                onChange={e => setPlayerInfo(e.target.value)}
                                rows={8}
                                placeholder="Paste player list here. e.g.&#10;John Doe, QB, john.d@email.com&#10;Mike Davis, WR, mike.d@email.com"
                                className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">Enter one player per line: Name, Position, Email</p>
                        </div>
                        <div className="pt-2">
                            <button type="submit" className="w-full bg-brand-primary hover:bg-brand-dark py-3 rounded-lg font-bold disabled:bg-gray-600" disabled={!playerInfo.trim()}>
                                Send Account Invites
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

const UploadFilmModal: React.FC<{ onUpload: (source: File | string) => void, closeModal: () => void }> = ({ onUpload, closeModal }) => {
    const [tab, setTab] = useState<'file' | 'url'>('file');
    const [url, setUrl] = useState('');
    const [urlError, setUrlError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onUpload(e.target.files[0]);
        }
    };

    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setUrlError('');
        if (!url.trim()) return;

        try {
            new URL(url.trim());
            onUpload(url.trim());
        } catch (_) {
            setUrlError('Invalid URL. Please enter a valid web address.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 w-full max-w-lg rounded-xl shadow-2xl">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><UploadCloud /> Import Game Film</h2>
                    <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-700"><X size={20} /></button>
                </div>
                <div className="p-1 bg-gray-900/50 m-4 rounded-lg flex">
                    <button onClick={() => setTab('file')} className={`w-1/2 p-2 rounded-md font-semibold transition ${tab === 'file' ? 'bg-brand-primary' : 'hover:bg-gray-700'}`}>
                        <FileUp className="inline-block mr-2" size={18}/>Upload File
                    </button>
                    <button onClick={() => setTab('url')} className={`w-1/2 p-2 rounded-md font-semibold transition ${tab === 'url' ? 'bg-brand-primary' : 'hover:bg-gray-700'}`}>
                       <LinkIcon className="inline-block mr-2" size={18}/>Import from URL
                    </button>
                </div>
                <div className="p-6 pt-2">
                    {tab === 'file' ? (
                        <div>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="video/mp4,video/quicktime" />
                            <button onClick={() => fileInputRef.current?.click()} className="w-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-600 rounded-lg hover:bg-gray-700/50 hover:border-brand-primary transition">
                                <UploadCloud size={48} className="text-gray-500 mb-2" />
                                <span className="font-semibold text-lg">Click to upload</span>
                                <span className="text-gray-400 text-sm">MP4, MOV, etc. (Max 2GB)</span>
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleUrlSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Film URL</label>
                                <input
                                    type="url"
                                    value={url}
                                    onChange={e => setUrl(e.target.value)}
                                    placeholder="https://www.hudl.com/..."
                                    className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                />
                                {urlError && <p className="text-xs text-red-400 mt-1">{urlError}</p>}
                                <p className="text-xs text-gray-500 mt-1">Supports Hudl, YouTube, Dropbox, etc.</p>
                            </div>
                            <button type="submit" className="w-full bg-brand-primary hover:bg-brand-dark py-3 rounded-lg font-bold disabled:bg-gray-600" disabled={!url.trim()}>
                                Import and Process Film
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};


const PlayerComparisonModal: React.FC<{ players: Player[]; closeModal: () => void }> = ({ players, closeModal }) => {
    const [playerOneId, setPlayerOneId] = useState<string>('');
    const [playerTwoId, setPlayerTwoId] = useState<string>('');

    const playerOne = players.find(p => p.id === parseInt(playerOneId));
    const playerTwo = players.find(p => p.id === parseInt(playerTwoId));
    
    const combinedRadarData = playerOne?.radarData.map((p1, i) => ({
        subject: p1.subject,
        [playerOne.name]: p1.value,
        [playerTwo?.name || 'Player 2']: playerTwo?.radarData[i]?.value,
        fullMark: p1.fullMark,
    }));

    const renderPlayerColumn = (player: Player | undefined) => {
        if (!player) return <div className="text-center text-gray-500">Select a player</div>;
        return (
            <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 bg-brand-primary rounded-full flex items-center justify-center font-bold text-3xl">{player.avatar}</div>
                <h3 className="text-2xl font-bold">{player.name}</h3>
                <p className="text-lg text-brand-accent">{player.position}</p>
                <div className="w-full bg-gray-900/50 p-3 rounded-lg space-y-2">
                    {player.stats.map(stat => (
                        <div key={stat.name} className="flex justify-between text-sm">
                            <span className="text-gray-400">{stat.name}</span>
                            <span className="font-semibold">{stat.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><GitCompareArrows /> Player Comparison</h2>
                    <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-700"><X size={20} /></button>
                </div>
                <div className="p-6 flex flex-col gap-6 flex-grow overflow-hidden">
                    <div className="grid grid-cols-2 gap-6">
                        <select value={playerOneId} onChange={e => setPlayerOneId(e.target.value)} className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600">
                            <option value="">-- Select Player 1 --</option>
                            {players.map(p => <option key={p.id} value={p.id}>{p.name} ({p.position})</option>)}
                        </select>
                        <select value={playerTwoId} onChange={e => setPlayerTwoId(e.target.value)} className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600">
                            <option value="">-- Select Player 2 --</option>
                            {players.map(p => <option key={p.id} value={p.id}>{p.name} ({p.position})</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-6 flex-grow">
                        {renderPlayerColumn(playerOne)}
                        {renderPlayerColumn(playerTwo)}
                    </div>
                    {playerOne && playerTwo && (
                        <div className="h-80 -mt-8">
                             <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={combinedRadarData}>
                                    <PolarGrid gridType="circle" stroke="rgba(255,255,255,0.2)" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                                    <Legend />
                                    <Radar name={playerOne.name} dataKey={playerOne.name} stroke="var(--color-brand-accent)" fill="var(--color-brand-accent)" fillOpacity={0.6} />
                                    <Radar name={playerTwo.name} dataKey={playerTwo.name} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const PlaybookManagementModal: React.FC<{ plays: Play[], setPlays: (plays: Play[]) => void, openPlayCreator: () => void, openImporter: () => void, closeModal: () => void }> = ({ plays, setPlays, openPlayCreator, openImporter, closeModal }) => {
    const [filter, setFilter] = useState('All');

    const handleDeletePlay = (id: number) => {
        if(window.confirm("Are you sure you want to delete this play?")) {
            setPlays(plays.filter(p => p.id !== id));
        }
    };
    
    const filteredPlays = plays.filter(p => filter === 'All' || p.type === filter);

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 w-full max-w-4xl h-[90vh] rounded-xl shadow-2xl flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><ClipboardList /> Manage Playbook</h2>
                    <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-700"><X size={20} /></button>
                </div>
                <div className="p-6 flex-grow overflow-hidden flex flex-col">
                     <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-1 bg-gray-700 p-1 rounded-lg">
                            <button onClick={() => setFilter('All')} className={`px-3 py-1 text-sm rounded-md ${filter === 'All' ? 'bg-brand-primary' : ''}`}>All</button>
                            <button onClick={() => setFilter('Offense')} className={`px-3 py-1 text-sm rounded-md ${filter === 'Offense' ? 'bg-brand-primary' : ''}`}>Offense</button>
                            <button onClick={() => setFilter('Defense')} className={`px-3 py-1 text-sm rounded-md ${filter === 'Defense' ? 'bg-brand-primary' : ''}`}>Defense</button>
                         </div>
                         <div className="flex items-center gap-2">
                             <button onClick={openImporter} className="bg-gray-600 hover:bg-gray-500 py-2 px-4 rounded-lg font-semibold flex items-center gap-2"><FileUp size={18} /> Import Plays</button>
                             <button onClick={openPlayCreator} className="bg-green-600 hover:bg-green-700 py-2 px-4 rounded-lg font-semibold flex items-center gap-2"><FilePlus size={18} /> Create New Play</button>
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
                                    <button onClick={() => handleDeletePlay(play.id)} className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0 ml-4"><Trash2 size={16} /></button>
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

const SettingsModal: React.FC<{
    aiName: string;
    onAiNameChange: (name: string) => void;
    teamColor: string;
    onTeamColorChange: (color: string) => void;
    closeModal: () => void;
}> = ({ aiName, onAiNameChange, teamColor, onTeamColorChange, closeModal }) => {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 w-full max-w-md rounded-xl shadow-2xl">
                 <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><Settings /> Team Settings</h2>
                    <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-700"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <label htmlFor="aiNameInput" className="block text-sm font-medium text-gray-400 mb-2">Customize AI Name</label>
                        <input 
                            id="aiNameInput"
                            type="text" 
                            value={aiName} 
                            onChange={(e) => onAiNameChange(e.target.value)} 
                            className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-primary" 
                        />
                    </div>
                    <div>
                        <label htmlFor="teamColorInput" className="block text-sm font-medium text-gray-400 mb-2">Primary Team Color</label>
                        <div className="flex items-center gap-3">
                            <input 
                                id="teamColorInput"
                                type="color" 
                                value={teamColor} 
                                onChange={(e) => onTeamColorChange(e.target.value)} 
                                className="p-1 h-10 w-10 block bg-gray-700 border border-gray-600 cursor-pointer rounded-lg"
                            />
                            <div className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600">{teamColor}</div>
                        </div>
                    </div>
                     <div className="pt-2">
                        <button onClick={closeModal} className="w-full bg-brand-primary hover:bg-brand-dark py-3 rounded-lg font-bold">Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const AddPlayerModal: React.FC<{ onAdd: (player: NewPlayerInfo) => void, closeModal: () => void }> = ({ onAdd, closeModal }) => {
    const [playerData, setPlayerData] = useState({
        name: '',
        position: '',
        age: '',
        height: '',
        parentsName: '',
        phone: '',
        notes: '',
        academicInfo: '', // Added for recruiting
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setPlayerData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (playerData.name && playerData.position) {
            onAdd({
                ...playerData,
                age: playerData.age ? parseInt(playerData.age) : undefined,
            });
        }
    };

    const inputClass = "w-full p-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-primary";
    const labelClass = "block text-sm font-medium text-gray-400 mb-1";

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 w-full max-w-lg rounded-xl shadow-2xl flex flex-col">
                 <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><UserPlus /> Add New Player</h2>
                    <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-700"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className={labelClass}>Full Name</label>
                            <input id="name" name="name" type="text" value={playerData.name} onChange={handleChange} required className={inputClass} />
                        </div>
                        <div>
                             <label htmlFor="position" className={labelClass}>Position</label>
                            <input id="position" name="position" type="text" value={playerData.position} onChange={handleChange} required className={inputClass} />
                        </div>
                         <div>
                            <label htmlFor="age" className={labelClass}>Age</label>
                            <input id="age" name="age" type="number" value={playerData.age} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="height" className={labelClass}>Height (e.g., 6'1")</label>
                            <input id="height" name="height" type="text" value={playerData.height} onChange={handleChange} className={inputClass} />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="parentsName" className={labelClass}>Parent/Guardian Name</label>
                        <input id="parentsName" name="parentsName" type="text" value={playerData.parentsName} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="phone" className={labelClass}>Phone Number</label>
                        <input id="phone" name="phone" type="tel" value={playerData.phone} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="academicInfo" className={labelClass}>Academic Info (e.g., GPA, interests)</label>
                        <input id="academicInfo" name="academicInfo" type="text" value={playerData.academicInfo} onChange={handleChange} className={inputClass} />
                    </div>
                     <div>
                        <label htmlFor="notes" className={labelClass}>Coach's Notes (Private)</label>
                        <textarea id="notes" name="notes" value={playerData.notes} onChange={handleChange} rows={3} className={`${inputClass} resize-none`}></textarea>
                    </div>
                    <div className="pt-2">
                        <button type="submit" className="w-full bg-brand-primary hover:bg-brand-dark py-3 rounded-lg font-bold">Add Player to Roster</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const LiveConversationModal: React.FC<ModalProps> = ({ ai, closeModal }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcription, setTranscription] = useState<{ user: string, model: string }[]>([]);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);

    const stopConversation = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close();
        }
        setIsListening(false);
    }, []);

    const startConversation = useCallback(async () => {
        setIsListening(true);
        setTranscription([]);

        const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        outputAudioContextRef.current = outputAudioContext;
        let nextStartTime = 0;

        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                systemInstruction: 'You are a helpful and concise high school football coaching assistant named Grid. Keep your answers brief and to the point.'
            },
            callbacks: {
                onopen: async () => {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                    inputAudioContextRef.current = inputAudioContext;
                    const source = inputAudioContext.createMediaStreamSource(stream);
                    const processor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                    
                    source.connect(processor);
                    processor.connect(inputAudioContext.destination);

                    processor.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        const int16 = new Int16Array(inputData.length);
                        for (let i = 0; i < inputData.length; i++) {
                            int16[i] = inputData[i] * 32768;
                        }
                        const pcmBlob = {
                            data: encode(new Uint8Array(int16.buffer)),
                            mimeType: 'audio/pcm;rate=16000',
                        };
                        sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                    };
                },
                onmessage: async (message: LiveServerMessage) => {
                    if (message.serverContent?.inputTranscription) {
                        setTranscription(prev => {
                            const last = prev[prev.length - 1];
                            if (last && !last.model) {
                                return [...prev.slice(0, -1), { ...last, user: last.user + message.serverContent.inputTranscription.text }];
                            }
                            return [...prev, { user: message.serverContent.inputTranscription.text, model: '' }];
                        });
                    }
                    if (message.serverContent?.outputTranscription) {
                        setTranscription(prev => {
                            const last = prev[prev.length - 1];
                            return [...prev.slice(0, -1), { ...last, model: last.model + message.serverContent.outputTranscription.text }];
                        });
                    }
                    const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (audioData && outputAudioContextRef.current) {
                         nextStartTime = Math.max(nextStartTime, outputAudioContextRef.current.currentTime);
                         const audioBuffer = await decodeAudioData(decode(audioData), outputAudioContextRef.current, 24000, 1);
                         const source = outputAudioContextRef.current.createBufferSource();
                         source.buffer = audioBuffer;
                         source.connect(outputAudioContextRef.current.destination);
                         source.start(nextStartTime);
                         nextStartTime += audioBuffer.duration;
                    }
                },
                onerror: (e) => { console.error("Live session error:", e); alert("Live session error: " + getApiErrorMessage(e)); stopConversation(); },
                onclose: () => setIsListening(false),
            }
        });
        sessionPromiseRef.current = sessionPromise;
    }, [ai, stopConversation]);


    useEffect(() => {
        return () => { // Cleanup on unmount
            stopConversation();
        };
    }, [stopConversation]);


    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 w-full max-w-2xl h-[80vh] rounded-xl shadow-2xl flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><Mic /> Live AI Conversation</h2>
                    <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-700"><X size={20} /></button>
                </div>
                <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                   {transcription.map((turn, i) => (
                       <div key={i} className="space-y-2">
                           <p className="text-right text-gray-300">{turn.user}</p>
                           {turn.model && <p className="text-left text-brand-accent font-semibold">{turn.model}</p>}
                       </div>
                   ))}
                </div>
                <div className="p-4 border-t border-gray-700">
                    <button
                        onClick={isListening ? stopConversation : startConversation}
                        className={`w-full py-3 rounded-lg text-lg font-bold transition ${isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-primary hover:bg-brand-dark'}`}
                    >
                        {isListening ? 'Stop Conversation' : 'Start Conversation'}
                    </button>
                </div>
            </div>
        </div>
    )
};

interface EnhancedLiveSidelineAssistantModalProps extends ModalProps {
    players: Player[];
}

const EnhancedLiveSidelineAssistantModal: React.FC<EnhancedLiveSidelineAssistantModalProps> = ({ ai, closeModal, players }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcription, setTranscription] = useState<{ user: string, ai: string }[]>([]);
    const [proactiveAlertsEnabled, setProactiveAlertsEnabled] = useState(false);
    const [gameSituation, setGameSituation] = useState({ down: 1, distance: 10, fieldPosition: 25, timeRemaining: '12:00', score: '0-0' });
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    let nextStartTime = 0; // Managed outside React state to avoid re-renders impacting audio scheduling

    // Mock function to simulate querying game state / player stats
    const queryGameData = useCallback((query: string) => {
        query = query.toLowerCase();
        if (query.includes("tendency") && query.includes("3rd") && query.includes("short")) {
            return "On 3rd and short, opponent's most likely play is an inside zone run (65% confidence).";
        }
        if (query.includes("qb") && query.includes("deep passes")) {
            const qb = players.find(p => p.position === 'QB' && p.name.includes('J. Williams'));
            return qb ? `J. Williams has completed 3 of 5 deep passes for 85 yards today.` : `QB stats not available for deep passes.`;
        }
        if (query.includes("play call") && query.includes("defensive coverage")) {
            return "Given their current offensive formation, a Cover 2 zone would disrupt their quick passing game.";
        }
        return "I can't find specific data for that query right now, Coach. Please ask something else.";
    }, [players]);

    const stopConversation = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close();
        }
        setIsListening(false);
        setTranscription([]);
        nextStartTime = 0; // Reset audio time
    }, []);

    const startConversation = useCallback(async () => {
        setIsListening(true);
        setTranscription([]);
        nextStartTime = 0;

        const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        outputAudioContextRef.current = outputAudioContext;

        const processAiMessage = async (message: LiveServerMessage) => {
            let aiText = '';
            if (message.toolCall && message.toolCall.functionCalls) {
                for (const fc of message.toolCall.functionCalls) {
                    if (fc.name === 'queryGameData') {
                        const result = queryGameData(fc.args.query);
                        aiText = result;
                        // Send tool response back to AI to maintain context
                        sessionPromiseRef.current?.then((session) => {
                            session.sendToolResponse({
                                functionResponses: {
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: result },
                                }
                            });
                        });
                    }
                }
            }
            if (message.serverContent?.outputTranscription) {
                aiText += (aiText ? ' ' : '') + message.serverContent.outputTranscription.text;
            }

            if (aiText) {
                setTranscription(prev => {
                    const last = prev[prev.length - 1];
                    if (last && last.ai === '') { // If last turn was user and AI is still responding
                        return [...prev.slice(0, -1), { ...last, ai: last.ai + aiText }];
                    }
                    return [...prev, { user: '', ai: aiText }];
                });
            }

            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && outputAudioContextRef.current) {
                nextStartTime = Math.max(nextStartTime, outputAudioContextRef.current.currentTime);
                const audioBuffer = await decodeAudioData(decode(audioData), outputAudioContextRef.current, 24000, 1);
                const source = outputAudioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContextRef.current.destination);
                source.start(nextStartTime);
                nextStartTime += audioBuffer.duration;
            }
        };

        const queryGameDataFunctionDeclaration: FunctionDeclaration = {
            name: 'queryGameData',
            parameters: {
                type: Type.OBJECT,
                description: 'Queries live game data or player statistics based on a natural language query.',
                properties: {
                    query: {
                        type: Type.STRING,
                        description: 'The natural language query to extract game data. E.g., "opponent tendency on 3rd down" or "QB completion percentage".',
                    },
                },
                required: ['query'],
            },
        };

        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } }, // Distinct voice for sideline assistant
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                systemInstruction: `You are Grid, a highly specialized real-time high school football sideline assistant AI. Provide concise, actionable information to the coach. Use the 'queryGameData' tool for any data-related questions. If proactive alerts are enabled, provide critical strategic insights based on the mocked game situation: Down ${gameSituation.down}, Distance ${gameSituation.distance}, Field Position Own ${gameSituation.fieldPosition}, Time ${gameSituation.timeRemaining}, Score ${gameSituation.score}. Keep responses brief and to the point.`,
                tools: [{ functionDeclarations: [queryGameDataFunctionDeclaration] }]
            },
            callbacks: {
                onopen: async () => {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                    inputAudioContextRef.current = inputAudioContext;
                    const source = inputAudioContext.createMediaStreamSource(stream);
                    const processor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                    
                    source.connect(processor);
                    processor.connect(inputAudioContext.destination);

                    processor.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        const int16 = new Int16Array(inputData.length);
                        for (let i = 0; i < inputData.length; i++) {
                            int16[i] = inputData[i] * 32768;
                        }
                        const pcmBlob = {
                            data: encode(new Uint8Array(int16.buffer)),
                            mimeType: 'audio/pcm;rate=16000',
                        };
                        sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                    };

                    // Proactive alert simulation
                    if (proactiveAlertsEnabled) {
                        sessionPromise.then(session => {
                            session.sendRealtimeInput({
                                text: `Proactive alert: Based on previous opponent tendencies and current game state (Down ${gameSituation.down}, Distance ${gameSituation.distance}, Field Position Own ${gameSituation.fieldPosition}), they often run a play-action pass here.`
                            });
                        });
                    }
                },
                onmessage: processAiMessage,
                onerror: (e) => { console.error("Live session error:", e); alert("Live session error: " + getApiErrorMessage(e)); stopConversation(); },
                onclose: () => setIsListening(false),
            }
        });
        sessionPromiseRef.current = sessionPromise;
    }, [ai, stopConversation, proactiveAlertsEnabled, gameSituation, queryGameData]);


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcription]);

    useEffect(() => {
        return () => { // Cleanup on unmount
            stopConversation();
        };
    }, [stopConversation]);

    // Mock game situation update
    useEffect(() => {
        const interval = setInterval(() => {
            setGameSituation(prev => ({
                ...prev,
                down: Math.floor(Math.random() * 4) + 1,
                distance: Math.floor(Math.random() * 10) + 1,
                fieldPosition: Math.floor(Math.random() * 90) + 1,
                timeRemaining: `${Math.floor(Math.random() * 12)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
                score: `${Math.floor(Math.random() * 30)}-${Math.floor(Math.random() * 30)}`
            }));
        }, 15000); // Update every 15 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 w-full max-w-4xl h-[90vh] rounded-xl shadow-2xl flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><Mic /> Live Sideline Assistant</h2>
                    <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-700"><X size={20} /></button>
                </div>
                <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                    <div className="bg-gray-900/50 p-3 rounded-lg flex justify-around text-sm text-gray-400 font-mono mb-4">
                        <span>D: {gameSituation.down}</span>
                        <span>Yds: {gameSituation.distance}</span>
                        <span>Pos: Own {gameSituation.fieldPosition}</span>
                        <span>Time: {gameSituation.timeRemaining}</span>
                        <span>Score: {gameSituation.score}</span>
                    </div>
                    {transcription.map((turn, i) => (
                       <div key={i} className="space-y-2">
                           {turn.user && <p className="text-right text-gray-300">Coach: {turn.user}</p>}
                           {turn.ai && <p className="text-left text-red-400 font-semibold">Grid: {turn.ai}</p>}
                       </div>
                   ))}
                   {isListening && <div className="flex justify-start"><div className="bg-gray-700 p-3 rounded-xl animate-pulse">...</div></div>}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <label htmlFor="proactive-alerts" className="flex items-center cursor-pointer">
                            <div className="relative">
                                <input type="checkbox" id="proactive-alerts" className="sr-only" checked={proactiveAlertsEnabled} onChange={() => setProactiveAlertsEnabled(!proactiveAlertsEnabled)} />
                                <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${proactiveAlertsEnabled ? 'translate-x-full bg-red-500' : ''}`}></div>
                            </div>
                            <span className="ml-3 text-gray-300">Proactive Alerts</span>
                        </label>
                        <button
                            onClick={isListening ? stopConversation : startConversation}
                            className={`px-6 py-3 rounded-lg text-lg font-bold transition ${isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-primary hover:bg-brand-dark'}`}
                        >
                            {isListening ? 'Stop Listening' : 'Start Listening'}
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 text-center">Say things like "What's their tendency on 3rd & short?" or "Suggest a play call."</p>
                </div>
            </div>
        </div>
    );
};


const ImageAnalysisModal: React.FC<ModalProps> = ({ ai, closeModal }) => {
    const [image, setImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [analysis, setAnalysis] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleAnalyze = async () => {
        if (!image || !prompt) return;
        setIsLoading(true);
        setAnalysis('');
        try {
            const base64Data = image.split(',')[1];
            const mimeType = image.split(';')[0].split(':')[1];
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    parts: [
                        { inlineData: { mimeType, data: base64Data } },
                        { text: prompt }
                    ]
                }
            });
            setAnalysis(response.text);
        } catch (error) {
            setAnalysis(getApiErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    return (
         <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 w-full max-w-4xl h-[90vh] rounded-xl shadow-2xl flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><FileImage /> Analyze Play/Film Image</h2>
                    <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-700"><X size={20} /></button>
                </div>
                <div className="flex-grow p-4 grid grid-cols-2 gap-4 overflow-hidden">
                    <div className="flex flex-col gap-4">
                        <div className="flex-grow bg-gray-900 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600">
                             {image ? <img src={image} alt="upload" className="max-h-full max-w-full object-contain" /> : <p className="text-gray-500">Upload an image to analyze</p>}
                        </div>
                        <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-semibold">Upload Image</button>
                    </div>
                     <div className="flex flex-col gap-4">
                        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Enter your prompt... e.g., 'What defensive formation is this? Who is the MIKE linebacker? What are the weaknesses?'" className="w-full h-32 p-2 bg-gray-900 rounded-lg border border-gray-600 resize-none"></textarea>
                        <button onClick={handleAnalyze} disabled={isLoading || !image || !prompt} className="w-full bg-brand-primary hover:bg-brand-dark py-2 rounded-lg font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed">
                            {isLoading ? 'Analyzing...' : 'Analyze'}
                        </button>
                        <div className="flex-grow bg-gray-900 rounded-lg p-4 overflow-y-auto border border-gray-600">
                            {isLoading ? <div className="animate-pulse text-gray-400">AI is analyzing the image...</div> : <p className="whitespace-pre-wrap">{analysis}</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ComplexAnalysisModal: React.FC<ModalProps> = ({ ai, closeModal }) => {
    const [prompt, setPrompt] = useState<string>('');
    const [result, setResult] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    
    const handleAnalyze = async () => {
        if (!prompt) return;
        setIsLoading(true);
        setResult('');
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
                config: { thinkingConfig: { thinkingBudget: 32768 } }
            });
            setResult(response.text);
        } catch (error) {
            setResult(getApiErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleTTS = async () => {
        if (!result) return;
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: result }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
                }
            });
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                const source = outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContext.destination);
                source.start();
            }
        } catch (error) {
            console.error("TTS Error:", error);
            alert("Failed to play audio. Error: " + getApiErrorMessage(error));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 w-full max-w-3xl h-[85vh] rounded-xl shadow-2xl flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><BrainCircuit /> Deep Strategy Analysis</h2>
                    <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-700"><X size={20} /></button>
                </div>
                <div className="p-4 flex flex-col gap-4 flex-grow overflow-hidden">
                    <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Enter a complex strategic prompt... e.g., 'Analyze our last 5 games. Our offense struggles against a 3-4 defense. Devise a complete game plan with new formations, key plays, and player-specific adjustments to counter it.'" className="w-full h-40 p-2 bg-gray-900 rounded-lg border border-gray-600 resize-none"></textarea>
                    <button onClick={handleAnalyze} disabled={isLoading || !prompt} className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed">
                        {isLoading ? 'Thinking...' : 'Generate Deep Analysis'}
                    </button>
                    <div className="flex-grow bg-gray-900 rounded-lg p-4 overflow-y-auto border border-gray-600 relative">
                         {result && <button onClick={handleTTS} className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-full"><Speech size={18} /></button>}
                        {isLoading ? <div className="animate-pulse text-gray-400">AI is performing a deep analysis. This may take a moment...</div> : <p className="whitespace-pre-wrap">{result}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

const GroundedSearchModal: React.FC<ModalProps> = ({ ai, closeModal }) => {
    const [prompt, setPrompt] = useState<string>('');
    const [result, setResult] = useState<GenerateContentResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async () => {
        if (!prompt) return;
        setIsLoading(true);
        setResult(null);
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: { tools: [{googleSearch: {}}] },
            });
            setResult(response);
        } catch (error) {
            const text = getApiErrorMessage(error);
// FIX: The result state expects a GenerateContentResponse object. In case of an error, create a mock response object with the error message and an empty candidates array to prevent runtime errors when accessing result.candidates.
            setResult({ text, candidates: [] } as any);
        } finally {
            setIsLoading(false);
        }
    };
    
    const sources = result?.candidates?.[0]?.groundingMetadata?.groundingChunks;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 w-full max-w-3xl h-[85vh] rounded-xl shadow-2xl flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><Search /> Grounded Search Q&A</h2>
                    <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-700"><X size={20} /></button>
                </div>
                <div className="p-4 flex flex-col gap-4 flex-grow overflow-hidden">
                    <div className="flex gap-2">
                        <input value={prompt} onChange={e => setPrompt(e.target.value)} type="text" placeholder="Ask a question requiring up-to-date info... e.g., 'What are the latest trends in high school spread offenses in 2024?'" className="w-full p-3 bg-gray-900 rounded-lg border border-gray-600"></input>
                        <button onClick={handleSearch} disabled={isLoading || !prompt} className="bg-yellow-600 hover:bg-yellow-700 px-6 rounded-lg font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed">
                            {isLoading ? '...' : 'Search'}
                        </button>
                    </div>
                    <div className="flex-grow bg-gray-900 rounded-lg p-4 overflow-y-auto border border-gray-600">
                        {isLoading && <div className="animate-pulse text-gray-400">Searching the web for the latest information...</div>}
                        {result && <p className="whitespace-pre-wrap">{result.text}</p>}
                        {sources && sources.length > 0 && (
                            <div className="mt-6 border-t border-gray-700 pt-4">
                                <h3 className="text-lg font-semibold text-yellow-400 mb-2">Sources:</h3>
                                <ul className="space-y-2">
                                    {sources.map((source, index) => (
                                        <li key={index} className="text-sm">
                                            <a href={source.web?.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                                {index + 1}. {source.web?.title}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- CHATBOT COMPONENT ---

interface Message {
    sender: 'user' | 'bot';
    text: string;
}

const CHAT_HISTORY_KEY = 'gridironIntelCoachChatHistory';

const AIChatbot: React.FC<{ ai: GoogleGenAI | null; aiName: string; gameFilms: GameFilm[] }> = ({ ai, aiName, gameFilms }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [chat, setChat] = useState<Chat | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFilmModalOpen, setIsFilmModalOpen] = useState(false);
    const [selectedFilm, setSelectedFilm] = useState<GameFilm | null>(null);
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
            const storedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
            if (storedHistory) {
                setMessages(JSON.parse(storedHistory));
            } else {
                setMessages([{ sender: 'bot', text: `Hello Coach! I'm ${aiName}. Ask me a question or attach a game film to begin a deep-dive analysis.` }]);
            }
        } catch (error) {
            console.error("Failed to load chat history:", error);
            setMessages([{ sender: 'bot', text: `Hello Coach! I'm ${aiName}.` }]);
        }
    }, [aiName]);

    useEffect(() => {
        if (messages.length > 1) {
            localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
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
                    systemInstruction: `You are Grid, an expert AI football strategist. Your name is ${aiName}. Analyze the provided game film data and user queries to provide in-depth, actionable advice. Break down complex situations, suggest specific plays, and identify opponent weaknesses based on the data provided.`
                }
            });
            setChat(newChat);
        }
    }, [ai, chat, aiName, messages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !chat || isLoading) return;
        if (isListening) stopListening();

        let finalPrompt = input;
        if (selectedFilm) {
            finalPrompt = `Based on the following game film analysis, answer the user's question.\n\nFILM DATA: "${selectedFilm.title}"\n${selectedFilm.summary || ''}\n\nQUESTION: ${input}`;
        }

        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setSelectedFilm(null);
        setIsLoading(true);

        try {
            const response = await chat.sendMessage({ message: finalPrompt });
            const botMessage: Message = { sender: 'bot', text: response.text };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            const errorMessage: Message = { sender: 'bot', text: getApiErrorMessage(error) };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSelectFilm = (film: GameFilm) => {
        setSelectedFilm(film);
        setIsFilmModalOpen(false);
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
                <h3 className="text-lg font-bold">{aiName}</h3>
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
                <div className="relative">
                    {isFilmModalOpen && (
                        <div className="absolute bottom-full w-full mb-2 bg-gray-700 rounded-lg shadow-xl border border-gray-600 z-10">
                            <div className="p-2 border-b border-gray-600 text-center text-sm font-semibold">Select Film to Analyze</div>
                            <div className="max-h-48 overflow-y-auto p-2">
                                {gameFilms.map(film => (
                                    <button 
                                        key={film.id}
                                        onClick={() => handleSelectFilm(film)}
                                        className="w-full text-left p-2 text-sm rounded hover:bg-brand-primary transition"
                                    >
                                        {film.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {selectedFilm && (
                        <div className="bg-gray-600 px-3 py-1 rounded-t-lg text-sm flex items-center justify-between">
                            <span className="truncate text-gray-200">Analyzing: {selectedFilm.title}</span>
                            <button onClick={() => setSelectedFilm(null)} className="p-1 rounded-full hover:bg-red-500/50">
                                <X size={14} />
                            </button>
                        </div>
                    )}
                    <div className={`flex items-center gap-2 p-2 bg-gray-700 ${selectedFilm ? 'rounded-b-lg' : 'rounded-lg'}`}>
                        <button onClick={() => setIsFilmModalOpen(prev => !prev)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-full transition" title="Attach Film">
                            <Paperclip size={20} />
                        </button>
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
        </div>
    );
};
