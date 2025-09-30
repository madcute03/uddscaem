import { Head } from "@inertiajs/react";
import EventTabs from "@/Components/EventTabs";
import AppLayout from "@/Layouts/AppLayout";

export default function Welcome({ events = [] }) {
    return (
        <AppLayout title="Welcome">
            <div className="space-y-10 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto w-full py-8">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-center py-8">
                    <span className="text-semi-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-300">
                        FEATURED PROGRAMS AND EVENTS
                    </span>
                </h1>
                <div>
                    <EventTabs events={events} />
                </div>
            </div>
        </AppLayout>
    );
}
