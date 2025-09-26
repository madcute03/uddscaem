import { Head, Link, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import PublicLayout from "@/Layouts/PublicLayout";

export default function ShowEvent({ event }) {
    const [showSuccess, setShowSuccess] = useState(false);
    const { flash } = usePage().props;
    const { auth } = usePage().props;

    useEffect(() => {
        if (flash.success) {
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [flash]);
    const today = new Date().toISOString().split("T")[0];

    // States ng event
    const isUpcoming = today < event.event_date && !event.is_done;
    const isOngoing = today >= event.event_date && !event.is_done;
    const isDone = event.is_done === 1 || today > event.event_date;
    const hasBracket = Boolean(event.bracket_type && event.teams);

    const isRegistrationClosed = event.registration_end_date 
        ? today > event.registration_end_date 
        : true; // Consider registration closed if no end date is set

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    // Carousel state
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const totalImages = event.images_path ? event.images_path.length : 0;

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % totalImages);
    };

    // Bracket Modal state
    const [showSoonModal, setShowSoonModal] = useState(false);
    const [showAuthRequiredModal, setShowAuthRequiredModal] = useState(false);

    // Helper to check if target URL is publicly accessible
    const tryOpenPublic = async (url) => {
        try {
            const resp = await fetch(url, { method: 'GET', credentials: 'same-origin', redirect: 'manual' });
            // If server responds with 200 OK, open in new tab
            if (resp.status === 200) {
                window.open(url, '_blank', 'noopener');
                return true;
            }
            // If manual redirect or other status, treat as protected
            return false;
        } catch (e) {
            console.error('Error checking public access for', url, e);
            return false;
        }
    };

    const handleViewBracket = async (e, type = 'bracket') => {
        // If bracket not configured, show coming soon modal
        if (!event.bracket_type || !event.teams) {
            e.preventDefault(); // stop redirect
            setShowSoonModal(true);
            return;
        }

        // If user is authenticated, allow the Inertia Link to proceed
        if (auth && auth.user) {
            return;
        }

        // For guests, prevent Inertia navigation and try to open the public page
        e.preventDefault();
        const url = type === 'bracket'
            ? route('bracket.show', { event: event.id })
            : route('standing.show', { event: event.id });

        const ok = await tryOpenPublic(url);
        if (!ok) {
            // Show modal telling the user this page currently requires login on the server
            setShowAuthRequiredModal(true);
        }
    };

    return (
        <PublicLayout>
            <Head title={event.title} />
            {showSuccess && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300">
                        {flash.success}
                    </div>
                </div>
            )}
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-black text-slate-100 px-2 sm:px-4 md:px-8 max-w-7xl mx-auto w-full py-8">
                {/* Image Carousel */}
                {event.images_path && event.images_path.length > 0 ? (
                    <div className="relative w-full h-screen overflow-hidden">
                        {/* Background Image with blur effect */}
                        <div 
                            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                            style={{
                                backgroundImage: `url('/storage/${event.images_path[currentImageIndex]}')`,
                                filter: 'blur(4px)',
                                transform: 'scale(1.02)'
                            }}
                        />
                        
                        {/* Dark overlay */}
                        <div className="absolute inset-0 bg-black/60" />
                        
                        {/* Content */}
                        <div className="relative z-10 h-full flex flex-col justify-center p-8 sm:p-16 text-center">
                            <div className="max-w-4xl mx-auto space-y-8">
                                <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-8 leading-tight">
                                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-300">
                                        {event.title}
                                    </span>
                                </h1>
                                
                                <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-slate-700">
                                    <p className="text-2xl sm:text-3xl md:text-4xl mb-6 text-slate-100 leading-relaxed font-light">
                                        {event.description}
                                    </p>
                                    <p className="text-xl sm:text-2xl text-slate-300 mb-6">
                                        Organized by <span className="text-blue-300 font-semibold text-2xl">{event.coordinator_name}</span>
                                    </p>
                                    
                                    <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border border-blue-400/30">
                                        <p className="text-2xl sm:text-3xl text-blue-200 font-medium">
                                            Event Date
                                        </p>
                                        <p className="text-xl sm:text-2xl text-white font-bold mt-2">
                                            {formatDate(event.event_date)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3 justify-center py-4">
                                {event.registration_end_date && isUpcoming && (
                                    isRegistrationClosed ? (
                                        <p className="inline-block bg-slate-700 text-slate-200 px-6 py-2 rounded-full font-semibold text-sm sm:text-lg">
                                            Registration Not Available
                                        </p>
                                    ) : (
                                        <Link
                                            href={route("events.register", event.id)}
                                            className="w-[131px] h-[45px] rounded-[15px] cursor-pointer 
                                                           transition duration-300 ease-in-out 
                                                           bg-gradient-to-br from-[#2e8eff] to-[#2e8eff]/0 
                                                           bg-[#2e8eff]/20 flex items-center justify-center 
                                                           hover:bg-[#2e8eff]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)] 
                                                           focus:outline-none focus:bg-[#2e8eff]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]"
                                        >
                                            Register
                                        </Link>
                                    )
                                )}

                                {(hasBracket || isOngoing || isDone) && (
                                    <>
                                        <Link
                                            href={route("bracket.show", {
                                                event: event.id,
                                            })}
                                            onClick={(e) => handleViewBracket(e, 'bracket')}
                                            className="w-[131px] h-[45px] rounded-[15px] cursor-pointer 
                                                           transition duration-300 ease-in-out 
                                                           bg-gradient-to-br from-[#2e8eff] to-[#2e8eff]/0 
                                                           bg-[#2e8eff]/20 flex items-center justify-center 
                                                           hover:bg-[#2e8eff]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)] 
                                                           focus:outline-none focus:bg-[#2e8eff]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]"
                                        >
                                            View Bracket
                                        </Link>

                                        <Link
                                            href={route("standing.show", {
                                                event: event.id,
                                            })}
                                            onClick={(e) => handleViewBracket(e, 'standing')}
                                            className="w-[131px] h-[45px] rounded-[15px] cursor-pointer 
                                                           transition duration-300 ease-in-out 
                                                           bg-gradient-to-br from-[#2e8eff] to-[#2e8eff]/0 
                                                           bg-[#2e8eff]/20 flex items-center justify-center 
                                                           hover:bg-[#2e8eff]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)] 
                                                           focus:outline-none focus:bg-[#2e8eff]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]"
                                        >
                                            View Standing
                                        </Link>
                                    </>
                                )}
                            </div>

                            {/* Image navigation */}
                            {event.images_path.length > 1 && (
                                <div className="mt-8 flex items-center justify-center gap-4">
                                    <button 
                                        onClick={() => setCurrentImageIndex(prev => (prev - 1 + event.images_path.length) % event.images_path.length)}
                                        className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                                        aria-label="Previous image"
                                    >
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    
                                    <div className="flex gap-2">
                                        {event.images_path.map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setCurrentImageIndex(index)}
                                                className={`w-3 h-3 rounded-full transition-colors ${currentImageIndex === index ? 'bg-white' : 'bg-white/50'}`}
                                                aria-label={`Go to image ${index + 1}`}
                                            />
                                        ))}
                                    </div>
                                    
                                    <button 
                                        onClick={() => setCurrentImageIndex(prev => (prev + 1) % event.images_path.length)}
                                        className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                                        aria-label="Next image"
                                    >
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                            
                            <div className="mt-12">
                                <Link
                                    href={route("home")}
                                    className="relative
                                            text-[14px] font-extrabold font-inherit uppercase
                                            text-[#e1e1e1]
                                            cursor-pointer bg-none border-0
                                            transition-colors duration-400 [transition-timing-function:cubic-bezier(0.25,0.8,0.25,1)]
                                            hover:text-white focus:text-white
                                            after:content-[''] after:absolute after:bottom-[-2px] after:left-1/2
                                            after:w-0 after:h-[2px] after:bg-white
                                            after:transition-[width,left] after:duration-400 [after:transition-timing-function:cubic-bezier(0.25,0.8,0.25,1)]
                                            hover:after:w-full hover:after:left-0
                                            focus:after:w-full focus:after:left-0
                                            h-15 px-2 mt-10"
                                >
                                    <span>←</span>
                                    Back to Events
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Fallback if no images
                    <div className="p-8 sm:p-16 text-center min-h-screen flex flex-col justify-center">
                        <div className="max-w-4xl mx-auto space-y-8">
                            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-8 leading-tight">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-300">
                                    {event.title}
                                </span>
                            </h1>
                            
                            <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-slate-700">
                                <p className="text-2xl sm:text-3xl md:text-4xl mb-6 text-slate-100 leading-relaxed font-light">
                                    {event.description}
                                </p>
                                <p className="text-xl sm:text-2xl text-slate-300 mb-6">
                                    Organized by <span className="text-blue-300 font-semibold text-2xl">{event.coordinator_name}</span>
                                </p>
                                
                                <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border border-blue-400/30">
                                    <p className="text-2xl sm:text-3xl text-blue-200 font-medium">
                                        <span className="text-3xl">📅</span> Event Date
                                    </p>
                                    <p className="text-xl sm:text-2xl text-white font-bold mt-2">
                                        {formatDate(event.event_date)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3 mt-4 justify-center">
                            {isUpcoming && !isRegistrationClosed ? (
                                <Link
                                    href={route("events.register", event.id)}
                                    className="inline-block btn-blue-glow"
                                >
                                    Register
                                </Link>
                            ) : isUpcoming && isRegistrationClosed ? (
                                <p className="inline-block bg-slate-700 text-slate-200 px-6 py-2 rounded-full font-semibold text-sm sm:text-lg">
                                    Registration Not Available
                                </p>
                            ) : null}

                            {(hasBracket || isOngoing || isDone) && (
                                <>
                                    <Link
                                        href={route("bracket.show", {
                                            event: event.id,
                                        })}
                                        onClick={handleViewBracket}
                                        className="w-[131px] h-[45px] rounded-[15px] cursor-pointer 
                                                               transition duration-300 ease-in-out 
                                                               bg-gradient-to-br from-[#2e8eff] to-[#2e8eff]/0 
                                                               bg-[#2e8eff]/20 flex items-center justify-center 
                                                               hover:bg-[#2e8eff]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)] 
                                                               focus:outline-none focus:bg-[#2e8eff]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]"
                                    >
                                        View Bracket
                                    </Link>

                                    <Link
                                        href={route("standing.show", {
                                            event: event.id,
                                        })}
                                        onClick={handleViewBracket}
                                        className="w-[131px] h-[45px] rounded-[15px] cursor-pointer 
                                                               transition duration-300 ease-in-out 
                                                               bg-gradient-to-br from-[#2e8eff] to-[#2e8eff]/0 
                                                               bg-[#2e8eff]/20 flex items-center justify-center 
                                                               hover:bg-[#2e8eff]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)] 
                                                               focus:outline-none focus:bg-[#2e8eff]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]"
                                    >
                                        View Standing
                                    </Link>
                                </>
                            )}
                        </div>

                        <div className="mt-12">
                            <Link
                                href={route("home")}
                                className="inline-flex items-center gap-2 text-xl font-semibold text-blue-300 hover:text-blue-200 transition-colors duration-300 group"
                            >
                                <span className="text-2xl group-hover:-translate-x-1 transition-transform duration-300">←</span>
                                Back to Events
                            </Link>
                        </div>
                    </div>
                )}

                {/* Popup Modal kapag wala pang bracket settings */}
                {showSoonModal && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
                        <div className="bg-slate-900/95 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-md mx-4 text-center text-slate-100">
                            <div className="text-6xl mb-4">⏳</div>
                            <h2 className="text-2xl font-bold mb-6 text-blue-300">
                                Coming Soon
                            </h2>
                            <p className="text-lg text-slate-300 mb-6 leading-relaxed">
                                The bracket for{" "}
                                <span className="font-semibold text-white text-xl">
                                    {event.title}
                                </span>{" "}
                                is not yet available. Please check back later!
                            </p>
                            <button
                                onClick={() => setShowSoonModal(false)}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-300 text-lg"
                            >
                                Got it!
                            </button>
                        </div>
                    </div>
                )}

                {/* Modal shown when server requires auth for bracket/standing */}
                {showAuthRequiredModal && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
                        <div className="bg-slate-900/95 border border-slate-700 p-6 rounded-2xl shadow-2xl max-w-md mx-4 text-center text-slate-100">
                            <h2 className="text-2xl font-bold mb-4 text-blue-300">Authentication Required</h2>
                            <p className="text-slate-300 mb-6">
                                Viewing the bracket or standing currently requires signing in. We tried to open the public view but the server redirected to the login page.
                            </p>
                            <p className="text-slate-400 mb-6">If these views should be public, update the server routes to allow guest access (remove auth middleware) or provide a public endpoint.</p>
                            <div className="flex justify-center gap-3">
                                <button
                                    onClick={() => setShowAuthRequiredModal(false)}
                                    className="px-4 py-2 bg-gray-700 rounded text-white"
                                >Close</button>
                                <a
                                    href={route('login')}
                                    className="px-4 py-2 bg-blue-600 rounded text-white"
                                >Login</a>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
