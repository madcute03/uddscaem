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
                                <option key={it.id} value={it.id}>
                                    {it.name} (Available: {it.available})
                                </option>
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
                        {(() => {
                            const selectedItem = items.find(item => item.id == data.item_id);
                            const maxQuantity = selectedItem ? selectedItem.available : 999;
                            const hasError = errors.quantity || (data.quantity > maxQuantity && maxQuantity > 0);
                            
                            return (
                                <>
                                    <input 
                                        id="quantity" 
                                        name="quantity" 
                                        type="number" 
                                        value={data.quantity} 
                                        onChange={(e)=>setData('quantity', e.target.value)} 
                                        className={`w-full px-3 py-2 rounded bg-slate-900 border ${hasError ? 'border-red-500' : 'border-slate-700'}`}
                                        min="1" 
                                        max={maxQuantity > 0 ? maxQuantity : undefined}
                                        required 
                                    />
                                    {selectedItem && (
                                        <p className="text-xs text-slate-400 mt-1">
                                            Available: {selectedItem.available} items
                                        </p>
                                    )}
                                    {errors.quantity && <p className="text-red-400 text-sm mt-1">{errors.quantity}</p>}
                                    {!errors.quantity && data.quantity > maxQuantity && maxQuantity > 0 && (
                                        <p className="text-red-400 text-sm mt-1">
                                            Quantity cannot exceed {maxQuantity} (available items)
                                        </p>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                    <div>
                        <label className="block text-sm mb-1" htmlFor="contact_number">Contact Number</label>
                        <input id="contact_number" name="contact_number" type="tel" value={data.contact_number} onChange={(e)=>setData('contact_number', e.target.value)} className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700" placeholder="Your phone number for contact" />
                    </div>
                    <div className="flex items-center gap-3">
                        <button type="submit" disabled={processing} className="w-[131px] h-[45px] rounded-[15px] cursor-pointer
                                                               transition duration-300 ease-in-out
                                                               bg-gradient-to-br from-[#2e8eff] to-[#2e8eff]/0
                                                               bg-[#2e8eff]/20 flex items-center justify-center
                                                               hover:bg-[#2e8eff]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)]
                                                               focus:outline-none focus:bg-[#2e8eff]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]">Submit Request</button>
                        <Link href={route('borrow.index')} className="w-[120px] h-[45px] rounded-[15px] cursor-pointer 
                                                               transition duration-300 ease-in-out 
                                                               bg-gradient-to-br from-[#C90808] to-[#C90808]/0 
                                                               bg-[#C90808]/20 flex items-center justify-center 
                                                               hover:bg-[#C90808]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)] 
                                                               focus:outline-none focus:bg-[#C90808]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]">Cancel</Link>
                    </div>
                </form>
            </div>
        </PublicLayout>
    );
}


