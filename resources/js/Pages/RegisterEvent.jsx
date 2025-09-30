import { Head, useForm, Link, router } from '@inertiajs/react';
import { useEffect } from 'react';

export default function RegisterEvent({ event, requiredPlayers }) {
    const { data, setData, post, errors, reset } = useForm({
        team_name: '',
        players: Array.from({ length: requiredPlayers }, () => ({
            student_id: '',
            name: '',
            email: '',
            department: '',
            age: '',
            gdrive_link: '',
        })),
    });

    useEffect(() => {
        setData('players', Array.from({ length: requiredPlayers }, () => ({
            student_id: '',
            name: '',
            email: '',
            department: '',
            age: '',
            gdrive_link: '',
        })));
    }, [requiredPlayers]);

    const handlePlayerChange = (index, field, value) => {
        const newPlayers = [...data.players];
        newPlayers[index][field] = value;
        setData('players', newPlayers);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Strict email validation before submit
        for (let i = 0; i < data.players.length; i++) {
            const email = data.players[i].email.trim();
            if (!email.endsWith('@cdd.edu.ph')) {
                alert(`Player ${i + 1}: Email must end with @cdd.edu.ph`);
                return; // Stop form submission
            }
        }

        // Use plain payload now that we're sending a text link (no files)
        const payload = {
            team_name: requiredPlayers > 1 ? data.team_name : undefined,
            players: data.players.map((p) => ({
                student_id: p.student_id,
                name: p.name,
                email: p.email,
                department: p.department,
                age: p.age,
                gdrive_link: p.gdrive_link,
            })),
        };

        post(route('eventregistrations.store', event.id), payload, {
            onSuccess: () => {
                router.visit(route('events.show', event.id), {
                    only: ['event'],
                    data: { success: 'Registration successful!' },
                    onFinish: () => reset()
                });
            },
            onError: (errors) => {
                console.error('Registration error:', errors);
            }
        });
    };

    return (
        <>
            <Head title={`Register: ${event.title}`} />
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-black text-slate-100 py-8 px-2 sm:px-4 md:px-8">
                <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-xl shadow-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-4 sm:p-6 md:p-8">
                    <h1 className="text-2xl font-semibold text-center">Register for {event.title}</h1>
                    <p className="text-lg text-slate-300 text-center">Fill in participant details</p>

                    <form onSubmit={handleSubmit} className="mt-4 space-y-6" encType="multipart/form-data">
                        {requiredPlayers > 1 && (
                            <div>
                                <label className="block mb-1 text-slate-200">Team Name *</label>
                                <input
                                    type="text"
                                    value={data.team_name}
                                    onChange={(e) => setData('team_name', e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                    required
                                />
                                {errors.team_name && <p className="text-red-300 text-sm mt-1">{errors.team_name}</p>}
                            </div>
                        )}

                        {data.players.map((player, index) => (
                            <div key={index} className="border border-white/20 rounded p-4 space-y-3 bg-white/5">
                                

                                <input
                                    type="text"
                                    placeholder="Student ID"
                                    value={player.student_id}
                                    onChange={(e) => handlePlayerChange(index, 'student_id', e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                    pattern="[0-9\-]+"
                                    title="Only numbers and dashes allowed, e.g., 2025-001"
                                    required
                                />

                                <input
                                    type="text"
                                    placeholder="Name"
                                    value={player.name}
                                    onChange={(e) => handlePlayerChange(index, 'name', e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                    required
                                />

                                {/* Email restricted to @cdd.edu.ph */}
                                <input
                                    type="email"
                                    placeholder="Email (must end with @cdd.edu.ph)"
                                    value={player.email}
                                    onChange={(e) => handlePlayerChange(index, 'email', e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                    pattern="^[a-zA-Z0-9._%+-]+@cdd\.edu\.ph$"
                                    title="Email must be a valid @cdd.edu.ph address"
                                    required
                                />

                                <input
                                    type="text"
                                    placeholder="Department"
                                    value={player.department}
                                    onChange={(e) => handlePlayerChange(index, 'department', e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                    required
                                />

                                <input
                                    type="number"
                                    placeholder="Age"
                                    value={player.age}
                                    onChange={(e) => handlePlayerChange(index, 'age', e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                    required
                                />

                                <div>
                                    <label className="block mb-1 text-slate-200">Google Drive link (Whiteform/PDS/Medical in one folder)</label>
                                    <input
                                        type="url"
                                        placeholder="https://drive.google.com/..."
                                        value={player.gdrive_link}
                                        onChange={(e) => handlePlayerChange(index, 'gdrive_link', e.target.value)}
                                        className="w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                        pattern="https?://.+"
                                        title="Enter a valid link (include https://)"
                                        required
                                    />
                                    <p className="text-xs text-slate-300 mt-1">Make sure the sharing is set to Anyone with the link can view.</p>
                                </div>

                                
                            </div>
                        ))}

                        <button
                            type="submit"
                            className="w-full justify-center bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded transition"
                        >
                            Submit Registration
                        </button>
                    </form>

                    <Link href={route('home')} className="mt-6 inline-block text-blue-300 hover:text-blue-200 hover:underline">
                        ← Back to Events
                    </Link>
                </div>
            </div>
        </>
    );
}
