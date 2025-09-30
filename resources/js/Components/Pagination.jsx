import React from 'react';
import { Link } from '@inertiajs/react';

export default function Pagination({ links = [] }) {
  if (links.length <= 3) return null;

  return (
    <nav className="flex items-center justify-center gap-2">
      {links.map((link, index) => (
        <PaginationLink key={index} link={link} />
      ))}
    </nav>
  );
}

function PaginationLink({ link }) {
  if (!link.url) {
    return (
      <span
        className="px-3 py-1 text-sm rounded border border-slate-200 text-slate-400"
        dangerouslySetInnerHTML={{ __html: link.label }}
      />
    );
  }

  return (
    <Link
      href={link.url}
      preserveScroll
      preserveState
      className={`px-3 py-1 text-sm rounded border transition ${
        link.active
          ? 'border-blue-500 bg-blue-600 text-white shadow'
          : 'border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
      }`}
      dangerouslySetInnerHTML={{ __html: link.label }}
    />
  );
}
