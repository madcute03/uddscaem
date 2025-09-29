import React from 'react';
import { Link, usePage } from '@inertiajs/react';

export default function Header() {
  const { auth } = usePage().props;

  return (
    <header className="bg-white shadow">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link href="/" className="text-2xl font-bold text-blue-600">
          News Portal
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <Link href="/articles" className="hover:text-blue-600">Articles</Link>
          {auth?.user ? (
            <>
              <Link href="/admin/dashboard" className="hover:text-blue-600">Admin</Link>
              <Link
                href="/logout"
                method="post"
                as="button"
                className="hover:text-blue-600"
              >
                Logout
              </Link>
            </>
          ) : (
            <Link href="/login" className="hover:text-blue-600">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
