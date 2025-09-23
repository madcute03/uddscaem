import React, { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';

const EventTypeSelector = ({ value, onChange, error, onTypeSelect }) => {
    const [showOtherInput, setShowOtherInput] = useState(false);
    const [otherEventName, setOtherEventName] = useState('');
    const inputRef = useRef(null);
    
    // Focus the input when it becomes visible
    useEffect(() => {
        if (showOtherInput && inputRef.current) {
            inputRef.current.focus();
        }
    }, [showOtherInput]);
    const handleEventTypeChange = (e) => {
        const selectedValue = e.target.value;
        
        // Show/hide other event name input
        setShowOtherInput(selectedValue === 'other');
        
        // Call the parent's onChange
        onChange({
            event_type: selectedValue,
            other_event_type: selectedValue === 'other' ? otherEventName : ''
        });
        
        // Handle navigation for non-other event types
        const routes = {
            'tryouts': '/dashboard/create-tryouts',
            'competition': '/dashboard/create-competition',
            'intramurals': '/dashboard/create-intramurals'
        };
        
        if (routes[selectedValue]) {
            window.location.href = window.location.origin + routes[selectedValue];
        }
    };
    
    const handleOtherSubmit = (e) => {
        e.preventDefault();
        if (otherEventName.trim()) {
            // Update the form with the entered event name
            onChange({
                event_type: 'other',
                other_event_type: otherEventName
            });
            // Navigate to the other event page
            window.location.href = `${window.location.origin}/dashboard/create-other-event?name=${encodeURIComponent(otherEventName)}`;
        }
    };
    
    const handleOtherNameChange = (e) => {
        const newName = e.target.value;
        setOtherEventName(newName);
        // Update the form as the user types
        onChange({
            event_type: 'other',
            other_event_type: newName
        });
    };

    const handleOtherTypeChange = (e) => {
        const newValue = e.target.value;
        setOtherEventName(newValue);
        onChange({
            ...value,
            other_event_type: newValue
        });
    };

    return (
        <div className="mb-2">
            <label className="block mb-1 text-slate-300">Event Type</label>
            <div className="space-y-2">
                <select
                    className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                    value={value.event_type || ''}
                    onChange={handleEventTypeChange}
                >
                    <option value="">Select event type</option>
                    <option value="competition">Competition</option>
                    <option value="tryouts">Tryouts</option>
                    <option value="intramurals">Intramurals</option>
                    <option value="other">{value.other_event_type || 'Other (please specify)'}</option>                </select>
                
                {showOtherInput && (
                    <div className="flex space-x-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={otherEventName}
                            onChange={handleOtherNameChange}
                            placeholder="Enter event name"
                            className="flex-1 bg-slate-800/60 border border-slate-700 text-slate-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                        />
                        <button
                            onClick={handleOtherSubmit}
                            disabled={!otherEventName.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            OK
                        </button>
                    </div>
                )}
            </div>
            {error && (
                <p className="mt-1 text-sm text-red-500">
                    {error}
                </p>
            )}
            
        </div>
    );
};

export default EventTypeSelector;
