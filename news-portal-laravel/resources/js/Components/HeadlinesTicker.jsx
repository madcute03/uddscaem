import React from 'react';
import { Link } from '@inertiajs/react';

export default function HeadlinesTicker({ headlines = [] }) {
  if (!headlines.length) return null;

  return (
    <div className="bg-blue-600 text-white rounded-lg shadow overflow-hidden">
      <div className="flex items-center gap-4 py-3 px-4">
        <span className="font-semibold uppercase tracking-wide">Headlines</span>
        <div className="flex-1 overflow-hidden">
          <marquee className="text-sm">
            {headlines.map((headline) => (
              <span key={headline.id} className="mr-6">
                <Link href={`/articles/${headline.slug}`} className="hover:underline">
                  {headline.title}
                </Link>
              </span>
            ))}
          </marquee>
        </div>
      </div>
    </div>
  );
}
