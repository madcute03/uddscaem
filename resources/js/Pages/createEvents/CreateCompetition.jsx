import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Inertia } from '@inertiajs/inertia';
import EventTypeSelector from '@/Components/EventTypeSelector';

// Custom DateTime Picker Component
const DateTimePicker = ({ value, onChange, label, placeholder = "Select date and time" }) => {
    const [dateValue, setDateValue] = useState(value ? value.split('T')[0] : '');
    const [timeValue, setTimeValue] = useState(value ? value.split('T')[1]?.substring(0, 5) || '12:00' : '12:00');
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [activeTab, setActiveTab] = useState('date'); // 'date' or 'time'
    
    // Parse time into hours, minutes, and AM/PM
    const parseTime = (timeStr) => {
        if (!timeStr) return { hour: 12, minute: 0, period: 'AM' };
        
        const [hours, minutes] = timeStr.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        let hour = hours % 12;
        if (hour === 0) hour = 12; // Convert 0 to 12 for 12-hour format
        
        return {
            hour: hour,
            minute: minutes || 0,
            period: period
        };
    };
    
    const [time, setTime] = useState(parseTime(timeValue));
    
    // Generate time options
    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: 60 }, (_, i) => i); // 0 to 59
    const periods = ['AM', 'PM'];

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

    const formatDateTime = (value) => {
        const parsed = parseDateTimeValue(value);
        if (!parsed) return '';
        return parsed.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const handleDateSelect = (date) => {
        if (date) {
            // Create a new date string in YYYY-MM-DD format without timezone conversion
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const newDate = `${year}-${month}-${day}`;
            
            setDateValue(newDate);
            updateDateTime(newDate, timeValue);
            setActiveTab('time');
        }
    };

    const handleTimeChange = (field, value) => {
        const newTime = { ...time, [field]: value };
        setTime(newTime);
        
        // Convert to 24-hour format for storage
        let hour24 = newTime.hour;
        if (newTime.period === 'PM' && hour24 < 12) {
            hour24 += 12;
        } else if (newTime.period === 'AM' && hour24 === 12) {
            hour24 = 0;
        }
        
        const formattedTime = `${String(hour24).padStart(2, '0')}:${String(newTime.minute).padStart(2, '0')}`;
        setTimeValue(formattedTime);
        updateDateTime(dateValue, formattedTime);
    };

    const updateDateTime = (date, time) => {
        if (date && time) {
            const dateTimeString = `${date}T${time}:00`;
            onChange(dateTimeString);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const parsed = parseDateTimeValue(`${dateString}T00:00`);
        if (!parsed) return '';
        return parsed.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    };


    const navigateMonth = (direction) => {
        setCurrentMonth(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + direction);
            return newDate;
        });
    };

    const isSelected = (date) => {
        if (!date || !dateValue) return false;
        return date.toISOString().split('T')[0] === dateValue;
    };

    const isToday = (date) => {
        if (!date) return false;
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const days = getDaysInMonth(currentMonth);
    const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
        <div className="relative">
            <div
                className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 rounded-md px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600/50 flex items-center justify-between"
                onClick={() => {
                    setIsOpen(true);
                    setActiveTab('date');
                }}
            >
                <span className={value ? 'text-slate-100' : 'text-slate-400'}>
                    {value ? formatDateTime(value) : placeholder}
                </span>
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/60 z-[70]"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
                        <div
                            className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-100">Select Event Start</h3>
                                    <p className="text-sm text-slate-400">{monthYear}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="text-slate-400 hover:text-slate-200"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="flex border-b border-slate-700 mb-4">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('date')}
                                    className={`px-4 py-2 font-medium text-sm ${activeTab === 'date' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    Date
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('time')}
                                    className={`px-4 py-2 font-medium text-sm ${activeTab === 'time' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    Time
                                </button>
                            </div>

                            {activeTab === 'date' && (
                                <>
                                    <div className="flex items-center justify-between mb-4">
                                        <button
                                            type="button"
                                            onClick={() => navigateMonth(-1)}
                                            className="p-2 hover:bg-slate-800 rounded-full"
                                        >
                                            <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <h4 className="text-base font-medium text-slate-100">{monthYear}</h4>
                                        <button
                                            type="button"
                                            onClick={() => navigateMonth(1)}
                                            className="p-2 hover:bg-slate-800 rounded-full"
                                        >
                                            <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-7 gap-1 mb-2">
                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                            <div key={day} className="text-xs text-slate-400 text-center py-1 font-medium">
                                                {day}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-7 gap-1">
                                        {days.map((date, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => handleDateSelect(date)}
                                                disabled={!date}
                                                className={`
                                                    h-10 text-sm rounded-md transition-colors
                                                    ${!date ? 'invisible' : ''}
                                                    ${isSelected(date)
                                                        ? 'bg-blue-600 text-white'
                                                        : isToday(date)
                                                            ? 'bg-slate-700 text-slate-100 hover:bg-slate-600'
                                                            : 'text-slate-200 hover:bg-slate-800'
                                                    }
                                                `}
                                            >
                                                {date?.getDate()}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}

                            {activeTab === 'time' && (
                                <div className="py-2">
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Selected Date: {dateValue ? formatDate(dateValue) : 'No date selected'}
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <label className="block text-xs text-slate-400 mb-1">Hour</label>
                                                <select
                                                    value={time.hour}
                                                    onChange={(e) => handleTimeChange('hour', parseInt(e.target.value))}
                                                    className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                                                >
                                                    {hours.map(h => (
                                                        <option key={h} value={h}>
                                                            {String(h).padStart(2, '0')}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-400 mb-1">Minute</label>
                                                <select
                                                    value={time.minute}
                                                    onChange={(e) => handleTimeChange('minute', parseInt(e.target.value))}
                                                    className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                                                >
                                                    {minutes.map(m => (
                                                        <option key={m} value={m}>
                                                            {String(m).padStart(2, '0')}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-400 mb-1">AM/PM</label>
                                                <select
                                                    value={time.period}
                                                    onChange={(e) => handleTimeChange('period', e.target.value)}
                                                    className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                                                >
                                                    {periods.map(p => (
                                                        <option key={p} value={p}>
                                                            {p}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-xs text-slate-400">
                                            Selected time: {time.hour.toString().padStart(2, '0')}:{time.minute.toString().padStart(2, '0')} {time.period}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 border border-slate-700 rounded-md"
                                >
                                    Close
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// Custom Calendar Component (kept for reference, not used)
const CalendarPicker = ({ value, onChange, label, placeholder = "Select date" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const parseToLocalDate = (dateValue) => {
        if (!dateValue) return null;
        if (dateValue instanceof Date) {
            return dateValue;
        }

        if (typeof dateValue === 'string') {
            const [datePart] = dateValue.split('T');
            const parts = datePart?.split('-');
            if (parts && parts.length === 3) {
                const [year, month, day] = parts.map(Number);
                return new Date(year, (month ?? 1) - 1, day ?? 1);
            }
        }

        const parsed = new Date(dateValue);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const formatDate = (dateValue) => {
        const date = parseToLocalDate(dateValue);
        if (!date) return '';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    };

    const toDateString = (dateValue) => {
        if (!dateValue) return '';
        const date = parseToLocalDate(dateValue);
        if (!date) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleDateSelect = (date) => {
        if (date) {
            onChange(toDateString(date));
            setIsOpen(false);
        }
    };

    const navigateMonth = (direction) => {
        setCurrentMonth(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + direction);
            return newDate;
        });
    };

    const isSelected = (date) => {
        if (!date || !value) return false;
        return toDateString(date) === toDateString(value);
    };

    const isToday = (date) => {
        if (!date) return false;
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const days = getDaysInMonth(currentMonth);
    const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
        <div className="relative">
            <label className="block mb-1 text-slate-300">{label}</label>
            <div
                className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 rounded-md px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600/50 flex items-center justify-between"
                onClick={() => setIsOpen(true)}
            >
                <span className={value ? 'text-slate-100' : 'text-slate-400'}>
                    {value ? formatDate(value) : placeholder}
                </span>
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/60 z-[70]"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
                        <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-100">Select Date</h3>
                                    <p className="text-sm text-slate-400">{monthYear}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="text-slate-400 hover:text-slate-200"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Calendar Header */}
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    type="button"
                                    onClick={() => navigateMonth(-1)}
                                    className="p-2 hover:bg-slate-800 rounded-full"
                                >
                                    <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <h4 className="text-base font-medium text-slate-100">{monthYear}</h4>
                                <button
                                    type="button"
                                    onClick={() => navigateMonth(1)}
                                    className="p-2 hover:bg-slate-800 rounded-full"
                                >
                                    <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>

                            {/* Days of Week */}
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="text-xs text-slate-400 text-center py-1 font-medium">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Days */}
                            <div className="grid grid-cols-7 gap-1">
                                {days.map((date, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => handleDateSelect(date)}
                                        disabled={!date}
                                        className={`
                                            h-10 text-sm rounded-md transition-colors
                                            ${!date ? 'invisible' : ''}
                                            ${isSelected(date)
                                                ? 'bg-blue-600 text-white'
                                                : isToday(date)
                                                    ? 'bg-slate-700 text-slate-100 hover:bg-slate-600'
                                                    : 'text-slate-200 hover:bg-slate-800'
                                            }
                                        `}
                                    >
                                        {date?.getDate()}
                                    </button>
                                ))}
                            </div>

                            <div className="flex justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
;

export default function CreateCompetition({ auth, events = [] }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        description: '',
        coordinator_name: '',
        venue: '',
        participants: [''],
        category: 'sport', // Default to sport
        other_category: '', // For 'other' category input
        event_type: 'competition', // Set default to 'competition'
        other_event_type: '',
        event_date: '',
        event_end_date: '',
        registration_end_date: '',
        has_registration_end_date: false,
        has_required_players: false,
        allow_bracketing: false,
        images: [],
        rulebook: null,
        required_players: '',
        registration_type: 'single', // 'single' or 'team'
        team_size: '', // Number of players per team
    });

    const [editingEventId, setEditingEventId] = useState(null);
    const [showDateWarning, setShowDateWarning] = useState(false);
    const [pendingSubmit, setPendingSubmit] = useState(false);
    const [editData, setEditData] = useState({
        title: '',
        description: '',
        coordinator_name: '',
        participants: [''],
        event_date: '',
        event_end_date: '',
        registration_end_date: '', // 
        images: [],
        required_players: '',
        registration_type: 'single',
        team_size: '',
    });

    const checkDateAndSubmit = (e) => {
        e.preventDefault();

        // Check if event date is in the past
        const today = new Date().toISOString().split('T')[0];
        if (data.event_date && data.event_date < today) {
            setShowDateWarning(true);
            setPendingSubmit(true);
            return;
        }

        // Proceed with submission
        handleSubmit();
    };

    const handleSubmit = () => {
        const formData = new FormData();
        
        // Add all form data to formData object
        Object.entries(data).forEach(([key, value]) => {
            if (key === 'images') {
                // Handle file uploads
                data.images.forEach((image, index) => {
                    if (image instanceof File) {
                        formData.append(`images[${index}]`, image);
                    }
                });
            } else if (key === 'rulebook') {
                // Handle rulebook file upload
                if (value instanceof File) {
                    formData.append('rulebook', value);
                }
            } else if (key === 'participants') {
                (value || [])
                    .map(participant => (participant || '').trim())
                    .filter(participant => participant.length > 0)
                    .forEach((participant, index) => {
                        formData.append(`participants[${index}]`, participant);
                    });
            } else if (key === 'registration_end_date' && !data.has_registration_end_date) {
                // Skip registration end date if not enabled
                return;
            } else if (key === 'team_size' && data.registration_type !== 'team') {
                // Skip team size if not team registration
                return;
            } else if (value !== null && value !== undefined) {
                // Handle all other fields
                formData.append(key, value);
            }
        });

        // Make sure to set the correct headers for file upload
        post('/events', formData, {
            forceFormData: true,
            onSuccess: () => {
                reset();
                // Clear file inputs after successful submission
                const fileInputs = document.querySelectorAll('input[type="file"]');
                fileInputs.forEach(input => {
                    input.value = '';
                });
            },
            onError: (errors) => {
                console.error('Error creating event:', errors);
            },
            preserveScroll: true
        });
    };

    const confirmPastDateSubmit = () => {
        setShowDateWarning(false);
        setPendingSubmit(false);
        handleSubmit();
    };

    const cancelPastDateSubmit = () => {
        setShowDateWarning(false);
        setPendingSubmit(false);
    };

    const startEdit = (event) => {
        setEditingEventId(event.id);
        setEditData({
            title: event.title,
            description: event.description,
            coordinator_name: event.coordinator_name,
            participants: Array.isArray(event.participants) && event.participants.length > 0
                ? event.participants
                : [''],
            event_date: event.event_date,
            event_end_date: event.event_end_date ? event.event_end_date.split('T')[0] : '',
            registration_end_date: event.registration_end_date || '',
            images: [], // bagong uploads
            existingImages: event.images_path || [], // existing images
            required_players: event.required_players,
            registration_type: event.registration_type || 'single',
            team_size: event.team_size || '',
        });
    };


    const handleEditSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData();

        Object.entries(editData).forEach(([key, val]) => {
            if (key === 'images') {
                val.forEach(img => img && formData.append('images[]', img));
            } else if (key === 'existingImages') {
                val.forEach(imgPath => formData.append('existing_images[]', imgPath));
            } else if (key === 'participants') {
                (val || [])
                    .map(participant => (participant || '').trim())
                    .filter(participant => participant.length > 0)
                    .forEach((participant, index) => {
                        formData.append(`participants[${index}]`, participant);
                    });
            } else if (key === 'team_size' && editData.registration_type !== 'team') {
                // Skip team size if not team registration
                return;
            } else {
                formData.append(key, val);
            }
        });

        fetch(`/events/${editingEventId}`, {
            method: 'POST',
            headers: {
                'X-HTTP-Method-Override': 'PUT',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
            },
            body: formData
        }).then(response => {
            if (response.ok) {
                setEditingEventId(null);
                window.location.reload();
            } else {
                alert('Failed to update event. Please try again.');
            }
        }).catch(error => {
            console.error('Error updating event:', error);
            alert('An error occurred while updating the event.');
        });
    };


    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this event?')) {
            fetch(`/events/${id}`, {
                method: 'POST',
                headers: {
                    'X-HTTP-Method-Override': 'DELETE',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                }
            }).then(response => {
                if (response.ok) {
                    window.location.reload();
                } else {
                    alert('Failed to delete event. Please try again.');
                }
            }).catch(error => {
                console.error('Error deleting event:', error);
                alert('An error occurred while deleting the event.');
            });
        }
    };
    const handleMarkDone = (id) => {
        fetch(`/events/${id}/done`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        })
            .then(async res => {
                if (!res.ok) throw new Error("Failed request");
                return res.json();
            })
            .then(data => {
                if (data.success) {
                    window.location.reload();
                } else {
                    alert("Failed to mark event as done.");
                }
            })
            .catch(err => console.error(err));
    };





    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="CreateEvent" />

            <div className="py-8 px-2 sm:px-4 md:px-8">
                <div className="mx-auto max-w-4xl w-full space-y-6">

                    {/* Back Button */}
                    <Link 
                        href={route('dashboard')}
                        className="inline-flex items-center text-slate-300 hover:text-white mb-4 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Events
                    </Link>
                    
                    {/* Create Event Form */}
                    <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-xl shadow-lg shadow-blue-950/30">
                        <div className="flex flex-col space-y-4">
                            {/* Event Type Selector - Moved to top */}
                            <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700">
                                <EventTypeSelector
                                    value={{
                                        event_type: data.event_type,
                                        other_event_type: data.other_event_type || ''
                                    }}
                                    onChange={(newValue) => {
                                        setData({
                                            ...data,
                                            ...newValue
                                        });
                                    }}
                                    error={errors.event_type}
                                />
                                {errors.event_type && (
                                    <p className="mt-1 text-sm text-red-500">{errors.event_type}</p>
                                )}
                                {data.event_type === 'other' && errors.other_event_type && (
                                    <p className="mt-1 text-sm text-red-500">{errors.other_event_type}</p>
                                )}
                            </div>

                            {/* Registration Settings */}
                            <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700">
                                <h3 className="text-lg font-medium text-slate-200 mb-4">Settings</h3>
                                <div className="flex flex-col space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm text-slate-300">Enable Registration</span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={data.has_registration_end_date}
                                                    onChange={(e) => setData('has_registration_end_date', e.target.checked)}
                                                />
                                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Registration Type Selection - Only show if registration is enabled */}
                                    {data.has_registration_end_date && (
                                        <div className="ml-4">
                                            <label className="block mb-3 text-slate-300">Registration Type</label>
                                            <div className="space-y-2">
                                                <div className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        id="single-registration"
                                                        name="registration_type"
                                                        value="single"
                                                        checked={data.registration_type === 'single'}
                                                        onChange={(e) => {
                                                            setData('registration_type', e.target.value);
                                                            if (e.target.value === 'single') {
                                                                setData('team_size', '');
                                                            }
                                                        }}
                                                        className="mr-2 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <label htmlFor="single-registration" className="text-slate-300">
                                                        Single Registration (Individual participants)
                                                    </label>
                                                </div>
                                                <div className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        id="team-registration"
                                                        name="registration_type"
                                                        value="team"
                                                        checked={data.registration_type === 'team'}
                                                        onChange={(e) => setData('registration_type', e.target.value)}
                                                        className="mr-2 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <label htmlFor="team-registration" className="text-slate-300">
                                                        Team Registration
                                                    </label>
                                                </div>
                                            </div>
                                            {errors.registration_type && (
                                                <p className="text-red-500 text-xs mt-1">{errors.registration_type}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Team Size Input - Only show if team registration is selected */}
                                    {data.has_registration_end_date && data.registration_type === 'team' && (
                                        <div className="ml-4">
                                            <label className="block mb-1 text-slate-300">Number of Players per Team</label>
                                            <input
                                                type="number"
                                                min="2"
                                                max="50"
                                                className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                                                value={data.team_size}
                                                onChange={(e) => setData('team_size', e.target.value)}
                                                placeholder="Enter number of players per team"
                                            />
                                            {errors.team_size && (
                                                <p className="text-red-500 text-xs mt-1">{errors.team_size}</p>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm text-slate-300">Enable Bracketing</span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={data.allow_bracketing}
                                                    onChange={(e) => setData('allow_bracketing', e.target.checked)}
                                                />
                                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <form onSubmit={checkDateAndSubmit} encType="multipart/form-data" className="mt-6 space-y-6">
                            {/* Basic Information */}
                            <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700">
                                <h3 className="text-lg font-medium text-slate-200 mb-4">Basic Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block mb-1 text-slate-300">Event Title</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                                            value={data.title}
                                            onChange={e => setData('title', e.target.value)}
                                            placeholder="Enter event title"
                                        />
                                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block mb-1 text-slate-300">Description</label>
                                        <textarea
                                            className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                                            value={data.description}
                                            onChange={e => setData('description', e.target.value)}
                                            rows={10}
                                            placeholder="Enter event description"
                                        />
                                        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                                    </div>
                                    <div>
                                        <label className="block mb-1 text-slate-300">Coordinator</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                                            value={data.coordinator_name}
                                            onChange={e => setData('coordinator_name', e.target.value)}
                                            placeholder="Enter coordinator name"
                                        />
                                        {errors.coordinator_name && <p className="text-red-500 text-xs mt-1">{errors.coordinator_name}</p>}
                                    </div>
                                    <div>
                                        <label className="block mb-1 text-slate-300">Venue</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                                            value={data.venue}
                                            onChange={e => setData('venue', e.target.value)}
                                            placeholder="Enter event venue"
                                        />
                                        {errors.venue && <p className="text-red-500 text-xs mt-1">{errors.venue}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Category & Participants */}
                            <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700">
                                <h3 className="text-lg font-medium text-slate-200 mb-4">Category & Participants</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block mb-1 text-slate-300">Category</label>
                                        <select
                                            className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                                            value={data.category}
                                            onChange={(e) => setData('category', e.target.value)}
                                        >
                                            <option value="sport">Sport</option>
                                            <option value="culture">Culture</option>
                                            <option value="arts">Arts</option>
                                            <option value="intramurals">Intramurals</option>
                                            <option value="other">Other (please specify)</option>
                                        </select>
                                        {data.category === 'other' && (
                                            <div className="mt-2">
                                                <input
                                                    type="text"
                                                    className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                                                    placeholder="Please specify category"
                                                    value={data.other_category}
                                                    onChange={(e) => setData('other_category', e.target.value)}
                                                />
                                                {errors.other_category && <p className="text-red-500 text-xs mt-1">{errors.other_category}</p>}
                                            </div>
                                        )}
                                        {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                                    </div>
                                    <div>
                                        <label className="block mb-2 text-slate-300">Participants</label>
                                        <div className="space-y-2">
                                            {data.participants.map((participant, index) => {
                                                const trimmedError = (() => {
                                                    if (!errors) return null;
                                                    if (Array.isArray(errors.participants)) {
                                                        return errors.participants[index] || null;
                                                    }
                                                    return (
                                                        errors[`participants.${index}`] ||
                                                        (typeof errors.participants === 'string' ? errors.participants : null)
                                                    );
                                                })();

                                                return (
                                                    <div key={index} className="space-y-1">
                                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                            <input
                                                                type="text"
                                                                className="flex-1 bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                                                                value={participant}
                                                                placeholder={`Participant ${index + 1}`}
                                                                onChange={e => {
                                                                    const updated = [...data.participants];
                                                                    updated[index] = e.target.value;
                                                                    setData('participants', updated);
                                                                }}
                                                            />
                                                            {data.participants.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    className="px-3 py-2 text-sm text-red-300 hover:text-red-200"
                                                                    onClick={() => {
                                                                        const updated = data.participants.filter((_, idx) => idx !== index);
                                                                        setData('participants', updated.length > 0 ? updated : ['']);
                                                                    }}
                                                                >
                                                                    Remove
                                                                </button>
                                                            )}
                                                        </div>
                                                        {trimmedError && (
                                                            <p className="text-xs text-red-500">{trimmedError}</p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <button
                                            type="button"
                                            className="mt-3 text-blue-300 hover:text-blue-200 underline"
                                            onClick={() => setData('participants', [...data.participants, ''])}
                                        >
                                            + Add participant
                                        </button>
                                        {errors.participants && <p className="text-red-500 text-xs mt-1">{errors.participants}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Event Dates */}
                            <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700">
                                <h3 className="text-lg font-medium text-slate-200 mb-4">Event Dates</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block mb-1 text-slate-300">Event Start Date & Time</label>
                                        <DateTimePicker
                                            value={data.event_date}
                                            onChange={(value) => setData('event_date', value)}
                                            label=""
                                            placeholder="Select event date and time"
                                        />
                                        {errors.event_date && <p className="text-red-500 text-xs mt-1">{errors.event_date}</p>}
                                    </div>
                                    <div>
                                        <label className="block mb-1 text-slate-300">Event End Date</label>
                                        <CalendarPicker
                                            value={data.event_end_date}
                                            onChange={(value) => setData('event_end_date', value)}
                                            placeholder="Select event end date"
                                        />
                                        {errors.event_end_date && <p className="text-red-500 text-xs mt-1">{errors.event_end_date}</p>}
                                    </div>
                                    {/* Registration End Date - Only show if registration is enabled */}
                                    {data.has_registration_end_date && (
                                        <div className="md:col-span-2">
                                            <label className="block mb-1 text-slate-300">Registration End Date & Time</label>
                                            <DateTimePicker
                                                value={data.registration_end_date}
                                                onChange={(value) => setData('registration_end_date', value)}
                                                label=""
                                                placeholder="Select registration end date and time"
                                            />
                                            {errors.registration_end_date && (
                                                <p className="text-red-500 text-xs mt-1">{errors.registration_end_date}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Images */}
                            <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700">
                                <h3 className="text-lg font-medium text-slate-200 mb-4">Event Images</h3>
                                <div className="mb-2">
                                    <label className="block mb-1 text-slate-300">Image of the event</label>
                                    {data.images.map((img, idx) => (
                                        <input
                                            key={idx}
                                            type="file"
                                            className="bg-slate-800/60 border border-slate-700 text-slate-100 rounded-md mt-1 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-slate-700 file:text-slate-100 hover:file:bg-slate-600"
                                            style={{width: '100%'}}
                                            onChange={e => {
                                                const newImages = [...data.images];
                                                newImages[idx] = e.target.files[0];
                                                setData('images', newImages);
                                            }}
                                        />
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setData('images', [...data.images, null])}
                                        className="mt-2 text-blue-300 hover:text-blue-200 underline"
                                    >
                                        + Add image
                                    </button>
                                    {errors.images && <p className="text-red-500 text-xs mt-1">{errors.images}</p>}
                                </div>
                            </div>
                            {/* Rulebook Document */}
                            <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700">
                                <h3 className="text-lg font-medium text-slate-200 mb-4">Rulebook Document (Optional)</h3>
                                <div className="mb-2">
                                    <label className="block mb-1 text-slate-300">Upload rulebook document</label>
                                    <input
                                        type="file"
                                        className="bg-slate-800/60 border border-slate-700 text-slate-100 rounded-md mt-1 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-slate-700 file:text-slate-100 hover:file:bg-slate-600"
                                        style={{width: '100%'}}
                                        accept=".pdf,.doc,.docx,.txt"
                                        onChange={e => {
                                            setData('rulebook', e.target.files[0] || null);
                                        }}
                                    />
                                    {data.rulebook && (
                                        <p className="text-sm text-slate-400 mt-1">
                                            Selected: {data.rulebook.name}
                                        </p>
                                    )}
                                    <p className="text-xs text-slate-400 mt-1">
                                        Accepted formats: PDF, DOC, DOCX, TXT (optional)
                                    </p>
                                    {errors.rulebook && <p className="text-red-500 text-xs mt-1">{errors.rulebook}</p>}
                                </div>
                            </div>

                            <button type="submit" className="w-[131px] h-[45px] rounded-[15px] cursor-pointer
                                                               transition duration-300 ease-in-out
                                                               bg-gradient-to-br from-[#2e8eff] to-[#2e8eff]/0
                                                               bg-[#2e8eff]/20 flex items-center justify-center
                                                               hover:bg-[#2e8eff]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)]
                                                               focus:outline-none focus:bg-[#2e8eff]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]">
                                Create Event
                            </button>
                        </form>
                    </div>

                    {/* Event List moved to Dashboard */}
                </div>
            </div>

            {/* Date Warning Modal */}
            {showDateWarning && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md mx-4 shadow-xl">
                        <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center mr-3">
                                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-slate-100">Warning: Past Date Selected</h3>
                        </div>

                        <p className="text-slate-300 mb-6">
                            Ang event date na pinili mo ay nakaraan na. Sigurado ka ba na gusto mo itong i-create?
                        </p>

                        <div className="flex space-x-3">
                            <button
                                onClick={confirmPastDateSubmit}
                                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                            >
                                Yes, Create Event
                            </button>
                            <button
                                onClick={cancelPastDateSubmit}
                                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}