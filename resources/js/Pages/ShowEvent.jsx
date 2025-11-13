import { Head, Link, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import PublicLayout from "@/Layouts/PublicLayout";

export default function ShowEvent({ event, tournament = null }) {
    // ==================== STATE MANAGEMENT ====================
    const [showSoonModal, setShowSoonModal] = useState(false);
    const [showAuthRequiredModal, setShowAuthRequiredModal] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const { auth } = usePage().props;
    const isAdmin = auth?.user?.role === 'admin';

    // ==================== COMPUTED VALUES ====================
    const today = new Date().toISOString().split("T")[0];
    const isUpcoming = today < event.event_date && !event.is_done;
    const isOngoing = today >= event.event_date && !event.is_done;
    const isDone = event.is_done === 1 || today > event.event_date;
    const hasBracket = Boolean(event.allow_bracketing);
    const totalImages = event.images_path?.length || 0;
    const isRegistrationOpen = event.has_registration_end_date && 
                               (!event.registration_end_date || new Date(event.registration_end_date) > new Date()) && 
                               isUpcoming;
    const isRegistrationClosed = event.has_registration_end_date && 
                                (today > event.registration_end_date);

    // ==================== UTILITY FUNCTIONS ====================
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
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    };

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

    // ==================== EVENT HANDLERS ====================
    const handleViewBracket = async (e, type = 'bracket') => {
        // If bracket not configured, show coming soon modal
        if (!event.bracket_type || !event.teams) {
            e.preventDefault();
            setShowSoonModal(true);
            return;
        }

        // If user is authenticated, allow the Inertia Link to proceed
        if (auth?.user) {
            return;
        }

        // For guests, prevent Inertia navigation and try to open the public page
        e.preventDefault();
        const url = type === 'bracket'
            ? route('events.publicViewBracket', { event: event.id })
            : route('standing.show', { event: event.id });

        const ok = await tryOpenPublic(url);
        if (!ok) {
            setShowAuthRequiredModal(true);
        }
    };

    const handleViewRulebook = () => {
        window.open(route("events.rulebook.view", event.id), '_blank', 'noopener,noreferrer');
    };

    // ==================== EFFECTS ====================
    // Auto-advance carousel images
    useEffect(() => {
        if (!event.images_path || event.images_path.length <= 1) return;

        const intervalId = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % event.images_path.length);
        }, 4000);

        return () => clearInterval(intervalId);
    }, [event.images_path]);

    // ==================== RENDER ====================
    return (
        <PublicLayout showNavbar={true}>
            <Head title={event.title} />
            
            {/* Image Carousel */}
            <ImageCarousel 
                images={event.images_path} 
                currentIndex={currentImageIndex}
                eventTitle={event.title}
            />

            {/* Event Details Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Event Title */}
                <EventTitle title={event.title} />

                {/* Event Schedule & Venue */}
                <EventSchedule 
                    eventDate={event.event_date}
                    eventEndDate={event.event_end_date}
                    venue={event.venue}
                    formatDate={formatDate}
                />

                {/* Event Description */}
                <EventDescription description={event.description} />

                {/* Action Buttons */}
                <ActionButtons
                    event={event}
                    tournament={tournament}
                    isRegistrationOpen={isRegistrationOpen}
                    isUpcoming={isUpcoming}
                    hasBracket={hasBracket}
                    formatDate={formatDate}
                    handleViewBracket={handleViewBracket}
                />

                {/* Rulebook Section */}
                {event.rulebook_path && (
                    <RulebookSection onView={handleViewRulebook} />
                )}

                {/* Participants List (Competition only) */}
                {event.event_type === 'competition' && event.participants?.length > 0 && (
                    <ParticipantsList participants={event.participants} />
                )}

                {/* Coordinator Info */}
                <CoordinatorInfo name={event.coordinator_name} />
            </div>

            {/* Modals */}
            <ComingSoonModal 
                isOpen={showSoonModal}
                onClose={() => setShowSoonModal(false)}
                eventTitle={event.title}
            />

            <AuthRequiredModal
                isOpen={showAuthRequiredModal}
                onClose={() => setShowAuthRequiredModal(false)}
            />
        </PublicLayout>
    );
}

