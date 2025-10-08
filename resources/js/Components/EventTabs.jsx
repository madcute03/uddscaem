// EventTabs.jsx
import { Link } from "@inertiajs/react";
import dayjs from "dayjs";
import { useState, useEffect } from "react";

const getEventStatus = (event) => {
    // Get current time in local timezone
    const now = new Date();
    
    // If event is marked as done, return DONE
    if (event.is_done) {
        return 'DONE';
    }

    let eventStart, eventEnd;
    
    // Parse event start date
    if (event.event_date) {
        const [datePart, timePart] = event.event_date.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        let hours = 0, minutes = 0;
        
        if (timePart) {
            const [timeStr] = timePart.split('.'); // Remove milliseconds if present
            [hours, minutes] = timeStr.split(':').map(Number);
        }
        
        // Create date in local timezone
        eventStart = new Date(year, month - 1, day, hours, minutes);
    }

    // If no valid start date, consider it as DONE
    if (!eventStart || isNaN(eventStart.getTime())) {
        return 'DONE';
    }

    // If current time is before event start time
    if (now < eventStart) {
        return 'UPCOMING';
    }

    // Parse event end date if it exists
    if (event.event_end_date) {
        const [datePart, timePart] = event.event_end_date.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        let hours = 23, minutes = 59; // Default to end of day if no time specified
        
        if (timePart) {
            const [timeStr] = timePart.split('.'); // Remove milliseconds if present
            [hours, minutes] = timeStr.split(':').map(Number);
        }
        
        // Create date in local timezone
        eventEnd = new Date(year, month - 1, day, hours, minutes);
    }

    // If there's a valid end date and we're past it, mark as DONE
    if (eventEnd && !isNaN(eventEnd.getTime()) && now > eventEnd) {
        return 'DONE';
    }

    // If we're between start and end time, or if there's no end time and we're past start time
    return 'ONGOING';
};

export default function EventTabs({ events }) {
    const [currentTime, setCurrentTime] = useState(new Date());
    
    // Update current time every minute to refresh statuses
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute
        
        return () => clearInterval(interval);
    }, []);
    
    // Categorize events based on status
    const upcomingEvents = events.filter(event => getEventStatus(event) === 'UPCOMING');
    const ongoingEvents = events.filter(event => getEventStatus(event) === 'ONGOING');
    const recentEvents = events.filter(event => {
        const status = getEventStatus(event);
        return status === 'COMPLETED' || status === 'DONE';
    });

    const EventCard = ({ event }) => {
        const [index, setIndex] = useState(0);

        const nextImage = () => {
            if (!event.images) return;
            setIndex((prev) => (prev + 1) % event.images.length);
        };

        const prevImage = () => {
            if (!event.images) return;
            setIndex(
                (prev) => (prev - 1 + event.images.length) % event.images.length
            );
        };

        return (
            <Link
                href={route("events.show", event.id)}
                className="group w-full h-full min-h-[420px] bg-slate-900/60 backdrop-blur border border-slate-800/50 rounded-xl overflow-hidden flex flex-col shadow-lg shadow-blue-950/20 hover:shadow-xl hover:shadow-blue-950/30 transition-all duration-300 hover:border-blue-500/50"
            >
                {/* Cover Image reserved height */}
                <div className="relative w-full h-48 md:h-60 overflow-hidden bg-gray-200">
                    {event.images && event.images.length > 0 ? (
                        <div
                            className="flex w-full h-full transition-transform duration-500 ease-in-out"
                            style={{ transform: `translateX(-${index * 100}%)` }}
                        >
                            {event.images.map((img, i) => (
                                <img
                                    key={i}
                                    src={`/storage/${img.image_path}`}
                                    alt={event.title}
                                    className="w-full h-full object-cover flex-shrink-0 transform transition-transform duration-500 group-hover:scale-105"
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 text-sm">
                            No Image
                        </div>
                    )}

                    {/* Carousel Controls */}
                    {event.images && event.images.length > 1 && (
                        <>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    prevImage();
                                }}
                                className="absolute top-1/2 left-3 -translate-y-1/2 bg-black/40 text-white text-lg p-2 rounded-full hover:bg-black/60 z-10"
                            >
                                ‹
                            </button>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    nextImage();
                                }}
                                className="absolute top-1/2 right-3 -translate-y-1/2 bg-black/40 text-white text-lg p-2 rounded-full hover:bg-black/60 z-10"
                            >
                                ›
                            </button>
                        </>
                    )}
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-slate-100 mb-2 line-clamp-2">{event.title}</h3>
                    <p className="text-slate-300 text-base mb-3 line-clamp-3">{event.description}</p>
                    <p className="text-sm text-slate-400 mt-auto">
                        By <span className="font-semibold text-slate-200">{event.coordinator_name}</span> | {dayjs(event.event_date).format("MMM D, YYYY")}
                    </p>
                </div>
            </Link>
        );
    };

    const renderEvents = (list) => {
        if (list.length === 0)
            return (
                <p className="text-slate-400 text-center">No events available.</p>
            );
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch content-stretch">
                {list.map((event) => (
                    <EventCard key={event.id} event={event} />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-20 md:space-y-24 w-full">
            {/* Upcoming Section */}
            {upcomingEvents.length > 0 && (
                <section className="w-full">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-6 md:mb-10 text-cyan-300 text-center">
                        Upcoming Events
                    </h2>
                    <div>{renderEvents(upcomingEvents)}</div>
                </section>
            )}

            {/* Ongoing Section */}
            {ongoingEvents.length > 0 && (
                <section className="w-full">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-6 md:mb-10 text-cyan-300 text-center">
                        Ongoing Events
                    </h2>
                    <div>{renderEvents(ongoingEvents)}</div>
                </section>
            )}

            {/* Recent Section */}
            {recentEvents.length > 0 && (
                <section className="w-full">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-6 md:mb-10 text-cyan-300 text-center">
                        Recent Events
                    </h2>
                    <div>{renderEvents(recentEvents)}</div>
                </section>
            )}

            {/* Show message if no events at all */}
            {upcomingEvents.length === 0 && ongoingEvents.length === 0 && recentEvents.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-xl text-slate-400">No events available at the moment. Please check back later.</p>
                </div>
            )}
        </div>
    );
}
