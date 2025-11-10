
import React, { useState } from 'react';
// FIX: Replaced useHistory with useNavigate for react-router-dom v6 compatibility.
import { useNavigate, Link } from 'react-router-dom';

const LoginPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'coach' | 'player'>('coach');
    // FIX: Replaced useHistory with useNavigate for react-router-dom v6 compatibility.
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock login logic
        if (activeTab === 'coach') {
            // FIX: Replaced history.push with navigate for v6 compatibility.
            navigate('/dashboard');
        } else {
            // FIX: Replaced history.push with navigate for v6 compatibility.
            navigate('/player-dashboard');
        }
    };
    
    const inputStyles = "w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-primary";
    const buttonStyles = "w-full py-3 bg-brand-primary hover:bg-brand-dark text-white rounded-lg font-bold transition";

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
             <div className="absolute inset-0 bg-grid-gray-900/[0.2]"></div>
             <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
            
            <div className="relative z-10 w-full max-w-md p-8 space-y-8 bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-800">
                <div className="text-center">
                    <Link to="/" className="inline-block mb-4 text-3xl font-bold text-white">
                        🏈 Gridiron Intel
                    </Link>
                    <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
                    <p className="text-gray-400">Sign in to access your dashboard.</p>
                </div>
                
                <div className="flex p-1 bg-gray-800 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('coach')}
                        className={`w-1/2 p-2 rounded-md font-semibold transition ${activeTab === 'coach' ? 'bg-brand-primary text-white' : 'text-gray-400'}`}
                    >
                        Coach Login
                    </button>
                    <button
                         onClick={() => setActiveTab('player')}
                         className={`w-1/2 p-2 rounded-md font-semibold transition ${activeTab === 'player' ? 'bg-brand-primary text-white' : 'text-gray-400'}`}
                    >
                        Player Login
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Email or Username</label>
                        <input type="text" required className={inputStyles} placeholder="you@example.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
                        <input type="password" required className={inputStyles} placeholder="••••••••" />
                    </div>
                    <button type="submit" className={buttonStyles}>
                        Sign In as {activeTab === 'coach' ? 'Coach' : 'Player'}
                    </button>
                </form>
                
                <div className="text-center text-gray-400 text-sm">
                    <p>To get an account, please contact your program administrator.</p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