// ==================== COMPONENT SECTIONS ====================

function ImageCarousel({ images, currentIndex, eventTitle }) {
    if (!images || images.length === 0) return null;

    return (
        <section className="w-full overflow-hidden">
            <div
                className="flex transition-transform duration-700 ease-in-out will-change-transform"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {images.map((src, idx) => (
                    <img
                        key={idx}
                        src={src}
                        alt={`${eventTitle} - ${idx + 1}`}
                        className="min-w-full max-h-[600px] sm:max-h-[700px] md:max-h-[800px] object-cover object-center"
                    />
                ))}
            </div>
        </section>
    );
}

function EventTitle({ title }) {
    return (
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-2 leading-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-300">
                {title}
            </span>
        </h1>
    );
}

function EventSchedule({ eventDate, eventEndDate, venue, formatDate }) {
    return (
        <div className="mb-8 mt-7">
            <p className="text-lg tracking-wider text-blue-300 mb-2">Event Schedule</p>
            <p className="text-sm text-white">
                {formatDate(eventDate, true)} - {formatDate(eventEndDate)}
            </p>
            
            {venue && (
                <div className="mt-3">
                    <p className="text-lg text-slate-300">
                        <span className="text-blue-300">Venue:</span> {venue}
                    </p>
                </div>
            )}
        </div>
    );
}

function EventDescription({ description }) {
    return (
        <div className="mb-6">
            <p className="text-xl sm:text-2xl text-slate-100 leading-relaxed font-light text-center">
                {description}
            </p>
        </div>
    );
}

function ParticipantsList({ participants }) {
    return (
        <div className="mt-6 mb-6 p-6 bg-slate-600/20 border border-slate-600 rounded-xl max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-4 justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-xl font-semibold text-blue-300">Participants</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {participants.map((participant, index) => (
                    <div key={index} className="bg-slate-700/60 text-slate-100 p-3 rounded-lg">
                        {participant}
                    </div>
                ))}
            </div>
        </div>
    );
}

