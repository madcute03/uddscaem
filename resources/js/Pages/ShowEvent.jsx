import { Head, Link, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import PublicLayout from "@/Layouts/PublicLayout";

export default function ShowEvent({ event }) {
    // ==================== STATE MANAGEMENT ====================
    const [showSoonModal, setShowSoonModal] = useState(false);
    const [showAuthRequiredModal, setShowAuthRequiredModal] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const { auth } = usePage().props;

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
            ? route('bracket.show', { event: event.id })
            : route('standing.show', { event: event.id });

        const ok = await tryOpenPublic(url);
        if (!ok) {
            setShowAuthRequiredModal(true);
        }
    };

    const handleDownloadRulebook = () => {
        window.open(route("events.rulebook.download", event.id), '_blank', 'noopener,noreferrer');
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
            <div className="max-w-7xl ml-8 px-4 py-8">
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

                {/* Participants List (Competition only) */}
                {event.event_type === 'competition' && event.participants?.length > 0 && (
                    <ParticipantsList participants={event.participants} />
                )}

                {/* Action Buttons */}
                <ActionButtons
                    event={event}
                    isRegistrationOpen={isRegistrationOpen}
                    isUpcoming={isUpcoming}
                    hasBracket={hasBracket}
                    formatDate={formatDate}
                    handleViewBracket={handleViewBracket}
                />

                {/* Rulebook Section */}
                {event.rulebook_path && (
                    <RulebookSection onDownload={handleDownloadRulebook} />
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
        <div className="mb-8 ml-3 mt-7">
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
            <p className="text-xl sm:text-2xl text-slate-100 leading-relaxed font-light">
                {description}
            </p>
        </div>
    );
}

function ParticipantsList({ participants }) {
    return (
        <div className="mt-6 mb-6">
            <p className="text-lg font-semibold text-blue-300 mb-2">Participants</p>
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

function ActionButtons({ event, isRegistrationOpen, isUpcoming, hasBracket, formatDate, handleViewBracket }) {
    const showRegistration = event.has_registration_end_date && 
                            (event.event_type === 'tryouts' || event.event_type === 'competition');
    
    if (!showRegistration && !hasBracket) return null;

    return (
        <div className="flex flex-wrap items-center gap-4 mt-6 mb-6">
            {/* Register Button */}
            {showRegistration && (
                <div>
                    {isRegistrationOpen ? (
                        <>
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
                                <p className="text-blue-300 text-sm mt-2">
                                    Registration Until {formatDate(event.registration_end_date, true)}
                                </p>
                            )}
                        </>
                    ) : (
                        <div className="inline-block px-8 py-3 rounded-2xl 
                                      bg-slate-600/50 border border-slate-600 
                                      text-slate-400 cursor-not-allowed">
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
                    className="inline-block px-8 py-3 rounded-2xl cursor-pointer 
                             transition duration-300 ease-in-out 
                             bg-gradient-to-br from-[#2e8eff] to-[#2e8eff]/0 
                             bg-[#2e8eff]/20 
                             hover:bg-[#2e8eff]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)] 
                             focus:outline-none focus:bg-[#2e8eff]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]
                             text-white font-medium"
                >
                    View Bracket
                </Link>
            )}
        </div>
    );
}

function RulebookSection({ onDownload }) {
    return (
        <div className="max-w-3xl mt-6 mb-6 p-6 bg-slate-600/20 border border-slate-600 rounded-xl">
            <p className="text-xl text-blue-300 mb-4">Event Rulebook</p>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm text-slate-100">Official event rulebook available</span>
                </div>
                <button
                    onClick={onDownload}
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
        <p className="text-lg tracking-wider text-blue-300 mb-2 py-3">
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
