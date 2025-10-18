import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function EditEvent({ auth, event }) {
    const { data, setData, put, processing, errors } = useForm({
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
        existingImages: event.images || [],
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
        formData.append('event_type', data.event_type);
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
        if (data.has_registration_end_date && data.registration_end_date) {
            formData.append('registration_end_date', data.registration_end_date);
            formData.append('registration_type', data.registration_type || 'team');
            if (data.registration_type === 'team' && data.team_size) {
                formData.append('team_size', data.team_size);
            }
        }

        if (data.event_type !== 'tryouts' && Array.isArray(data.participants)) {
            data.participants
                .filter(p => p.trim().length > 0)
                .forEach((participant, index) => {
                    formData.append(`participants[${index}]`, participant);
                });
        }

        if (data.existingImages && data.existingImages.length > 0) {
            data.existingImages.forEach(img => {
                const path = typeof img === 'string' ? img : img.image_path;
                formData.append('existing_images[]', path);
            });
        }

        if (data.images && data.images.length > 0) {
            data.images.forEach((file) => {
                formData.append('images[]', file);
            });
        }

        if (data.rulebook instanceof File) {
            formData.append('rulebook', data.rulebook);
        }

        put(route('events.update', event.id), {
            data: formData,
            forceFormData: true,
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
                                    <label className="block text-slate-300 mb-2">Event Title *</label>
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
                                    <label className="block text-slate-300 mb-2">Description *</label>
                                    <textarea
                                        rows={4}
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                    {errors.description && <p className="mt-1 text-sm text-red-400">{errors.description}</p>}
                                </div>

                                <div>
                                    <label className="block text-slate-300 mb-2">Coordinator Name *</label>
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
                                    <label className="block text-slate-300 mb-2">Event Type *</label>
                                    <select
                                        value={data.event_type}
                                        onChange={(e) => setData('event_type', e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Select Type</option>
                                        <option value="competition">Competition</option>
                                        <option value="tryouts">Tryouts</option>
                                        <option value="intramurals">Intramurals</option>
                                        <option value="general">General</option>
                                    </select>
                                    {errors.event_type && <p className="mt-1 text-sm text-red-400">{errors.event_type}</p>}
                                </div>

                                <div>
                                    <label className="block text-slate-300 mb-2">Category *</label>
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
                                    <label className="block text-slate-300 mb-2">Event Start Date & Time *</label>
                                    <input
                                        type="datetime-local"
                                        value={data.event_date}
                                        onChange={(e) => setData('event_date', e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                    {errors.event_date && <p className="mt-1 text-sm text-red-400">{errors.event_date}</p>}
                                </div>

                                <div>
                                    <label className="block text-slate-300 mb-2">Event End Date</label>
                                    <input
                                        type="date"
                                        value={data.event_end_date}
                                        onChange={(e) => setData('event_end_date', e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {errors.event_end_date && <p className="mt-1 text-sm text-red-400">{errors.event_end_date}</p>}
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
                                            Enable Registration End Date
                                        </label>
                                    </div>

                                    {data.has_registration_end_date && (
                                        <>
                                            <div>
                                                <label className="block text-slate-300 mb-2">Registration End Date & Time</label>
                                                <input
                                                    type="datetime-local"
                                                    value={data.registration_end_date}
                                                    onChange={(e) => setData('registration_end_date', e.target.value)}
                                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                <h2 className="text-xl font-semibold text-white mb-4">Participants</h2>
                                <div className="space-y-2">
                                    {data.participants.map((participant, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={participant}
                                                onChange={(e) => updateParticipant(index, e.target.value)}
                                                placeholder={`Participant ${index + 1}`}
                                                className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            {data.participants.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeParticipant(index)}
                                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addParticipant}
                                        className="text-blue-400 hover:text-blue-300 text-sm"
                                    >
                                        + Add Participant
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Event Images */}
                        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
                            <h2 className="text-xl font-semibold text-white mb-4">Event Images</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-slate-300 mb-2">Upload New Images</label>
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
