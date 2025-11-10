
import React, { useState } from 'react';
// FIX: Replaced useHistory with useNavigate for react-router-dom v6 compatibility.
import { useNavigate } from 'react-router-dom';
import { Shield, Users, UserPlus, LogOut, X, RefreshCw, Eye, EyeOff, FileText } from 'lucide-react';

interface Coach {
    id: number;
    name: string;
    email: string;
    team: string;
    status: 'Active' | 'Deactivated';
}

interface AuditLogEntry {
    id: number;
    timestamp: string;
    admin: string;
    action: string;
}

const mockCoaches: Coach[] = [
    { id: 1, name: 'John Harbaugh', email: 'j.harbaugh@ravens.com', team: 'Baltimore Ravens High', status: 'Active' },
    { id: 2, name: 'Andy Reid', email: 'a.reid@chiefs.com', team: 'Kansas City Chiefs Prep', status: 'Active' },
    { id: 3, name: 'Sean McVay', email: 's.mcvay@rams.com', team: 'Los Angeles Rams Academy', status: 'Deactivated' },
];

const AddCoachModal: React.FC<{ onAdd: (coach: Omit<Coach, 'id' | 'status'>) => void; closeModal: () => void }> = ({ onAdd, closeModal }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [team, setTeam] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && email && team) {
            onAdd({ name, email, team });
            setIsSubmitted(true);
        }
    };
    
    if (isSubmitted) {
        return (
             <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 w-full max-w-md rounded-xl shadow-2xl p-8 text-center">
                    <UserPlus className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Account Created!</h2>
                    <p className="text-gray-400 mb-6">An email invitation has been sent to {email} to set up their account.</p>
                    <button onClick={closeModal} className="w-full bg-brand-primary hover:bg-brand-dark py-3 rounded-lg font-bold">Done</button>
                </div>
             </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 w-full max-w-md rounded-xl shadow-2xl">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><UserPlus /> Add New Coach</h2>
                    <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-700"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Team Name</label>
                        <input type="text" value={team} onChange={e => setTeam(e.target.value)} required className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600" />
                    </div>
                    <div className="pt-2">
                        <button type="submit" className="w-full bg-brand-primary hover:bg-brand-dark py-3 rounded-lg font-bold">Create Coach Account</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const AdminDashboard: React.FC = () => {
    // FIX: Replaced useHistory with useNavigate for react-router-dom v6 compatibility.
    const navigate = useNavigate();
    const [coaches, setCoaches] = useState<Coach[]>(mockCoaches);
    const [showModal, setShowModal] = useState(false);
    const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([
        { id: 1, timestamp: new Date().toLocaleString(), admin: 'admin', action: 'Admin logged in.' }
    ]);
    
    const addAuditLog = (action: string) => {
        const newLog: AuditLogEntry = {
            id: Date.now(),
            timestamp: new Date().toLocaleString(),
            admin: 'admin',
            action,
        };
        setAuditLog(prev => [newLog, ...prev]);
    }

    const handleAddCoach = (newCoach: Omit<Coach, 'id' | 'status'>) => {
        const coachToAdd: Coach = {
            ...newCoach,
            id: Date.now(),
            status: 'Active',
        };
        setCoaches(prev => [coachToAdd, ...prev]);
        addAuditLog(`Created new coach account: ${newCoach.name} (${newCoach.email})`);
        setShowModal(false);
    };
    
    const toggleCoachStatus = (coachId: number) => {
        setCoaches(coaches.map(coach => {
            if (coach.id === coachId) {
                const newStatus = coach.status === 'Active' ? 'Deactivated' : 'Active';
                addAuditLog(`${newStatus} account for ${coach.name}.`);
                return { ...coach, status: newStatus };
            }
            return coach;
        }));
    };
    
    const resetPassword = (coachName: string) => {
        if (window.confirm(`Are you sure you want to send a password reset to ${coachName}?`)) {
             addAuditLog(`Sent password reset to ${coachName}.`);
             alert("Password reset email has been sent.");
        }
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen">
            <nav className="bg-gray-800 border-b-4 border-red-600 shadow-lg">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-4">
                            <div className="text-2xl font-bold text-white">🏈 GRIDIRON INTEL</div>
                            <div className="text-gray-400">|</div>
                            <div className="flex items-center gap-2 text-red-400 font-semibold"><Shield size={18}/> Admin Panel</div>
                        </div>
                        {/* FIX: Replaced history.push with navigate for v6 compatibility. */}
                        <button onClick={() => navigate('/admin/login')} className="flex items-center gap-2 text-gray-300 hover:text-white transition">
                            <LogOut size={20} />
                            Log Out
                        </button>
                    </div>
                </div>
            </nav>
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-3xl font-bold">Coach Management</h1>
                            <button onClick={() => setShowModal(true)} className="bg-brand-primary hover:bg-brand-dark text-white font-bold py-2 px-4 rounded-lg transition flex items-center gap-2">
                                <UserPlus size={18} /> Add New Coach
                            </button>
                        </div>
                        
                        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-700">
                                        <tr>
                                            <th className="p-4">Name</th>
                                            <th className="p-4">Email</th>
                                            <th className="p-4">Team</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {coaches.map(coach => (
                                            <tr key={coach.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                                <td className="p-4 font-semibold">{coach.name}</td>
                                                <td className="p-4 text-gray-300">{coach.email}</td>
                                                <td className="p-4 text-gray-300">{coach.team}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${coach.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                        {coach.status}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex gap-2 justify-center">
                                                        <button onClick={() => toggleCoachStatus(coach.id)} title={coach.status === 'Active' ? 'Deactivate' : 'Activate'} className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-full transition">
                                                            {coach.status === 'Active' ? <EyeOff size={16} /> : <Eye size={16} />}
                                                        </button>
                                                        <button onClick={() => resetPassword(coach.name)} title="Reset Password" className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-full transition">
                                                            <RefreshCw size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                     <div className="lg:col-span-1">
                          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><FileText /> Audit Log</h2>
                          <div className="bg-gray-800 rounded-xl shadow-lg p-4 h-[500px] overflow-y-auto">
                            <ul className="space-y-3">
                                {auditLog.map(log => (
                                    <li key={log.id} className="text-sm p-2 bg-gray-900/50 rounded-md">
                                        <p className="text-gray-300">{log.action}</p>
                                        <p className="text-xs text-gray-500">{log.timestamp} by {log.admin}</p>
                                    </li>
                                ))}
                            </ul>
                          </div>
                     </div>
                </div>
            </main>
            {showModal && <AddCoachModal onAdd={handleAddCoach} closeModal={() => setShowModal(false)} />}
        </div>
    );
};

export default AdminDashboard;