function ActionButtons({ event, tournament, isRegistrationOpen, isUpcoming, hasBracket, formatDate, handleViewBracket }) {
    const { auth } = usePage().props;
    const isAdmin = auth?.user?.role === 'admin';
    const showRegistration = event.has_registration_end_date && 
                            (event.event_type === 'tryouts' || event.event_type === 'competition');
    
    if (!showRegistration && !hasBracket) return null;

    return (
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 mb-3 justify-center">
            {/* Register Button */}
            {showRegistration && (
                <div className="p-6 bg-slate-600/20 border border-slate-600 rounded-xl w-full sm:w-80 h-60">
                    {isRegistrationOpen ? (
                        <div className="flex flex-col items-center justify-between h-full">
                            <div className="flex items-center gap-2">
                                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                                <span className="text-lg font-semibold text-blue-300">Registration</span>
                            </div>
                            <Link
                                href={route("events.register", event.id)}
                                className="inline-block px-8 py-3 rounded-2xl cursor-pointer 
                                         transition duration-300 ease-in-out 
                                         bg-gradient-to-br from-[#2e8eff] to-[#2e8eff]/0 
                                         bg-[#2e8eff]/20 
                                         hover:bg-[#2e8eff]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)] 
                                         focus:outline-none focus:bg-[#2e8eff]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]
                                         text-white font-medium"
                            >
                                Register Now
                            </Link>
                            {event.registration_end_date && (
                                <p className="text-blue-300 text-sm text-center">
                                    Registration Until {formatDate(event.registration_end_date, true)}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-between h-full">
                            <div className="flex items-center gap-2">
                                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                                <span className="text-lg font-semibold text-blue-300">Registration</span>
                            </div>
                            <div className="inline-block px-8 py-3 rounded-2xl 
                                          bg-slate-600/50 border border-slate-600 
                                          text-slate-400 cursor-not-allowed">
                                Registration Closed
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tournament Bracket Section */}
            {hasBracket && (
                <div className="p-6 bg-slate-600/20 border border-slate-600 rounded-xl w-full sm:w-80 h-60">
                    <div className="flex flex-col justify-between h-full">
                        <div className="flex items-center gap-2 justify-center">
                            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                            <span className="text-lg font-semibold text-blue-300">Tournament Bracket</span>
                        </div>

                        {/* Tournament Status */}
                        {tournament && (
                            <div className="bg-slate-700/30 rounded-lg p-3">
                                <p className="text-sm text-gray-300">
                                    <span className="capitalize">{tournament.bracket_type} Elimination</span>
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Status: <span className="capitalize text-green-400">{tournament.status}</span>
                                </p>
                            </div>
                        )}

                        <div className="flex justify-center">
                            {/* View Dynamic Bracket Button (Everyone) */}
                            {tournament && (
                                <Link
                                    href={route("events.publicViewBracket", { event: event.id })}
                                    className="inline-flex items-center px-6 py-3 rounded-2xl cursor-pointer 
                                             transition duration-300 ease-in-out 
                                             bg-gradient-to-br from-[#2e8eff] to-[#2e8eff]/0 
                                             bg-[#2e8eff]/20 
                                             hover:bg-[#2e8eff]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)] 
                                             focus:outline-none focus:bg-[#2e8eff]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]
                                             text-white font-medium"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    View Dynamic Bracket
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function RulebookSection({ onView }) {
    return (
        <div className="max-w-3xl mt-3 mb-8 p-6 bg-slate-600/20 border border-slate-600 rounded-xl mx-auto">
            <p className="text-xl text-blue-300 mb-4">Event Rulebook</p>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm text-slate-100">Official event rulebook available</span>
                </div>
                <button
                    onClick={onView}
                    className="px-6 py-2 rounded-xl cursor-pointer 
                             transition duration-300 ease-in-out 
                             bg-gradient-to-br from-[#2e8eff] to-[#2e8eff]/0 
                             bg-[#2e8eff]/20 
                             hover:bg-[#2e8eff]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)] 
                             focus:outline-none focus:bg-[#2e8eff]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]
                             text-white font-medium"
                >
                    View Rulebook
                </button>
            </div>
        </div>
    );
}

function CoordinatorInfo({ name }) {
    if (!name) return null;

    return (
        <p className="mt-8 text-lg tracking-wider text-blue-300 mb-2 py-3">
            Coordinator <span className="text-white font-medium">{name}</span>
        </p>
    );
}

function ComingSoonModal({ isOpen, onClose, eventTitle }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
            <div className="bg-slate-900/95 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-md mx-4 text-center text-slate-100">
                <h2 className="text-2xl font-bold mb-6 text-blue-300">Coming Soon</h2>
                <p className="text-lg text-slate-300 mb-6 leading-relaxed">
                    The bracket for <span className="font-semibold text-white">{eventTitle}</span> is not yet available. Please check back later!
                </p>
                <button
                    onClick={onClose}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-300 text-lg"
                >
                    Got it!
                </button>
            </div>
        </div>
    );
}

function AuthRequiredModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
            <div className="bg-slate-900/95 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-md mx-4 text-center text-slate-100">
                <h2 className="text-2xl font-bold mb-6 text-blue-300">Authentication Required</h2>
                <p className="text-lg text-slate-300 mb-6 leading-relaxed">
                    You need to be logged in to view this content.
                </p>
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors duration-300"
                    >
                        Cancel
                    </button>
                    <Link
                        href={route('login')}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-300"
                    >
                        Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
