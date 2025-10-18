import PublicLayout from '@/Layouts/PublicLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

export default function BorrowRequestForm() {
    const { items = [], ziggy } = usePage().props;
    const { data, setData, post, processing, reset, errors } = useForm({
        student_name: '',
        student_id: '',
        email: '',
        item_id: '',
        purpose: '',
        quantity: 1,
        contact_number: '',
    });

    useEffect(() => {
        // Preselect from query if provided
        try {
            const url = new URL(window.location.href);
            const pre = url.searchParams.get('item_id');
            if (pre) setData('item_id', pre);
        } catch {}
    }, [setData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('borrow.store'), {
            onSuccess: () => reset(),
        });
    };

    return (
        <PublicLayout>
            <Head title="Borrow Request" />
            <div className="max-w-lg mx-auto px-4 py-10">
                <h1 className="text-2xl font-bold mb-6">Borrow Request</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm mb-1" htmlFor="student_name">Student Name</label>
                        <input id="student_name" name="student_name" value={data.student_name} onChange={(e)=>setData('student_name', e.target.value)} className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700" required />
                    </div>
                    <div>
                        <label className="block text-sm mb-1" htmlFor="student_id">Student ID</label>
                        <input id="student_id" name="student_id" type="number" value={data.student_id} onChange={(e)=>setData('student_id', e.target.value)} className={`w-full px-3 py-2 rounded bg-slate-900 border ${errors.student_id ? 'border-red-500' : 'border-slate-700'}`} required />
                        {errors.student_id && <p className="text-red-400 text-sm mt-1">{errors.student_id}</p>}
                    </div>
                    <div>
                        <label className="block text-sm mb-1" htmlFor="email">Email</label>
                        <input id="email" name="email" type="email" value={data.email} onChange={(e)=>setData('email', e.target.value)} className={`w-full px-3 py-2 rounded bg-slate-900 border ${errors.email ? 'border-red-500' : 'border-slate-700'}`} required />
                        {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                    </div>
                    <div>
                        <label className="block text-sm mb-1" htmlFor="item_id">Item</label>
                        <select id="item_id" name="item_id" value={data.item_id} onChange={(e)=>setData('item_id', e.target.value)} className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700" required>
                            <option value="" disabled>Select an item</option>
                            {items.map((it) => (
                                <option key={it.id} value={it.id}>{it.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm mb-1" htmlFor="purpose">Purpose / Usage</label>
                        <textarea
                            id="purpose"
                            name="purpose"
                            value={data.purpose}
                            onChange={(e)=>setData('purpose', e.target.value)}
                            className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 resize-vertical"
                            rows={6}
                            maxLength={5000}
                            placeholder="Describe the purpose or how you will use this item in detail..."
                        />
                        <div className="text-xs text-slate-400 mt-1">
                            {data.purpose.length}/5000 characters
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm mb-1" htmlFor="quantity">Quantity</label>
                        <input id="quantity" name="quantity" type="number" value={data.quantity} onChange={(e)=>setData('quantity', e.target.value)} className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700" min="1" max="10" required />
                    </div>
                    <div>
                        <label className="block text-sm mb-1" htmlFor="contact_number">Contact Number</label>
                        <input id="contact_number" name="contact_number" type="number" value={data.contact_number} onChange={(e)=>setData('contact_number', e.target.value)} className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700" placeholder="Your phone number for contact" />
                    </div>
                    <div className="flex items-center gap-3">
                        <button type="submit" disabled={processing} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white">Submit Request</button>
                        <Link href={route('borrow.index')} className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600">Cancel</Link>
                    </div>
                </form>
            </div>
        </PublicLayout>
    );
}


