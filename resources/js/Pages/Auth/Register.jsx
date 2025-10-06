import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function Register() {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const [showMessage, setShowMessage] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showPassword2, setShowPassword2] = useState(false);

    useEffect(() => {
        if (flash.success) {
            setShowMessage(true);
            const timer = setTimeout(() => setShowMessage(false), 3000); // auto-hide after 3s
            return () => clearTimeout(timer);
        }
    }, [flash.success]);

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <div className="py-10 w-full">
                <div className="mx-auto flex overflow-hidden rounded-xl shadow-2xl max-w-sm lg:max-w-4xl border border-white/15 bg-white/10 backdrop-blur-xl">
                    {/* Left image (lg and up) */}
                    <div
                        className="hidden lg:block lg:w-1/2 bg-cover bg-center bg-no-repeat opacity-90"
                        style={{
                            backgroundImage: "url('/images/udd.jpg')",
                        }}
                    />

                    {/* Right form */}
                    <div className="w-full p-8 lg:w-1/2 text-slate-100">
                        <h2 className="text-2xl font-semibold text-center">Create account</h2>
                        <p className="text-lg text-slate-300 text-center">Join SCAEMS</p>

                        {/* ✅ Success Message */}
                        {flash.success && showMessage && (
                            <div className="mt-4 p-3 bg-green-500/20 text-green-200 rounded text-center border border-green-400/30">
                                {flash.success}
                            </div>
                        )}

                       

                        <form onSubmit={submit} className="mt-4">
                            <div>
                                <InputLabel htmlFor="name" value="Name" className="text-slate-200" />
                                <TextInput
                                    id="name"
                                    name="name"
                                    value={data.name}
                                    className="mt-1 block w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 focus:ring-2 focus:ring-blue-500/40"
                                    autoComplete="name"
                                    isFocused={true}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div className="mt-4">
                                <InputLabel htmlFor="email" value="Email" className="text-slate-200" />
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="mt-1 block w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 focus:ring-2 focus:ring-blue-500/40"
                                    autoComplete="username"
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                />
                                <InputError message={errors.email} className="mt-2" />
                            </div>

                            <div className="mt-4">
                                <InputLabel htmlFor="password" value="Password" className="text-slate-200" />
                                <div className="relative">
                                    <TextInput
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={data.password}
                                        className="mt-1 block w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 focus:ring-2 focus:ring-blue-500/40 pr-10"
                                        autoComplete="new-password"
                                        onChange={(e) => setData('password', e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-300 hover:text-white"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                                                <path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l2.112 2.112A11.7 11.7 0 0 0 1.293 12c1.258 3.67 4.95 6.75 10.207 6.75 2.087 0 3.884-.47 5.38-1.24l3.59 3.59a.75.75 0 1 0 1.06-1.06L3.53 2.47ZM12.75 14.56l1.69 1.69a3.75 3.75 0 0 1-5.39-5.19l1.68 1.68a1.5 1.5 0 0 0 2.02 1.82ZM12 6.75c5.257 0 8.95 3.08 10.207 6.75-.598 1.747-1.77 3.33-3.388 4.532l-2.032-2.032A6 6 0 0 0 9.75 8.063V7.5A10.4 10.4 0 0 1 12 6.75Z" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                                                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                                                <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                <InputError message={errors.password} className="mt-2" />
                            </div>

                            <div className="mt-4">
                                <InputLabel htmlFor="password_confirmation" value="Confirm Password" className="text-slate-200" />
                                <TextInput
                                    id="password_confirmation"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password_confirmation"
                                    value={data.password_confirmation}
                                    className="mt-1 block w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 focus:ring-2 focus:ring-blue-500/40"
                                    autoComplete="new-password"
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    required
                                />
                                <InputError message={errors.password_confirmation} className="mt-2" />
                            </div>

                            <div className="mt-6">
                                <PrimaryButton className="w-full justify-center bg-blue-600 hover:bg-blue-500" disabled={processing}>
                                    Register
                                </PrimaryButton>
                            </div>
                        </form>

                        <div className="mt-6 flex items-center justify-between text-slate-300">
                            <span className="border-b border-slate-300/30 w-1/5 md:w-1/4" />
                            <span className="text-xs uppercase">or login</span>
                            <span className="border-b border-slate-300/30 w-1/5 md:w-1/4" />
                        </div>

                        {/* Link to Login */}
                        <div className="mt-4 text-center">
                            <span className="text-sm text-slate-300">
                                Already have an account?{' '}
                                <Link href={route('login')} className="text-blue-300 hover:text-blue-200 hover:underline">
                                    Log in
                                </Link>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
