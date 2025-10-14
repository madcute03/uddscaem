import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Login({ status, canResetPassword }) {
    const { flash } = usePage().props;
    const [activeTab, setActiveTab] = useState('login');
    const [showPassword, setShowPassword] = useState(false);
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);
    const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
    const [showMessage, setShowMessage] = useState(true);

    // Login form
    const { data: loginData, setData: setLoginData, post: loginPost, processing: loginProcessing, errors: loginErrors, reset: resetLogin } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    // Register form
    const { data: registerData, setData: setRegisterData, post: registerPost, processing: registerProcessing, errors: registerErrors, reset: resetRegister } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const handleLogin = (e) => {
        e.preventDefault();
        loginPost(route('login'), {
            onFinish: () => resetLogin('password'),
        });
    };

    const handleRegister = (e) => {
        e.preventDefault();
        registerPost(route('register'), {
            onFinish: () => resetRegister('password', 'password_confirmation'),
            onSuccess: () => {
                setShowMessage(true);
                setTimeout(() => setShowMessage(false), 3000);
            }
        });
    };

    return (
        <GuestLayout>
            <Head title={activeTab === 'login' ? 'Log in' : 'Register'} />

            <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-md space-y-8">
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden border border-white/15">
                        {/* Tabs */}
                        <div className="flex border-b border-white/20">
                            <button
                                onClick={() => setActiveTab('login')}
                                className={`flex-1 py-4 px-1 text-center font-medium text-sm ${activeTab === 'login' 
                                    ? 'text-blue-300 border-b-2 border-blue-400' 
                                    : 'text-gray-300 hover:text-white'}`}
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => setActiveTab('register')}
                                className={`flex-1 py-4 px-1 text-center font-medium text-sm ${activeTab === 'register' 
                                    ? 'text-blue-300 border-b-2 border-blue-400' 
                                    : 'text-gray-300 hover:text-white'}`}
                            >
                                Create Account
                            </button>
                        </div>

                        {/* Forms */}
                        <div className="px-8 py-8">
                            {status && activeTab === 'login' && (
                                <div className="mb-4 text-sm font-medium text-green-300 text-center">
                                    {status}
                                </div>
                            )}

                            {flash.success && showMessage && activeTab === 'register' && (
                                <div className="mb-4 p-3 bg-green-500/20 text-green-200 rounded text-center border border-green-400/30">
                                    {flash.success}
                                </div>
                            )}

                            {/* Login Form */}
                            {activeTab === 'login' && (
                                <form onSubmit={handleLogin} className="space-y-6">
                                    <div>
                                        <InputLabel htmlFor="email" value="Email Address" className="text-slate-200" />
                                        <TextInput
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={loginData.email}
                                            className="mt-1 block w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 focus:ring-2 focus:ring-blue-500/40"
                                            autoComplete="email"
                                            isFocused={activeTab === 'login'}
                                            onChange={(e) => setLoginData('email', e.target.value)}
                                        />
                                        <InputError message={loginErrors.email} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="password" value="Password" className="text-slate-200" />
                                        <div className="relative">
                                            <TextInput
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                value={loginData.password}
                                                className="mt-1 block w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 focus:ring-2 focus:ring-blue-500/40 pr-10"
                                                autoComplete="current-password"
                                                onChange={(e) => setLoginData('password', e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-300 hover:text-white"
                                                aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                                        <InputError message={loginErrors.password} className="mt-2" />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <input
                                                id="remember"
                                                name="remember"
                                                type="checkbox"
                                                checked={loginData.remember}
                                                onChange={(e) => setLoginData('remember', e.target.checked)}
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white/10 border-white/20"
                                            />
                                            <label htmlFor="remember" className="ml-2 block text-sm text-gray-300">
                                                Remember me
                                            </label>
                                        </div>

                                        {canResetPassword && (
                                            <div className="text-sm">
                                                <Link
                                                    href={route('password.request')}
                                                    className="font-medium text-blue-300 hover:text-blue-200"
                                                >
                                                    Forgot your password?
                                                </Link>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <PrimaryButton 
                                            className="w-full justify-center bg-blue-600 hover:bg-blue-500" 
                                            disabled={loginProcessing}
                                        >
                                            {loginProcessing ? 'Signing in...' : 'Sign in'}
                                        </PrimaryButton>
                                    </div>
                                </form>
                            )}

                            {/* Register Form */}
                            {activeTab === 'register' && (
                                <form onSubmit={handleRegister} className="space-y-6">
                                    <div>
                                        <InputLabel htmlFor="name" value="Full Name" className="text-slate-200" />
                                        <TextInput
                                            id="name"
                                            name="name"
                                            value={registerData.name}
                                            className="mt-1 block w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 focus:ring-2 focus:ring-blue-500/40"
                                            autoComplete="name"
                                            isFocused={activeTab === 'register'}
                                            onChange={(e) => setRegisterData('name', e.target.value)}
                                            required
                                        />
                                        <InputError message={registerErrors.name} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="register-email" value="Email Address" className="text-slate-200" />
                                        <TextInput
                                            id="register-email"
                                            type="email"
                                            name="email"
                                            value={registerData.email}
                                            className="mt-1 block w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 focus:ring-2 focus:ring-blue-500/40"
                                            autoComplete="email"
                                            onChange={(e) => setRegisterData('email', e.target.value)}
                                            required
                                        />
                                        <InputError message={registerErrors.email} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="register-password" value="Password" className="text-slate-200" />
                                        <div className="relative">
                                            <TextInput
                                                id="register-password"
                                                type={showRegisterPassword ? 'text' : 'password'}
                                                name="password"
                                                value={registerData.password}
                                                className="mt-1 block w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 focus:ring-2 focus:ring-blue-500/40 pr-10"
                                                autoComplete="new-password"
                                                onChange={(e) => setRegisterData('password', e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-300 hover:text-white"
                                                aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showRegisterPassword ? (
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
                                        <InputError message={registerErrors.password} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="password_confirmation" value="Confirm Password" className="text-slate-200" />
                                        <div className="relative">
                                            <TextInput
                                                id="password_confirmation"
                                                type={showRegisterConfirmPassword ? 'text' : 'password'}
                                                name="password_confirmation"
                                                value={registerData.password_confirmation}
                                                className="mt-1 block w-full bg-white/10 border border-white/20 text-slate-100 placeholder-slate-300 focus:ring-2 focus:ring-blue-500/40 pr-10"
                                                autoComplete="new-password"
                                                onChange={(e) => setRegisterData('password_confirmation', e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-300 hover:text-white"
                                                aria-label={showRegisterConfirmPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showRegisterConfirmPassword ? (
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
                                        <InputError message={registerErrors.password_confirmation} className="mt-2" />
                                    </div>

                                    <div>
                                        <PrimaryButton 
                                            className="w-full justify-center bg-blue-600 hover:bg-blue-500" 
                                            disabled={registerProcessing}
                                        >
                                            {registerProcessing ? 'Creating Account...' : 'Create Account'}
                                        </PrimaryButton>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>

                    <div className="text-center text-sm text-gray-400">
                        {activeTab === 'login' ? (
                            <p>
                                Don't have an account?{' '}
                                <button 
                                    onClick={() => setActiveTab('register')}
                                    className="font-medium text-blue-300 hover:text-blue-200 cursor-pointer"
                                >
                                    Sign up
                                </button>
                            </p>
                        ) : (
                            <p>
                                Already have an account?{' '}
                                <button 
                                    onClick={() => setActiveTab('login')}
                                    className="font-medium text-blue-300 hover:text-blue-200 cursor-pointer"
                                >
                                    Sign in
                                </button>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
