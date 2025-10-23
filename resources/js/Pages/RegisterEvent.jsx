import { Head, useForm, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';

export default function RegisterEvent({ event }) {
    const { errors: pageErrors } = usePage().props;
    const { data, setData, post, errors: formErrors, reset } = useForm({
        student_id: '',
        name: '',
        email: '',
        department: '',
        age: '',
        gdrive_link: '',
        team_name: '',
        team_members: event.registration_type === 'team' ? Array((event.team_size || 2)).fill('').map(() => ({
            student_id: '',
            name: '',
            email: '',
            department: '',
            age: '',
            gdrive_link: ''
        })) : [''],
        is_team_registration: event.registration_type === 'team',
    });

    // Merge errors from both sources (router.post uses pageErrors, form.post uses formErrors)
    const errors = { ...pageErrors, ...formErrors };

    const [duplicateErrors, setDuplicateErrors] = useState({});

    const checkForDuplicates = () => {
        const errors = {};
        const seenEmails = new Set();
        const seenStudentIds = new Set();

        data.team_members.forEach((member, index) => {
            const email = member.email?.trim().toLowerCase();
            const studentId = member.student_id?.trim();

            if (email && seenEmails.has(email)) {
                errors[`${index}_email`] = 'Duplicate email found in team members.';
            } else if (email) {
                seenEmails.add(email);
            }

            if (studentId && seenStudentIds.has(studentId)) {
                errors[`${index}_student_id`] = 'Duplicate student ID found in team members.';
            } else if (studentId) {
                seenStudentIds.add(studentId);
            }
        });

        setDuplicateErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!checkForDuplicates()) {
            return; // Prevent submission if duplicates exist
        }

        // Format data for backend - backend expects 'players' array
        console.log('Registration type:', event.registration_type);
        console.log('Form data before formatting:', data);
        
        const formData = event.registration_type === 'team' 
            ? {
                team_name: data.team_name,
                players: data.team_members
            }
            : {
                players: [{
                    student_id: data.student_id,
                    name: data.name,
                    email: data.email,
                    department: data.department,
                    age: data.age,
                    gdrive_link: data.gdrive_link
                }]
            };

        console.log('Formatted data for submission:', formData);
        console.log('Players array:', formData.players);

        // Use router.post to send custom formData
        router.post(route('eventregistrations.store', event.id), formData, {
            preserveScroll: true,
            onSuccess: () => {
                router.visit(route('events.show', event.id), {
                    only: ['event'],
                    data: { success: 'Registration successful!' },
                    onFinish: () => reset()
                });
            },
            onError: (errors) => {
                console.error('Registration error:', errors);
                // Log individual error messages for debugging
                if (errors && typeof errors === 'object') {
                    Object.keys(errors).forEach(key => {
                        console.error(`${key}: ${errors[key]}`);
                    });
                }
            }
        });
    };

    const updateTeamMember = (index, field, value) => {
        const updatedMembers = [...data.team_members];
        if (!updatedMembers[index]) {
            updatedMembers[index] = {};
        }
        updatedMembers[index] = { ...updatedMembers[index], [field]: value };
        setData('team_members', updatedMembers);
        checkForDuplicates(); // Check for duplicates after update
    };

    const addTeamMember = () => {
        if (data.team_members.length < (event.team_size || 2)) {
            setData('team_members', [...data.team_members, {
                student_id: '',
                name: '',
                email: '',
                department: '',
                age: '',
                gdrive_link: ''
            }]);
            checkForDuplicates(); // Check for duplicates after adding
        }
    };

    const removeTeamMember = (index) => {
        if (data.team_members.length > 1) {
            const updatedMembers = data.team_members.filter((_, i) => i !== index);
            setData('team_members', updatedMembers);
            checkForDuplicates(); // Check for duplicates after removing
        }
    };

    return (
        <PublicLayout>
            <Head title={`Register: ${event.title}`}>
                <style>
                    {`
                        select option {
                            background-color: #1e293b;
                            color: #f1f5f9;
                            padding: 8px;
                        }
                        select option:checked {
                            background-color: #334155;
                            font-weight: 500;
                        }
                    `}
                </style>
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-black text-slate-100 py-8 px-4">
                <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-xl shadow-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-8 md:p-10">
                    <h1 className="text-2xl font-semibold text-center mb-2">
                        Register for {event.title}
                    </h1>
                    <p className="text-lg text-slate-300 text-center mb-6">
                        Fill in your registration details below
                    </p>

                    

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {event.registration_type === 'team' ? (
                            // Team Registration Form
                            <>
                                <div className="mb-6 p-4 bg-blue-950/20 border border-blue-800/30 rounded-lg">
                                    <h3 className="text-lg font-semibold text-blue-300 mb-2">Team Registration</h3>
                                    <p className="text-sm text-blue-200 mb-4">
                                        Team Size: {event.team_size} players • Event: {event.title}
                                    </p>

                                    <div className="mb-4">
                                        <label className="block mb-1 text-slate-200">Team Name</label>
                                        <input
                                            type="text"
                                            placeholder="Enter team name"
                                            value={data.team_name}
                                            onChange={(e) => setData('team_name', e.target.value)}
                                            className="w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                            required
                                        />
                                        {errors.team_name && (
                                            <p className="text-red-400 text-sm mt-1">{errors.team_name}</p>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="font-medium text-slate-200">Team Members</h4>
                                        {data.team_members.map((member, index) => (
                                            <div key={index} className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-lg">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h5 className="font-medium text-slate-200">Player {index + 1}</h5>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <input
                                                            type="text"
                                                            placeholder="Student ID"
                                                            value={member.student_id || ''}
                                                            onChange={(e) => updateTeamMember(index, 'student_id', e.target.value)}
                                                            className="w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                                            pattern="[0-9\-]+"
                                                            title="Only numbers and dashes allowed"
                                                            required
                                                        />
                                                        {(errors[`team_members.${index}.student_id`] || errors[`players.${index}.student_id`]) && (
                                                            <p className="text-red-400 text-sm mt-1">{errors[`team_members.${index}.student_id`] || errors[`players.${index}.student_id`]}</p>
                                                        )}
                                                        {duplicateErrors[`${index}_student_id`] && (
                                                            <p className="text-red-400 text-sm mt-1">{duplicateErrors[`${index}_student_id`]}</p>
                                                        )}
                                                    </div>

                                                    <input
                                                        type="text"
                                                        placeholder="Full Name"
                                                        value={member.name || ''}
                                                        onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                                                        className="bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                                        required
                                                    />

                                                    <div>
                                                        <input
                                                            type="email"
                                                            placeholder="Email (must end with @cdd.edu.ph)"
                                                            value={member.email || ''}
                                                            onChange={(e) => updateTeamMember(index, 'email', e.target.value)}
                                                            className="w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                                            pattern=".*@cdd\.edu\.ph$"
                                                            title="Email must end with @cdd.edu.ph"
                                                            required
                                                        />
                                                        {(errors[`team_members.${index}.email`] || errors[`players.${index}.email`]) && (
                                                            <p className="text-red-400 text-sm mt-1">{errors[`team_members.${index}.email`] || errors[`players.${index}.email`]}</p>
                                                        )}
                                                        {duplicateErrors[`${index}_email`] && (
                                                            <p className="text-red-400 text-sm mt-1">{duplicateErrors[`${index}_email`]}</p>
                                                        )}
                                                    </div>

                                                    <select
                                                        value={member.department?.startsWith('Other: ') ? 'Other' : (member.department || '')}
                                                        onChange={(e) => {
                                                            const value = e.target.value === 'Other' ? 'Other: ' : e.target.value;
                                                            updateTeamMember(index, 'department', value);
                                                        }}
                                                        className="bg-white/10 border border-white/20 text-slate-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                                        required
                                                    >
                                                        <option value="">Select Department</option>
                                                        <option value="School of Information Technology">
                                                            School of Information Technology
                                                        </option>
                                                        <option value="School of Engineering">
                                                            School of Engineering
                                                        </option>
                                                        <option value="School of Teacher Education">
                                                            School of Teacher Education
                                                        </option>
                                                        <option value="School of Business and Accountancy">
                                                            School of Business and Accountancy
                                                        </option>
                                                        <option value="School of International Hospitality Management">
                                                            School of International Hospitality Management
                                                        </option>
                                                        <option value="School of Humanities">
                                                            School of Humanities
                                                        </option>
                                                        <option value="School of Health and Sciences">
                                                            School of Health and Sciences
                                                        </option>
                                                        <option value="School of Criminology">
                                                            School of Criminology
                                                        </option>
                                                        <option value="Other">Other (Please specify)</option>
                                                    </select>

                                                    <input
                                                        type="number"
                                                        placeholder="Age"
                                                        value={member.age || ''}
                                                        onChange={(e) => updateTeamMember(index, 'age', e.target.value)}
                                                        className="h-[45px] bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                                        required
                                                    />

                                                    <div>
                                                        
                                                        <input
                                                            type="url"
                                                            placeholder="Upload Whiteform via GoogleDrive Link"
                                                            value={member.gdrive_link || ''}
                                                            onChange={(e) => updateTeamMember(index, 'gdrive_link', e.target.value)}
                                                            className="w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                                            pattern="https?://.+"
                                                            title="Enter a valid link (include https://)"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                {member.department?.startsWith('Other: ') || member.department === 'Other' ? (
                                                    <input
                                                        type="text"
                                                        placeholder="Please specify department"
                                                        value={member.department?.startsWith('Other: ') ? member.department.substring(8) : ''}
                                                        onChange={(e) => updateTeamMember(index, 'department', 'Other: ' + e.target.value)}
                                                        className="w-full mt-2 bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                                        required
                                                    />
                                                ) : null}
                                            </div>
                                        ))}

                                        {data.team_members.length < (event.team_size || 2) && (
                                            <button
                                                type="button"
                                                onClick={addTeamMember}
                                                className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded transition"
                                            >
                                                + Add Team Member
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            // Individual Registration Form
                            <>
                                <input
                                    type="text"
                                    placeholder="Student ID"
                                    value={data.student_id}
                                    onChange={(e) => setData('student_id', e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                    pattern="[0-9\-]+"
                                    title="Only numbers and dashes allowed, e.g., 2025-001"
                                    required
                                />
                                {(errors.student_id || errors['players.0.student_id']) && (
                                    <p className="text-red-400 text-sm mt-1">{errors.student_id || errors['players.0.student_id']}</p>
                                )}

                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                    required
                                />

                                <input
                                    type="email"
                                    placeholder="Email (must end with @cdd.edu.ph)"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                    pattern=".*@cdd\.edu\.ph$"
                                    title="Email must end with @cdd.edu.ph"
                                    required
                                />
                                {(errors.email || errors['players.0.email']) && (
                                    <p className="text-red-400 text-sm mt-1">{errors.email || errors['players.0.email']}</p>
                                )}

                                <div className="space-y-2">
                                    <select
                                        value={data.department.startsWith('Other: ') ? 'Other' : data.department}
                                        onChange={(e) => {
                                            const value =
                                                e.target.value === 'Other' ? 'Other: ' : e.target.value;
                                            setData('department', value);
                                        }}
                                        className="w-full bg-white/10 border border-white/20 text-slate-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                        required
                                    >
                                        <option value="">Select Department</option>
                                        <option value="School of Information Technology">
                                            School of Information Technology
                                        </option>
                                        <option value="School of Engineering">
                                            School of Engineering
                                        </option>
                                        <option value="School of Teacher Education">
                                            School of Teacher Education
                                        </option>
                                        <option value="School of Business and Accountancy">
                                            School of Business and Accountancy
                                        </option>
                                        <option value="School of International Hospitality Management">
                                            School of International Hospitality Management
                                        </option>
                                        <option value="School of Humanities">
                                            School of Humanities
                                        </option>
                                        <option value="School of Health and Sciences">
                                            School of Health and Sciences
                                        </option>
                                        <option value="School of Criminology">
                                            School of Criminology
                                        </option>
                                        <option value="Other">Other (Please specify)</option>
                                    </select>

                                    {data.department.startsWith('Other: ') || data.department === 'Other' ? (
                                        <input
                                            type="text"
                                            placeholder="Please specify department"
                                            value={
                                                data.department.startsWith('Other: ')
                                                    ? data.department.substring(8)
                                                    : ''
                                            }
                                            onChange={(e) =>
                                                setData('department', 'Other: ' + e.target.value)
                                            }
                                            className="w-full mt-2 bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                            required
                                        />
                                    ) : null}
                                </div>

                                <input
                                    type="number"
                                    placeholder="Age"
                                    value={data.age}
                                    onChange={(e) => setData('age', e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                    required
                                />

                                <div>
                                    <label className="block mb-1 text-slate-200">
                                        {event.event_type === 'competition' ? 'Upload your whiteform image' : 'Google Drive link (Whiteform/PDS/Medical in one folder)'}
                                    </label>
                                    <input
                                        type="url"
                                        placeholder="https://drive.google.com/..."
                                        value={data.gdrive_link}
                                        onChange={(e) => setData('gdrive_link', e.target.value)}
                                        className="w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                        pattern="https?://.+"
                                        title="Enter a valid link (include https://)"
                                        required
                                    />
                                    {(errors.gdrive_link || errors['players.0.gdrive_link']) && (
                                        <p className="text-red-400 text-sm mt-1">{errors.gdrive_link || errors['players.0.gdrive_link']}</p>
                                    )}
                                    <p className="text-xs text-slate-300 mt-1">
                                        Make sure sharing is set to "Anyone with the link can view."
                                    </p>
                                </div>
                            </>
                        )}

                        <button
                            type="submit"
                            className="w-full h-[45px] rounded-[15px] cursor-pointer 
                                                               transition duration-300 ease-in-out 
                                                               bg-gradient-to-br from-[#2e8eff] to-[#2e8eff]/0 
                                                               bg-[#2e8eff]/20 flex items-center justify-center 
                                                               hover:bg-[#2e8eff]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)] 
                                                               focus:outline-none focus:bg-[#2e8eff]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]"
                        >
                            Submit Registration
                        </button>
                    </form>

                    <Link
                        href={route('events.show', event.id)}
                        className="mt-6 inline-block text-blue-300 hover:text-blue-200 hover:underline"
                    >
                        ← Back to Event
                    </Link>
                </div>
            </div>
        </PublicLayout>
    );
}
