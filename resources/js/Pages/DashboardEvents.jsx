import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import React, { useState, useEffect } from 'react'
import { usePage, Link, router } from '@inertiajs/react'

// Custom DateTime Picker Component
const DateTimePicker = ({ value, onChange, label, placeholder = "Select date and time" }) => {
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

    const parsedInitial = parseDateTimeValue(value);
    const initialDate = parsedInitial
        ? `${parsedInitial.getFullYear()}-${String(parsedInitial.getMonth() + 1).padStart(2, '0')}-${String(parsedInitial.getDate()).padStart(2, '0')}`
        : '';
    const initialTime = parsedInitial
        ? `${String(parsedInitial.getHours()).padStart(2, '0')}:${String(parsedInitial.getMinutes()).padStart(2, '0')}`
        : '12:00';

    const [dateValue, setDateValue] = useState(initialDate);
    const [timeValue, setTimeValue] = useState(initialTime);
    const [time, setTime] = useState(parseTime(initialTime));
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [activeTab, setActiveTab] = useState('date'); // 'date' or 'time'
    const [isMobile, setIsMobile] = useState(false);

    // Generate time options
    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: 60 }, (_, i) => i); // 0 to 59
    const periods = ['AM', 'PM'];

    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        // Initial check
        checkIfMobile();

        // Add event listener for window resize
        window.addEventListener('resize', checkIfMobile);

        // Cleanup
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    const formatDateTime = (dateTime) => {
        const parsed = parseDateTimeValue(dateTime);
        if (!parsed) return '';
        return parsed.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const handleDateSelect = (date) => {
        if (date) {
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
        if (date && (time || timeValue)) {
            const timeToUse = time || timeValue || '00:00';
            const dateTimeString = `${date}T${timeToUse}:00`;
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

    const navigateMonth = (direction) => {
        setCurrentMonth(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + direction);
            return newDate;
        });
    };

    const isSelected = (date) => {
        if (!date || !dateValue) return false;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}` === dateValue;
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
            {label && (
                <label className="block mb-1 text-slate-300">{label}</label>
            )}
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
                                    <h3 className="text-lg font-semibold text-slate-100">Select Date & Time</h3>
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
                                        <div className="grid grid-cols-3 gap-2 mb-3">
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
                                        <div className="text-sm text-slate-300 text-center">
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
                                    Cancel
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

const DatePicker = ({ value, onChange, label, placeholder = "Select date" }) => {
    const parseDateValue = (dateValue) => {
        if (!dateValue) return null;

        if (dateValue instanceof Date) {
            return dateValue;
        }

        const stringValue = String(dateValue).trim();
        if (!stringValue) return null;

        const normalized = stringValue.includes('T') ? stringValue : `${stringValue}T00:00`;
        const cleaned = normalized
            .replace(/Z$/i, '')
            .replace(/\.[0-9]+$/, '')
            .replace(/([+-][0-9:]+)$/, '');

        const parsed = new Date(cleaned);
        if (Number.isNaN(parsed.getTime())) {
            const [datePart] = cleaned.split('T');
            if (!datePart) return null;
            const [yearStr, monthStr, dayStr] = datePart.split('-');
            const year = Number(yearStr);
            const month = Number(monthStr ?? 1) - 1;
            const day = Number(dayStr ?? 1);
            if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
                return null;
            }
            return new Date(year, month, day, 0, 0, 0);
        }

        return parsed;
    };

    const toDateString = (date) => {
        if (!(date instanceof Date)) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatDate = (dateValue) => {
        const parsed = parseDateValue(dateValue);
        if (!parsed) return '';
        return parsed.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const parsedInitial = parseDateValue(value);
    const initialDate = parsedInitial ? toDateString(parsedInitial) : '';
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(parsedInitial || new Date());

    useEffect(() => {
        const parsed = parseDateValue(value);
        if (parsed) {
            setSelectedDate(toDateString(parsed));
            setCurrentMonth(parsed);
        } else {
            setSelectedDate('');
            setCurrentMonth(new Date());
        }
    }, [value]);

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

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
        if (!date || !selectedDate) return false;
        return toDateString(date) === selectedDate;
    };

    const isToday = (date) => {
        if (!date) return false;
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const days = getDaysInMonth(currentMonth);
    const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const handleDateSelect = (date) => {
        if (!date) return;
        const newDate = toDateString(date);
        setSelectedDate(newDate);
        if (onChange) {
            onChange(newDate);
        }
        setIsOpen(false);
    };

    return (
        <div className="relative">
            {label && (
                <label className="block mb-1 text-slate-300">{label}</label>
            )}
            <div
                className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 rounded-md px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600/50 flex items-center justify-between"
                onClick={() => setIsOpen(true)}
            >
                <span className={selectedDate ? 'text-slate-100' : 'text-slate-400'}>
                    {selectedDate ? formatDate(selectedDate) : placeholder}
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

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 border border-slate-700 rounded-md"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

function Dashboard() {
    const { auth, events = [], flash = {} } = usePage().props;
    const user = auth.user;
    const [currentSlide, setCurrentSlide] = useState({});

    // Effect to update event statuses in real-time
    useEffect(() => {
        // Update event statuses every minute
        const intervalId = setInterval(() => {
            // Force a re-render to update statuses
            setCurrentSlide(prev => ({ ...prev }));
        }, 60000); // Check every minute

        return () => clearInterval(intervalId);
    }, []);

    const defaultEventForm = {
        title: '',
        description: '',
        event_type: 'competition',
        category: 'sport',
        other_category: '',
        venue: '',
        coordinator_name: '',
        participants: [''],
        event_date: '',
        event_end_date: '',
        registration_end_date: '',
        has_registration_end_date: false,
        required_players: '',
        has_required_players: false,
        allow_bracketing: false,
        images: [],
        rulebook: null,
        registration_type: 'single',
        team_size: '',
    };

    const [editingEventId, setEditingEventId] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [eventForm, setEventForm] = useState({ ...defaultEventForm });
    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'upcoming', 'ongoing', 'completed'
    const [editData, setEditData] = useState({
        id: '',
        title: '',
        description: '',
        event_type: '',
        category: 'sport',
        other_category: '',
        event_date: '',
        event_end_date: '',
        registration_end_date: '',
        coordinator_name: '',
        participants: [''],
        images: [],
        existingImages: [],
        rulebook: null,
        allow_bracketing: false,
        has_registration_end_date: false,
        required_players: '',
        has_required_players: false,
        registration_type: 'team',
        team_size: '',
    });

    const [successMessage, setSuccessMessage] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    // Ensure images is always an array
    const safeImages = Array.isArray(editData.images) ? editData.images : [];

    useEffect(() => {
        if (flash?.success) {
            setSuccessMessage(flash.success);
            setErrorMessage(null);
        }
    }, [flash]);

    useEffect(() => {
        if (!successMessage) return;

        const timer = setTimeout(() => {
            setSuccessMessage(null);
        }, 3000);

        return () => clearTimeout(timer);
    }, [successMessage]);

    // Categorize events
    const now = new Date();

    const categorizedEvents = events.reduce((acc, event) => {
        const eventStart = new Date(event.event_date);
        const eventEnd = event.event_end_date ? new Date(event.event_end_date) : new Date(eventStart);

        // If current time is after the event end date, it's completed
        if (now > eventEnd) {
            acc.completed.push(event);
        }
        // If current time is between start and end (or just after start if no end date), it's ongoing
        else if (now >= eventStart && now <= eventEnd) {
            acc.ongoing.push(event);
        }
        // Otherwise, it's upcoming
        else {
            acc.upcoming.push(event);
        }

        return acc;
    }, { upcoming: [], ongoing: [], completed: [] });

    // Get events based on active filter
    const getFilteredEvents = () => {
        switch (activeFilter) {
            case 'upcoming':
                return categorizedEvents.upcoming;
            case 'ongoing':
                return categorizedEvents.ongoing;
            case 'completed':
                return categorizedEvents.completed;
            default:
                return events; // All events
        }
    };

    // Event type color mapping
    const eventTypeColorDefaults = {
        'basketball': 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
        'volleyball': 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
        'badminton': 'bg-green-500/20 text-green-300 border border-green-500/30',
        'chess': 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
        'table tennis': 'bg-red-500/20 text-red-300 border border-red-500/30',
        'swimming': 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
        'soccer': 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
        'futsal': 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
        'dance': 'bg-pink-500/20 text-pink-300 border border-pink-500/30',
        'esports': 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
    };

    const eventTypePalette = [
        'bg-blue-500/20 text-blue-300 border border-blue-500/30',
        'bg-orange-500/20 text-orange-300 border border-orange-500/30',
        'bg-green-500/20 text-green-300 border border-green-500/30',
        'bg-purple-500/20 text-purple-300 border border-purple-500/30',
        'bg-red-500/20 text-red-300 border border-red-500/30',
        'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
        'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
        'bg-pink-500/20 text-pink-300 border border-pink-500/30',
        'bg-slate-500/20 text-slate-300 border border-slate-500/30',
        'bg-amber-500/20 text-amber-300 border border-amber-500/30',
        'bg-rose-500/20 text-rose-300 border border-rose-500/30'
    ];

    const hashString = (value) => {
        let hash = 0;
        for (let i = 0; i < value.length; i++) {
            hash = (hash << 5) - hash + value.charCodeAt(i);
            hash |= 0; // Convert to 32bit integer
        }
        return Math.abs(hash);
    };

    const getEventStatus = (event) => {
        const now = new Date();

        try {
            // Parse start date
            const startDate = new Date(event.event_date);
            if (isNaN(startDate.getTime())) {
                console.warn('Invalid start date for event:', event.id, 'Date:', event.event_date);
                return {
                    label: 'UPCOMING',
                    className: 'bg-amber-500 text-white'
                };
            }

            // Parse end date (default to end of start date if not provided)
            let endDate = startDate;
            if (event.event_end_date) {
                endDate = new Date(event.event_end_date);
                // If no time is specified in end date, set to end of day
                if (event.event_end_date.split('T').length === 1) {
                    endDate.setHours(23, 59, 59, 999);
                }
            } else {
                // If no end date, set to end of start date
                endDate = new Date(startDate);
                endDate.setHours(23, 59, 59, 999);
            }

            console.log('Event Status Debug:', {
                eventId: event.id,
                eventTitle: event.title,
                eventDate: event.event_date,
                eventEndDate: event.event_end_date,
                parsedStart: startDate.toISOString(),
                parsedEnd: endDate.toISOString(),
                currentTime: now.toISOString(),
                startComparison: now < startDate,
                endComparison: now > endDate,
                timeUntilStart: startDate.getTime() - now.getTime(),
                timeUntilEnd: endDate.getTime() - now.getTime()
            });

            // If current time is before event start time
            if (now < startDate) {
                console.log('Event is UPCOMING - current time before start');
                return {
                    label: 'UPCOMING',
                    className: 'bg-amber-500 text-white'
                };
            }

            // If current time is after event end time
            if (now > endDate) {
                console.log('Event is COMPLETED - current time after end');
                return {
                    label: 'COMPLETED',
                    className: 'bg-gray-500 text-white'
                };
            }

            // If we're between start and end time
            console.log('Event is ONGOING - current time between start and end');
            return {
                label: 'ONGOING',
                className: 'bg-emerald-500 text-white'
            };

        } catch (error) {
            console.error('Error parsing event dates for event:', event.id, error);
            return {
                label: 'UPCOMING',
                className: 'bg-amber-500 text-white'
            };
        }
    };

    // Category color mapping
    const categoryColors = {
        'sport': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        'culture': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        'arts': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
        'intramurals': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        'other': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
        'default': 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    };

    const getCategoryLabel = (event) => {
        const category = event?.category;
        if (!category || typeof category !== 'string') {
            return 'Uncategorized';
        }

        if (category === 'other') {
            return event?.other_category?.trim() || 'Other';
        }

        return category.charAt(0).toUpperCase() + category.slice(1);
    };

    // Get color class for category
    const getCategoryColor = (category) => {
        return categoryColors[category] || categoryColors.default;
    };

    // Get color class for event type
    const getEventTypeColor = (type) => {
        const key = (type || 'general').toLowerCase();
        if (eventTypeColorDefaults[key]) {
            return eventTypeColorDefaults[key];
        }

        const paletteIndex = hashString(key) % eventTypePalette.length;
        return eventTypePalette[paletteIndex];
    };

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

    // Format date and time for display with AM/PM
    const formatDateTime = (dateTimeString, includeTime = true) => {
        const parsed = parseDateTimeValue(dateTimeString);
        if (!parsed) return '';

        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour12: true
        };

        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }

        // For mobile view, always include time in 12-hour format with AM/PM
        const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

        if (isMobile || includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
            options.hour12 = true;
        }

        return parsed.toLocaleString('en-US', options);
    };

    const formatDateOnly = (dateString) => {
        const parsed = parseDateTimeValue(`${dateString ?? ''}T00:00`);
        if (!parsed) return '';

        // Check if we're on mobile
        const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

        // For mobile, include time in 12-hour format with AM/PM
        if (isMobile) {
            return parsed.toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        }

        // For desktop, just show the date
        return parsed.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // Handle date time change for the event date
    const handleEventDateTimeChange = (dateTimeString) => {
        setEditData(prev => ({
            ...prev,
            event_date: dateTimeString
        }));
    };

    const handleRegistrationEndDateChange = (dateTimeString) => {
        setEditData(prev => ({
            ...prev,
            registration_end_date: dateTimeString
        }));
    };

    const handleCreateEventDateChange = (dateTimeString) => {
        setEventForm(prev => ({
            ...prev,
            event_date: dateTimeString
        }));
    };

    const handleCreateRegistrationEndChange = (dateTimeString) => {
        setEventForm(prev => ({
            ...prev,
            registration_end_date: dateTimeString
        }));
    };

    const normalizeDateTimeForOutput = (value) => {
        if (!value) return '';
        return value.length === 16 ? `${value}:00` : value;
    };

    // Handle date time change for the registration end date
    const normalizeDateTimeForInput = (value) => {
        if (!value) return '';
        const parsed = parseDateTimeValue(value);
        if (!parsed) return '';

        const year = parsed.getFullYear();
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const day = String(parsed.getDate()).padStart(2, '0');
        const hour = String(parsed.getHours()).padStart(2, '0');
        const minute = String(parsed.getMinutes()).padStart(2, '0');

        return `${year}-${month}-${day}T${hour}:${minute}`;
    };

    const normalizeDateOnlyForInput = (value) => {
        if (!value) return '';
        const parsed = parseDateTimeValue(value.includes('T') ? value : `${value}T00:00`);
        if (!parsed) return '';

        const year = parsed.getFullYear();
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const day = String(parsed.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    };

    const buildExistingImages = (event) => {
        if (Array.isArray(event.images) && event.images.length > 0) {
            return event.images.map((img) => {
                if (typeof img === 'string') {
                    return { image_path: img };
                }
                return img;
            });
        }

        if (Array.isArray(event.images_path) && event.images_path.length > 0) {
            return event.images_path.map((path) => ({ image_path: path }));
        }

        return [];
    };

    const startEdit = (event) => {
        const standardCategories = ['sport', 'culture', 'arts', 'intramurals'];
        const rawCategory = (event.category || '').toLowerCase();
        const isStandardCategory = standardCategories.includes(rawCategory);
        const derivedCategory = isStandardCategory ? rawCategory : 'other';
        const derivedOtherCategory = isStandardCategory
            ? (event.other_category || '')
            : (event.other_category || event.category || '');

        const eventDateValue = normalizeDateTimeForInput(event.event_date);
        const registrationEndDateValue = normalizeDateTimeForInput(event.registration_end_date);
        const eventEndDateValue = normalizeDateOnlyForInput(event.event_end_date);
        setEditingEventId(event.id);
        setIsCreating(false);
        setEditData({
            id: event.id,
            title: event.title || '',
            description: event.description || '',
            event_type: event.event_type || '',
            category: derivedCategory || 'sport',
            other_category: derivedOtherCategory,
            venue: event.venue || '',
            event_date: eventDateValue,
            event_end_date: eventEndDateValue,
            registration_end_date: registrationEndDateValue,
            coordinator_name: event.coordinator_name || '',
            participants: Array.isArray(event.participants) && event.participants.length > 0
                ? event.participants.map((participant) => (typeof participant === 'string' ? participant : '')).filter(Boolean)
                : [''],
            images: [],
            existingImages: buildExistingImages(event),
            rulebook: null, // New rulebook file uploads will go here
            allow_bracketing: !!event.allow_bracketing,
            has_registration_end_date: !!event.registration_end_date,
            required_players: event.required_players ? String(event.required_players) : '',
            has_required_players: !!event.required_players,
            registration_type: event.registration_type || 'team',
            team_size: event.team_size || '',
        });
    };

    const resetCreateState = () => {
        setEventForm({ ...defaultEventForm });
        setIsCreating(false);
        setValidationErrors({});
    };

    const startCreate = () => {
        setEditingEventId(null);
        setIsCreating(true);
        setValidationErrors({});
        setEventForm({ ...defaultEventForm });
    };

    const handleCreateSubmit = (e) => {
        e.preventDefault();

        const formData = new FormData();

        formData.append('title', eventForm.title);
        formData.append('description', eventForm.description);
        formData.append('venue', eventForm.venue || '');
        formData.append('coordinator_name', eventForm.coordinator_name);
        formData.append('event_type', eventForm.event_type);
        formData.append('category', eventForm.category);
        formData.append('other_category', eventForm.other_category || '');
        formData.append('allow_bracketing', eventForm.allow_bracketing ? '1' : '0');

        if (eventForm.event_date) {
            formData.append('event_date', normalizeDateTimeForOutput(eventForm.event_date));
        }

        if (eventForm.event_end_date) {
            formData.append('event_end_date', eventForm.event_end_date);
        }

        formData.append('has_registration_end_date', eventForm.has_registration_end_date ? '1' : '0');
        if (eventForm.has_registration_end_date && eventForm.registration_end_date) {
            formData.append('registration_end_date', normalizeDateTimeForOutput(eventForm.registration_end_date));
        }

        formData.append('has_required_players', eventForm.has_required_players ? '1' : '0');
        if (eventForm.has_required_players && eventForm.required_players) {
            formData.append('required_players', eventForm.required_players);
        }

        (eventForm.participants || [])
            .map((participant) => (typeof participant === 'string' ? participant.trim() : ''))
            .filter(Boolean)
            .forEach((participant, index) => {
                formData.append(`participants[${index}]`, participant);
            });

        if (eventForm.images && eventForm.images.length > 0) {
            eventForm.images.forEach((file) => {
                if (file instanceof File) {
                    formData.append('images[]', file);
                }
            });
        }

        setValidationErrors({});
        setErrorMessage(null);

        router.post('/events', formData, {
            forceFormData: true,
            onSuccess: () => {
                resetCreateState();
            },
            onError: (errors) => {
                setValidationErrors(errors || {});
                setErrorMessage('Please review the form for errors.');
            },
        });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();

        try {
            const formData = new FormData();

            formData.append('_method', 'PUT');
            formData.append('title', editData.title);
            formData.append('description', editData.description);
            formData.append('venue', editData.venue || '');
            formData.append('coordinator_name', editData.coordinator_name);
            formData.append('event_type', editData.event_type);
            formData.append('category', editData.category);
            formData.append('other_category', editData.other_category || '');
            formData.append('allow_bracketing', editData.allow_bracketing ? '1' : '0');

            // Always send registration_type if has_registration_end_date is enabled
            if (editData.has_registration_end_date) {
                formData.append('registration_type', editData.registration_type || 'team');

                // Send team_size only if registration type is team
                if (editData.registration_type === 'team' && editData.team_size) {
                    formData.append('team_size', editData.team_size);
                }
            }

            if (editData.event_date) {
                const sanitizedEventDate = editData.event_date.length === 16
                    ? `${editData.event_date}:00`
                    : editData.event_date;
                formData.append('event_date', sanitizedEventDate);
            }

            const eventTypeLower = (editData.event_type || '').toLowerCase();

            // Handle event_end_date for all event types
            if (editData.event_end_date) {
                formData.append('event_end_date', editData.event_end_date);
            } else {
                formData.append('event_end_date', '');
            }

            // For tryouts, always set has_registration_end_date to true and require registration_end_date
            if (eventTypeLower === 'tryouts') {
                formData.append('has_registration_end_date', '1');
                if (editData.registration_end_date) {
                    const sanitizedRegistrationDate = editData.registration_end_date.length === 16
                        ? `${editData.registration_end_date}:00`
                        : editData.registration_end_date;
                    formData.append('registration_end_date', sanitizedRegistrationDate);
                } else {
                    // If no date is set, use the event date as a fallback
                    formData.append('registration_end_date', editData.event_date || '');
                }
            } else {
                // For other event types, use the toggle
                formData.append('has_registration_end_date', editData.has_registration_end_date ? '1' : '0');
                if (editData.has_registration_end_date && editData.registration_end_date) {
                    const sanitizedRegistrationDate = editData.registration_end_date.length === 16
                        ? `${editData.registration_end_date}:00`
                        : editData.registration_end_date;
                    formData.append('registration_end_date', sanitizedRegistrationDate);
                } else {
                    formData.append('registration_end_date', '');
                }
            }

            if (eventTypeLower !== 'tryouts' && Array.isArray(editData.participants)) {
                editData.participants
                    .map((participant) => (typeof participant === 'string' ? participant.trim() : ''))
                    .filter((participant) => participant.length > 0)
                    .forEach((participant, index) => {
                        formData.append(`participants[${index}]`, participant);
                    });
            }

            if (editData.existingImages && editData.existingImages.length > 0) {
                editData.existingImages.forEach(img => {
                    formData.append('existing_images[]', img.image_path);
                });
            }

            if (editData.images && editData.images.length > 0) {
                editData.images.forEach((file) => {
                    formData.append('images[]', file);
                });
            }

            // Handle rulebook file upload
            if (editData.rulebook instanceof File) {
                formData.append('rulebook', editData.rulebook);
            }

            console.log('Submitting form with data:');
            for (let pair of formData.entries()) {
                console.log(pair[0] + ': ', pair[1]);
            }

            setErrorMessage(null);
            router.post(`/events/${editingEventId}`, formData, {
                forceFormData: true,
                onSuccess: () => {
                    setEditingEventId(null);
                    // Force a page reload to get fresh data including updated_at
                    window.location.reload();
                },
                onError: (errors) => {
                    const message = errors ? Object.values(errors).flat().join('\n') : 'Failed to update event';
                    setErrorMessage(message);
                    setSuccessMessage(null);
                },
                onFinish: () => {
                    // optional cleanup if needed
                }
            });
        } catch (error) {
            console.error('Error updating event:', error);
            setErrorMessage(error.message || 'Please check the console for details');
            setSuccessMessage(null);
        }
    };

    const handleDelete = (id) => {
        if (!confirm('Delete this event?')) return;
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        fetch(`/events/${id}`, {
            method: 'POST',
            headers: {
                'X-HTTP-Method-Override': 'DELETE',
                ...(token ? { 'X-CSRF-TOKEN': token } : {}),
            },
            credentials: 'include',
        }).then(() => window.location.reload());
    };

    const handleMarkDone = (id) => {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        fetch(`/events/${id}/mark-done`, {
            method: 'POST',
            headers: {
                ...(token ? { 'X-CSRF-TOKEN': token } : {}),
            },
            credentials: 'include',
        }).then(() => window.location.reload());
    };

    const handleMarkUndone = (id) => {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        fetch(`/events/${id}/mark-undone`, {
            method: 'POST',
            headers: {
                ...(token ? { 'X-CSRF-TOKEN': token } : {}),
            },
            credentials: 'include',
        }).then(() => window.location.reload());
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
        >
            {successMessage && (
                <div className="mb-4 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-emerald-200">
                    {successMessage}
                </div>
            )}
            {errorMessage && (
                <div className="mb-4 rounded-md border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-rose-200 space-y-1">
                    <div>{errorMessage}</div>
                    {Object.entries(validationErrors).map(([field, messages]) => (
                        <div key={field} className="text-xs text-rose-200/80">
                            <span className="font-semibold capitalize">{field.replace(/_/g, ' ')}:</span>{' '}
                            {Array.isArray(messages) ? messages.join(' ') : messages}
                        </div>
                    ))}
                </div>
            )}


            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold text-white">Events</h2>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            href={route('dashboard.create-competition')}
                            className="w-[141px] h-[45px] rounded-[15px] cursor-pointer 
                                                               transition duration-300 ease-in-out 
                                                               bg-gradient-to-br from-[#2e8eff] to-[#2e8eff]/0 
                                                               bg-[#2e8eff]/20 flex items-center justify-center 
                                                               hover:bg-[#2e8eff]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)] 
                                                               focus:outline-none focus:bg-[#2e8eff]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Event
                        </Link>
                        <Link
                            href={route('bracket')}
                            className="w-[141px] h-[45px] rounded-[15px] cursor-pointer 
                                                               transition duration-300 ease-in-out 
                                                               bg-gradient-to-br from-[#7F00FF] to-[#7F00FF]/0 
                                                               bg-[#2e8eff]/20 flex items-center justify-center 
                                                               hover:bg-[#2e8eff]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)] 
                                                               focus:outline-none focus:bg-[#2e8eff]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
                            </svg>
                            Create Bracket
                        </Link>
                    </div>
                </div>
                {events.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-gray-400">No events created yet.</p>
                    </div>
                )}

                {/* Filter Buttons */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <button
                        onClick={() => setActiveFilter('all')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    >
                        All Events
                    </button>
                    <button
                        onClick={() => setActiveFilter('upcoming')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeFilter === 'upcoming' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    >
                        Upcoming ({categorizedEvents.upcoming.length})
                    </button>
                    <button
                        onClick={() => setActiveFilter('ongoing')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeFilter === 'ongoing' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    >
                        Ongoing ({categorizedEvents.ongoing.length})
                    </button>
                    <button
                        onClick={() => setActiveFilter('completed')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeFilter === 'completed' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    >
                        Completed ({categorizedEvents.completed.length})
                    </button>
                </div>

                <div className={`${editingEventId ? 'mx-auto max-w-4xl w-full space-y-6' : 'grid grid-cols-1 md:grid-cols-2 gap-6'}`}>
                    {(activeFilter === 'all' ? events : getFilteredEvents()).map(event => {
                        const statusInfo = getEventStatus(event);
                        const cardImages = (() => {
                            if (Array.isArray(event.images_path) && event.images_path.length > 0) {
                                return event.images_path.map((path) => (path.startsWith('http') ? path : `/storage/${path}`));
                            }

                            if (Array.isArray(event.images) && event.images.length > 0) {
                                return event.images
                                    .map((img) => {
                                        if (!img) return null;
                                        if (typeof img === 'string') {
                                            return img.startsWith('http') ? img : `/storage/${img}`;
                                        }
                                        if (typeof img === 'object' && img.image_path) {
                                            return img.image_path.startsWith('http') ? img.image_path : `/storage/${img.image_path}`;
                                        }
                                        return null;
                                    })
                                    .filter(Boolean);
                            }

                            return [];
                        })();
                        const participants = Array.isArray(event.participants)
                            ? event.participants
                                .map((participant) => (typeof participant === 'string' ? participant.trim() : ''))
                                .filter((participant) => participant.length > 0)
                            : [];

                        const isTryouts = editingEventId === event.id && (editData.event_type || '').toLowerCase() === 'tryouts';

                        return (
                            <div key={event.id} className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 relative group">
                                {/* Admin Status Bar */}
                                <div className="bg-slate-900/80 px-4 py-2 flex justify-between items-center border-b border-slate-700">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusInfo.className}`}>
                                            {statusInfo.label}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${getEventTypeColor(event.event_type || 'general')}`}>
                                            {event.event_type ? event.event_type.toUpperCase() : 'EVENT'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">

                                    </div>
                                </div>

                                <div className="p-5">
                                    {editingEventId === event.id ? (
                                        <form onSubmit={handleEditSubmit} encType="multipart/form-data" className="space-y-6">
                                            {/* Basic Information Section */}
                                            <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700">
                                                <h3 className="text-lg font-medium text-slate-200 mb-4">Basic Information</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="md:col-span-2">
                                                        <label className="block text-sm text-slate-300 mb-1">Event Title</label>
                                                        <input
                                                            type="text"
                                                            value={editData.title}
                                                            onChange={e => setEditData({ ...editData, title: e.target.value })}
                                                            className="w-full border border-slate-600 bg-slate-700 text-white px-3 py-2 rounded-md focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                                            placeholder="Enter event title"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className="block text-sm text-slate-300 mb-1">Description</label>
                                                        <textarea
                                                            rows={3}
                                                            value={editData.description}
                                                            onChange={e => setEditData({ ...editData, description: e.target.value })}
                                                            className="w-full border border-slate-600 bg-slate-700 text-white px-3 py-2 rounded-md focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                                            placeholder="Enter event description"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm text-slate-300 mb-1">Coordinator</label>
                                                        <input
                                                            type="text"
                                                            value={editData.coordinator_name}
                                                            onChange={e => setEditData({ ...editData, coordinator_name: e.target.value })}
                                                            className="w-full border border-slate-600 bg-slate-700 text-white px-3 py-2 rounded-md focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                                            placeholder="Enter coordinator name"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm text-slate-300 mb-1">Venue</label>
                                                        <input
                                                            type="text"
                                                            value={editData.venue || ''}
                                                            onChange={e => setEditData({ ...editData, venue: e.target.value })}
                                                            className="w-full border border-slate-600 bg-slate-700 text-white px-3 py-2 rounded-md focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                                            placeholder="Enter venue location"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Category & Participants Section */}
                                            <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700">
                                                <h3 className="text-lg font-medium text-slate-200 mb-4">Category & Participants</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm text-slate-300 mb-1">Category</label>
                                                        <select
                                                            value={editData.category}
                                                            onChange={e => setEditData({ ...editData, category: e.target.value })}
                                                            className="w-full border border-slate-600 bg-slate-700 text-white px-3 py-2 rounded-md focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                                        >
                                                            <option value="sport">Sport</option>
                                                            <option value="culture">Culture</option>
                                                            <option value="arts">Arts</option>
                                                            <option value="intramurals">Intramurals</option>
                                                            <option value="other">Other (please specify)</option>
                                                        </select>
                                                        {editData.category === 'other' && (
                                                            <div className="mt-2">
                                                                <input
                                                                    type="text"
                                                                    className="w-full border border-slate-600 bg-slate-700 text-white px-3 py-2 rounded-md focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                                                    placeholder="Please specify category"
                                                                    value={editData.other_category}
                                                                    onChange={e => setEditData({ ...editData, other_category: e.target.value })}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {!isTryouts && (
                                                        <div>
                                                            <label className="block text-sm text-slate-300 mb-2">Participants</label>
                                                            <div className="space-y-2">
                                                                {(Array.isArray(editData.participants) ? editData.participants : ['']).map((participant, index) => (
                                                                    <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                                        <input
                                                                            type="text"
                                                                            value={participant}
                                                                            placeholder={`Participant ${index + 1}`}
                                                                            onChange={(e) => {
                                                                                const updated = Array.isArray(editData.participants) ? [...editData.participants] : [''];
                                                                                updated[index] = e.target.value;
                                                                                setEditData({ ...editData, participants: updated });
                                                                            }}
                                                                            className="flex-1 border border-slate-600 bg-slate-700 text-white px-3 py-2 rounded-md focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                                                        />
                                                                        {(editData.participants?.length ?? 0) > 1 && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const updated = (editData.participants || []).filter((_, idx) => idx !== index);
                                                                                    setEditData({ ...editData, participants: updated.length > 0 ? updated : [''] });
                                                                                }}
                                                                                className="px-3 py-2 text-sm text-red-300 hover:text-red-200 rounded-md hover:bg-slate-600"
                                                                            >
                                                                                Remove
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            {(!editData.participants || editData.participants.length === 0) && (
                                                                <p className="text-xs text-slate-400 mt-1">No participants listed.</p>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditData({
                                                                    ...editData,
                                                                    participants: [...(editData.participants || ['']), '']
                                                                })}
                                                                className="mt-2 text-blue-300 hover:text-blue-200 text-sm underline"
                                                            >
                                                                + Add participant
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Event Dates Section */}
                                            <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700">
                                                <h3 className="text-lg font-medium text-slate-200 mb-4">Event Dates</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm text-slate-300 mb-1">Event Start</label>
                                                        <DateTimePicker
                                                            value={editData.event_date}
                                                            onChange={handleEventDateTimeChange}
                                                            placeholder="Select event date and time"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm text-slate-300 mb-1">Event End Date</label>
                                                        <DatePicker
                                                            value={editData.event_end_date}
                                                            onChange={(date) => setEditData({ ...editData, event_end_date: date })}
                                                            placeholder="Select event end date"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Registration Settings Section */}
                                            <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700">
                                                <h3 className="text-lg font-medium text-slate-200 mb-4">Settings</h3>
                                                <div className="space-y-4">
                                                    {isTryouts ? (
                                                        <div>
                                                            <label className="block text-sm text-slate-300 mb-1">Registration End <span className="text-red-500">*</span></label>
                                                            <DateTimePicker
                                                                value={editData.registration_end_date || ''}
                                                                onChange={handleRegistrationEndDateChange}
                                                                placeholder="Select registration end date"
                                                                required
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    id={`has_registration_end_date_${editingEventId}`}
                                                                    checked={editData.has_registration_end_date}
                                                                    onChange={(e) => setEditData({
                                                                        ...editData,
                                                                        has_registration_end_date: e.target.checked,
                                                                        registration_end_date: !editData.registration_end_date && e.target.checked
                                                                            ? new Date().toISOString().slice(0, 16)
                                                                            : editData.registration_end_date
                                                                    })}
                                                                    className="h-4 w-4 rounded border-gray-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                                                                />
                                                                <label htmlFor={`has_registration_end_date_${editingEventId}`} className="text-sm text-slate-300">
                                                                    Enable Registration End Date
                                                                </label>
                                                            </div>

                                                            {editData.has_registration_end_date && (
                                                                <div>
                                                                    <label className="block text-sm text-slate-300 mb-1">Registration End</label>
                                                                    <DateTimePicker
                                                                        value={editData.registration_end_date}
                                                                        onChange={handleRegistrationEndDateChange}
                                                                        placeholder="Select registration end date"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Registration Type Selection - Only show if registration is enabled and not a tryout event */}
                                                    {editData.has_registration_end_date && !isTryouts && (
                                                        <div>
                                                            <label className="block text-sm text-slate-300 mb-3">Registration Type</label>
                                                            <div className="space-y-2">
                                                                <div className="flex items-center">
                                                                    <input
                                                                        type="radio"
                                                                        id={`single-registration-${editingEventId}`}
                                                                        name={`registration_type-${editingEventId}`}
                                                                        value="single"
                                                                        checked={editData.registration_type === 'single'}
                                                                        onChange={(e) => {
                                                                            setEditData(prev => ({
                                                                                ...prev,
                                                                                registration_type: e.target.value,
                                                                                team_size: e.target.value === 'single' ? '' : prev.team_size
                                                                            }));
                                                                        }}
                                                                        className="mr-2 text-blue-600 focus:ring-blue-500"
                                                                    />
                                                                    <label htmlFor={`single-registration-${editingEventId}`} className="text-slate-300">
                                                                        Single Registration
                                                                    </label>
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <input
                                                                        type="radio"
                                                                        id={`team-registration-${editingEventId}`}
                                                                        name={`registration_type-${editingEventId}`}
                                                                        value="team"
                                                                        checked={editData.registration_type === 'team'}
                                                                        onChange={(e) => setEditData(prev => ({ ...prev, registration_type: e.target.value }))}
                                                                        className="mr-2 text-blue-600 focus:ring-blue-500"
                                                                    />
                                                                    <label htmlFor={`team-registration-${editingEventId}`} className="text-slate-300">
                                                                        Team Registration
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Team Size Input - Only show if team registration is selected */}
                                                    {editData.has_registration_end_date && editData.registration_type === 'team' && (
                                                        <div>
                                                            <label className="block text-sm text-slate-300 mb-1">Number of Players per Team</label>
                                                            <input
                                                                type="number"
                                                                min="2"
                                                                max="50"
                                                                className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                                                                value={editData.team_size}
                                                                onChange={(e) => setEditData(prev => ({ ...prev, team_size: e.target.value }))}
                                                                placeholder="Enter number of players per team"
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            id={`allow_bracketing_${editingEventId}`}
                                                            checked={editData.allow_bracketing}
                                                            onChange={(e) => setEditData({ ...editData, allow_bracketing: e.target.checked })}
                                                            className="h-4 w-4 rounded border-gray-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                                                        />
                                                        <label htmlFor={`allow_bracketing_${editingEventId}`} className="text-sm text-slate-300">Allow Bracketing</label>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Event Images Section */}
                                            <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700">
                                                <h3 className="text-lg font-medium text-slate-200 mb-4">Event Images</h3>
                                                <div className="space-y-4">
                                                    {/* New Images Upload */}
                                                    <div className="flex items-center justify-center w-full">
                                                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-slate-800/50 border-slate-700 hover:bg-slate-800/70">
                                                            <div className="flex flex-col items-center justify-center px-4 py-3">
                                                                <svg className="w-6 h-6 mb-1 text-slate-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                                                                </svg>
                                                                <p className="text-xs text-slate-400"><span className="font-semibold">Click to upload</span></p>
                                                                <p className="text-[10px] text-slate-500">PNG, JPG, JPEG (MAX. 10MB each)</p>
                                                            </div>
                                                            <input
                                                                id="dropzone-file"
                                                                type="file"
                                                                className="hidden"
                                                                multiple
                                                                accept="image/*"
                                                                onChange={(e) => {
                                                                    const files = Array.from(e.target.files);
                                                                    setEditData(prev => ({
                                                                        ...prev,
                                                                        images: [...prev.images, ...files]
                                                                    }));
                                                                }}
                                                            />
                                                        </label>
                                                    </div>

                                                    {/* Existing Images Grid */}
                                                    {editData.existingImages && editData.existingImages.length > 0 && (
                                                        <div>
                                                            <p className="text-sm text-slate-400 mb-2">Current Images:</p>
                                                            <div className="grid grid-cols-4 gap-2">
                                                                {editData.existingImages.map((img, i) => (
                                                                    <div key={i} className="relative aspect-square">
                                                                        <img
                                                                            src={`/storage/${img.image_path}`}
                                                                            alt={`Event ${i + 1}`}
                                                                            className="w-full h-full object-cover rounded"
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (confirm('Remove this image?')) {
                                                                                    setEditData(prev => ({
                                                                                        ...prev,
                                                                                        existingImages: prev.existingImages.filter((_, idx) => idx !== i)
                                                                                    }));
                                                                                }
                                                                            }}
                                                                            className="absolute top-0.5 right-0.5 bg-red-500/80 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                                                                        >
                                                                            ×
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* New Images Preview */}
                                                    {safeImages.length > 0 && (
                                                        <div>
                                                            <p className="text-sm text-slate-400 mb-2">New images to upload:</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {safeImages.map((file, index) => (
                                                                    <div key={index} className="relative">
                                                                        <img
                                                                            src={URL.createObjectURL(file)}
                                                                            alt={`Preview ${index + 1}`}
                                                                            className="h-16 w-16 object-cover rounded"
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const newImages = [...safeImages];
                                                                                newImages.splice(index, 1);
                                                                                setEditData(prev => ({
                                                                                    ...prev,
                                                                                    images: newImages
                                                                                }));
                                                                            }}
                                                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                                                        >
                                                                            ×
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Rulebook Document Section */}
                                            <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700">
                                                <h3 className="text-lg font-medium text-slate-200 mb-4">Rulebook Document (Optional)</h3>
                                                <div className="space-y-4">
                                                    {/* Existing Rulebook Display */}
                                                    {event.rulebook_path && !editData.rulebook && (
                                                        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                    </svg>
                                                                    <span className="text-sm text-green-300">Current rulebook: {event.rulebook_path.split('/').pop()}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => window.open(route("events.rulebook.download", event.id), '_blank', 'noopener,noreferrer')}
                                                                        className="text-blue-400 hover:text-blue-300 text-sm underline"
                                                                    >
                                                                        View
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (confirm('Replace current rulebook?')) {
                                                                                // File input will be triggered to upload new file
                                                                                document.getElementById('rulebook-file')?.click();
                                                                            }
                                                                        }}
                                                                        className="text-orange-400 hover:text-orange-300 text-sm"
                                                                    >
                                                                        Replace
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-center w-full">
                                                            {/* New Rulebook Display */}
                                                            {editData.rulebook && (
                                                                <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                            </svg>
                                                                            <span className="text-sm text-blue-300">New rulebook: {editData.rulebook.name}</span>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setEditData(prev => ({ ...prev, rulebook: null }))}
                                                                            className="text-red-400 hover:text-red-300 text-sm"
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <input
                                                                id="rulebook-file"
                                                                type="file"
                                                                className="hidden"
                                                                accept=".pdf,.doc,.docx,.txt"
                                                                onChange={(e) => {
                                                                    const file = e.target.files[0];
                                                                    setEditData(prev => ({
                                                                        ...prev,
                                                                        rulebook: file || null
                                                                    }));
                                                                }}
                                                            />
                                                    </div>


                                                    {/* No Rulebook Message */}
                                                    {!event.rulebook_path && !editData.rulebook && (
                                                        <p className="text-xs text-slate-400 text-center">No rulebook uploaded</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex gap-2 pt-4">
                                                <button type="submit" className="w-[131px] h-[40px] rounded-[15px] cursor-pointer
                                                               transition duration-300 ease-in-out
                                                               bg-gradient-to-br from-[#2e8eff] to-[#2e8eff]/0
                                                               bg-[#2e8eff]/20 flex items-center justify-center
                                                               hover:bg-[#2e8eff]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)]
                                                               focus:outline-none focus:bg-[#2e8eff]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]">Save</button>
                                                <button type="button" onClick={() => setEditingEventId(null)} className="w-[131px] h-[40px] rounded-[15px] cursor-pointer
                                                               transition duration-300 ease-in-out
                                                               bg-gradient-to-br from-[#8b0000] to-[#8b0000]/0
                                                               bg-[#8b0000]/20 flex items-center justify-center
                                                               hover:bg-[#8b0000]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)]
                                                               focus:outline-none focus:bg-[#8b0000]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]">Cancel</button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="h-full flex flex-col">
                                            <div className="flex-1">
                                                <div className="mb-3">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center justify-between">
                                                            <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-sm text-gray-400 space-y-3 mb-4">
                                                    <div className="flex items-start gap-2">
                                                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 3H7a2 2 0 00-2 2v6l7 9 7-9V5a2 2 0 00-2-2z" />
                                                        </svg>
                                                        <div>
                                                            <p className="text-xs uppercase tracking-wide text-slate-500">Category</p>
                                                            <p className="text-slate-200">{getCategoryLabel(event)}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-start gap-2">
                                                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        <div>
                                                            <p className="text-xs uppercase tracking-wide text-slate-500">Event Start</p>
                                                            <p className="text-slate-200">{event.event_date ? formatDateTime(event.event_date) : 'TBD'}</p>
                                                        </div>
                                                    </div>

                                                    {event.event_end_date && (
                                                        <div className="flex items-start gap-2">
                                                            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8h18M3 12h18m-9 4h9" />
                                                            </svg>
                                                            <div>
                                                                <p className="text-xs uppercase tracking-wide text-slate-500">Event Ends</p>
                                                                <p className="text-slate-200">{formatDateOnly(event.event_end_date)}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {event.venue && (
                                                        <div className="flex items-start gap-2">
                                                            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            </svg>
                                                            <div>
                                                                <p className="text-xs uppercase tracking-wide text-slate-500">Venue</p>
                                                                <p className="text-slate-200">{event.venue}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="flex items-start gap-2">
                                                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                        <div className="py-4">
                                                            <p className="text-xs uppercase tracking-wide text-slate-500">Coordinator</p>
                                                            <p className="text-slate-200">{event.coordinator_name || 'TBD'}</p>
                                                        </div>
                                                    </div>

                                                    {event.registration_end_date && (
                                                        <div className="flex items-start gap-2">
                                                            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <div>
                                                                <p className="text-xs uppercase tracking-wide text-slate-500">Registration Ends</p>
                                                                <p className="text-slate-200">{formatDateTime(event.registration_end_date)}</p>
                                                            </div>
                                                        </div>
                                                    )}


                                                    {participants.length > 0 && (
                                                        <div className="flex items-start gap-2">
                                                            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                            </svg>
                                                            <div className="w-full">
                                                                <p className="text-xs uppercase tracking-wide text-slate-500">Participants</p>
                                                                <div className="mt-1 flex flex-wrap gap-2">
                                                                    {participants.map((participant, idx) => (
                                                                        <span
                                                                            key={`${event.id}-participant-${idx}`}
                                                                            className="inline-flex items-center rounded-full bg-slate-700/60 px-2.5 py-0.5 text-xs text-slate-200 border border-slate-600"
                                                                        >
                                                                            {participant}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {cardImages.length > 0 && (
                                                    <div className="mt-3 relative h-60 overflow-hidden rounded-lg bg-slate-700/30 group">
                                                        <div className="absolute inset-0 flex transition-transform duration-300 ease-in-out"
                                                            style={{ transform: `translateX(-${currentSlide[event.id] || 0}%)` }}>
                                                            {cardImages.map((imgPath, idx) => (
                                                                <div key={idx} className="min-w-full h-full">
                                                                    <img
                                                                        src={imgPath}
                                                                        alt={`Event ${idx + 1}`}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>

                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-2 gap-4">
                                                {event.has_registration_end_date && (
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-medium text-slate-400">Registration Status</p>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${event.registration_end_date && new Date(event.registration_end_date) > new Date() ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                            <span className="text-sm">
                                                                {event.registration_end_date && new Date(event.registration_end_date) > new Date()
                                                                    ? 'Open until ' + formatDateTime(event.registration_end_date)
                                                                    : 'Registration closed'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="col-span-2 flex justify-between items-center pt-2">
                                                    {event.has_registration_end_date && (
                                                        <Link
                                                            href={`/events/${event.id}/registrations`}
                                                            className="text-[11px] bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-2.5 py-1 rounded border border-blue-500/30 transition-colors flex items-center gap-1"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                            </svg>
                                                            View Registrations
                                                        </Link>
                                                    )}

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => startEdit(event)}
                                                            className="text-[11px] bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-2.5 py-1 rounded border border-blue-500/30 transition-colors flex items-center gap-1"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                            Edit
                                                        </button>

                                                        <button
                                                            onClick={() => handleDelete(event.id)}
                                                            className="text-[11px] bg-red-500/20 hover:bg-red-500/30 text-red-300 px-2.5 py-1 rounded border border-red-500/30 transition-colors flex items-center gap-1"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}


                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

export default Dashboard;
