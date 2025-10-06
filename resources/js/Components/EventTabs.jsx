// EventTabs.jsx
import { Link } from "@inertiajs/react";
import dayjs from "dayjs";
import { useState } from "react";

export default function EventTabs({ events }) {
    const today = dayjs();

    // Classify by dates (do not rely on is_done)
    const isRecent = (e) => {
        const start = dayjs(e.event_date);
        const end = e.event_end_date ? dayjs(e.event_end_date) : null;
        return end ? end.isBefore(today, 'day') : start.isBefore(today, 'day');
    };

    const isOngoing = (e) => {
        const start = dayjs(e.event_date);
        const end = e.event_end_date ? dayjs(e.event_end_date) : null;
        // Ongoing if today is the start day
        if (start.isSame(today, 'day')) return true;
        if (end) {
            // Ongoing if today is between start and end inclusive of end day
            return (start.isBefore(today, 'day') || start.isSame(today, 'day')) &&
                   (end.isAfter(today, 'day') || end.isSame(today, 'day'));
        }
        return false;
    };

    const isUpcoming = (e) => {
        const start = dayjs(e.event_date);
        return start.isAfter(today, 'day');
    };

    const upcomingEvents = events.filter(isUpcoming);
    const ongoingEvents = events.filter(isOngoing);
    const recentEvents = events.filter(isRecent);

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
                                className="absolute top-1/2 left-3 -translate-y-1/2 bg-black/40 text-white text-lg p-2 rounded-full hover:bg-black/60"
                            >
                                ‹
                            </button>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    nextImage();
                                }}
                                className="absolute top-1/2 right-3 -translate-y-1/2 bg-black/40 text-white text-lg p-2 rounded-full hover:bg-black/60"
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
            <section className="w-full">
                <h2 className="text-3xl md:text-4xl font-extrabold mb-6 md:mb-10 text-cyan-300 text-center">
                    Upcoming Events
                </h2>
                <div>{renderEvents(upcomingEvents)}</div>
            </section>

            {/* Ongoing Section */}
            <section className="w-full">
                <h2 className="text-3xl md:text-4xl font-extrabold mb-6 md:mb-10 text-cyan-300 text-center">
                    Ongoing Events
                </h2>
                <div>{renderEvents(ongoingEvents)}</div>
            </section>

            {/* Recent Section */}
            <section className="w-full">
                <h2 className="text-3xl md:text-4xl font-extrabold mb-6 md:mb-10 text-cyan-300 text-center">
                    Recent Events
                </h2>
                <div>{renderEvents(recentEvents)}</div>
            </section>
        </div>
    );
}
