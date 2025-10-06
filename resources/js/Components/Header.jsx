import React from 'react';
import { Link, usePage } from '@inertiajs/react';

export default function Header() {
  const { auth } = usePage().props;

  return (
    <header className="bg-white shadow">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link href={route('home')} className="text-2xl font-bold text-blue-600">
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
          <Link href={route('home')} className="hover:text-blue-600">
            Home
          </Link>
          <Link href={route('articles.index')} className="hover:text-blue-600">
            News
          </Link>
          {auth?.user ? (
            <>
              <Link href={route('admin.dashboard')} className="hover:text-blue-600">
              </Link>
              <Link href={route('logout')} method="post" as="button" className="hover:text-blue-600">
                Logout
              </Link>
            </>
          ) : (
            <Link href={route('login')} className="hover:text-blue-600">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
