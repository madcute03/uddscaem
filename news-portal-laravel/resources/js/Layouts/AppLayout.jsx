import React from 'react';
import { Head } from '@inertiajs/react';
import Header from '../Components/Header';
import HeadlinesTicker from '../Components/HeadlinesTicker';

export default function AppLayout({ title, headlines = [], children }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {title && <Head title={title} />}
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {headlines.length > 0 && <HeadlinesTicker headlines={headlines} />}
        <div className="bg-white shadow rounded-lg p-6">{children}</div>
      </main>
      <footer className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-sm">
          <p>© {new Date().getFullYear()} News Portal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
