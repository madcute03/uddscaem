import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

// Custom Calendar Component
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

    const handleDateSelect = (date) => {
        if (date) {
            const formattedDate = date.toISOString().split('T')[0];
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
        return date.toISOString().split('T')[0] === value;
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
                <div className="absolute top-full left-0 mt-1 w-full bg-slate-800 border border-slate-700 rounded-md shadow-lg z-[60] p-4">
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
                </div>
            )}

            {/* Overlay to close calendar when clicking outside */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[55]"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

// Custom Time Picker Component
const TimePicker = ({ value, onChange, label, placeholder = "Select time" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedHour, setSelectedHour] = useState('');
    const [selectedMinute, setSelectedMinute] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState('AM');
    
    // Parse existing value when component loads
    useEffect(() => {
        if (value) {
            const [hours, minutes] = value.split(':');
            const hour24 = parseInt(hours);
            const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
            const period = hour24 >= 12 ? 'PM' : 'AM';
            
            setSelectedHour(hour12.toString());
            setSelectedMinute(minutes);
            setSelectedPeriod(period);
        }
    }, [value]);
    
    const formatTime = (hour, minute, period) => {
        if (!hour || !minute || !period) return '';
        return `${hour}:${minute} ${period}`;
    };

    const convertTo24Hour = (hour12, minute, period) => {
        let hour24 = parseInt(hour12);
        if (period === 'AM' && hour24 === 12) {
            hour24 = 0;
        } else if (period === 'PM' && hour24 !== 12) {
            hour24 += 12;
        }
        return `${hour24.toString().padStart(2, '0')}:${minute}`;
    };

    const handleTimeChange = (newHour, newMinute, newPeriod) => {
        const hour = newHour || selectedHour;
        const minute = newMinute || selectedMinute;
        const period = newPeriod || selectedPeriod;
        
        if (hour && minute && period) {
            const time24 = convertTo24Hour(hour, minute, period);
            onChange(time24);
        }
    };

    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    return (
        <div className="relative">
            <label className="block mb-1 text-slate-300">{label}</label>
            <div
                className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 rounded-md px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600/50 flex items-center justify-between"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={value ? 'text-slate-100' : 'text-slate-400'}>
                    {value ? formatTime(selectedHour, selectedMinute, selectedPeriod) : placeholder}
                </span>
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-full bg-slate-800 border border-slate-700 rounded-md shadow-lg z-[60] p-4">
                    <div className="grid grid-cols-3 gap-4">
                        {/* Hour Selection */}
                        <div>
                            <label className="block text-xs text-slate-400 mb-2">Hour</label>
                            <div className="max-h-32 overflow-y-auto border border-slate-600 rounded">
                                {hours.map((hour) => (
                                    <button
                                        key={hour}
                                        type="button"
                                        onClick={() => {
                                            setSelectedHour(hour);
                                            handleTimeChange(hour, selectedMinute, selectedPeriod);
                                        }}
                                        className={`
                                            w-full text-center py-1 hover:bg-slate-700 transition-colors
                                            ${selectedHour === hour ? 'bg-blue-600 text-white' : 'text-slate-300'}
                                        `}
                                    >
                                        {hour}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Minute Selection */}
                        <div>
                            <label className="block text-xs text-slate-400 mb-2">Minute</label>
                            <div className="max-h-32 overflow-y-auto border border-slate-600 rounded">
                                {minutes.map((minute) => (
                                    <button
                                        key={minute}
                                        type="button"
                                        onClick={() => {
                                            setSelectedMinute(minute);
                                            handleTimeChange(selectedHour, minute, selectedPeriod);
                                        }}
                                        className={`
                                            w-full text-center py-1 hover:bg-slate-700 transition-colors
                                            ${selectedMinute === minute ? 'bg-blue-600 text-white' : 'text-slate-300'}
                                        `}
                                    >
                                        {minute}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* AM/PM Selection */}
                        <div>
                            <label className="block text-xs text-slate-400 mb-2">Period</label>
                            <div className="border border-slate-600 rounded">
                                {['AM', 'PM'].map((period) => (
                                    <button
                                        key={period}
                                        type="button"
                                        onClick={() => {
                                            setSelectedPeriod(period);
                                            handleTimeChange(selectedHour, selectedMinute, period);
                                        }}
                                        className={`
                                            w-full text-center py-2 hover:bg-slate-700 transition-colors
                                            ${selectedPeriod === period ? 'bg-blue-600 text-white' : 'text-slate-300'}
                                        `}
                                    >
                                        {period}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-colors"
                    >
                        Done
                    </button>
                </div>
            )}

            {/* Overlay to close time picker when clicking outside */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[55]"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

// ViewCreatedNews Component
const ViewCreatedNews = ({ news = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    title: '',
    content: '',
    tags: '',
    published_date: '',
    published_time: '',
    location: '',
    author: '',
    cover_image: null,
    cover_image_preview: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditData({
      title: item.title || '',
      content: item.content || '',
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || ''),
      published_date: item.published_at ? item.published_at.split('T')[0] : '',
      published_time: item.published_at ? item.published_at.split('T')[1]?.substring(0, 5) : '',
      location: item.location || '',
      author: item.author || '',
      cover_image: null,
      cover_image_preview: item.cover_image ? `/storage/${item.cover_image}` : null
    });
    setError('');
    setSuccess('');
  };

  const handleEditChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'cover_image') {
      const file = files[0];
      setEditData(prev => ({
        ...prev,
        cover_image: file,
        cover_image_preview: file ? URL.createObjectURL(file) : prev.cover_image_preview
      }));
    } else {
      setEditData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleEditSubmit = async (e, itemId) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      
      // Add all fields to formData
      Object.entries(editData).forEach(([key, value]) => {
        if (key === 'published_date' || key === 'published_time' || key === 'cover_image_preview') {
          return; // Skip these as they're not part of the form data
        }
        
        if (key === 'tags') {
          // Convert tags string to array
          const tagsArray = value.split(',').map(tag => tag.trim()).filter(tag => tag);
          formData.append('tags', tagsArray.join(','));
        } else if (key === 'cover_image' && value) {
          // Only append if it's a new file
          formData.append('cover_image', value);
        } else if (key === 'published_date' && value && editData.published_time) {
          // Handle date and time combination
          formData.append('published_at', `${value}T${editData.published_time}`);
        } else if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      const response = await fetch(`/news/${itemId}`, {
        method: 'POST',
        headers: {
          'X-HTTP-Method-Override': 'PUT',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update news');
      }

      setSuccess('News updated successfully!');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setError(err.message || 'An error occurred while updating the news');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this news item?')) return;
    
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/news/${id}`, {
        method: 'POST',
        headers: {
          'X-HTTP-Method-Override': 'DELETE',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete news');
      }

      setSuccess('News deleted successfully!');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setError(err.message || 'An error occurred while deleting the news');
    } finally {
      setIsLoading(false);
    }
  };

  if (news.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-xl shadow-lg shadow-blue-950/30">
        <h3 className="text-lg font-semibold mb-4">Created News</h3>
        <p className="text-slate-400">No news created yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-xl shadow-lg shadow-blue-950/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Created News ({news.length})</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
      
      {/* Success and Error Messages */}
      {success && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 text-green-300 rounded-md">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-300 rounded-md">
          {error}
        </div>
      )}
      
      <div className={`space-y-4 ${isExpanded ? 'max-h-96 overflow-y-auto' : 'max-h-32 overflow-hidden'} transition-all duration-300`}>
        {news.map((item) => (
          <div key={item.id} className="border-b border-slate-700 pb-3 last:border-b-0">
            {editingId === item.id ? (
              <form onSubmit={(e) => handleEditSubmit(e, item.id)} className="space-y-3">
                <div>
                  <input
                    type="text"
                    name="title"
                    value={editData.title}
                    onChange={handleEditChange}
                    className="w-full border border-slate-600 bg-slate-700 text-white px-2 py-1 rounded text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Title"
                    required
                  />
                </div>
                <div>
                  <textarea
                    name="content"
                    value={editData.content}
                    onChange={handleEditChange}
                    className="w-full border border-slate-600 bg-slate-700 text-white px-2 py-1 rounded text-sm focus:border-blue-500 focus:outline-none"
                    rows="3"
                    placeholder="Content"
                    required
                  />
                </div>
                
                {/* Cover Image Update */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Cover Image</label>
                  <input
                    type="file"
                    name="cover_image"
                    onChange={handleEditChange}
                    accept="image/*"
                    className="w-full text-xs text-slate-300 file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-slate-700 file:text-slate-300 hover:file:bg-slate-600"
                  />
                  {editData.cover_image_preview && (
                    <div className="mt-2">
                      <img 
                        src={editData.cover_image_preview} 
                        alt="Preview" 
                        className="h-20 w-20 object-cover rounded border border-slate-600"
                      />
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <CalendarPicker
                    label=""
                    value={editData.published_date}
                    onChange={(date) => setEditData({...editData, published_date: date})}
                    placeholder="Select date"
                  />
                  <TimePicker
                    label=""
                    value={editData.published_time}
                    onChange={(time) => setEditData({...editData, published_time: time})}
                    placeholder="Select time"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    name="author"
                    value={editData.author}
                    onChange={handleEditChange}
                    className="border border-slate-600 bg-slate-700 text-white px-2 py-1 rounded text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Author"
                  />
                  <input
                    type="text"
                    name="location"
                    value={editData.location}
                    onChange={handleEditChange}
                    className="border border-slate-600 bg-slate-700 text-white px-2 py-1 rounded text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Location"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="tags"
                    value={editData.tags}
                    onChange={handleEditChange}
                    className="w-full border border-slate-600 bg-slate-700 text-white px-2 py-1 rounded text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Tags (comma-separated)"
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      isLoading 
                        ? 'bg-blue-700 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setEditingId(null)} 
                    disabled={isLoading}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-slate-100 mb-1">{item.title}</h4>
                  <p className="text-sm text-slate-400 mb-2 line-clamp-2">{item.content}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    {item.published_at && (
                      <span>📅 {new Date(item.published_at).toLocaleDateString()}</span>
                    )}
                    {item.author && <span>👤 {item.author}</span>}
                    {item.location && <span>📍 {item.location}</span>}
                  </div>
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(Array.isArray(item.tags) ? item.tags : item.tags.split(',')).map((tag, tagIndex) => (
                        <span key={tagIndex} className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded">
                          {typeof tag === 'string' ? tag.trim() : tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-3">
                  {item.cover_image && (
                    <img
                      src={`/storage/${item.cover_image}`}
                      alt="Cover"
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => startEdit(item)}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
                      disabled={isLoading}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {!isExpanded && news.length > 2 && (
        <div className="text-center mt-3">
          <button
            onClick={() => setIsExpanded(true)}
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
          >
            View all {news.length} news items
          </button>
        </div>
      )}
    </div>
  );
};

export default function CreateNews() {
  const { news = [] } = usePage().props;
  const { data, setData, post, processing, reset, errors } = useForm({
    title: '',
    content: '',
    category: '',
    tags: '', // comma-separated
    published_date: '', // date only
    published_time: '', // time only
    location: '',
    author: '',
    cover_image: null,
  });

  // Handle file input change
  const handleFileChange = (e) => {
    setData('cover_image', e.target.files[0] || null);
  };

  // Combine date and time for submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create FormData for file upload
    const formData = new FormData();
    
    // Add all form data to FormData
    Object.keys(data).forEach(key => {
      if (key === 'cover_image') {
        if (data.cover_image) {
          formData.append('cover_image', data.cover_image);
        }
      } else if (key === 'published_date' || key === 'published_time') {
        // Skip these as we'll handle them separately
      } else if (data[key] !== null && data[key] !== '') {
        formData.append(key, data[key]);
      }
    });
    
    // Combine date and time into datetime-local format
    if (data.published_date && data.published_time) {
      formData.append('published_at', `${data.published_date}T${data.published_time}`);
    }
    
    // Post the form data using Inertia
    post(route('news.store'), formData, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        reset();
        // Show success message
        window.scrollTo(0, 0);
      },
    });
  };


  return (
    <AuthenticatedLayout>
      <Head title="Create News" />
      <div className="py-8 px-2 sm:px-4 md:px-8">
        <div className="mx-auto max-w-4xl w-full space-y-6 text-slate-100">

          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-xl shadow-lg shadow-blue-950/30">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Create News</h2>
              <div className="flex items-center gap-3">
              
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4" encType="multipart/form-data">
              <div>
                <label className="block mb-1 text-slate-300">Title / Headline</label>
                <input
                  type="text"
                  value={data.title}
                  onChange={(e) => setData('title', e.target.value)}
                  className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                  required
                />
                {errors.title && <p className="text-red-300 text-sm mt-1">{errors.title}</p>}
              </div>

              {/* Cover Image */}
              <div>
                <label className="block mb-1 text-slate-300">Cover Image (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 rounded-md file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-slate-700 file:text-slate-100 hover:file:bg-slate-600"
                />
                {errors.cover_image && <p className="text-red-300 text-sm mt-1">{errors.cover_image}</p>}
                {data.cover_image && (
                  <div className="mt-3 flex items-center gap-3">
                    <img
                      src={data.cover_image instanceof File ? URL.createObjectURL(data.cover_image) : data.cover_image}
                      alt="Cover preview"
                      className="h-24 w-24 object-cover rounded border border-white/20"
                    />
                    <button
                      type="button"
                      onClick={() => setData('cover_image', null)}
                      className="btn-blue-glow"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-1">Recommended: JPG/PNG up to 4MB.</p>
              </div>

              <div>
                <label className="block mb-1 text-slate-300">Content / Description</label>
                <textarea
                  value={data.content}
                  onChange={(e) => setData('content', e.target.value)}
                  rows={6}
                  className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                  required
                />
                {errors.content && <p className="text-red-300 text-sm mt-1">{errors.content}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-slate-300">Category</label>
                  <input
                    type="text"
                    value={data.tags}
                    onChange={(e) => setData('tags', e.target.value)}
                    placeholder="e.g. Announcement, Sports, Campus"
                    className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <CalendarPicker
                    label="Date"
                    value={data.published_date}
                    onChange={(date) => setData('published_date', date)}
                    placeholder="Select publication date"
                  />
                </div>
                <div>
                  <TimePicker
                    label="Time"
                    value={data.published_time}
                    onChange={(time) => setData('published_time', time)}
                    placeholder="Select publication time"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-slate-300">Location / Venue</label>
                <input
                  type="text"
                  value={data.location}
                  onChange={(e) => setData('location', e.target.value)}
                  className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-300">Organizer / Author</label>
                <input
                  type="text"
                  value={data.author}
                  onChange={(e) => setData('author', e.target.value)}
                  className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={processing} className="w-[131px] h-[45px] rounded-[15px] cursor-pointer 
                                                               transition duration-300 ease-in-out 
                                                               bg-gradient-to-br from-[#2e8eff] to-[#2e8eff]/0 
                                                               bg-[#2e8eff]/20 flex items-center justify-center 
                                                               hover:bg-[#2e8eff]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)] 
                                                               focus:outline-none focus:bg-[#2e8eff]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]">
                  {processing ? 'Saving...' : 'Create News'}
                </button>
                <button type="button" onClick={() => reset()} className="w-[131px] h-[45px] rounded-[15px] cursor-pointer 
                                                               transition duration-300 ease-in-out 
                                                               bg-gradient-to-br from-[#ff0000] to-[#ff0000]/0 
                                                               bg-[#ff0000]/20 flex items-center justify-center 
                                                               hover:bg-[#ff0000]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)] 
                                                               focus:outline-none focus:bg-[#ff0000]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]">
                  Reset
                </button>
              </div>
            </form>
          </div>
          
          {/* View Created News Section */}
          <ViewCreatedNews news={news} />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
