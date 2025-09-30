import React from 'react';
import { Link } from '@inertiajs/react';

export default function HeadlinesTicker({ headlines = [] }) {
  if (!headlines.length) return null;

  return (
    <div className="py-2">
      <marquee className="text-sm text-slate-200">
        {headlines.map((headline) => (
          <span key={headline.id} className="mr-6">
            <Link
              href={route('articles.show', headline.slug)}
              className="text-slate-200/90 transition hover:text-white"
            >
              {headline.title}
            </Link>
          </span>
        ))}
      </marquee>
    </div>
  );
}
