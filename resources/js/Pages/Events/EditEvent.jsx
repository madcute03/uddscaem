import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

// Custom DateTime Picker Component
const DateTimePicker = ({ value, onChange, label, placeholder = "Select date and time" }) => {
    const [dateValue, setDateValue] = useState(value ? value.split('T')[0] : '');
    const [timeValue, setTimeValue] = useState(value ? value.split('T')[1]?.substring(0, 5) || '12:00' : '12:00');
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [activeTab, setActiveTab] = useState('date');
    
    const parseTime = (timeStr) => {
        if (!timeStr) return { hour: 12, minute: 0, period: 'AM' };
        
        const [hours, minutes] = timeStr.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        let hour = hours % 12;
        if (hour === 0) hour = 12;
        
        return { hour, minute: minutes || 0, period };
    };
    
    const [time, setTime] = useState(parseTime(timeValue));
    
    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: 60 }, (_, i) => i);
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
                    <div className="fixed inset-0 bg-black/70 z-[70]" onClick={() => setIsOpen(false)} />
                    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
                        <div
                            className="w-full max-w-lg bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-2xl shadow-2xl p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-semibold text-white">Select Event Start</h3>
                                    <p className="text-sm text-slate-400 mt-1">{monthYear}</p>
                                </div>
                                <button type="button" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="flex border-b border-slate-700/50 mb-6">
                                <button type="button" onClick={() => setActiveTab('date')} className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'date' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200'}`}>
                                    Date
                                </button>
                                <button type="button" onClick={() => setActiveTab('time')} className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'time' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200'}`}>
                                    Time
                                </button>
                            </div>

                            {activeTab === 'date' && (
                                <>
                                    <div className="flex items-center justify-between mb-6">
                                        <button type="button" onClick={() => navigateMonth(-1)} className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors">
                                            <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <h4 className="text-lg font-semibold text-white">{monthYear}</h4>
                                        <button type="button" onClick={() => navigateMonth(1)} className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors">
                                            <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-7 gap-2 mb-3">
                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                            <div key={day} className="text-xs text-slate-400 text-center py-2 font-medium">{day}</div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-7 gap-2">
                                        {days.map((date, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => handleDateSelect(date)}
                                                disabled={!date}
                                                className={`h-11 text-sm rounded-lg transition-all font-medium ${!date ? 'invisible' : ''} ${isSelected(date) ? 'bg-slate-700 text-white shadow-lg' : isToday(date) ? 'bg-slate-800/50 text-slate-100 hover:bg-slate-700/50' : 'text-slate-300 hover:bg-slate-800/30'}`}
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
                                                <select value={time.hour} onChange={(e) => handleTimeChange('hour', parseInt(e.target.value))} className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/50">
                                                    {hours.map(h => (<option key={h} value={h}>{String(h).padStart(2, '0')}</option>))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-400 mb-1">Minute</label>
                                                <select value={time.minute} onChange={(e) => handleTimeChange('minute', parseInt(e.target.value))} className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/50">
                                                    {minutes.map(m => (<option key={m} value={m}>{String(m).padStart(2, '0')}</option>))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-400 mb-1">AM/PM</label>
                                                <select value={time.period} onChange={(e) => handleTimeChange('period', e.target.value)} className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/50">
                                                    {periods.map(p => (<option key={p} value={p}>{p}</option>))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-xs text-slate-400">
                                            Selected time: {time.hour.toString().padStart(2, '0')}:{time.minute.toString().padStart(2, '0')} {time.period}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-8">
                                <button type="button" onClick={() => setIsOpen(false)} className="px-6 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-lg transition-colors">
                                    Close
                                </button>
                                <button type="button" onClick={() => setIsOpen(false)} className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
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

// Custom Calendar Picker Component
const CalendarPicker = ({ value, onChange, label, placeholder = "Select date" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const parseToLocalDate = (dateValue) => {
        if (!dateValue) return null;
        if (dateValue instanceof Date) return dateValue;

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
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

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
        const dateStr = toDateString(date);
        const valueStr = toDateString(value);
        return dateStr === valueStr;
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
                    <div className="fixed inset-0 bg-black/70 z-[70]" onClick={() => setIsOpen(false)} />
                    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
                        <div className="w-full max-w-md bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-2xl shadow-2xl p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-semibold text-white">Select Date</h3>
                                    <p className="text-sm text-slate-400 mt-1">{monthYear}</p>
                                </div>
                                <button type="button" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="flex items-center justify-between mb-6">
                                <button type="button" onClick={() => navigateMonth(-1)} className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors">
                                    <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <h4 className="text-lg font-semibold text-white">{monthYear}</h4>
                                <button type="button" onClick={() => navigateMonth(1)} className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors">
                                    <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>

                            <div className="grid grid-cols-7 gap-2 mb-3">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="text-xs text-slate-400 text-center py-2 font-medium">{day}</div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-2">
                                {days.map((date, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => handleDateSelect(date)}
                                        disabled={!date}
                                        className={`h-11 text-sm rounded-lg transition-all font-medium ${!date ? 'invisible' : ''} ${isSelected(date) ? 'bg-slate-700 text-white shadow-lg' : isToday(date) ? 'bg-slate-800/50 text-slate-100 hover:bg-slate-700/50' : 'text-slate-300 hover:bg-slate-800/30'}`}
                                    >
                                        {date?.getDate()}
                                    </button>
                                ))}
                            </div>

                            <div className="flex justify-end mt-8">
                                <button type="button" onClick={() => setIsOpen(false)} className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
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

export default function EditEvent({ auth, event }) {
    // Properly initialize existing images from the event
    const initializeExistingImages = () => {
        if (!event.images || !Array.isArray(event.images) || event.images.length === 0) {
            return [];
        }
        return event.images;
    };
    
    const { data, setData, post, processing, errors } = useForm({
        title: event.title || '',
        description: event.description || '',
        venue: event.venue || '',
        coordinator_name: event.coordinator_name || '',
        event_type: event.event_type || '',
        category: event.category || 'sport',
        other_category: event.other_category || '',
        event_date: event.event_date ? event.event_date.slice(0, 16) : '',
        event_end_date: event.event_end_date ? event.event_end_date.slice(0, 10) : '',
        registration_end_date: event.registration_end_date ? event.registration_end_date.slice(0, 16) : '',
        participants: event.participants && event.participants.length > 0 ? event.participants : [''],
        allow_bracketing: event.allow_bracketing || false,
        has_registration_end_date: !!event.registration_end_date,
        registration_type: event.registration_type || 'team',
        team_size: event.team_size || '',
        images: [],
        existingImages: initializeExistingImages(),
        rulebook: null,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('title', data.title);
        formData.append('description', data.description);
        formData.append('venue', data.venue || '');
        formData.append('coordinator_name', data.coordinator_name);
        formData.append('event_type', event.event_type); // Keep original event type
        formData.append('category', data.category);
        formData.append('other_category', data.other_category || '');
        formData.append('allow_bracketing', data.allow_bracketing ? '1' : '0');

        if (data.event_date) {
            formData.append('event_date', data.event_date);
        }

        if (data.event_end_date) {
            formData.append('event_end_date', data.event_end_date);
        }

        formData.append('has_registration_end_date', data.has_registration_end_date ? '1' : '0');
        
        // Always send registration_type and team_size to preserve them
        formData.append('registration_type', data.registration_type || 'single');
        if (data.team_size) {
            formData.append('team_size', data.team_size);
        }
        
        // Send registration_end_date if registration is enabled
        if (data.has_registration_end_date && data.registration_end_date) {
            formData.append('registration_end_date', data.registration_end_date);
        }

        if (data.event_type !== 'tryouts' && Array.isArray(data.participants)) {
            data.participants
                .filter(p => p.trim().length > 0)
                .forEach((participant, index) => {
                    formData.append(`participants[${index}]`, participant);
                });
        }

        // Always send existing images to prevent deletion
        // This is critical - if we don't send existing_images[], the backend will delete all images
        if (data.existingImages && Array.isArray(data.existingImages) && data.existingImages.length > 0) {
            data.existingImages.forEach(img => {
                const path = typeof img === 'string' ? img : (img.image_path || '');
                if (path) {
                    formData.append('existing_images[]', path);
                }
            });
        }

        // Add new images if any
        if (data.images && data.images.length > 0) {
            data.images.forEach((file) => {
                formData.append('images[]', file);
            });
        }

        if (data.rulebook instanceof File) {
            formData.append('rulebook', data.rulebook);
        }

        // Use POST route for file uploads (with _method: PUT in FormData)
        post(route('events.update.post', event.id), {
            data: formData,
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const addParticipant = () => {
        setData('participants', [...data.participants, '']);
    };

    const removeParticipant = (index) => {
        const updated = data.participants.filter((_, idx) => idx !== index);
        setData('participants', updated.length > 0 ? updated : ['']);
    };

    const updateParticipant = (index, value) => {
        const updated = [...data.participants];
        updated[index] = value;
        setData('participants', updated);
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={`Edit Event - ${event.title}`} />

            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <Link
                            href={route('dashboard')}
                            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4"
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                            Back to Events
                        </Link>
                        <h1 className="text-3xl font-bold text-white">Edit Event</h1>
                        <p className="text-slate-400 mt-2">Update event information</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information */}
                        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
                            <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-slate-300 mb-2">Event Title</label>
                                    <input
                                        type="text"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                    {errors.title && <p className="mt-1 text-sm text-red-400">{errors.title}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-slate-300 mb-2">Description</label>
                                    <textarea
                                        rows={10}
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                    {errors.description && <p className="mt-1 text-sm text-red-400">{errors.description}</p>}
                                </div>

                                <div>
                                    <label className="block text-slate-300 mb-2">Coordinator Name</label>
                                    <input
                                        type="text"
                                        value={data.coordinator_name}
                                        onChange={(e) => setData('coordinator_name', e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                    {errors.coordinator_name && <p className="mt-1 text-sm text-red-400">{errors.coordinator_name}</p>}
                                </div>

                                <div>
                                    <label className="block text-slate-300 mb-2">Venue</label>
                                    <input
                                        type="text"
                                        value={data.venue}
                                        onChange={(e) => setData('venue', e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {errors.venue && <p className="mt-1 text-sm text-red-400">{errors.venue}</p>}
                                </div>

                                <div>
                                    <label className="block text-slate-300 mb-2">Category</label>
                                    <select
                                        value={data.category}
                                        onChange={(e) => setData('category', e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="sport">Sport</option>
                                        <option value="culture">Culture</option>
                                        <option value="arts">Arts</option>
                                        <option value="intramurals">Intramurals</option>
                                        <option value="other">Other</option>
                                    </select>
                                    {errors.category && <p className="mt-1 text-sm text-red-400">{errors.category}</p>}
                                </div>

                                {data.category === 'other' && (
                                    <div className="md:col-span-2">
                                        <label className="block text-slate-300 mb-2">Specify Category</label>
                                        <input
                                            type="text"
                                            value={data.other_category}
                                            onChange={(e) => setData('other_category', e.target.value)}
                                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter category name"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Event Dates */}
                        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
                            <h2 className="text-xl font-semibold text-white mb-4">Event Dates</h2>
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
                            </div>
                        </div>

                        {/* Registration Settings */}
                        {data.event_type !== 'tryouts' && (
                            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
                                <h2 className="text-xl font-semibold text-white mb-4">Registration Settings</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="has_registration"
                                            checked={data.has_registration_end_date}
                                            onChange={(e) => setData('has_registration_end_date', e.target.checked)}
                                            className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                                        />
                                        <label htmlFor="has_registration" className="text-slate-300">
                                            Enable Registration
                                        </label>
                                    </div>

                                    {data.has_registration_end_date && (
                                        <>
                                            <div>
                                                <label className="block mb-1 text-slate-300">Registration End Date & Time</label>
                                                <DateTimePicker
                                                    value={data.registration_end_date}
                                                    onChange={(value) => setData('registration_end_date', value)}
                                                    label=""
                                                    placeholder="Select registration end date and time"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-slate-300 mb-2">Registration Type</label>
                                                <div className="space-y-2">
                                                    <div className="flex items-center">
                                                        <input
                                                            type="radio"
                                                            id="single"
                                                            name="registration_type"
                                                            value="single"
                                                            checked={data.registration_type === 'single'}
                                                            onChange={(e) => setData('registration_type', e.target.value)}
                                                            className="mr-2 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <label htmlFor="single" className="text-slate-300">Single Registration</label>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <input
                                                            type="radio"
                                                            id="team"
                                                            name="registration_type"
                                                            value="team"
                                                            checked={data.registration_type === 'team'}
                                                            onChange={(e) => setData('registration_type', e.target.value)}
                                                            className="mr-2 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <label htmlFor="team" className="text-slate-300">Team Registration</label>
                                                    </div>
                                                </div>
                                            </div>

                                            {data.registration_type === 'team' && (
                                                <div>
                                                    <label className="block text-slate-300 mb-2">Team Size</label>
                                                    <input
                                                        type="number"
                                                        min="2"
                                                        value={data.team_size}
                                                        onChange={(e) => setData('team_size', e.target.value)}
                                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Number of players per team"
                                                    />
                                                </div>
                                            )}
                                        </>
                                    )}

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="allow_bracketing"
                                            checked={data.allow_bracketing}
                                            onChange={(e) => setData('allow_bracketing', e.target.checked)}
                                            className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                                        />
                                        <label htmlFor="allow_bracketing" className="text-slate-300">
                                            Allow Bracketing
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Participants */}
                        {data.event_type !== 'tryouts' && (
                            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold text-white">Participants</h2>
                                    <span className="text-sm text-slate-400">
                                        {data.participants.filter(p => p.trim()).length} participant(s)
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {data.participants.map((participant, index) => (
                                        <div key={index} className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                value={participant}
                                                onChange={(e) => updateParticipant(index, e.target.value)}
                                                placeholder={`Participant ${index + 1}`}
                                                className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeParticipant(index)}
                                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                                                title="Remove participant"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addParticipant}
                                        className="mt-2 text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add Participant
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 mt-3">
                                    Note: Removing a participant here will allow them to be added again from the registrations page.
                                </p>
                            </div>
                        )}

                        {/* Event Images */}
                        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
                            <h2 className="text-xl font-semibold text-white mb-4">Featured Image</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-slate-300 mb-2">Upload New Image</label>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={(e) => setData('images', Array.from(e.target.files))}
                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">You can select multiple images</p>
                                </div>

                                {data.existingImages && data.existingImages.length > 0 && (
                                    <div>
                                        <p className="text-slate-300 mb-2">Current Images:</p>
                                        <div className="grid grid-cols-4 gap-2">
                                            {data.existingImages.map((img, index) => {
                                                const imgPath = typeof img === 'string' ? img : img.image_path;
                                                return (
                                                    <div key={index} className="relative aspect-square">
                                                        <img
                                                            src={`/storage/${imgPath}`}
                                                            alt={`Event ${index + 1}`}
                                                            className="w-full h-full object-cover rounded"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const updated = data.existingImages.filter((_, i) => i !== index);
                                                                setData('existingImages', updated);
                                                            }}
                                                            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Rulebook Upload */}
                        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
                            <h2 className="text-xl font-semibold text-white mb-4">Event Rulebook</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-slate-300 mb-2">Upload Rulebook (PDF, DOC, DOCX, TXT)</label>
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.txt"
                                        onChange={(e) => setData('rulebook', e.target.files[0])}
                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Maximum file size: 5MB</p>
                                </div>

                                {event.rulebook_path && (
                                    <div className="flex items-center gap-2 p-3 bg-slate-700/50 rounded-lg">
                                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span className="text-slate-300 text-sm flex-1">Current rulebook uploaded</span>
                                        <a
                                            href={route('events.rulebook.download', event.id)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 text-sm"
                                        >
                                            View
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end gap-4">
                            <Link
                                href={route('dashboard')}
                                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                                {processing ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
