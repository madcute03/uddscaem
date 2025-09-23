import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import React, { useState, useEffect } from 'react'
import { usePage, Link } from '@inertiajs/react'

// Custom DateTime Picker Component
const DateTimePicker = ({ value, onChange, label, placeholder = "Select date and time" }) => {
    // Parse the initial date and time from the value prop
    const initialDate = value ? value.split('T')[0] : '';
    const initialTime = value ? (value.split('T')[1] || '').substring(0, 5) : '00:00';
    
    const [dateValue, setDateValue] = useState(initialDate);
    const [timeValue, setTimeValue] = useState(initialTime);
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [activeTab, setActiveTab] = useState('date'); // 'date' or 'time'

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
            // Create a new date string in YYYY-MM-DD format using local time
            // This ensures the date is not affected by timezone conversion
            const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
            const newDate = localDate.toISOString().split('T')[0];
            
            setDateValue(newDate);
            updateDateTime(newDate, timeValue);
            setActiveTab('time');
        }
    };

    const handleTimeChange = (e) => {
        const newTime = e.target.value;
        setTimeValue(newTime);
        // Only update the date time if we have a date value
        if (dateValue) {
            updateDateTime(dateValue, newTime);
        }
    };

    const updateDateTime = (date, time) => {
        if (date) {
            // If time is not provided, use the current timeValue or default to '00:00'
            const timeToUse = time || timeValue || '00:00';
            const dateTimeString = `${date}T${timeToUse}`;
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
        // Convert both dates to YYYY-MM-DD format for accurate comparison
        const dateStr = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        return dateStr === dateValue;
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
                    setIsOpen(!isOpen);
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
                <div className="absolute top-full left-0 mt-1 w-full bg-slate-800 border border-slate-700 rounded-md shadow-lg z-[60] p-4">
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
                        <>
                            {/* Calendar Header */}
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    type="button"
                                    onClick={() => navigateMonth(-1)}
                                    className="p-1 hover:bg-slate-700 rounded"
                                >
                                    <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <h3 className="text-slate-100 font-medium">{monthYear}</h3>
                                <button
                                    type="button"
                                    onClick={() => navigateMonth(1)}
                                    className="p-1 hover:bg-slate-700 rounded"
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
                        </>
                    )}

                    {activeTab === 'time' && (
                        <div className="p-2">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Select Time
                            </label>
                            <input
                                type="time"
                                value={timeValue}
                                onChange={handleTimeChange}
                                className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-md px-3 py-2"
                            />
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-slate-700">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-700/50 border border-slate-600 rounded-md hover:bg-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

function Dashboard() {
    const { auth, events = [] } = usePage().props;
    const user = auth.user;
    const [currentSlide, setCurrentSlide] = useState({});

    const [editingEventId, setEditingEventId] = useState(null);
    const [editData, setEditData] = useState({
        id: '',
        title: '',
        description: '',
        event_type: '',
        event_date: '',
        coordinator_name: '',
        registration_end_date: '',
        has_registration_end_date: false,
        has_required_players: false,
        is_done: false,
        images: [],
        existingImages: [],
        required_players: '2',
    });
    
    // Ensure images is always an array
    const safeImages = Array.isArray(editData.images) ? editData.images : [];


    // Event type color mapping
    const eventTypeColors = {
        'Basketball': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        'Volleyball': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
        'Badminton': 'bg-green-500/20 text-green-300 border-green-500/30',
        'Chess': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        'Table Tennis': 'bg-red-500/20 text-red-300 border-red-500/30',
        'default': 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    };
    
    // Get color class for event type
    const getEventTypeColor = (type) => {
        return eventTypeColors[type] || eventTypeColors.default;
    };

    // Format date and time for display
    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return '';
        const date = new Date(dateTimeString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    // Handle date time change for the event date
    const handleEventDateTimeChange = (dateTimeString) => {
        setEditData(prev => ({
            ...prev,
            event_date: dateTimeString
        }));
    };

    // Handle date time change for the registration end date
    const handleRegistrationDateTimeChange = (dateTimeString) => {
        setEditData(prev => ({
            ...prev,
            registration_end_date: dateTimeString
        }));
    };

    const startEdit = (event) => {
        setEditingEventId(event.id);
        setEditData({
            id: event.id,
            title: event.title,
            description: event.description,
            event_type: event.event_type,
            // Ensure event_date is properly formatted
            event_date: event.event_date ? event.event_date.split('.')[0] : '', // Remove milliseconds if present
            coordinator_name: event.coordinator_name || '',
            // Ensure registration_end_date is properly formatted
            registration_end_date: event.registration_end_date ? event.registration_end_date.split('.')[0] : '',
            has_registration_end_date: !!event.registration_end_date,
            has_required_players: !!event.required_players,
            is_done: event.is_done,
            images: [],
            existingImages: event.images || [],
            required_players: event.required_players || '2',
        });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const formData = new FormData();
            
            // Add basic fields
            formData.append('_method', 'PUT'); // For Laravel to recognize as PUT request
            formData.append('title', editData.title);
            formData.append('description', editData.description);
            formData.append('coordinator_name', editData.coordinator_name);
            formData.append('event_type', editData.event_type);
            formData.append('allow_bracketing', editData.allow_bracketing ? '1' : '0');
            
            // Handle event date and time
            if (editData.event_date) {
                // Use the date string directly as it's already in YYYY-MM-DD format
                const [datePart, timePart] = editData.event_date.split('T');
                formData.append('event_date', datePart);
                formData.append('event_time', timePart ? timePart.substring(0, 5) : '00:00');
            }
            
            // Handle registration end date and time if it exists
            if (editData.has_registration_end_date && editData.registration_end_date) {
                // Use the date string directly as it's already in YYYY-MM-DD format
                const [datePart, timePart] = editData.registration_end_date.split('T');
                formData.append('registration_end_date', datePart);
                formData.append('registration_end_time', timePart ? timePart.substring(0, 5) : '00:00');
            } else {
                formData.append('registration_end_date', '');
                formData.append('registration_end_time', '');
            }

            // Handle required players
            formData.append('has_required_players', editData.has_required_players ? '1' : '0');
            if (editData.has_required_players && editData.required_players) {
                formData.append('required_players', editData.required_players);
            } else {
                formData.append('required_players', '');
            }

            // Handle existing images (keep the ones that weren't removed)
            if (editData.existingImages && editData.existingImages.length > 0) {
                editData.existingImages.forEach(img => {
                    formData.append('existing_images[]', img.image_path);
                });
            }

            // Handle new image uploads
            if (editData.images && editData.images.length > 0) {
                editData.images.forEach((file) => {
                    formData.append('images[]', file);
                });
            }

            console.log('Submitting form with data:');
            for (let pair of formData.entries()) {
                console.log(pair[0] + ': ', pair[1]);
            }

            const response = await fetch(`/events/${editingEventId}`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: formData,
            });

            // Get the response text first
            const responseText = await response.text();
            let responseData;
            
            try {
                // Try to parse as JSON
                responseData = JSON.parse(responseText);
            } catch (e) {
                // If it's not JSON, it's probably an HTML error page
                console.error('HTML Response:', responseText);
                throw new Error('Server returned an error page. Check the console for details.');
            }

            if (!response.ok) {
                console.error('Error response:', responseData);
                // Handle validation errors
                if (responseData.errors) {
                    const errorMessages = Object.values(responseData.errors).flat().join('\n');
                    throw new Error(errorMessages);
                }
                throw new Error(responseData.message || 'Failed to update event');
            }

            console.log('Success:', responseData);
            
            // Show success message and reload after a short delay
            alert('Event updated successfully!');
            setEditingEventId(null);
            window.location.reload();
        } catch (error) {
            console.error('Error updating event:', error);
            // Show more detailed error message
            alert('Error updating event: ' + (error.message || 'Please check the console for details'));
            
            // Log the full error for debugging
            if (error.response) {
                console.error('Full error response:', error.response);
            }
        }
    };

    const handleDelete = (id) => {
        if (!confirm('Delete this event?')) return;
        fetch(`/events/${id}`, {
            method: 'POST',
            headers: {
                'X-HTTP-Method-Override': 'DELETE',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
            },
        }).then(() => window.location.reload());
    };

    const handleMarkDone = (id) => {
        fetch(`/events/${id}/mark-done`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
            },
        }).then(() => window.location.reload());
    };

    const handleMarkUndone = (id) => {
        fetch(`/events/${id}/mark-undone`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
            },
        }).then(() => window.location.reload());
    };

    return (
        <AuthenticatedLayout
                user={auth.user}
                header={<h2 className="font-semibold text-xl text-gray-100 leading-tight">Dashboard</h2>}
            >        <div className="flex items-center justify-center py-10">
                    <div className="flex items-center gap-10 flex-col md:flex-row">
                        <img src="/images/sems.png" alt="Logo" className="h-40 w-40 rounded-full object-cover ring-4 ring-blue-500/60 shadow-2xl shadow-blue-900/40" />
                        <div className="text-center md:text-left">
                            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-300">Welcome!</span>
                                <span className="block md:inline md:ml-3 text-blue-300">{user.name}</span>
                            </h1>
                           
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-xl shadow-lg shadow-blue-950/30">
                    <h2 className="text-2xl font-bold mb-6 text-white">Events</h2>
                    {events.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-gray-400">No events created yet.</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map(event => (
                            <div key={event.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 relative">
                        {event.is_done && (
                            <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md">
                                COMPLETED
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
                                        <label className="block text-sm">Event Type</label>
                                        <input
                                            type="text"
                                            value={editData.event_type}
                                            onChange={e => setEditData({ ...editData, event_type: e.target.value })}
                                            className="w-full border border-slate-600 bg-slate-700 text-white px-2 py-1 rounded focus:border-blue-500 focus:outline-none mb-2"
                                            placeholder="Enter event type"
                                            required
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

                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <input
                                                type="checkbox"
                                                id="hasRequiredPlayers"
                                                checked={editData.has_required_players}
                                                onChange={(e) => {
                                                    const hasPlayers = e.target.checked;
                                                    setEditData({
                                                        ...editData,
                                                        has_required_players: hasPlayers,
                                                        required_players: hasPlayers ? editData.required_players || '2' : ''
                                                    });
                                                }}
                                                className="h-4 w-4 rounded border-gray-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                                            />
                                            <label htmlFor="hasRequiredPlayers" className="text-sm">Set Required Players</label>
                                        </div>
                                        {editData.has_required_players && (
                                            <input
                                                type="number"
                                                min="1"
                                                value={editData.required_players}
                                                onChange={e => setEditData({ ...editData, required_players: e.target.value })}
                                                className="w-full border border-slate-600 bg-slate-700 text-white px-2 py-1 rounded focus:border-blue-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                placeholder="Enter number of required players"
                                            />
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm">Event Date & Time</label>
                                        <DateTimePicker
                                            value={editData.event_date}
                                            onChange={handleEventDateTimeChange}
                                            placeholder="Select event date and time"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="block text-sm font-medium text-gray-300">Registration End Date & Time</label>
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="has_registration_end_date"
                                                    checked={editData.has_registration_end_date}
                                                    onChange={(e) => setEditData(prev => ({
                                                        ...prev,
                                                        has_registration_end_date: e.target.checked,
                                                        registration_end_date: e.target.checked ? (prev.registration_end_date || '') : ''
                                                    }))}
                                                    className="h-4 w-4 rounded border-gray-600 bg-slate-700 text-blue-500 focus:ring-blue-600"
                                                />
                                                <label htmlFor="has_registration_end_date" className="ml-2 text-sm text-gray-300">
                                                    Set registration end date
                                                </label>
                                            </div>
                                        </div>
                                        {editData.has_registration_end_date && (
                                            <DateTimePicker
                                                value={editData.registration_end_date}
                                                onChange={handleRegistrationDateTimeChange}
                                                placeholder="Select registration end date and time"
                                            />
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <label className="block text-sm font-medium text-slate-300">Event Images</label>
                                        
                                        {/* New Images Upload - Made smaller */}
                                        <div className="flex items-center justify-center w-full">
                                            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-slate-800/50 border-slate-700 hover:bg-slate-800/70">
                                                <div className="flex flex-col items-center justify-center px-4 py-3">
                                                    <svg className="w-6 h-6 mb-1 text-slate-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
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
                                            <div className="flex justify-between items-start gap-2">
                                                <h3 className="text-lg font-semibold text-white break-words flex-1">{event.title}</h3>
                                                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap border ${getEventTypeColor(event.event_type)}`}>
                                                    {event.event_type}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <p className="text-gray-300 mb-3">{event.description}</p>
                                        
                                        <div className="text-sm text-gray-400 space-y-1 mb-4">
                                            <div className="flex items-center">
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                {event.coordinator_name}
                                            </div>
                                            <div className="flex items-center">
                                            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <div>
                                                {new Date(event.event_date).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    timeZone: 'UTC'
                                                })}
                                                <span className="text-amber-400 ml-2">
                                                    {new Date(event.event_date).toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        hour12: true,
                                                        timeZone: 'UTC'
                                                    })}
                                                </span>
                                            </div>
                                            </div>
                                            {event.registration_end_date && (
                                                <div className="flex items-center">
                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="text-amber-400">
                                                        Reg. until: {new Date(event.registration_end_date).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            timeZone: 'UTC'
                                                        })}
                                                    </span>
                                                </div>
                                            )}
                                            {event.required_players && (
                                                <div className="flex items-center">
                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                    </svg>
                                                    Required {event.required_players} players
                                                </div>
                                            )}
                                        </div>
                                        
                                        {event.images_path?.length > 0 && (
                                            <div className="mt-3 relative h-32 overflow-hidden rounded-lg bg-slate-700/30 group">
                                                <div className="absolute inset-0 flex transition-transform duration-300 ease-in-out" 
                                                     style={{ transform: `translateX(-${currentSlide[event.id] || 0}%)` }}>
                                                    {event.images_path.map((imgPath, idx) => (
                                                        <div key={idx} className="min-w-full h-full">
                                                            <img 
                                                                src={`/storage/${imgPath}`} 
                                                                alt={`Event ${idx + 1}`} 
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                                
                                                {/* Navigation Buttons */}
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const current = currentSlide[event.id] || 0;
                                                        const newSlide = current > 0 ? current - 100 : (event.images_path.length - 1) * 100;
                                                        setCurrentSlide({...currentSlide, [event.id]: newSlide});
                                                    }}
                                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/70"
                                                >
                                                    ❮
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const current = currentSlide[event.id] || 0;
                                                        const newSlide = current < (event.images_path.length - 1) * 100 ? current + 100 : 0;
                                                        setCurrentSlide({...currentSlide, [event.id]: newSlide});
                                                    }}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/70"
                                                >
                                                    ❯
                                                </button>
                                                
                                                {/* Dots Indicator */}
                                                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                                                    {event.images_path.map((_, idx) => (
                                                        <button 
                                                            key={idx}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setCurrentSlide({...currentSlide, [event.id]: idx * 100});
                                                            }}
                                                            className={`w-2 h-2 rounded-full transition-all duration-300 ${(currentSlide[event.id] || 0) / 100 === idx ? 'bg-white w-4' : 'bg-white/30'}`}
                                                            aria-label={`Go to slide ${idx + 1}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-700 flex justify-end gap-4">
                                        {!event.is_done ? (
                                            <button
                                                onClick={() => handleMarkDone(event.id)}
                                                className="text-gray-400 hover:text-green-500 transition-colors"
                                                title="Mark as done"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleMarkUndone(event.id)}
                                                className="text-gray-400 hover:text-amber-500 transition-colors"
                                                title="Mark as not done"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}

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
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    )
}

export default Dashboard;
