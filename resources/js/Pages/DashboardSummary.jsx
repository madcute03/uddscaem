import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { 
    CalendarDaysIcon, 
    ClockIcon,
    MagnifyingGlassIcon,
    ExclamationTriangleIcon,
    TrashIcon,
    PlusIcon
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

export default function DashboardSummary({ auth, stats = {}, recentEvents = [], loading = false }) {
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

    // Stats data with loading states
    const statsData = [
        { 
            name: 'Total Events', 
            value: loading ? '...' : (stats?.total_events || 0), 
            icon: CalendarDaysIcon,
            bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
            textColor: 'text-blue-100',
            borderColor: 'border-blue-500/20',
            loading: loading
        },
        { 
            name: 'Ongoing', 
            value: loading ? '...' : (ongoingEvents?.length || 0), 
            icon: ClockIcon,
            bgColor: 'bg-gradient-to-br from-amber-500 to-amber-600',
            textColor: 'text-amber-100',
            borderColor: 'border-amber-500/20',
            loading: loading
        },
        { 
            name: 'Upcoming', 
            value: loading ? '...' : (upcomingEvents?.length || 0), 
            icon: CalendarDaysIcon,
            bgColor: 'bg-gradient-to-br from-violet-500 to-violet-600',
            textColor: 'text-violet-100',
            borderColor: 'border-violet-500/20',
            loading: loading
        },
    ];

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
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-white truncate">
                                            {event.name || 'Unnamed Event'}
                                        </h4>
                                        <div className="mt-1 text-xs text-slate-400">
                                            <div className="flex items-center">
                                                <CalendarDaysIcon className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                                                <span>{formatDate(event.date).split(', ')[0]}</span>
                                            </div>
                                            <div className="flex items-center mt-1">
                                                <svg className="h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span className="truncate">{event.venue || 'TBD'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-2 flex-shrink-0 flex flex-col items-end">
                                        <span 
                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${
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
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-2 text-xs text-slate-400">
                                    {formatDate(event.date).split(', ').slice(1).join(', ')}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop View - Table Layout */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-700">
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
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700 bg-slate-800/50">
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
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
                            {statsData.map((stat, index) => (
                                <div 
                                    key={index} 
                                    className={`relative overflow-hidden rounded-2xl shadow-lg ${stat.borderColor} border transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5`}
                                    aria-label={`${stat.name} stat card`}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-slate-700/50 to-slate-800/30 backdrop-blur-sm"></div>
                                    <div className="relative p-5">
                                        <div className="flex items-start">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-slate-300 mb-1">{stat.name}</p>
                                                <div className="flex items-center">
                                                    <div className={`${stat.bgColor} rounded-lg p-2 mr-3 flex-shrink-0`}>
                                                        <stat.icon className="h-5 w-5 text-white" aria-hidden="true" />
                                                    </div>
                                                    <div className="min-w-[40px]">
                                                        {stat.loading ? (
                                                            <div className="h-7 w-10 bg-slate-600/50 rounded animate-pulse"></div>
                                                        ) : (
                                                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Events Container */}
                        <ErrorBoundary>
                            {renderEventsContainer()}
                        </ErrorBoundary>
                    </div>
                </div>
            </AuthenticatedLayout>
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
    }),
    recentEvents: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            name: PropTypes.string,
            status: PropTypes.string,
            date: PropTypes.string,
            venue: PropTypes.string,
        })
    ),
    loading: PropTypes.bool,
};

// Default props
DashboardSummary.defaultProps = {
    auth: { user: null },
    stats: { total_events: 0 },
    recentEvents: [],
    loading: false,
};
