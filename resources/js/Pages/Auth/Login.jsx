import Checkbox from '@/Components/Checkbox';
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
        <GuestLayout>
            <Head title="Log in" />

            <div className="py-10 w-full">
                <div className="mx-auto flex overflow-hidden rounded-xl shadow-2xl max-w-sm lg:max-w-4xl border border-white/15 bg-white/10 backdrop-blur-xl">
                    {/* Left image (lg and up) */}
                    <div
                        className="hidden lg:block lg:w-1/2 bg-cover bg-center bg-no-repeat opacity-90"
                        style={{
                            backgroundImage: "url('/images/sems.png')",
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
                                <div className="flex justify-between items-center">
                                    <InputLabel htmlFor="password" value="Password" className="text-slate-200" />
                                    {canResetPassword && (
                                        <Link
                                            href={route('password.request')}
                                            className="text-xs text-slate-300 hover:text-white hover:underline"
                                        >
                                            Forgot Password?
                                        </Link>
                                    )}
                                </div>
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
                                                <path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l2.112 2.112A11.7 11.7 0 0 0 1.293 12c1.258 3.67 4.95 6.75 10.207 6.75 2.087 0 3.884-.47 5.38-1.24l3.59 3.59a.75.75 0 1 0 1.06-1.06L3.53 2.47ZM12.75 14.56l1.69 1.69a3.75 3.75 0 0 1-5.39-5.19l1.68 1.68a1.5 1.5 0 0 0 2.02 1.82ZM12 6.75c5.257 0 8.95 3.08 10.207 6.75-.598 1.747-1.77 3.33-3.388 4.532l-2.032-2.032A6 6 0 0 0 9.75 8.063V7.5A10.4 10.4 0 0 1 12 6.75Z" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                                                <path d="M12 5.25C6.743 5.25 3.05 8.33 1.793 12c1.257 3.67 4.95 6.75 10.207 6.75S20.95 15.67 22.207 12C20.95 8.33 17.257 5.25 12 5.25Zm0 10.5a3.75 3.75 0 1 1 0-7.5 3.75 3.75 0 0 1 0 7.5Z" />
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

                        <div className="mt-6 flex items-center justify-between text-slate-300">
                            <span className="border-b border-slate-300/30 w-1/5 md:w-1/4" />
                            <span className="text-xs uppercase">or sign up</span>
                            <span className="border-b border-slate-300/30 w-1/5 md:w-1/4" />
                        </div>

                        <div className="mt-4 text-center">
                            <span className="text-sm text-slate-300">
                                Don’t have an account?{' '}
                                <Link href={route('register')} className="text-blue-300 hover:text-blue-200 hover:underline">
                                    Register
                                </Link>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
