import { Head, Link, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import PublicLayout from "@/Layouts/PublicLayout";

export default function ShowEvent({ event }) {
    const [showSuccess, setShowSuccess] = useState(false);
    const { flash } = usePage().props;
    const { auth } = usePage().props;
    
    // Debug log to check event data
    useEffect(() => {
        console.log('Event data:', {
            type: event.event_type,
            registrationEndDate: event.registration_end_date,
            requiredPlayers: event.required_players,
            isUpcoming: new Date(event.event_date) > new Date(),
            isRegistrationClosed: event.has_registration_end_date && (new Date() > new Date(event.registration_end_date))
        });
    }, [event]);

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

    const isRegistrationClosed = event.has_registration_end_date
        ? (today > event.registration_end_date)
        : false; // If no explicit end date, keep registration open

    const formatDate = (dateString, includeTime = false) => {
        if (!dateString) return '';
        
        // Create date object and adjust for Philippine Time (UTC+8)
        const date = new Date(dateString);
        const phTime = new Date(date.getTime() + (8 * 60 * 60 * 1000));
        
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC'  // We've already adjusted the time, so use UTC to prevent double-adjustment
        };
        
        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
            options.hour12 = true;
            return phTime.toLocaleString('en-US', options);
        }
        
        return phTime.toLocaleDateString('en-US', options);
    };

    // Carousel state
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const totalImages = event.images_path ? event.images_path.length : 0;

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % totalImages);
    };

    // Auto-advance images every 4 seconds when there are multiple images
    useEffect(() => {
        if (!event.images_path || event.images_path.length <= 1) return;

        const intervalId = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % event.images_path.length);
        }, 4000);

        return () => clearInterval(intervalId);
        // Re-run if the images array reference changes or its length changes
    }, [event.images_path]);

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
        <PublicLayout showNavbar={false}>

            <Head title={event.title} />
            {/* Top cover image */}
            {event.images_path && event.images_path.length > 0 && (
                <section className="w-full overflow-hidden">
                    <div
                        className="flex transition-transform duration-700 ease-in-out will-change-transform"
                        style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
                    >
                        {event.images_path.map((src, idx) => (
                            <img
                                key={idx}
                                src={src}
                                alt={`${event.title} - ${idx + 1}`}
                                className="min-w-full max-h-[300px] sm:max-h-[500px] md:max-h-[600px] object-cover object-center"
                            />
                        ))}
                    </div>
                </section>
            )}
            {showSuccess && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300">
                        {flash.success}
                    </div>
                </div>
            )}
            {/* Image Carousel */}
            {event.images_path && event.images_path.length > 0 ? (
                <div>
                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-8 leading-tight text-center py-8">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-300">
                                {event.title}
                            </span>
                    </h1>
                    {/* Content */}
                    <div className="relative py-1 ">
                        <div className="max-w-8xl space-y-2">
                                <div className="text-left ml-6 mr-5">
                                    
                                    <p className="text-xl  mb-8 text-slate-100 leading-relaxed font-light">
                                        {event.description}
                                    </p>  
                                </div>
                            </div>

                            <div className="w-full flex justify-center py-4">
                                <div className="w-full max-w-3xl mx-4 bg-slate-900/60 border border-slate-700 rounded-2xl p-6 text-center shadow-lg">
                                    <p className="text-sm uppercase tracking-wider text-blue-300">Event Start</p>
                                    <p className="text-2xl text-white font-bold mt-1">{formatDate(event.event_date)}</p>

                                    {event.event_type === 'competition' && Array.isArray(event.participants) && event.participants.length > 0 && (
                                        <div className="mt-4 text-center">
                                            <p className="text-sm uppercase tracking-wider text-blue-300">Participants</p>
                                            <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {event.participants.map((p, idx) => (
                                                    <li key={idx} className="px-3 py-2 bg-slate-800/60 text-slate-100 rounded">
                                                        {p}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {event.event_type === 'tryouts' && (
                                        <div className="mt-4">
                                            <p className="text-sm uppercase tracking-wider text-blue-300">Registration Period</p>
                                            {event.registration_end_date ? (
                                                <p className="text-lg text-slate-100 mt-1">
                                                    {`Until ${formatDate(event.registration_end_date)}`}
                                                </p>
                                            ) : (
                                                <p className="text-lg text-slate-100 mt-1">
                                                    Open until event starts
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
                                        {event.event_type === 'tryouts' && (
                                            (() => {
                                                const showRegister = 
                                                    isUpcoming && 
                                                    !isRegistrationClosed && 
                                                    event.registration_end_date && 
                                                    (event.required_players === null || event.required_players > 0);
                                                
                                                if (showRegister) {
                                                    return (
                                                        <Link
                                                            href={route("events.register", event.id)}
                                                            className="px-6 py-2 rounded-[12px] cursor-pointer transition duration-300 ease-in-out bg-gradient-to-br from-[#2e8eff] to-[#2e8eff]/0 bg-[#2e8eff]/20 text-white hover:bg-[#2e8eff]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)] focus:outline-none focus:bg-[#2e8eff]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]"
                                                        >
                                                            Register
                                                        </Link>
                                                    );
                                                } else if (isRegistrationClosed || (event.required_players !== null && event.required_players <= 0)) {
                                                    return (
                                                        <span className="inline-block bg-slate-700 text-slate-200 px-6 py-2 rounded-full font-semibold text-sm sm:text-lg">
                                                            Registration Closed
                                                        </span>
                                                    );
                                                }
                                                return null;
                                            })()
                                        )}

                                        {event.event_type !== 'competition' && (hasBracket || isOngoing || isDone) && (
                                            <Link
                                                href={route("bracket.show", { event: event.id })}
                                                onClick={(e) => handleViewBracket(e, 'bracket')}
                                                className="px-6 py-2 rounded-[12px] cursor-pointer transition duration-300 ease-in-out bg-gradient-to-br from-[#2e8eff] to-[#2e8eff]/0 bg-[#2e8eff]/20 text-white hover:bg-[#2e8eff]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)] focus:outline-none focus:bg-[#2e8eff]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]"
                                            >
                                                View Bracket
                                            </Link>
                                        )}
                                    </div>
                                </div>
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
                            {event.event_type === 'tryouts' && isUpcoming && !isRegistrationClosed ? (
                                <Link
                                    href={route("events.register", event.id)}
                                    className="inline-block btn-blue-glow"
                                >
                                    Register
                                </Link>
                            ) : event.event_type === 'tryouts' && isUpcoming && isRegistrationClosed ? (
                                <p className="inline-block bg-slate-700 text-slate-200 px-6 py-2 rounded-full font-semibold text-sm sm:text-lg">
                                    Registration Closed
                                </p>
                            ) : null}

                            {isOngoing && (
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
        </PublicLayout>
    );
}
