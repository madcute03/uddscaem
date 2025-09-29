import React from 'react';
import { Link } from '@inertiajs/react';

export default function Pagination({ links = [] }) {
  if (!links.length) return null;

  return (
    <nav className="flex items-center justify-center gap-2 mt-6" aria-label="Pagination">
      {links.map((link, index) => (
        <Link
          key={index}
          href={link.url || '#'}
          className={`px-3 py-1 rounded-md text-sm font-medium transition ${
            link.active
              ? 'bg-blue-600 text-white shadow'
              : link.url
              ? 'text-blue-600 hover:bg-blue-50'
              : 'text-slate-400 cursor-not-allowed'
          }`}
          dangerouslySetInnerHTML={{ __html: link.label }}
        />
      ))}
    </nav>
  );
}
