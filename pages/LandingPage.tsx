
import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Target, BarChart, Users, Video, BrainCircuit } from 'lucide-react';

const LandingPage: React.FC = () => {

    const Nav = () => (
        <nav className="fixed top-0 w-full bg-black/80 backdrop-blur-lg z-50 border-b border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link to="/" className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-white">🏈 Gridiron Intel</span>
                    </Link>
                    <div className="hidden md:flex items-center space-x-6">
                        <a href="#features" className="text-gray-300 hover:text-brand-accent transition">Features</a>
                        <a href="#demo" className="text-gray-300 hover:text-brand-accent transition">Demo & Pricing</a>
                        <Link to="/login" className="text-gray-300 hover:text-brand-accent transition">Login</Link>
                        <Link to="/login" className="bg-brand-primary hover:bg-brand-dark px-5 py-2 rounded-lg font-semibold transition text-white">
                            Get Started
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );

    const Hero = () => (
        <section className="relative min-h-screen flex items-center justify-center text-white overflow-hidden pt-16">
             <div className="absolute inset-0 bg-black bg-grid-slate-900/[0.4]"></div>
             <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
             <div className="absolute top-0 left-0 w-96 h-96 bg-brand-primary/20 rounded-full filter blur-3xl opacity-50 animate-[float_8s_ease-in-out_infinite]"></div>
             <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-accent/20 rounded-full filter blur-3xl opacity-50 animate-[float_8s_ease-in-out_infinite_4s]"></div>

            <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
                <div className="inline-block bg-brand-accent/10 border border-brand-accent px-4 py-2 rounded-full mb-6">
                    <span className="text-brand-accent font-semibold">BUILT FOR THE 2026 SEASON</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                    The Ultimate Football Intelligence Platform
                </h1>
                <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                    Leverage AI-powered film analysis, predictive insights, and seamless team management to dominate the competition. Save time, win games.
                </p>
                <div className="flex justify-center items-center gap-4">
                     <Link to="/login" className="bg-brand-primary hover:bg-brand-dark text-white px-8 py-4 rounded-lg font-bold transition text-lg">
                        Coach Login
                    </Link>
                    <Link to="/login" className="border border-gray-700 hover:bg-gray-800 text-white px-8 py-4 rounded-lg font-bold transition text-lg">
                        Player Login
                    </Link>
                </div>
            </div>
        </section>
    );

    const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
        <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800 hover:border-brand-primary transition-all duration-300 hover:scale-105">
            <div className="mb-4 inline-block p-3 bg-brand-primary/10 rounded-lg">
                <Icon className="w-7 h-7 text-brand-accent" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
            <p className="text-gray-400">{description}</p>
        </div>
    );

    const Features = () => (
        <section id="features" className="py-24 bg-black text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">The Coach's AI Advantage</h2>
                    <p className="text-lg text-gray-400">Everything you need to out-prepare and out-perform.</p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FeatureCard icon={BrainCircuit} title="AI Film Analysis" description="Automatically tag formations, plays, and player performance from your game film in minutes, not hours." />
                    <FeatureCard icon={Target} title="Predictive Analytics" description="Uncover opponent tendencies and get AI-powered play suggestions based on down, distance, and situation." />
                    <FeatureCard icon={BarChart} title="Player Performance Metrics" description="Track individual player stats, progress, and areas for improvement with detailed, visualized data." />
                    <FeatureCard icon={Users} title="Team & Player Portals" description="Centralize communication, assignments, and film review with secure logins for your entire team." />
                    <FeatureCard icon={Video} title="Auto-Generated Highlights" description="Create professional recruiting reels for any player with one click, ready to be shared with college scouts." />
                    <FeatureCard icon={ShieldCheck} title="Secure & Controlled" description="You control who sees your data. Manage access for coaches and players with an admin-approved system." />
                </div>
            </div>
        </section>
    );
    
    const Demo = () => {
        const [submitted, setSubmitted] = React.useState(false);

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            // In a real application, you would handle form submission here (e.g., API call)
            setSubmitted(true);
        };

        return (
            <section id="demo" className="py-24 bg-black text-white relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[60rem] bg-brand-accent/10 rounded-full filter blur-3xl opacity-30"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">See It In Action</h2>
                        <p className="text-lg text-gray-400 max-w-3xl mx-auto">For custom pricing and to see the power of Gridiron Intel firsthand, schedule a live, on-site demo with our team. We'll bring the platform to you.</p>
                    </div>

                    <div className="max-w-2xl mx-auto">
                        {submitted ? (
                            <div className="bg-green-500/10 border border-green-500 text-green-300 p-8 rounded-xl text-center animate-[fadeIn_0.5s_ease-in-out]">
                                <ShieldCheck className="w-16 h-16 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-white mb-2">Thank You!</h3>
                                <p className="text-lg">Your demo request has been submitted. A Gridiron Intel representative will contact you within one business day to schedule your on-site presentation.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="bg-gray-900/50 p-8 rounded-xl border border-gray-800 space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="schoolName" className="block text-sm font-medium text-gray-400 mb-2">School Name</label>
                                        <input type="text" id="schoolName" name="schoolName" required placeholder="e.g., Central High School" className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                                    </div>
                                    <div>
                                        <label htmlFor="coachName" className="block text-sm font-medium text-gray-400 mb-2">Coach/Director Name</label>
                                        <input type="text" id="coachName" name="coachName" required placeholder="e.g., Coach Taylor" className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                                    </div>
                                </div>
                                 <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                                    <input type="email" id="email" name="email" required placeholder="coach@school.edu" className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                                </div>
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
                                    <input type="tel" id="phone" name="phone" required placeholder="(555) 123-4567" className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                                </div>
                                <div>
                                    <button type="submit" className="w-full py-4 bg-brand-primary hover:bg-brand-dark rounded-lg font-bold text-lg transition">
                                        Schedule My Demo
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </section>
        );
    };

    const Footer = () => (
        <footer className="bg-gray-900/50 py-12 text-white border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400">
                <p>© 2025 Gridiron Intel. The Future of Football is Here.</p>
                 <p className="text-sm mt-2">Contact: (870) 522-8421 | gridiron-intel2025@protonmail.com</p>
                 <p className="text-sm mt-2"><Link to="/admin/login" className="hover:text-brand-accent">Admin Login</Link></p>
            </div>
        </footer>
    );

    return (
        <div className="bg-black">
            <Nav />
            <main>
                <Hero />
                <Features />
                <Demo />
            </main>
            <Footer />
        </div>
    );
};

export default LandingPage;
