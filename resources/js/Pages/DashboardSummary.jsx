import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { 
    CalendarDaysIcon, 
    ClockIcon,
    MagnifyingGlassIcon,
    ExclamationTriangleIcon,
    TrashIcon,
    PlusIcon,
    NewspaperIcon,
    ClipboardDocumentListIcon,
    CheckCircleIcon,
    ClockIcon as ClockIconAlt,
    UserGroupIcon
} from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';

// Error Boundary Component
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Dashboard Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-200">
                    <div className="flex items-center">
                        <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                        <span>Something went wrong. Please try again later.</span>
                    </div>
                    {process.env.NODE_ENV === 'development' && (
                        <details className="mt-2 text-sm text-red-300">
                            <summary>Error details</summary>
                            <pre className="whitespace-pre-wrap mt-1">
                                {this.state.error?.toString()}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

ErrorBoundary.propTypes = {
    children: PropTypes.node.isRequired
};

const ITEMS_PER_PAGE = 5;

export default function DashboardSummary({ auth, stats = {}, recentEvents = [], recentNews = [], recentBorrowRequests = [], loading = false }) {
    const handleDeleteEvent = (eventId) => {
        if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
            router.delete(route('events.destroy', eventId), {
                preserveScroll: true,
                onSuccess: () => {
                    // The page will automatically refresh with the updated events list
                },
                onError: (errors) => {
                    console.error('Error deleting event:', errors);
                    alert('Failed to delete event. Please try again.');
                }
            });
        }
    };
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState('events');
    const [newsSearchTerm, setNewsSearchTerm] = useState('');
    const [newsCurrentPage, setNewsCurrentPage] = useState(1);
    const [borrowSearchTerm, setBorrowSearchTerm] = useState('');
    const [borrowCurrentPage, setBorrowCurrentPage] = useState(1);
    const [purposeModal, setPurposeModal] = useState({ open: false, title: '', content: '' });

    const openPurposeModal = (title, content) => {
        setPurposeModal({ open: true, title, content });
    };

    const closePurposeModal = () => {
        setPurposeModal({ open: false, title: '', content: '' });
    };
    const [registrationCounts, setRegistrationCounts] = useState({});
    const [notifications, setNotifications] = useState({});
    const [dismissedNotifications, setDismissedNotifications] = useState(() => {
        // Load dismissed notifications from localStorage on initialization
        try {
            const saved = localStorage.getItem('dismissedNotifications');
            return saved ? new Set(JSON.parse(saved)) : new Set();
        } catch (error) {
            console.error('Error loading dismissed notifications from localStorage:', error);
            return new Set();
        }
    });
    const [acknowledgedCounts, setAcknowledgedCounts] = useState(() => {
        // Load acknowledged counts from localStorage
        try {
            const saved = localStorage.getItem('acknowledgedCounts');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Error loading acknowledged counts from localStorage:', error);
            return {};
        }
    });

    // Save acknowledged counts to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem('acknowledgedCounts', JSON.stringify(acknowledgedCounts));
        } catch (error) {
            console.error('Error saving acknowledged counts to localStorage:', error);
        }
    }, [acknowledgedCounts]);

    // Keyboard shortcut to clear all dismissed notifications (Ctrl+Shift+R)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                if (confirm('Clear all dismissed notification history?')) {
                    clearAllDismissedNotifications();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Fetch registration counts for all events
    useEffect(() => {
        const fetchRegistrationCounts = async () => {
            console.log('Fetching registration counts for events:', recentEvents.map(e => ({ id: e.id, name: e.name })));
            const counts = {};

            for (const event of recentEvents) {
                try {
                    // Use axios to fetch registration count for this event
                    const url = `/events/${event.id}/registrations/count`;
                    console.log(`Fetching count for event ${event.id} from:`, url);
                    const response = await axios.get(url, {
                        withCredentials: true,
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    });
                    console.log(`Response for event ${event.id}:`, response.data);
                    const newCount = response.data.count || 0;
                    counts[event.id] = newCount;
                    console.log(`Set count for event ${event.id} to:`, newCount);

                    // Check if count increased from acknowledged count (what user has seen)
                    const acknowledgedCount = acknowledgedCounts[event.id] || 0;
                    if (newCount > acknowledgedCount) {
                        // Check if this increase was already dismissed
                        const increaseKey = `${event.id}-${newCount}`;
                        if (!dismissedNotifications.has(increaseKey)) {
                            addNotification(event.id, newCount - acknowledgedCount);
                        }
                    }
                } catch (error) {
                    console.error(`Failed to fetch registration count for event ${event.id}:`, error);
                    console.error('Error details:', {
                        message: error.message,
                        status: error.response?.status,
                        statusText: error.response?.statusText,
                        data: error.response?.data,
                        url: url
                    });
                    counts[event.id] = 0;
                }
            }

            console.log('Final registration counts:', counts);
            setRegistrationCounts(counts);
        };

        if (recentEvents.length > 0) {
            fetchRegistrationCounts();

            // Set up polling every 30 seconds to check for new registrations
            const interval = setInterval(fetchRegistrationCounts, 30000);

            return () => clearInterval(interval);
        }
    }, [recentEvents, dismissedNotifications, acknowledgedCounts]);

    // Add notification for new registrations
    const addNotification = (eventId, increase) => {
        const notificationId = `${eventId}-${Date.now()}`;
        setNotifications(prev => ({
            ...prev,
            [notificationId]: {
                id: notificationId,
                eventId,
                increase,
                timestamp: Date.now()
            }
        }));

        // No auto-cleanup - notifications stay until clicked
    };

    // Remove notification when clicked and mark the increase as seen
    const removeNotification = (notificationId) => {
        setNotifications(prev => {
            const updated = { ...prev };
            const notification = updated[notificationId];

            if (notification) {
                // Update acknowledged count to current registration count
                setAcknowledgedCounts(prevCounts => ({
                    ...prevCounts,
                    [notification.eventId]: registrationCounts[notification.eventId] || 0
                }));

                // Mark this specific increase as dismissed (for safety)
                const increaseKey = `${notification.eventId}-${registrationCounts[notification.eventId]}`;
                setDismissedNotifications(prevSet => new Set([...prevSet, increaseKey]));
            }

            delete updated[notificationId];
            return updated;
        });
    };

    // Clear all dismissed notifications (reset state)
    const clearAllDismissedNotifications = () => {
        setDismissedNotifications(new Set());
        setAcknowledgedCounts({});
        localStorage.removeItem('dismissedNotifications');
        localStorage.removeItem('acknowledgedCounts');
    };

    // Memoize filtered and paginated events
    const { ongoingEvents, upcomingEvents, completedEvents, filteredOngoing, filteredUpcoming, filteredCompleted } = useMemo(() => {
        const now = new Date();
        
        const processEvents = (event) => {
            if (!event?.date) return null;
            
            // Parse start date
            const startDate = new Date(event.date);
            if (isNaN(startDate.getTime())) return null;

            // Parse end date (default to end of start date if not provided)
            let endDate = startDate;
            if (event.end_date) {
                endDate = new Date(event.end_date);
                // If no time is specified in end date, set to end of day
                if (event.end_date.split('T').length === 1) {
                    endDate.setHours(23, 59, 59, 999);
                }
            } else {
                // If no end date, set to end of start date
                endDate = new Date(startDate);
                endDate.setHours(23, 59, 59, 999);
            }
            
            // Determine event status
            let status, isOngoing, isUpcoming, isCompleted;
            
            if (now < startDate) {
                status = 'Upcoming';
                isUpcoming = true;
                isOngoing = false;
                isCompleted = false;
            } else if (now > endDate) {
                status = 'Done';
                isCompleted = true;
                isOngoing = false;
                isUpcoming = false;
            } else {
                status = 'Ongoing';
                isOngoing = true;
                isUpcoming = false;
                isCompleted = false;
            }
            
            return {
                ...event,
                isOngoing,
                isUpcoming,
                isCompleted,
                status,
                originalStatus: event.status // Keep original status for reference
            };
        };
        
        const processedEvents = Array.isArray(recentEvents) 
            ? recentEvents.map(processEvents).filter(Boolean)
            : [];
            
        const ongoing = processedEvents.filter(event => event.isOngoing);
        const upcoming = processedEvents.filter(event => event.isUpcoming);
        const completed = processedEvents.filter(event => event.isCompleted);

        const filterEvents = (events) => {
            if (!searchTerm.trim()) return events;
            const term = searchTerm.toLowerCase();
            return events.filter(event => 
                (event?.name?.toLowerCase().includes(term) ||
                event?.status?.toLowerCase().includes(term) ||
                event?.venue?.toLowerCase().includes(term))
            );
        };

        return {
            ongoingEvents: ongoing,
            upcomingEvents: upcoming,
            completedEvents: completed,
            filteredOngoing: filterEvents(ongoing),
            filteredUpcoming: filterEvents(upcoming),
            filteredCompleted: filterEvents(completed)
        };
    }, [recentEvents, searchTerm]);

    // Memoize filtered and paginated news
    const { filteredNews } = useMemo(() => {
        const filterNews = (news) => {
            if (!newsSearchTerm.trim()) return news;
            const term = newsSearchTerm.toLowerCase();
            return news.filter(article =>
                (article?.title?.toLowerCase().includes(term) ||
                article?.category?.toLowerCase().includes(term) ||
                article?.status?.toLowerCase().includes(term) ||
                article?.writer_name?.toLowerCase().includes(term))
            );
        };

        const processedNews = Array.isArray(recentNews)
            ? recentNews.filter(Boolean)
            : [];

        return {
            filteredNews: filterNews(processedNews)
        };
    }, [recentNews, newsSearchTerm]);

    // Memoize filtered and paginated borrow requests
    const { filteredBorrowRequests } = useMemo(() => {
        const filterBorrowRequests = (requests) => {
            if (!borrowSearchTerm.trim()) return requests;
            const term = borrowSearchTerm.toLowerCase();
            return requests.filter(request =>
                (request?.student_name?.toLowerCase().includes(term) ||
                request?.student_id?.toLowerCase().includes(term) ||
                request?.item_name?.toLowerCase().includes(term) ||
                request?.status?.toLowerCase().includes(term) ||
                request?.purpose?.toLowerCase().includes(term))
            );
        };

        const processedBorrowRequests = Array.isArray(recentBorrowRequests)
            ? recentBorrowRequests.filter(Boolean)
            : [];

        return {
            filteredBorrowRequests: filterBorrowRequests(processedBorrowRequests)
        };
    }, [recentBorrowRequests, borrowSearchTerm]);

    // Organized stats data with logical groupings
    const statsSections = [
        {
            title: 'Events',
            icon: CalendarDaysIcon,
            color: 'blue',
            stats: [
                { 
                    name: 'Total Events', 
                    value: loading ? '...' : (stats?.total_events || 0), 
                    icon: CalendarDaysIcon,
                    bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
                    textColor: 'text-blue-100',
                    borderColor: 'border-blue-500/20',
                    loading: loading,
                    highlight: (stats?.total_events || 0) > 0
                },
                { 
                    name: 'Ongoing', 
                    value: loading ? '...' : (stats?.ongoing_events || 0), 
                    icon: ClockIcon,
                    bgColor: 'bg-gradient-to-br from-amber-500 to-amber-600',
                    textColor: 'text-amber-100',
                    borderColor: 'border-amber-500/20',
                    loading: loading,
                    highlight: (stats?.ongoing_events || 0) > 0
                },
                { 
                    name: 'Upcoming', 
                    value: loading ? '...' : (stats?.upcoming_events || 0), 
                    icon: CalendarDaysIcon,
                    bgColor: 'bg-gradient-to-br from-violet-500 to-violet-600',
                    textColor: 'text-violet-100',
                    borderColor: 'border-violet-500/20',
                    loading: loading,
                    highlight: (stats?.upcoming_events || 0) > 0
                }
            ]
        },
        {
            title: 'News',
            icon: NewspaperIcon,
            color: 'green',
            stats: [
                { 
                    name: 'Total News', 
                    value: loading ? '...' : (stats?.total_news || 0), 
                    icon: NewspaperIcon,
                    bgColor: 'bg-gradient-to-br from-green-500 to-green-600',
                    textColor: 'text-green-100',
                    borderColor: 'border-green-500/20',
                    loading: loading,
                    highlight: (stats?.total_news || 0) > 0
                },
                { 
                    name: 'Active News', 
                    value: loading ? '...' : (stats?.active_news || 0), 
                    icon: CheckCircleIcon,
                    bgColor: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
                    textColor: 'text-emerald-100',
                    borderColor: 'border-emerald-500/20',
                    loading: loading,
                    highlight: (stats?.active_news || 0) > 0
                },
                { 
                    name: 'Pending News', 
                    value: loading ? '...' : (stats?.pending_news || 0), 
                    icon: ClockIconAlt,
                    bgColor: 'bg-gradient-to-br from-orange-500 to-orange-600',
                    textColor: 'text-orange-100',
                    borderColor: 'border-orange-500/20',
                    loading: loading,
                    highlight: (stats?.pending_news || 0) > 0
                }
            ]
        },
        {
            title: 'Borrow System',
            icon: ClipboardDocumentListIcon,
            color: 'indigo',
            stats: [
                { 
                    name: 'Borrow Requests', 
                    value: loading ? '...' : (stats?.total_borrow_requests || 0), 
                    icon: ClipboardDocumentListIcon,
                    bgColor: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
                    textColor: 'text-indigo-100',
                    borderColor: 'border-indigo-500/20',
                    loading: loading,
                    highlight: (stats?.total_borrow_requests || 0) > 0
                },
                { 
                    name: 'Pending Borrowals', 
                    value: loading ? '...' : (stats?.pending_borrow_requests || 0), 
                    icon: ClockIconAlt,
                    bgColor: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
                    textColor: 'text-yellow-100',
                    borderColor: 'border-yellow-500/20',
                    loading: loading,
                    highlight: (stats?.pending_borrow_requests || 0) > 0
                },
                { 
                    name: 'Approved Borrowals', 
                    value: loading ? '...' : (stats?.approved_borrow_requests || 0), 
                    icon: CheckCircleIcon,
                    bgColor: 'bg-gradient-to-br from-teal-500 to-teal-600',
                    textColor: 'text-teal-100',
                    borderColor: 'border-teal-500/20',
                    loading: loading,
                    highlight: (stats?.approved_borrow_requests || 0) > 0
                }
            ]
        }
    ];

    // Flatten stats for easier access in rendering
    const statsData = statsSections.flatMap(section => section.stats);

    // Format date with proper error handling and consistent AM/PM display
    const formatDate = (dateString) => {
        try {
            if (!dateString || dateString === 'N/A') return 'N/A';
            
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid Date';
            
            // Extract date components
            const year = date.getFullYear();
            const month = date.toLocaleString('default', { month: 'short' });
            const day = date.getDate();
            
            // Format time with AM/PM
            let hours = date.getHours();
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // Convert 0 to 12 for 12-hour format
            
            return `${month} ${day}, ${year} ${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Date Error';
        }
    };

    // Render events table for a specific type (ongoing/upcoming)
    const renderEventsTable = (events, title) => {
        if (!events || !Array.isArray(events) || events.length === 0) {
            return (
                <div className="p-6 text-center text-slate-400">
                    <p>No {title.toLowerCase()} found</p>
                    {searchTerm && <p className="text-sm mt-1">Try adjusting your search</p>}
                </div>
            );
        }

        const paginatedEvents = events.slice(
            (currentPage - 1) * ITEMS_PER_PAGE,
            currentPage * ITEMS_PER_PAGE
        );
        const totalPages = Math.ceil(events.length / ITEMS_PER_PAGE);

        return (
            <div className="mb-6">
                {title && (
                    <h3 className="text-md font-medium text-white mb-3 px-2">
                        {title}
                        {title.toLowerCase() !== 'upcoming' && (
                            <span className="text-slate-400"> ({events.length})</span>
                        )}
                    </h3>
                )}
                
                <div className="overflow-hidden rounded-lg border border-slate-700">
                    {/* Mobile View - Card Layout */}
                    <div className="sm:hidden space-y-3 p-3">
                        {paginatedEvents.map((event) => (
                            <div 
                                key={`mobile-${event.id}-${event.status}`}
                                className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 hover:bg-slate-700/30 transition-colors duration-150"
                            >
                                <div className="space-y-2">
                                    {/* Event Name */}
                                    <div>
                                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Event Name</span>
                                        <h4 className="text-sm font-medium text-white mt-1">
                                            {event.name || 'Unnamed Event'}
                                        </h4>
                                    </div>

                                    {/* Date & Time */}
                                    <div>
                                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Date & Time</span>
                                        <div className="text-sm text-slate-300 mt-1">
                                            {formatDate(event.date)}
                                        </div>
                                    </div>

                                    {/* Location - only show if on larger mobile screens */}
                                    <div className="md:hidden">
                                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Location</span>
                                        <div className="text-sm text-slate-300 mt-1">
                                            {event.venue || 'TBD'}
                                        </div>
                                    </div>

                                    {/* Status and Registered in same row */}
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Status</span>
                                            <div className="mt-1">
                                                <span 
                                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                        event.status?.toLowerCase() === 'upcoming' 
                                                            ? 'bg-blue-500/20 text-blue-400' 
                                                            : event.status?.toLowerCase() === 'ongoing' || event.status?.toLowerCase() === 'in progress'
                                                                ? 'bg-amber-500/20 text-amber-400'
                                                                : event.status?.toLowerCase() === 'done'
                                                                    ? 'bg-green-500/20 text-green-400'
                                                                    : event.status?.toLowerCase() === 'cancelled'
                                                                        ? 'bg-red-500/20 text-red-400'
                                                                        : 'bg-slate-500/20 text-slate-400'
                                                    }`}
                                                >
                                                    {event.status === 'Done' ? 'Done' : 
                                                     event.status === 'Ongoing' ? 'In Progress' : 'Scheduled'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex-1 text-right">
                                            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Registered:</span>
                                            <div className="text-sm text-slate-300 mt-1 relative inline-block">
                                                {registrationCounts[event.id] !== undefined ? registrationCounts[event.id] : '0'}
                                                {/* Notification badge positioned on the count number */}
                                                {Object.values(notifications)
                                                    .filter(notification => notification.eventId === event.id)
                                                    .map(notification => (
                                                        <div
                                                            key={notification.id}
                                                            className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center cursor-pointer hover:bg-green-600 transition-colors"
                                                            style={{
                                                                animation: 'notificationBounce 0.6s ease-out forwards'
                                                            }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // Navigate to registered players page for this event
                                                                router.get(route('events.players', event.id));
                                                                // Dismiss the notification since user clicked it
                                                                removeNotification(notification.id);
                                                            }}
                                                            title={`View ${notification.increase} new registration${notification.increase > 1 ? 's' : ''} for ${event.name}`}
                                                        >
                                                            +{notification.increase}
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        </div>
                                    </div>

                                    {/* Delete button for completed events */}
                                    {event.status === 'Done' && (
                                        <div className="flex justify-end pt-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteEvent(event.id);
                                                }}
                                                className="text-red-400 hover:text-red-300 hover:bg-slate-700/50 p-1 rounded transition-colors"
                                                title="Delete Event"
                                                aria-label={`Delete event: ${event.name}`}
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop View - Table Layout */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-700 bg-slate-800/80">
                            <thead className="bg-slate-800/80">
                                <tr>
                                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        Event Name
                                    </th>
                                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        Date & Time
                                    </th>
                                    <th scope="col" className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        Location
                                    </th>
                                    <th scope="col" className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        Registered
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {paginatedEvents.map((event) => (
                                    <tr 
                                        key={`${event.id}-${event.status}`} 
                                        className="hover:bg-slate-700/50 transition-colors duration-150"
                                        aria-label={`${event.name} - ${event.status}`}
                                    >
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="text-sm font-medium text-white">
                                                    {event.name || 'Unnamed Event'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-300" title={event.date}>
                                                {formatDate(event.date)}
                                            </div>
                                        </td>
                                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-300">
                                                {event.venue || 'TBD'}
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                                            <span 
                                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                    event.status?.toLowerCase() === 'upcoming' 
                                                        ? 'bg-blue-500/20 text-blue-400' 
                                                        : event.status?.toLowerCase() === 'ongoing' || event.status?.toLowerCase() === 'in progress'
                                                            ? 'bg-amber-500/20 text-amber-400'
                                                            : event.status?.toLowerCase() === 'done'
                                                                ? 'bg-green-500/20 text-green-400'
                                                                : event.status?.toLowerCase() === 'cancelled'
                                                                    ? 'bg-red-500/20 text-red-400'
                                                                    : 'bg-slate-500/20 text-slate-400'
                                                }`}
                                                aria-label={`Status: ${event.status}`}
                                            >
                                                {event.status === 'Done' ? 'Done' : 
                                                 event.status === 'Ongoing' ? 'In Progress' : 'Scheduled'
                                                }
                                            </span>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right relative">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="text-sm text-slate-300 relative">
                                                    {registrationCounts[event.id] !== undefined ? registrationCounts[event.id] : '0'}
                                                    {/* Notification badge positioned on the count number */}
                                                    {Object.values(notifications)
                                                        .filter(notification => notification.eventId === event.id)
                                                        .map(notification => (
                                                            <div
                                                                key={notification.id}
                                                                className="absolute -top-3 -right-5 bg-green-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center cursor-pointer hover:bg-green-600 transition-colors"
                                                                style={{
                                                                    animation: 'notificationBounce 0.5s ease-out forwards',
                                                                    fontSize: '10px'
                                                                }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    // Navigate to registered players page for this event
                                                                    router.get(route('events.players', event.id));
                                                                    // Dismiss the notification since user clicked it
                                                                    removeNotification(notification.id);
                                                                }}
                                                                title={`View ${notification.increase} new registration${notification.increase > 1 ? 's' : ''} for ${event.name}`}
                                                            >
                                                                +{notification.increase}
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                                            {event.status === 'Done' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteEvent(event.id);
                                                    }}
                                                    className="text-red-400 hover:text-red-300 hover:bg-slate-700/50 p-1 rounded transition-colors"
                                                    title="Delete Event"
                                                    aria-label={`Delete event: ${event.name}`}
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="px-6 py-3 flex items-center justify-between border-t border-slate-700 bg-slate-800/30">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md text-slate-300 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md text-slate-300 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-slate-400">
                                        Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                                        <span className="font-medium">
                                            {Math.min(currentPage * ITEMS_PER_PAGE, events.length)}
                                        </span>{' '}
                                        of <span className="font-medium">{events.length}</span> results
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-600 bg-slate-700 text-sm font-medium text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                            aria-label="Previous page"
                                        >
                                            <span className="sr-only">Previous</span>
                                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                        
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            // Show first, last, and pages around current page
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }
                                            
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                        currentPage === pageNum 
                                                            ? 'bg-blue-600 border-blue-600 text-white' 
                                                            : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                                                    }`}
                                                    aria-current={currentPage === pageNum ? 'page' : undefined}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                        
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-600 bg-slate-700 text-sm font-medium text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                            aria-label="Next page"
                                        >
                                            <span className="sr-only">Next</span>
                                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Render news table for a specific type (active/pending)
    const renderNewsTable = (news, title) => {
        if (!news || !Array.isArray(news) || news.length === 0) {
            return (
                <div className="p-6 text-center text-slate-400">
                    <p>No {title.toLowerCase()} found</p>
                    {newsSearchTerm && <p className="text-sm mt-1">Try adjusting your search</p>}
                </div>
            );
        }

        const paginatedNews = news.slice(
            (newsCurrentPage - 1) * ITEMS_PER_PAGE,
            newsCurrentPage * ITEMS_PER_PAGE
        );
        const totalPages = Math.ceil(news.length / ITEMS_PER_PAGE);

        return (
            <div className="mb-6">
                {title && (
                    <h3 className="text-md font-medium text-white mb-3 px-2">
                        {title}
                        <span className="text-slate-400"> ({news.length})</span>
                    </h3>
                )}

                <div className="overflow-hidden rounded-lg border border-slate-700">
                    {/* Mobile View - Card Layout */}
                    <div className="sm:hidden space-y-3 p-3">
                        {paginatedNews.map((article) => (
                            <div
                                key={`mobile-news-${article.id}`}
                                className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 hover:bg-slate-700/30 transition-colors duration-150"
                            >
                                <div className="space-y-2">
                                    {/* Article Title */}
                                    <div>
                                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Title</span>
                                        <h4 className="text-sm font-medium text-white mt-1">
                                            {article.title || 'Untitled'}
                                        </h4>
                                    </div>

                                    {/* Category & Status */}
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Category</span>
                                            <div className="text-sm text-slate-300 mt-1">
                                                {article.category || 'Uncategorized'}
                                            </div>
                                        </div>

                                        <div className="flex-1 text-right">
                                            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Status</span>
                                            <div className="mt-1">
                                                <span
                                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                        article.status?.toLowerCase() === 'active'
                                                            ? 'bg-green-500/20 text-green-400'
                                                            : article.status?.toLowerCase() === 'pending'
                                                                ? 'bg-yellow-500/20 text-yellow-400'
                                                                : 'bg-slate-500/20 text-slate-400'
                                                    }`}
                                                >
                                                    {article.status || 'Unknown'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Writer & Date */}
                                    <div>
                                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Writer</span>
                                        <div className="text-sm text-slate-300 mt-1">
                                            {article.writer_name || 'Unknown'}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1">
                                            {formatDate(article.date)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop View - Table Layout */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-700 bg-slate-800/80">
                            <thead className="bg-slate-800/80">
                                <tr>
                                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        Title
                                    </th>
                                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th scope="col" className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        Writer
                                    </th>
                                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {paginatedNews.map((article) => (
                                    <tr
                                        key={`news-${article.id}`}
                                        className="hover:bg-slate-700/50 transition-colors duration-150"
                                    >
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-white">
                                                {article.title || 'Untitled'}
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-300">
                                                {article.category || 'Uncategorized'}
                                            </div>
                                        </td>
                                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-300">
                                                {article.writer_name || 'Unknown'}
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                    article.status?.toLowerCase() === 'active'
                                                        ? 'bg-green-500/20 text-green-400'
                                                        : article.status?.toLowerCase() === 'pending'
                                                            ? 'bg-yellow-500/20 text-yellow-400'
                                                            : 'bg-slate-500/20 text-slate-400'
                                                }`}
                                            >
                                                {article.status || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-300">
                                                {formatDate(article.date)}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="px-6 py-3 flex items-center justify-between border-t border-slate-700 bg-slate-800/30">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                    onClick={() => setNewsCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={newsCurrentPage === 1}
                                    className="relative inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md text-slate-300 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setNewsCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={newsCurrentPage === totalPages}
                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md text-slate-300 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-slate-400">
                                        Showing <span className="font-medium">{(newsCurrentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                                        <span className="font-medium">
                                            {Math.min(newsCurrentPage * ITEMS_PER_PAGE, news.length)}
                                        </span>{' '}
                                        of <span className="font-medium">{news.length}</span> results
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                        <button
                                            onClick={() => setNewsCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={newsCurrentPage === 1}
                                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-600 bg-slate-700 text-sm font-medium text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">Previous</span>
                                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </button>

                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (newsCurrentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (newsCurrentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = newsCurrentPage - 2 + i;
                                            }

                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setNewsCurrentPage(pageNum)}
                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                        newsCurrentPage === pageNum
                                                            ? 'bg-blue-600 border-blue-600 text-white'
                                                            : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                                                    }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}

                                        <button
                                            onClick={() => setNewsCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={newsCurrentPage === totalPages}
                                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-600 bg-slate-700 text-sm font-medium text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">Next</span>
                                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Render borrow requests table
    const renderBorrowRequestsTable = (requests, title) => {
        if (!requests || !Array.isArray(requests) || requests.length === 0) {
            return (
                <div className="p-6 text-center text-slate-400">
                    <p>No {title.toLowerCase()} found</p>
                    {borrowSearchTerm && <p className="text-sm mt-1">Try adjusting your search</p>}
                </div>
            );
        }

        const paginatedRequests = requests.slice(
            (borrowCurrentPage - 1) * ITEMS_PER_PAGE,
            borrowCurrentPage * ITEMS_PER_PAGE
        );
        const totalPages = Math.ceil(requests.length / ITEMS_PER_PAGE);

        return (
            <div className="mb-6">
                {title && (
                    <h3 className="text-md font-medium text-white mb-3 px-2">
                        {title}
                        <span className="text-slate-400"> ({requests.length})</span>
                    </h3>
                )}

                <div className="overflow-hidden rounded-lg border border-slate-700">
                    {/* Mobile View - Card Layout */}
                    <div className="sm:hidden space-y-3 p-3">
                        {paginatedRequests.map((request) => (
                            <div
                                key={`mobile-borrow-${request.id}`}
                                className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 hover:bg-slate-700/30 transition-colors duration-150"
                            >
                                <div className="space-y-2">
                                    {/* Student Info */}
                                    <div>
                                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Student</span>
                                        <div className="text-sm font-medium text-white mt-1">
                                            {request.student_name || 'Unknown'}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            ID: {request.student_id || 'N/A'}
                                        </div>
                                    </div>

                                    {/* Item & Status */}
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Item</span>
                                            <div className="text-sm text-slate-300 mt-1">
                                                {request.item_name || 'Unknown Item'}
                                            </div>
                                        </div>

                                        <div className="flex-1 text-right">
                                            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Status</span>
                                            <div className="mt-1">
                                                <span
                                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                        request.status?.toLowerCase() === 'approved'
                                                            ? 'bg-green-500/20 text-green-400'
                                                            : request.status?.toLowerCase() === 'pending'
                                                                ? 'bg-yellow-500/20 text-yellow-400'
                                                                : request.status?.toLowerCase() === 'returned'
                                                                    ? 'bg-blue-500/20 text-blue-400'
                                                                    : 'bg-slate-500/20 text-slate-400'
                                                    }`}
                                                >
                                                    {request.status || 'Unknown'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Purpose & Date */}
                                    <div>
                                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Purpose</span>
                                        <div className="text-sm text-slate-300 mt-1">
                                            {request.purpose || 'Not specified'}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1">
                                            Requested: {formatDate(request.requested_at)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop View - Table Layout */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-700 bg-slate-800/80">
                            <thead className="bg-slate-800/80">
                                <tr>
                                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        Student
                                    </th>
                                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        Item
                                    </th>
                                    <th scope="col" className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        Purpose
                                    </th>
                                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                        Requested
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {paginatedRequests.map((request) => (
                                    <tr
                                        key={`borrow-${request.id}`}
                                        className="hover:bg-slate-700/50 transition-colors duration-150"
                                    >
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div>
                                                    <div className="text-sm font-medium text-white">
                                                        {request.student_name || 'Unknown'}
                                                    </div>
                                                    <div className="text-sm text-slate-400">
                                                        {request.student_id || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-300">
                                                {request.item_name || 'Unknown Item'}
                                            </div>
                                        </td>
                                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-300">
                                                {request.purpose || 'Not specified'}
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                    request.status?.toLowerCase() === 'approved'
                                                        ? 'bg-green-500/20 text-green-400'
                                                        : request.status?.toLowerCase() === 'pending'
                                                            ? 'bg-yellow-500/20 text-yellow-400'
                                                            : request.status?.toLowerCase() === 'returned'
                                                                ? 'bg-blue-500/20 text-blue-400'
                                                                : 'bg-slate-500/20 text-slate-400'
                                                }`}
                                            >
                                                {request.status || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-300">
                                                {formatDate(request.requested_at)}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="px-6 py-3 flex items-center justify-between border-t border-slate-700 bg-slate-800/30">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                    onClick={() => setBorrowCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={borrowCurrentPage === 1}
                                    className="relative inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md text-slate-300 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setBorrowCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={borrowCurrentPage === totalPages}
                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md text-slate-300 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-slate-400">
                                        Showing <span className="font-medium">{(borrowCurrentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                                        <span className="font-medium">
                                            {Math.min(borrowCurrentPage * ITEMS_PER_PAGE, requests.length)}
                                        </span>{' '}
                                        of <span className="font-medium">{requests.length}</span> results
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                        <button
                                            onClick={() => setBorrowCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={borrowCurrentPage === 1}
                                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-600 bg-slate-700 text-sm font-medium text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">Previous</span>
                                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </button>

                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (borrowCurrentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (borrowCurrentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = borrowCurrentPage - 2 + i;
                                            }

                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setBorrowCurrentPage(pageNum)}
                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                        borrowCurrentPage === pageNum
                                                            ? 'bg-blue-600 border-blue-600 text-white'
                                                            : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                                                    }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}

                                        <button
                                            onClick={() => setBorrowCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={borrowCurrentPage === totalPages}
                                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-600 bg-slate-700 text-sm font-medium text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">Next</span>
                                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Combined events container
    const renderEventsContainer = () => {
        const hasEvents = ongoingEvents.length > 0 || upcomingEvents.length > 0 || completedEvents.length > 0;
        const hasSearchResults = filteredOngoing.length > 0 || filteredUpcoming.length > 0 || filteredCompleted.length > 0;

        return (
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700 overflow-hidden transition-all duration-300 hover:shadow-xl mb-6">
    
                
                {/* Search Bar */}
                <div className="p-4 border-b border-slate-700">
                    <label htmlFor="search" className="sr-only">Search events</label>
                    <div className="relative w-full max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                        </div>
                        <input
                            id="search"
                            name="search"
                            type="text"
                            className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-700/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                            placeholder="Search by event name, status, or location..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1); // Reset to first page on search
                            }}
                            aria-label="Search events"
                        />
                    </div>
                </div>
                
                {/* Loading State */}
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent">
                            <span className="sr-only">Loading...</span>
                        </div>
                        <p className="mt-2 text-slate-400">Loading events...</p>
                    </div>
                ) : hasEvents ? (
                    /* Events Tables */
                    <div className="p-4 space-y-8">
                        {searchTerm && !hasSearchResults ? (
                            <div className="text-center py-8">
                                <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-slate-500" />
                                <h3 className="mt-2 text-sm font-medium text-slate-300">No events found</h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    We couldn't find any events matching your search. Try a different term.
                                </p>
                                <div className="mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setSearchTerm('')}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Clear search
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Ongoing Events */}
                                <div className="mb-8">
                                    <h3 className="text-lg font-semibold text-white mb-4">
                                        Ongoing Events
                                    </h3>
                                    {filteredOngoing.length > 0 ? (
                                        renderEventsTable(filteredOngoing, '')
                                    ) : (
                                        <div className="p-4 text-center text-slate-400 bg-slate-800/30 rounded-lg">
                                            {searchTerm ? 'No matching ongoing events found' : 'No ongoing events'}
                                        </div>
                                    )}
                                </div>

                                {/* Upcoming Events */}
                                <div className="mb-8">
                                    <h3 className="text-lg font-semibold text-white mb-4">
                                        Upcoming Events
                                    </h3>
                                    {filteredUpcoming.length > 0 ? (
                                        renderEventsTable(filteredUpcoming, '')
                                    ) : (
                                        <div className="p-4 text-center text-slate-400 bg-slate-800/30 rounded-lg">
                                            {searchTerm ? 'No matching upcoming events found' : 'No upcoming events'}
                                        </div>
                                    )}
                                </div>

                                {/* Completed Events */}
                                <div className="mb-8">
                                    <h3 className="text-lg font-semibold text-white mb-4">
                                        Completed Events
                                    </h3>
                                    {filteredCompleted.length > 0 ? (
                                        renderEventsTable(filteredCompleted, '')
                                    ) : (
                                        <div className="p-4 text-center text-slate-400 bg-slate-800/30 rounded-lg">
                                            {searchTerm ? 'No matching completed events found' : 'No completed events'}
                                        </div>
                                    )}
                                </div>

                                {hasSearchResults && searchTerm && (
                                    <div className="mt-4 text-center">
                                        <button
                                            type="button"
                                            onClick={() => setSearchTerm('')}
                                            className="text-sm text-blue-400 hover:text-blue-300"
                                        >
                                            Clear search to show all events
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="text-center py-12 px-4">
                        <CalendarDaysIcon className="mx-auto h-12 w-12 text-slate-500" />
                        <h3 className="mt-2 text-sm font-medium text-slate-300">No events yet</h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Get started by creating a new event.
                        </p>
                        
                    </div>
                )}
            </div>
        );
    };

    // Combined news container
    const renderNewsContainer = () => {
        const hasNews = filteredNews.length > 0;

        return (
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700 overflow-hidden transition-all duration-300 hover:shadow-xl mb-6">
                {/* Search Bar */}
                <div className="p-4 border-b border-slate-700">
                    <label htmlFor="news-search" className="sr-only">Search news</label>
                    <div className="relative w-full max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                        </div>
                        <input
                            id="news-search"
                            name="news-search"
                            type="text"
                            className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-700/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                            placeholder="Search by title, category, status, or writer..."
                            value={newsSearchTerm}
                            onChange={(e) => {
                                setNewsSearchTerm(e.target.value);
                                setNewsCurrentPage(1); // Reset to first page on search
                            }}
                            aria-label="Search news"
                        />
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent">
                            <span className="sr-only">Loading...</span>
                        </div>
                        <p className="mt-2 text-slate-400">Loading news...</p>
                    </div>
                ) : hasNews ? (
                    <div className="p-4">
                        {newsSearchTerm && !hasNews ? (
                            <div className="text-center py-8">
                                <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-slate-500" />
                                <h3 className="mt-2 text-sm font-medium text-slate-300">No news found</h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    We couldn't find any news matching your search. Try a different term.
                                </p>
                                <div className="mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setNewsSearchTerm('')}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Clear search
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="mb-8">
                                    <h3 className="text-lg font-semibold text-white mb-4">
                                        Recent News Articles
                                    </h3>
                                    {renderNewsTable(filteredNews, '')}
                                </div>

                                {hasNews && newsSearchTerm && (
                                    <div className="mt-4 text-center">
                                        <button
                                            type="button"
                                            onClick={() => setNewsSearchTerm('')}
                                            className="text-sm text-blue-400 hover:text-blue-300"
                                        >
                                            Clear search to show all news
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="text-center py-12 px-4">
                        <NewspaperIcon className="mx-auto h-12 w-12 text-slate-500" />
                        <h3 className="mt-2 text-sm font-medium text-slate-300">No news articles yet</h3>
                        <p className="mt-1 text-sm text-slate-500">
                            News articles will appear here when they are created.
                        </p>
                    </div>
                )}
            </div>
        );
    };

    // Combined borrow requests container
    const renderBorrowRequestsContainer = () => {
        const hasRequests = filteredBorrowRequests.length > 0;

        return (
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700 overflow-hidden transition-all duration-300 hover:shadow-xl mb-6">
                {/* Search Bar */}
                <div className="p-4 border-b border-slate-700">
                    <label htmlFor="borrow-search" className="sr-only">Search borrow requests</label>
                    <div className="relative w-full max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                        </div>
                        <input
                            id="borrow-search"
                            name="borrow-search"
                            type="text"
                            className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-700/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                            placeholder="Search by student name, ID, item, status, or purpose..."
                            value={borrowSearchTerm}
                            onChange={(e) => {
                                setBorrowSearchTerm(e.target.value);
                                setBorrowCurrentPage(1); // Reset to first page on search
                            }}
                            aria-label="Search borrow requests"
                        />
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent">
                            <span className="sr-only">Loading...</span>
                        </div>
                        <p className="mt-2 text-slate-400">Loading borrow requests...</p>
                    </div>
                ) : hasRequests ? (
                    <div className="p-4">
                        {borrowSearchTerm && !hasRequests ? (
                            <div className="text-center py-8">
                                <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-slate-500" />
                                <h3 className="mt-2 text-sm font-medium text-slate-300">No borrow requests found</h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    We couldn't find any borrow requests matching your search. Try a different term.
                                </p>
                                <div className="mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setBorrowSearchTerm('')}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Clear search
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="mb-8">
                                    <h3 className="text-lg font-semibold text-white mb-4">
                                        Recent Borrow Requests
                                    </h3>
                                    {renderBorrowRequestsTable(filteredBorrowRequests, '')}
                                </div>

                                {hasRequests && borrowSearchTerm && (
                                    <div className="mt-4 text-center">
                                        <button
                                            type="button"
                                            onClick={() => setBorrowSearchTerm('')}
                                            className="text-sm text-blue-400 hover:text-blue-300"
                                        >
                                            Clear search to show all requests
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="text-center py-12 px-4">
                        <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-slate-500" />
                        <h3 className="mt-2 text-sm font-medium text-slate-300">No borrow requests yet</h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Borrow requests will appear here when students submit them.
                        </p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <ErrorBoundary>
            <AuthenticatedLayout
                user={auth?.user}
                header={
                    <div className="flex justify-between items-center">
                        <h1 className="font-semibold text-xl text-white leading-tight">
                            Dashboard Overview
                        </h1>
                    </div>
                }
            >
                <Head title="Dashboard" />

                <div className="py-6 sm:py-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Tab Navigation */}
                        <div className="mb-8">
                            <nav className="flex space-x-1 bg-slate-800/50 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab('events')}
                                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                                        activeTab === 'events'
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                                    }`}
                                >
                                    Events
                                </button>
                                <button
                                    onClick={() => setActiveTab('news')}
                                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                                        activeTab === 'news'
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                                    }`}
                                >
                                    News
                                </button>
                                <button
                                    onClick={() => setActiveTab('borrowing')}
                                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                                        activeTab === 'borrowing'
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                                    }`}
                                >
                                    Borrowings
                                </button>
                            </nav>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'events' && (
                            <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700 overflow-hidden transition-all duration-300 hover:shadow-xl">
                                {/* Events Stats Overview */}
                                <div className="p-6 border-b border-slate-700">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                                            <div className="flex items-center">
                                                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3 mr-4">
                                                    <CalendarDaysIcon className="h-6 w-6 text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-400">Total Events</p>
                                                    <p className="text-2xl font-bold text-white">{stats?.total_events || 0}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                                            <div className="flex items-center">
                                                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg p-3 mr-4">
                                                    <ClockIcon className="h-6 w-6 text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-400">Ongoing</p>
                                                    <p className="text-2xl font-bold text-white">{stats?.ongoing_events || 0}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                                            <div className="flex items-center">
                                                <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg p-3 mr-4">
                                                    <CalendarDaysIcon className="h-6 w-6 text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-400">Upcoming</p>
                                                    <p className="text-2xl font-bold text-white">{stats?.upcoming_events || 0}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Search Bar */}
                                <div className="p-4 border-b border-slate-700">
                                    <label htmlFor="search" className="sr-only">Search events</label>
                                    <div className="relative w-full max-w-md">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                                        </div>
                                        <input
                                            id="search"
                                            name="search"
                                            type="text"
                                            className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-700/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                                            placeholder="Search by event name, status, or location..."
                                            value={searchTerm}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value);
                                                setCurrentPage(1); // Reset to first page on search
                                            }}
                                            aria-label="Search events"
                                        />
                                    </div>
                                </div>

                                {/* Loading State */}
                                {loading ? (
                                    <div className="p-8 text-center">
                                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent">
                                            <span className="sr-only">Loading...</span>
                                        </div>
                                        <p className="mt-2 text-slate-400">Loading events...</p>
                                    </div>
                                ) : (
                                    /* Events Tables */
                                    <div className="p-4 space-y-8">
                                        {searchTerm && (filteredOngoing.length === 0 && filteredUpcoming.length === 0 && filteredCompleted.length === 0) ? (
                                            <div className="text-center py-8">
                                                <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-slate-500" />
                                                <h3 className="mt-2 text-sm font-medium text-slate-300">No events found</h3>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    We couldn't find any events matching your search. Try a different term.
                                                </p>
                                                <div className="mt-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSearchTerm('')}
                                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                    >
                                                        Clear search
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Ongoing Events */}
                                                <div className="mb-8">
                                                    <h3 className="text-lg font-semibold text-white mb-4">
                                                        Ongoing Events
                                                    </h3>
                                                    {filteredOngoing.length > 0 ? (
                                                        renderEventsTable(filteredOngoing, '')
                                                    ) : (
                                                        <div className="p-4 text-center text-slate-400 bg-slate-800/30 rounded-lg">
                                                            {searchTerm ? 'No matching ongoing events found' : 'No ongoing events'}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Upcoming Events */}
                                                <div className="mb-8">
                                                    <h3 className="text-lg font-semibold text-white mb-4">
                                                        Upcoming Events
                                                    </h3>
                                                    {filteredUpcoming.length > 0 ? (
                                                        renderEventsTable(filteredUpcoming, '')
                                                    ) : (
                                                        <div className="p-4 text-center text-slate-400 bg-slate-800/30 rounded-lg">
                                                            {searchTerm ? 'No matching upcoming events found' : 'No upcoming events'}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Completed Events */}
                                                <div className="mb-8">
                                                    <h3 className="text-lg font-semibold text-white mb-4">
                                                        Completed Events
                                                    </h3>
                                                    {filteredCompleted.length > 0 ? (
                                                        renderEventsTable(filteredCompleted, '')
                                                    ) : (
                                                        <div className="p-4 text-center text-slate-400 bg-slate-800/30 rounded-lg">
                                                            {searchTerm ? 'No matching completed events found' : 'No completed events'}
                                                        </div>
                                                    )}
                                                </div>

                                                {searchTerm && (filteredOngoing.length > 0 || filteredUpcoming.length > 0 || filteredCompleted.length > 0) && (
                                                    <div className="mt-4 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSearchTerm('')}
                                                            className="text-sm text-blue-400 hover:text-blue-300"
                                                        >
                                                            Clear search to show all events
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'news' && (
                            <div className="space-y-6">
                                {/* News Overview Stats */}
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                                        <div className="flex items-center">
                                            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3 mr-4">
                                                <NewspaperIcon className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-400">Total News</p>
                                                <p className="text-2xl font-bold text-white">{stats?.total_news || 0}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                                        <div className="flex items-center">
                                            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg p-3 mr-4">
                                                <CheckCircleIcon className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-400">Active</p>
                                                <p className="text-2xl font-bold text-white">{stats?.active_news || 0}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                                        <div className="flex items-center">
                                            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-3 mr-4">
                                                <ClockIconAlt className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-400">Pending</p>
                                                <p className="text-2xl font-bold text-white">{stats?.pending_news || 0}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* News Summary */}
                                <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                                    <h3 className="text-lg font-semibold text-white mb-4">Recent News</h3>
                                    {recentNews.length > 0 ? (
                                        <div className="space-y-3">
                                            {recentNews.slice(0, 3).map((article) => (
                                                <div key={article.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-white truncate">{article.title}</p>
                                                        <p className="text-sm text-slate-400">By {article.writer_name} • {article.category}</p>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ml-3 ${
                                                        article.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                                        article.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-slate-500/20 text-slate-400'
                                                    }`}>
                                                        {article.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <NewspaperIcon className="mx-auto h-12 w-12 text-slate-500" />
                                            <h4 className="mt-2 text-sm font-medium text-slate-300">No news articles</h4>
                                            <p className="mt-1 text-sm text-slate-500">News articles will appear here when created.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'borrowing' && (
                            <div className="space-y-6">
                                {/* Borrowing Overview Stats */}
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                                    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700">
                                        <div className="flex items-center">
                                            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-2 sm:p-3 mr-3 sm:mr-4 flex-shrink-0">
                                                <ClipboardDocumentListIcon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs sm:text-sm font-medium text-slate-400">Total Requests</p>
                                                <p className="text-lg sm:text-2xl font-bold text-white truncate">{stats?.total_borrow_requests || 0}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700">
                                        <div className="flex items-center">
                                            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-2 sm:p-3 mr-3 sm:mr-4 flex-shrink-0">
                                                <ClockIconAlt className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs sm:text-sm font-medium text-slate-400">Pending</p>
                                                <p className="text-lg sm:text-2xl font-bold text-white truncate">{stats?.pending_borrow_requests || 0}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700">
                                        <div className="flex items-center">
                                            <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg p-2 sm:p-3 mr-3 sm:mr-4 flex-shrink-0">
                                                <CheckCircleIcon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs sm:text-sm font-medium text-slate-400">Approved</p>
                                                <p className="text-lg sm:text-2xl font-bold text-white truncate">{stats?.approved_borrow_requests || 0}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700">
                                        <div className="flex items-center">
                                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-2 sm:p-3 mr-3 sm:mr-4 flex-shrink-0">
                                                <CheckCircleIcon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs sm:text-sm font-medium text-slate-400">Returned</p>
                                                <p className="text-lg sm:text-2xl font-bold text-white truncate">{stats?.returned_borrow_requests || 0}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Borrowing Logs Table */}
                                <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
                                    <div className="p-6 border-b border-slate-700">
                                        <h3 className="text-lg font-semibold text-white">Borrowing Logs</h3>
                                        <p className="text-sm text-slate-400 mt-1">Complete borrowing request history</p>
                                    </div>

                                    {recentBorrowRequests.length > 0 ? (
                                        <>
                                            {/* Mobile View - Card Layout */}
                                            <div className="sm:hidden space-y-3 p-3">
                                                {recentBorrowRequests.map((request) => (
                                                    <div key={`mobile-borrow-log-${request.id}`} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600 hover:bg-slate-700/50 transition-colors">
                                                        <div className="space-y-3">
                                                            {/* Header with Student Info and Status */}
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex-1">
                                                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                                                        <div>
                                                                            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Student ID</span>
                                                                            <p className="text-sm font-medium text-white">{request.student_id || 'N/A'}</p>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Name</span>
                                                                            <p className="text-sm font-medium text-white">{request.student_name || 'N/A'}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                                    request.returned_at ? 'bg-blue-500/20 text-blue-400' :
                                                                    request.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                                                    request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                    'bg-slate-500/20 text-slate-400'
                                                                }`}>
                                                                    {request.returned_at ? 'Returned' : (request.status === 'approved' ? 'Borrowed' : request.status)}
                                                                </span>
                                                            </div>

                                                            {/* Contact & Item */}
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div>
                                                                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Email</span>
                                                                    <p className="text-sm text-slate-300 truncate" title={request.email}>{request.email || 'N/A'}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Item</span>
                                                                    <p className="text-sm text-slate-300">{request.item_name || 'Unknown Item'}</p>
                                                                </div>
                                                            </div>

                                                            {/* Details */}
                                                            <div className="grid grid-cols-3 gap-2">
                                                                <div>
                                                                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Qty</span>
                                                                    <p className="text-sm text-slate-300">{request.quantity || 1}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Contact</span>
                                                                    <p className="text-sm text-slate-300">{request.contact_number || 'N/A'}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Purpose</span>
                                                                    <div className="mt-1">
                                                                        {request.purpose ? (
                                                                            <button
                                                                                onClick={() => openPurposeModal(`Purpose - Log #${request.id}`, request.purpose)}
                                                                                className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
                                                                                title="Click to view purpose"
                                                                            >
                                                                                View
                                                                            </button>
                                                                        ) : (
                                                                            <span className="text-xs text-slate-500">—</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Dates */}
                                                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-600">
                                                                <div>
                                                                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Borrowed On</span>
                                                                    <p className="text-sm text-slate-300">{request.approved_at ? formatDate(request.approved_at) : '—'}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Returned On</span>
                                                                    <p className="text-sm text-slate-300">{request.returned_at ? formatDate(request.returned_at) : '—'}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Desktop View - Table Layout */}
                                            <div className="w-full overflow-visible">
                                                <table className="min-w-full divide-y divide-slate-700 table-fixed">
                                                    <thead className="bg-slate-800/80">
                                                        <tr>
                                                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider w-20">
                                                                Student ID
                                                            </th>
                                                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider w-32">
                                                                Student Name
                                                            </th>
                                                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider w-48">
                                                                Email
                                                            </th>
                                                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider w-24">
                                                                Item
                                                            </th>
                                                            <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider w-16">
                                                                Qty
                                                            </th>
                                                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider w-32">
                                                                Purpose
                                                            </th>
                                                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider w-24">
                                                                Contact
                                                            </th>
                                                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider w-32">
                                                                Borrowed On
                                                            </th>
                                                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider w-32">
                                                                Returned On
                                                            </th>
                                                            <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider w-20">
                                                                Status
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-700">
                                                        {recentBorrowRequests.map((request) => (
                                                            <tr key={`borrow-log-${request.id}`} className="hover:bg-slate-700/50 transition-colors duration-150">
                                                                <td className="px-3 py-4 whitespace-nowrap w-20">
                                                                    <div className="text-sm font-medium text-white">
                                                                        {request.student_id || 'N/A'}
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap w-32">
                                                                    <div className="text-sm font-medium text-white">
                                                                        {request.student_name || 'N/A'}
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap w-48">
                                                                    <div className="text-sm text-slate-300 truncate" title={request.email}>
                                                                        {request.email || 'N/A'}
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap w-24">
                                                                    <div className="text-sm text-slate-300">
                                                                        {request.item_name || 'Unknown Item'}
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap text-center w-16">
                                                                    <div className="text-sm text-slate-300">
                                                                        {request.quantity || 1}
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap w-32">
                                                                    <div className="text-sm text-slate-300">
                                                                        {request.purpose ? (
                                                                            <button
                                                                                onClick={() => openPurposeModal(`Purpose - Log #${request.id}`, request.purpose)}
                                                                                className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
                                                                                title="Click to view purpose"
                                                                            >
                                                                                View
                                                                            </button>
                                                                        ) : (
                                                                            '—'
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap w-24">
                                                                    <div className="text-sm text-slate-300">
                                                                        {request.contact_number || 'N/A'}
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap w-32">
                                                                    <div className="text-sm text-slate-300">
                                                                        {request.approved_at ? formatDate(request.approved_at) : '—'}
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap w-32">
                                                                    <div className="text-sm text-slate-300">
                                                                        {request.returned_at ? formatDate(request.returned_at) : '—'}
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap text-center w-20">
                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                        request.returned_at ? 'bg-blue-500/20 text-blue-400' :
                                                                        request.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                                                        request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                        'bg-slate-500/20 text-slate-400'
                                                                    }`} title={request.returned_at ? 'Returned' : (request.status === 'approved' ? 'Borrowed' : request.status)}>
                                                                        {request.returned_at ? 'Returned' : (request.status === 'approved' ? 'Borrowed' : request.status)}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Pagination for Borrowing Logs */}
                                            {Math.ceil(recentBorrowRequests.length / 10) > 1 && (
                                                <div className="px-6 py-3 flex items-center justify-between border-t border-slate-700 bg-slate-800/30">
                                                    <div className="flex-1 flex justify-between sm:hidden">
                                                        <button
                                                            onClick={() => setBorrowCurrentPage(p => Math.max(1, p - 1))}
                                                            disabled={borrowCurrentPage === 1}
                                                            className="relative inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md text-slate-300 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Previous
                                                        </button>
                                                        <button
                                                            onClick={() => setBorrowCurrentPage(p => Math.min(Math.ceil(recentBorrowRequests.length / 10), p + 1))}
                                                            disabled={borrowCurrentPage === Math.ceil(recentBorrowRequests.length / 10)}
                                                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md text-slate-300 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Next
                                                        </button>
                                                    </div>
                                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                                        <div>
                                                            <p className="text-sm text-slate-400">
                                                                Showing <span className="font-medium">{(borrowCurrentPage - 1) * 10 + 1}</span> to{' '}
                                                                <span className="font-medium">
                                                                    {Math.min(borrowCurrentPage * 10, recentBorrowRequests.length)}
                                                                </span>{' '}
                                                                of <span className="font-medium">{recentBorrowRequests.length}</span> results
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                                <button
                                                                    onClick={() => setBorrowCurrentPage(p => Math.max(1, p - 1))}
                                                                    disabled={borrowCurrentPage === 1}
                                                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-600 bg-slate-700 text-sm font-medium text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    <span className="sr-only">Previous</span>
                                                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                </button>

                                                                {Array.from({ length: Math.min(5, Math.ceil(recentBorrowRequests.length / 10)) }, (_, i) => {
                                                                    let pageNum;
                                                                    const totalPages = Math.ceil(recentBorrowRequests.length / 10);
                                                                    if (totalPages <= 5) {
                                                                        pageNum = i + 1;
                                                                    } else if (borrowCurrentPage <= 3) {
                                                                        pageNum = i + 1;
                                                                    } else if (borrowCurrentPage >= totalPages - 2) {
                                                                        pageNum = totalPages - 4 + i;
                                                                    } else {
                                                                        pageNum = borrowCurrentPage - 2 + i;
                                                                    }

                                                                    return (
                                                                        <button
                                                                            key={pageNum}
                                                                            onClick={() => setBorrowCurrentPage(pageNum)}
                                                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                                                borrowCurrentPage === pageNum
                                                                                    ? 'bg-blue-600 border-blue-600 text-white'
                                                                                    : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                                                                            }`}
                                                                        >
                                                                            {pageNum}
                                                                        </button>
                                                                    );
                                                                })}

                                                                <button
                                                                    onClick={() => setBorrowCurrentPage(p => Math.min(Math.ceil(recentBorrowRequests.length / 10), p + 1))}
                                                                    disabled={borrowCurrentPage === Math.ceil(recentBorrowRequests.length / 10)}
                                                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-600 bg-slate-700 text-sm font-medium text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    <span className="sr-only">Next</span>
                                                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                </button>
                                                            </nav>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center py-12 px-4">
                                            <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-slate-500" />
                                            <h4 className="mt-2 text-sm font-medium text-slate-300">No borrow requests yet</h4>
                                            <p className="mt-1 text-sm text-slate-500">
                                                Borrow requests will appear here when students submit them.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <style jsx>{`
                    @keyframes notificationBounce {
                        0% { transform: scale(0) rotate(0deg); opacity: 0; }
                        50% { transform: scale(1.2) rotate(5deg); opacity: 1; }
                        100% { transform: scale(1) rotate(0deg); opacity: 1; }
                    }
                `}</style>
            </AuthenticatedLayout>

            {/* Purpose Modal */}
            {purposeModal.open && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity" onClick={closePurposeModal}></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-white mb-4">
                                            {purposeModal.title}
                                        </h3>
                                        <div className="mt-2">
                                            <div className="bg-slate-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                                                <pre className="whitespace-pre-wrap text-sm text-slate-300 leading-relaxed">
                                                    {purposeModal.content}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={closePurposeModal}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </ErrorBoundary>
    );
}

// Add PropTypes for better development experience and type checking
DashboardSummary.propTypes = {
    auth: PropTypes.shape({
        user: PropTypes.object
    }),
    stats: PropTypes.shape({
        total_events: PropTypes.number,
        ongoing_events: PropTypes.number,
        upcoming_events: PropTypes.number,
        total_news: PropTypes.number,
        active_news: PropTypes.number,
        pending_news: PropTypes.number,
        total_borrow_requests: PropTypes.number,
        pending_borrow_requests: PropTypes.number,
        approved_borrow_requests: PropTypes.number,
        returned_borrow_requests: PropTypes.number,
    }),
    recentEvents: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            name: PropTypes.string,
            status: PropTypes.string,
            date: PropTypes.string,
            venue: PropTypes.string,
            registered_count: PropTypes.number,
        })
    ),
    recentNews: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            title: PropTypes.string,
            category: PropTypes.string,
            status: PropTypes.string,
            date: PropTypes.string,
            writer_name: PropTypes.string,
        })
    ),
    recentBorrowRequests: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            student_name: PropTypes.string,
            student_id: PropTypes.string,
            item_name: PropTypes.string,
            status: PropTypes.string,
            requested_at: PropTypes.string,
            purpose: PropTypes.string,
            quantity: PropTypes.number,
        })
    ),
    loading: PropTypes.bool,
};

// Default props
DashboardSummary.defaultProps = {
    auth: { user: null },
    stats: {
        total_events: 0,
        ongoing_events: 0,
        upcoming_events: 0,
        total_news: 0,
        active_news: 0,
        pending_news: 0,
        total_borrow_requests: 0,
        pending_borrow_requests: 0,
        approved_borrow_requests: 0,
        returned_borrow_requests: 0,
    },
    recentEvents: [],
    recentNews: [],
    recentBorrowRequests: [],
    loading: false,
};
