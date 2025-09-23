import React from 'react';

const EventTypeSelector = ({ value, onChange, error }) => {
    const handleEventTypeChange = (e) => {
        const selectedValue = e.target.value;
        onChange({
            event_type: selectedValue,
            // Clear other_event_type when switching away from 'other'
            other_event_type: selectedValue === 'other' ? value.other_event_type : ''
        });
    };

    const handleOtherTypeChange = (e) => {
        onChange({
            ...value,
            other_event_type: e.target.value
        });
    };

    return (
        <div className="mb-2">
            <label className="block mb-1 text-slate-300">Event Type</label>
            <select
                className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                value={value.event_type || ''}
                onChange={handleEventTypeChange}
            >
                <option value="">Select event type</option>
                <option value="competition">Competition</option>
                <option value="tryouts">Tryouts</option>
                <option value="intramurals">Intramurals</option>
                <option value="other">Other (please specify)</option>
            </select>
            {error && (
                <p className="mt-1 text-sm text-red-500">
                    {error}
                </p>
            )}
            {value.event_type === 'other' && (
                <div className="mt-2">
                    <input
                        type="text"
                        className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                        placeholder="Please specify event type"
                        value={value.other_event_type || ''}
                        onChange={handleOtherTypeChange}
                    />
                </div>
            )}
        </div>
    );
};

export default EventTypeSelector;
