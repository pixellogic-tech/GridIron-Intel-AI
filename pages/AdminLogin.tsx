
import React, { useState } from 'react';
// FIX: Replaced useHistory with useNavigate for react-router-dom v6 compatibility.
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Check } from 'lucide-react';

const AdminLogin: React.FC = () => {
    // FIX: Replaced useHistory with useNavigate for react-router-dom v6 compatibility.
    const navigate = useNavigate();
    const [isVerified, setIsVerified] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isVerified) {
            alert("Please verify you are not a robot.");
            return;
        }
        // Mock admin login logic
        // FIX: Replaced history.push with navigate for v6 compatibility.
        navigate('/admin');
    };
    
    const inputStyles = "w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-primary";
    const buttonStyles = "w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition disabled:bg-gray-600 disabled:cursor-not-allowed";

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
             <div className="absolute inset-0 bg-grid-gray-900/[0.2]"></div>
             <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
            
            <div className="relative z-10 w-full max-w-md p-8 space-y-8 bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-red-800/50">
                <div className="text-center">
                    <Link to="/" className="inline-block mb-4 text-3xl font-bold text-white">
                        🏈 Gridiron Intel
                    </Link>
                    <div className="flex items-center justify-center gap-2">
                        <Shield className="text-red-500"/>
                        <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
                    </div>
                    <p className="text-gray-400">Restricted Access</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Admin Username</label>
                        <input type="text" required className={inputStyles} defaultValue="admin" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
                        <input type="password" required className={inputStyles} defaultValue="password" />
                    </div>

                    <div className="flex items-center gap-3 bg-gray-700 p-3 rounded-lg border border-gray-600">
                        <div 
                            onClick={() => setIsVerified(!isVerified)} 
                            className={`w-6 h-6 rounded border-2 ${isVerified ? 'bg-brand-primary border-brand-primary' : 'border-gray-500'} cursor-pointer flex items-center justify-center`}
                        >
                            {isVerified && <Check size={16} />}
                        </div>
                        <label htmlFor="captcha" className="text-gray-300">I am not a robot</label>
                    </div>

                    <button type="submit" className={buttonStyles} disabled={!isVerified}>
                        Secure Sign In
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;