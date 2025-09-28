import { Head } from "@inertiajs/react";
import EventTabs from "@/Components/EventTabs";
import PublicLayout from "@/Layouts/PublicLayout";

export default function Welcome({ events = [], news = [] }) {
    const formatDateTime = (dt) => (dt ? new Date(dt).toLocaleString() : "");

    return (
        <PublicLayout>
            <Head title="Welcome" />
            <div className="space-y-10 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto w-full py-8">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-center py-8">
                    <span className="text-semi-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-300">
                        FEATURED PROGRAMS AND EVENTS
                    </span>
                </h1>
                {/* Full wide container */}
                <div>
                    <EventTabs events={events} />
                </div>
            </div>
        </PublicLayout>
    );
}
