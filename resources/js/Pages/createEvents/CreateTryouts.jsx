import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Inertia } from '@inertiajs/inertia';
import EventTypeSelector from '@/Components/EventTypeSelector';

// Custom DateTime Picker Component
const DateTimePicker = ({ value, onChange, label, placeholder = "Select date and time" }) => {
    const [dateValue, setDateValue] = useState(value ? value.split('T')[0] : '');
    const [timeValue, setTimeValue] = useState(value ? value.split('T')[1]?.substring(0, 5) || '12:00' : '12:00');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [activeTab, setActiveTab] = useState('date'); // 'date' or 'time'
    const [showModal, setShowModal] = useState(false);

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

    const formatDateTime = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleString('en-US', {
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
        const date = new Date(dateString);
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
                onClick={() => setShowModal(true)}
            >
                <span className={value ? 'text-slate-100' : 'text-slate-400'}>
                    {value ? formatDateTime(value) : placeholder}
                </span>
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-4 border-b border-slate-700">
                            <h3 className="text-lg font-medium text-slate-100">Select Date and Time</h3>
                        </div>
                        <div className="p-4">
                            {/* Tabs */}
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
                                <div>
                                    {/* Calendar Header */}
                                    <div className="flex items-center justify-between mb-4 px-2">
                                        <button
                                            type="button"
                                            onClick={() => navigateMonth(-1)}
                                            className="p-1 hover:bg-slate-700 rounded-full"
                                        >
                                            <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <h3 className="text-slate-100 font-medium text-lg">{monthYear}</h3>
                                        <button
                                            type="button"
                                            onClick={() => navigateMonth(1)}
                                            className="p-1 hover:bg-slate-700 rounded-full"
                                        >
                                            <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                                onClick={() => {
                                                    handleDateSelect(date);
                                                    setActiveTab('time');
                                                }}
                                                disabled={!date}
                                                className={`
                                                    h-8 text-sm rounded transition-colors
                                                    ${!date ? 'invisible' : ''}
                                                    ${isSelected(date)
                                                        ? 'bg-blue-600 text-white'
                                                        : isToday(date)
                                                            ? 'bg-slate-600 text-slate-100 hover:bg-slate-500'
                                                            : 'text-slate-300 hover:bg-slate-700'
                                                    }
                                                `}
                                            >
                                                {date?.getDate()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
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
                                        <div className="text-sm text-slate-300 mb-4 text-center">
                                            Selected time: {time.hour.toString().padStart(2, '0')}:{time.minute.toString().padStart(2, '0')} {time.period}
                                        </div>
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowModal(false);
                                            }}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Custom Calendar Component (kept for reference, not used)
const CalendarPicker = ({ value, onChange, label, placeholder = "Select date" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-US', {
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

    const formatDateForComparison = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleDateSelect = (date) => {
        if (date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            onChange(formattedDate);
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
        const selectedDate = formatDateForComparison(date);
        const currentValue = formatDateForComparison(value);
        return selectedDate === currentValue;
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
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={value ? 'text-slate-100' : 'text-slate-400'}>
                    {value ? formatDate(value) : placeholder}
                </span>
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md p-6 relative">
                        {/* Close Button */}
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-slate-100">Select Date</h3>
                        </div>

                        {/* Month Navigation */}
                        <div className="flex items-center justify-between mb-4">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigateMonth(-1);
                                }}
                                className="p-2 hover:bg-slate-700 rounded-full transition-colors"
                            >
                                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h4 className="text-lg font-medium text-slate-100">{monthYear}</h4>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigateMonth(1);
                                }}
                                className="p-2 hover:bg-slate-700 rounded-full transition-colors"
                            >
                                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        {/* Days of Week */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
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
                                    onClick={() => {
                                        handleDateSelect(date);
                                        setIsOpen(false);
                                    }}
                                    disabled={!date}
                                    className={`
                                        aspect-square w-full text-sm rounded-lg transition-all flex items-center justify-center
                                        ${!date ? 'invisible' : ''}
                                        ${isSelected(date)
                                            ? 'bg-blue-600 text-white font-medium'
                                            : isToday(date)
                                                ? 'bg-slate-700 text-blue-400 font-medium'
                                                : 'text-slate-300 hover:bg-slate-700/50'
                                        }
                                    `}
                                >
                                    {date?.getDate()}
                                </button>
                            ))}
                        </div>

                        {/* Selected Date Display */}
                        {value && (
                            <div className="mt-4 pt-4 border-t border-slate-700">
                                <p className="text-slate-400 text-sm">Selected:</p>
                                <p className="text-slate-100 font-medium">{formatDate(value)}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function CreateTryouts({ auth, events = [] }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        description: '',
        coordinator_name: '',
        category: 'sport', // Default to sport
        other_category: '', // For 'other' category input
        event_type: 'tryouts', // Set default to 'tryouts'
        other_event_type: '',
        event_date: '',
        event_end_date: '',
        registration_end_date: '',
        has_registration_end_date: true,
        has_required_players: true,
        allow_bracketing: false,
        images: [],
        required_players: '1',
    });

    const [editingEventId, setEditingEventId] = useState(null);
    const [showDateWarning, setShowDateWarning] = useState(false);
    const [pendingSubmit, setPendingSubmit] = useState(false);
    const [editData, setEditData] = useState({
        title: '',
        description: '',
        coordinator_name: '',
        event_date: '',
        registration_end_date: '',
        images: [],
        required_players: '',
    });

    // Handle event type selection
    const handleEventTypeSelect = (type) => {
        if (type === 'tryouts') {
            // You can add any additional logic here before navigating
            // For example, saving the current form data or showing a confirmation

            // Navigate to the CreateTryouts page
            router.visit('/dashboard/create-tryouts');
        }
    };

    const checkDateAndSubmit = (e) => {
        e.preventDefault();

        // Check if event date is in the past
        const today = new Date().toISOString().split('T')[0];
        if (data.event_date && data.event_date < today) {
            setShowDateWarning(true);
            setPendingSubmit(true);
            return;
        }

        // If date is valid, proceed with submission
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
            } else if (key === 'registration_end_date' && !data.has_registration_end_date) {
                // Skip registration end date if not enabled
                return;
            } else if (key === 'required_players' && !data.has_required_players) {
                // Skip required players if not enabled
                return;
            } else if (key === 'other_event_type' && data.event_type !== 'other') {
                // Skip other_event_type if event_type is not 'other'
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
            event_date: event.event_date,
            registration_end_date: event.registration_end_date || '',
            images: [], // bagong uploads
            existingImages: event.images_path || [], // existing images
            required_players: event.required_players,
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
                                    onTypeSelect={handleEventTypeSelect}
                                    error={errors.event_type}
                                />
                                {errors.event_type && (
                                    <p className="mt-1 text-sm text-red-500">{errors.event_type}</p>
                                )}
                                {data.event_type === 'other' && errors.other_event_type && (
                                    <p className="mt-1 text-sm text-red-500">{errors.other_event_type}</p>
                                )}
                            </div>
                        </div>

                        <form onSubmit={checkDateAndSubmit} encType="multipart/form-data" className="mt-4">
                            <div className="mb-2">
                                <label className="block mb-1 text-slate-300">Event Title</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                                    value={data.title}
                                    onChange={e => setData('title', e.target.value)}
                                />
                            </div>
                            <div className="mb-2">
                                <label className="block mb-1 text-slate-300">Description</label>
                                <textarea
                                    className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                />
                            </div>
                            <div className="mb-2">
                                <label className="block mb-1 text-slate-300">Coordinator</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                                    value={data.coordinator_name}
                                    onChange={e => setData('coordinator_name', e.target.value)}
                                />
                            </div>
                            <div className="mb-2">
                                <label className="block mb-1 text-slate-300">Venue</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                                    value={data.venue || ''}
                                    onChange={e => setData('venue', e.target.value)}
                                    placeholder="Enter event venue"
                                />
                                {errors.venue && <p className="text-red-500 text-xs mt-1">{errors.venue}</p>}
                            </div>
                            <div className="mb-2">
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
                                    </div>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block mb-1 text-slate-300">Event Start Date & Time</label>
                                <DateTimePicker
                                    value={data.event_date}
                                    onChange={(value) => setData('event_date', value)}
                                    label=""
                                    placeholder="Select event date and time"
                                />
                                {errors.event_date && <p className="text-red-500 text-xs mt-1">{errors.event_date}</p>}
                            </div>
                            <div className="mb-4">
                                <label className="block mb-1 text-slate-300">Event End Date</label>
                                <CalendarPicker
                                    value={data.event_end_date}
                                    onChange={(value) => setData('event_end_date', value)}
                                    label=""
                                    placeholder="Select event end date"
                                />
                                {errors.event_end_date && <p className="text-red-500 text-xs mt-1">{errors.event_end_date}</p>}
                            </div>
                            <div className="mt-4">
                                <div className="mb-4">
                                    <label className="block mb-1 text-slate-300">Registration End Date & Time</label>
                                    <DateTimePicker
                                        value={data.registration_end_date}
                                        onChange={(value) => setData('registration_end_date', value)}
                                        label=""
                                        placeholder="Select registration end date and time"
                                    />
                                    {errors.registration_end_date && <p className="text-red-500 text-xs mt-1">{errors.registration_end_date}</p>}
                                </div>
                            </div>     {/* Images */}
                            <div className="mb-2">
                                <label className="block mb-1 text-slate-300">Image of the event</label>
                                {data.images.map((img, idx) => (
                                    <input
                                        key={idx}
                                        type="file"
                                        className="bg-slate-800/60 border border-slate-700 text-slate-100 rounded-md mt-1 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-slate-700 file:text-slate-100 hover:file:bg-slate-600"
                                        style={{ width: '100%' }}
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
                                Yes, Create Tryouts
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