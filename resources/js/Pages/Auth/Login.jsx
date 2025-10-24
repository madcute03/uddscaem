
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });
    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-black text-slate-100">
            <Head title="Log in" />
            <section 
                    className="relative min-h-screen flex items-center justify-center px-4 sm:px-7 lg:px-8 h-20"
                    style={{
                        backgroundImage: "url('/images/logo.png')",
                        backgroundPosition: "50% 20%",
                        backgroundRepeat: "no-repeat",
                        backgroundSize: "cover",
                        backgroundBlendMode: "overlay",
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-blue-950/85 to-black/90"></div>
            <div className="py-10 w-full">
                <div className="mx-auto flex overflow-hidden rounded-xl shadow-2xl max-w-sm lg:max-w-4xl border border-white/15 bg-white/10 backdrop-blur-xl">
                    {/* Left image (lg and up) */}
                    <div
                        className="hidden lg:block lg:w-1/2 bg-cover bg-center bg-no-repeat opacity-90"
                        style={{
                            backgroundImage: "url('/images/logo.png')",
                        }}
                    />

                    {/* Right form */}
                    <div className="w-full p-8 lg:w-1/2 text-slate-100">
                        <h2 className="text-2xl font-semibold text-center">Welcome</h2>
                        <p className="text-lg text-slate-300 text-center">Sign in to continue</p>

                        {status && (
                            <div className="mt-4 text-sm font-medium text-green-300 text-center">
                                {status}
                            </div>
                        )}

                        <form
                            onSubmit={submit}
                            autoComplete="off"
                            name="login-form"
                            id="login-form"
                            className="mt-4"
                        >
                            <div className="mt-4">
                                <InputLabel htmlFor="email" value="Email Address" className="text-slate-200" />
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="mt-1 block w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 focus:ring-2 focus:ring-blue-500/40"
                                    autoComplete="off"
                                    isFocused={true}
                                    onChange={(e) => setData('email', e.target.value)}
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
                                    />
                                    <button
                                        type="button"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        onClick={() => setShowPassword((s) => !s)}
                                        className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-300 hover:text-white"
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                                                <path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l18 18a.75.75 0 1 0 1.06-1.06l-18-18zM22.676 12.553a11.249 11.249 0 01-2.631 3.31l-1.37-1.37a9.75 9.75 0 001.413-4.093 10.4 10.4 0 00-9.5-9.5 9.75 9.75 0 00-4.093 1.413L7.136 3.97A11.25 11.25 0 0122.676 12.553z" />
                                                <path d="M15.75 12c0 .18-.013.357-.037.53l-4.244-4.243A3.75 3.75 0 0115.75 12zM12.53 15.713L8.287 11.47a3.75 3.75 0 004.243 4.243z" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                                                <path d="M12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" />
                                                <path fillRule="evenodd" d="M1.5 12c0-2.388 2.524-5.25 7.5-5.25 4.976 0 7.5 2.862 7.5 5.25s-2.524 5.25-7.5 5.25c-4.976 0-7.5-2.862-7.5-5.25zM18 12c0-1.5 1.5-3.75 5.25-3.75 3.75 0 5.25 2.25 5.25 3.75s-1.5 3.75-5.25 3.75c-3.75 0-5.25-2.25-5.25-3.75z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                <InputError message={errors.password} className="mt-2" />
                            </div>

                            <div className="mt-8">
                                <PrimaryButton className="w-full justify-center bg-blue-600 hover:bg-blue-500" disabled={processing}>
                                    Log in
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </section>  
        </GuestLayout>
    );
}
