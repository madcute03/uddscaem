import React, { useState, useRef, useEffect } from 'react';

const EventTypeSelector = ({ value, onChange, error, onTypeSelect }) => {
    const [showOtherInput, setShowOtherInput] = useState((value?.event_type ?? '') === 'other');
    const [otherEventName, setOtherEventName] = useState(value?.other_event_type ?? '');
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef(null);

    // Focus the input when it becomes visible
    useEffect(() => {
        if (showOtherInput && inputRef.current) {
            inputRef.current.focus();
        }
    }, [showOtherInput]);

    useEffect(() => {
        const isOther = (value?.event_type ?? '') === 'other';
        setShowOtherInput(isOther);
        if (isOther) {
            setOtherEventName(value?.other_event_type ?? '');
        }
    }, [value?.event_type, value?.other_event_type]);

    const handleEventTypeChange = (e) => {
        const selectedValue = e.target.value;

        // Show/hide other event name input
        setShowOtherInput(selectedValue === 'other');
        if (selectedValue !== 'other') {
            setOtherEventName('');
        }

        // Call the parent's onChange
        onChange({
            event_type: selectedValue,
            other_event_type: selectedValue === 'other' ? otherEventName : ''
        });

        if (onTypeSelect) {
            onTypeSelect(selectedValue);
        }

        // Handle navigation for non-other event types
        const routes = {
            'tryouts': '/dashboard/create-tryouts',
            'competition': '/dashboard/create-competition',
            'intramurals': '/dashboard/create-intramurals'
        };

        if (routes[selectedValue]) {
            setIsLoading(true);
            setTimeout(() => {
                window.location.href = `${window.location.origin}${routes[selectedValue]}`;
            }, 15);
        } else {
            setIsLoading(false);
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

    return (
        <div className="mb-2">
            {isLoading && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl px-8 py-6 shadow-2xl flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-blue-500/70 border-t-transparent rounded-full animate-spin" />
                        <p className="text-slate-200 text-sm font-medium">Loading, please wait...</p>
                    </div>
                </div>
            )}
            <label className="block mb-1 text-slate-300">Event Type</label>
            <div className="space-y-2">
                <select
                    className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                    value={value.event_type || ''}
                    onChange={handleEventTypeChange}
                >
                    
                    <option value="competition">Competition</option>
                    <option value="tryouts">Tryouts</option>
                    <option value="intramurals">Intramurals</option>
                </select>
                
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
