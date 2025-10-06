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
    };

    const [editingEventId, setEditingEventId] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [eventForm, setEventForm] = useState({ ...defaultEventForm });
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
        is_done: false,
        images: [],
        existingImages: [],
        allow_bracketing: false,
        has_registration_end_date: false,
        required_players: '',
        has_required_players: false,
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
        console.log('--- Event Status Check ---');
        console.log('Event ID:', event.id);
        
        // Get current time in local timezone
        const now = new Date();
        console.log('Current local time:', now.toString());
        console.log('Current UTC time:', now.toISOString());
        
        if (event.is_done) {
            console.log('Event is marked as DONE');
            return {
                label: 'DONE',
                className: 'bg-green-500 text-white'
            };
        }

        let eventStart, eventEnd;
        
        console.log('Event data:', {
            event_date: event.event_date,
            event_end_date: event.event_end_date,
            is_done: event.is_done
        });

        try {
            // Parse event start date
            if (event.event_date) {
                // Parse the date string and adjust for local timezone
                const [datePart, timePart] = event.event_date.split('T');
                const [year, month, day] = datePart.split('-').map(Number);
                let hours = 0, minutes = 0;
                
                if (timePart) {
                    const [timeStr] = timePart.split('.'); // Remove milliseconds if present
                    [hours, minutes] = timeStr.split(':').map(Number);
                }
                
                // Create date in local timezone
                eventStart = new Date(year, month - 1, day, hours, minutes);
                
                if (isNaN(eventStart.getTime())) {
                    throw new Error('Invalid start date');
                }
                
                console.log('Parsed event start (local):', eventStart.toString());
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
                
                if (isNaN(eventEnd.getTime())) {
                    console.warn('Invalid end date, ignoring');
                    eventEnd = null;
                } else {
                    console.log('Parsed event end (local):', eventEnd.toString());
                }
            }

            // If no start date, show as pending
            if (!eventStart) {
                return {
                    label: 'PENDING',
                    className: 'bg-slate-500 text-white'
                };
            }

            // If current time is before event start time
            console.log('Event start time:', eventStart.toISOString());
            console.log('Current time is before start time?', now < eventStart);
            
            if (now < eventStart) {
                console.log('Status: UPCOMING');
                return {
                    label: 'UPCOMING',
                    className: 'bg-amber-500 text-white'
                };
            }

            // If there's an end date and we're past it
            if (eventEnd) {
                console.log('Event end time:', eventEnd.toISOString());
                console.log('Current time is after end time?', now > eventEnd);
                
                if (now > eventEnd) {
                    console.log('Status: COMPLETED');
                    return {
                        label: 'COMPLETED',
                        className: 'bg-green-500 text-white'
                    };
                }
            }

            // If we're between start and end time, or if there's no end time and we're past start time
            console.log('Status: ONGOING');
            return {
                label: 'ONGOING',
                className: 'bg-emerald-500 text-white'
            };

        } catch (error) {
            console.error('Error parsing event dates:', error);
            return {
                label: 'PENDING',
                className: 'bg-slate-500 text-white'
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
            event_date: eventDateValue,
            event_end_date: eventEndDateValue,
            registration_end_date: registrationEndDateValue,
            coordinator_name: event.coordinator_name || '',
            participants: Array.isArray(event.participants) && event.participants.length > 0
                ? event.participants.map((participant) => (typeof participant === 'string' ? participant : '')).filter(Boolean)
                : [''],
            is_done: event.is_done ?? false,
            images: [],
            existingImages: buildExistingImages(event),
            allow_bracketing: !!event.allow_bracketing,
            has_registration_end_date: !!event.registration_end_date,
            required_players: event.required_players ? String(event.required_players) : '',
            has_required_players: !!event.required_players,
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
            formData.append('coordinator_name', editData.coordinator_name);
            formData.append('event_type', editData.event_type);
            formData.append('category', editData.category);
            formData.append('other_category', editData.other_category || '');
            formData.append('allow_bracketing', editData.allow_bracketing ? '1' : '0');

            if (editData.event_date) {
                const sanitizedEventDate = editData.event_date.length === 16
                    ? `${editData.event_date}:00`
                    : editData.event_date;
                formData.append('event_date', sanitizedEventDate);
            }

            const eventTypeLower = (editData.event_type || '').toLowerCase();

            if (eventTypeLower !== 'tryouts' && editData.event_end_date) {
                formData.append('event_end_date', editData.event_end_date);
            }

            if (eventTypeLower === 'tryouts' && editData.registration_end_date) {
                const sanitizedRegistrationDate = editData.registration_end_date.length === 16
                    ? `${editData.registration_end_date}:00`
                    : editData.registration_end_date;
                formData.append('registration_end_date', sanitizedRegistrationDate);
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

            console.log('Submitting form with data:');
            for (let pair of formData.entries()) {
                console.log(pair[0] + ': ', pair[1]);
            }

            setErrorMessage(null);
            router.post(`/events/${editingEventId}`, formData, {
                forceFormData: true,
                onSuccess: () => {
                    setEditingEventId(null);
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
                <h2 className="text-2xl font-bold mb-6 text-white">Events</h2>
                {events.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-gray-400">No events created yet.</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2  gap-6">
                    {events.map(event => {
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
                            <div key={event.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 relative">
                                {(event.is_done || statusInfo) && (
                                    <div
                                        className={`absolute -top-2 -right-2 text-[10px] font-bold px-3 py-1 rounded-full shadow-md ${event.is_done ? 'bg-green-500 text-white' : statusInfo.className}`}
                                    >
                                        {event.is_done ? 'DONE' : statusInfo.label}
                                    </div>
                                )}

                                {editingEventId === event.id ? (
                                    <form onSubmit={handleEditSubmit} encType="multipart/form-data" className="space-y-2">
                                        <div>
                                            <label className="block text-sm">Title</label>
                                            <input
                                                type="text"
                                                value={editData.title}
                                                onChange={e => setEditData({ ...editData, title: e.target.value })}
                                                className="w-full border border-slate-600 bg-slate-700 text-white px-2 py-1 rounded focus:border-blue-500 focus:outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm">Description</label>
                                            <textarea
                                                value={editData.description}
                                                onChange={e => setEditData({ ...editData, description: e.target.value })}
                                                className="w-full border border-slate-600 bg-slate-700 text-white px-2 py-1 rounded focus:border-blue-500 focus:outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm">Coordinator Name</label>
                                            <input
                                                type="text"
                                                value={editData.coordinator_name}
                                                onChange={e => setEditData({ ...editData, coordinator_name: e.target.value })}
                                                className="w-full border border-slate-600 bg-slate-700 text-white px-2 py-1 rounded focus:border-blue-500 focus:outline-none"
                                            />
                                        </div>

                                        {!isTryouts && (
                                            <div>
                                                <label className="block text-sm">Participants</label>
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
                                                                className="flex-1 border border-slate-600 bg-slate-700 text-white px-2 py-1 rounded focus:border-blue-500 focus:outline-none"
                                                            />
                                                            {(editData.participants?.length ?? 0) > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const updated = (editData.participants || []).filter((_, idx) => idx !== index);
                                                                        setEditData({ ...editData, participants: updated.length > 0 ? updated : [''] });
                                                                    }}
                                                                    className="text-sm text-red-300 hover:text-red-200"
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
                                                    className="mt-2 text-blue-300 hover:text-blue-200 text-sm"
                                                >
                                                    + Add participant
                                                </button>
                                            </div>
                                        )}



                                        <div>
                                            <label className="block text-sm">Category</label>
                                            <select
                                                value={editData.category}
                                                onChange={e => setEditData({ ...editData, category: e.target.value })}
                                                className="w-full border border-slate-600 bg-slate-700 text-white px-2 py-1 rounded focus:border-blue-500 focus:outline-none"
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
                                                        className="w-full border border-slate-600 bg-slate-700 text-white px-2 py-1 rounded focus:border-blue-500 focus:outline-none"
                                                        placeholder="Please specify category"
                                                        value={editData.other_category}
                                                        onChange={e => setEditData({ ...editData, other_category: e.target.value })}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm">Event Start</label>
                                            <DateTimePicker
                                                value={editData.event_date}
                                                onChange={handleEventDateTimeChange}
                                                placeholder="Select event date and time"
                                            />
                                        </div>

                                        {!isTryouts && (
                                            <div>
                                                <label className="block text-sm">Event End Date</label>
                                                <DatePicker
                                                    value={editData.event_end_date}
                                                    onChange={(date) => setEditData({ ...editData, event_end_date: date })}
                                                    placeholder="Select event end date"
                                                />
                                            </div>
                                        )}

                                        {isTryouts && (
                                            <div>
                                                <label className="block text-sm">Registration End</label>
                                                <DateTimePicker
                                                    value={editData.registration_end_date}
                                                    onChange={handleRegistrationEndDateChange}
                                                    placeholder="Select registration end date"
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
                                            <label htmlFor={`allow_bracketing_${editingEventId}`} className="text-sm">Allow Bracketing</label>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="block text-sm font-medium text-slate-300">Event Images</label>

                                            {/* New Images Upload - Made smaller */}
                                            <div className="flex items-center justify-center w-full">
                                                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-slate-800/50 border-slate-700 hover:bg-slate-800/70">
                                                    <div className="flex flex-col items-center justify-center px-4 py-3">
                                                        <svg className="w-6 h-6 mb-1 text-slate-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                                                        </svg>
                                                        <p className="text-xs text-slate-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
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

                                            {/* Existing Images Grid - Moved below upload */}
                                            {editData.existingImages && editData.existingImages.length > 0 && (
                                                <div className="mt-4">
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
                                                <div className="mt-4">
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

                                        <div className="flex gap-2 mt-2">
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
                                                        <div className="flex gap-2">
                                                            <span className={`text-xs px-2 py-1 rounded-full ${getEventTypeColor(event.event_type)}`}>
                                                                {event.event_type}
                                                            </span>
                                                        </div>
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

                                        <div className="mt-4 pt-4 border-t border-slate-700 flex justify-end gap-4">
                                            {event.registration_end_date ? (
                                                <Link
                                                    href={route('events.registrations', event.id)}
                                                    className="text-gray-400 hover:text-blue-500 transition-colors"
                                                    title="View teams"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                    </svg>
                                                </Link>
                                            ) : (
                                                <span className="text-gray-500 cursor-not-allowed" title="Registration not yet open">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                    </svg>
                                                </span>
                                            )}

                                            <button
                                                onClick={() => startEdit(event)}
                                                className="text-gray-400 hover:text-amber-500 transition-colors"
                                                title="Edit"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>

                                            <button
                                                onClick={() => handleDelete(event.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                                title="Delete"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </AuthenticatedLayout>
    )
}

export default Dashboard;
