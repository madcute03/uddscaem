import { Head, Link, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import PublicLayout from "@/Layouts/PublicLayout";

export default function ShowEvent({ event }) {
    const [showSuccess, setShowSuccess] = useState(false);
    const [showSoonModal, setShowSoonModal] = useState(false);
    const [showAuthRequiredModal, setShowAuthRequiredModal] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
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
    const isUpcoming = today < event.event_date && !event.is_done;
    const isOngoing = today >= event.event_date && !event.is_done;
    const isDone = event.is_done === 1 || today > event.event_date;
    // Debug log to check the event data
    useEffect(() => {
        console.log('Event data in ShowEvent:', {
            id: event.id,
            title: event.title,
            allow_bracketing: event.allow_bracketing,
            bracket_type: event.bracket_type,
            teams: event.teams,
            is_done: event.is_done,
            event_date: event.event_date,
            today: today
        });
    }, [event]);

    // Show bracket if allow_bracketing is true, regardless of bracket_type and teams
    const hasBracket = Boolean(event.allow_bracketing);
    console.log(`hasBracket calculated as: ${hasBracket} for event ${event.id} (${event.title})`);
    const totalImages = event.images_path ? event.images_path.length : 0;
    const isRegistrationClosed = event.has_registration_end_date
        ? (today > event.registration_end_date)
        : false;

    const parseDateTimeValue = (dateTimeValue) => {
        if (!dateTimeValue) return null;

        const [datePart, rawTimePart = ''] = String(dateTimeValue).split('T');
        if (!datePart) return null;

        const [yearStr, monthStr, dayStr] = datePart.split('-');
        const year = Number(yearStr);
        const month = Number(monthStr ?? 1) - 1;
        const day = Number(dayStr ?? 1);

        let timePart = rawTimePart
            .replace(/Z$/i, '')
            .replace(/\.[0-9]+$/, '')
            .replace(/([+-][0-9:]+)$/, '')
            .trim();

        if (!timePart) {
            return new Date(year, month, day, 0, 0, 0);
        }

        const [hourStr = '0', minuteStr = '0'] = timePart.split(':');
        const hour = Number(hourStr);
        const minute = Number(minuteStr);

        return new Date(year, month, day, hour, minute, 0);
    };

    const formatDate = (dateString, includeTime = false) => {
        if (!dateString) return '';
        
        const date = parseDateTimeValue(dateString);
        if (!date) return '';
        
        if (includeTime) {
            // Format: "Month Day, Year at Hour:Minute AM/PM" (e.g., "March 25, 2024 at 12:00 PM")
            const datePart = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const timePart = date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            return `${datePart} at ${timePart}`;
        } else {
            // Date only format
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    };

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
    }, [event.images_path]);

    const tryOpenPublic = async (url) => {
        try {
            const resp = await fetch(url, { method: 'GET', credentials: 'same-origin', redirect: 'manual' });
            if (resp.status === 200) {
                window.open(url, '_blank', 'noopener');
                return true;
            }
            return false;
        } catch (e) {
            console.error('Error checking public access for', url, e);
            return false;
        }
    };

    const handleViewBracket = async (e, type = 'bracket') => {
        // If bracket not configured, show coming soon modal
        if (!event.bracket_type || !event.teams) {
            e.preventDefault();
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
        <PublicLayout showNavbar={true}>
            <Head title={event.title} />
            
            {/* Event Image Carousel */}
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
                            className="min-w-full max-h-[600px] sm:max-h-[700px] md:max-h-[800px] object-cover object-center"
                        />
                    ))}
                </div>
            </section>
            
            {/* Success Message */}
            {showSuccess && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300">
                        {flash.success}
                    </div>
                </div>
            )}

            {/* Event Details */}
            <div className="max-w-7xl ml-8 px-4 py-8">
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-2 leading-tight">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-300">
                        {event.title}
                    </span>
                </h1>
                
                <div className="mb-8 ml-3 mt-7">
                    <p className="text-l tracking-wider text-blue-300 mb-2">Event Schedule</p>
                    
                        <p className="text-sm text-white">{formatDate(event.event_date, true)} - {formatDate(event.event_end_date)}</p>
                       
                    
                    {event.venue && (
                        <div className="mt-3">
                            <p className="text-l text-slate-300">
                                <span className="text-blue-300">Venue:</span> {event.venue}
                            </p>
                        </div>
                    )}
                </div>

                {/* Event Description */}
                <div>
                    <p className="text-xl sm:text-2xltext-slate-100 leading-relaxed font-light">
                        {event.description}
                    </p>
                    
                    

                    {/* Participants */}
                    {event.event_type === 'competition' && Array.isArray(event.participants) && event.participants.length > 0 && (
                        <div className="mt-6">
                            <p className="text-lg font-semibold text-blue-300 mb-2">Participants</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {event.participants.map((participant, index) => (
                                    <div key={index} className="bg-slate-700/60 text-slate-100 p-3 rounded-lg">
                                        {participant}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-8 flex gap-6">
                        {/* Register Button for Tryouts and Competitions */}
                        {event.has_registration_end_date && (event.event_type === 'tryouts' || event.event_type === 'competition') && (
                            <div>
                                {(!event.registration_end_date || new Date(event.registration_end_date) > new Date()) && isUpcoming ? (
                                    <>
                                        <Link
                                            href={route("events.register", event.id)}
                                            className="w-[141px] h-[45px] rounded-[15px] cursor-pointer 
                                                                   transition duration-300 ease-in-out 
                                                                   bg-gradient-to-br from-[#2e8eff] to-[#2e8eff]/0 
                                                                   bg-[#2e8eff]/20 flex items-center justify-center 
                                                                   hover:bg-[#2e8eff]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)] 
                                                                   focus:outline-none focus:bg-[#2e8eff]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]"
                                        >
                                            Register Now
                                        </Link>
                                        {event.registration_end_date && (
                                            <div className="text-left py-4 text-blue-300 text-sm ">
                                                Registration Until {formatDate(event.registration_end_date, true)}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div
                                        className="w-[160px] h-[45px] rounded-[15px] 
                                                   bg-slate-600/50 border border-slate-600 
                                                   flex items-center justify-center 
                                                   text-slate-400 cursor-not-allowed"
                                    >
                                        Registration Closed
                                    </div>
                                )}
                            </div>
                        )}

                        {/* View Bracket Button */}
                        {hasBracket && (
                            <Link
                                href={route("bracket.show", { event: event.id })}
                                onClick={(e) => handleViewBracket(e, 'bracket')}
                                className="w-[141px] h-[45px] rounded-[15px] cursor-pointer 
                                                               transition duration-300 ease-in-out 
                                                               bg-gradient-to-br from-[#2e8eff] to-[#2e8eff]/0 
                                                               bg-[#2e8eff]/20 flex items-center justify-center 
                                                               hover:bg-[#2e8eff]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)] 
                                                               focus:outline-none focus:bg-[#2e8eff]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]"
                            >
                                View Bracket
                            </Link>
                        )}
                    </div>
                    {event.rulebook_path && (
                        <div className="mt-2">
                            <p className="text-1xl text-blue-300 mb-2">Event Rulebook</p>
                            <div className="text-slate-100">
                                <div className="items-center py-2 gap-2">
                                    <div className="flex items-center space-x-2">
                                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span className="text-sm py-4">Official event rulebook available</span>
                                    </div>
                                    <button
                                        onClick={() => window.open(route("events.rulebook.download", event.id), '_blank', 'noopener,noreferrer')}
                                        className="w-[250px] h-[45px] rounded-[15px] cursor-pointer 
                                                               transition duration-300 ease-in-out 
                                                               bg-gradient-to-br from-[#2e8eff] to-[#2e8eff]/0 
                                                               bg-[#2e8eff]/20 flex items-center justify-center 
                                                               hover:bg-[#2e8eff]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)] 
                                                               focus:outline-none focus:bg-[#2e8eff]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]"
                                    >
                                        View Rulebook
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    <p className="text-1xl tracking-wider text-blue-300 mb-2 py-3">
                        Coordinator <span className="text-white">{event.coordinator_name}</span>
                    </p>
                </div>
            </div>

            {/* Coming Soon Modal */}
            {showSoonModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
                    <div className="bg-slate-900/95 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-md mx-4 text-center text-slate-100">
                        <h2 className="text-2xl font-bold mb-6 text-blue-300">Coming Soon</h2>
                        <p className="text-lg text-slate-300 mb-6 leading-relaxed">
                            The bracket for <span className="font-semibold text-white">{event.title}</span> is not yet available. Please check back later!
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
        </PublicLayout>
    );
}
