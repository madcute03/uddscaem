import { Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';

export default function Welcome() {
    const developers = [
        { name: 'Cheszerae M. Bravo', role: 'Developer', image: '/images/rae.jpeg' },
        { name: 'Jian Nuel S. Claveria', role: 'Developer', image: '/images/jian.jpeg' },
        { name: 'Jerilyn Manuel', role: 'Project Manager', image: '/images/jerilyn.jpeg' },
        { name: 'Adrian Fonacier', role: 'System Tester', image: '/images/adrian.jpeg' },
    ];

    return (
        <PublicLayout title="Welcome">
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-black text-slate-100">
                {/* Section 1: Hero Section with Background Logo */}
                <section 
                    className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8"
                    style={{
                        backgroundImage: "url('/images/logo.png')",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                        backgroundSize: "cover",
                        backgroundBlendMode: "overlay",
                    }}
                >
                    {/* Overlay for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-blue-950/85 to-black/90"></div>
                    
                    <div className="max-w-7xl mx-auto w-full relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            {/* Title */}
                            <div className="text-center lg:text-left">
                                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6">
                                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-300">
                                        UdD Eventure
                                    </span>
                                </h1>
                                <p className="text-xl sm:text-2xl text-slate-300 mb-8">
                                    Universidad de Dagupan Sports, Culture and Arts Event Management System
                                </p>
                            </div>

                            {/* Logo */}
                            <div className="flex justify-center lg:justify-end">
                                <div className="w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 rounded-full flex items-center justify-center backdrop-blur-sm border border-blue-500/30 shadow-2xl overflow-hidden bg-white/10">
                                    <img 
                                        src="/images/udd.jpg" 
                                        alt="UdD Logo" 
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 2: Description */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-8">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                                About the System
                            </span>
                        </h2>
                        <p className="text-lg sm:text-xl text-slate-300 leading-relaxed">
                            UdD Eventure is a comprehensive event management system designed specifically for the Sports and Cultural Affairs office. 
                            Our platform streamlines the entire event lifecycle - from planning and registration to execution and reporting. 
                            With features like automated bracketing, real-time registration tracking, and athlete management, we make organizing 
                            sports competitions, cultural events, and intramurals effortless. Whether you're managing tryouts, tournaments, or 
                            cultural showcases, UdD Eventure provides the tools you need to create memorable experiences for your community.
                        </p>
                    </div>
                </section>

                {/* Section 3: Developers */}
                <section className="py-20 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-center">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                                Meet the Team
                            </span>
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {developers.map((dev, index) => (
                                <div
                                    key={index}
                                    className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 text-center hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 transform hover:-translate-y-2"
                                >
                                    <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-blue-500/50">
                                        <img
                                            src={dev.image}
                                            alt={dev.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.parentElement.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center"><span class="text-3xl font-bold text-white">${dev.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span></div>`;
                                            }}
                                        />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-2">{dev.name}</h3>
                                    <p className="text-base text-blue-400">{dev.role}</p>
                                </div>
                            ))}
                        </div>
                        <div className="text-center justify-center font-bold text-4xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 py-8">
                            CTRL+ALT+ELITE
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
                    <div className="max-w-6xl mx-auto text-center text-slate-400">
                        <p>&copy; {new Date().getFullYear()} UdD Eventure. All rights reserved.</p>
                    </div>
                </footer>
            </div>
        </PublicLayout>
    );
}
