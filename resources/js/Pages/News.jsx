import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';

export default function News({ news }) {
  const items = news?.data || [];
  const links = news?.links || [];

  const formatDateTime = (dt) => (dt ? new Date(dt).toLocaleString() : '');

  return (
    <PublicLayout>
      <Head title="News" />
  <div className="mx-auto max-w-7xl px-2 sm:px-4 md:px-8 space-y-6 w-full py-8">
        <div className="flex items-center justify-between py-6">
          <h1 className="text-3xl font-bold">News</h1>
          
        </div>

        {items.length === 0 ? (
          <p className="text-slate-300">No news available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <article key={item.id} className="bg-slate-900/60 border border-slate-800 rounded-xl shadow-lg shadow-blue-950/20 overflow-hidden">
                {item.cover_image && (
                  <img src={`/storage/${item.cover_image}`} alt={item.title} className="w-full h-40 object-cover" />
                )}
                <div className="p-5">
                  <h2 className="text-xl font-bold mb-1">
                    
                      {item.title}
                    
                  </h2>
                  <div className="text-sm text-slate-300 mb-3">
                    
                    {item.author && <span> By: {item.author}</span>}
                    
                  </div>
                  
                  {Array.isArray(item.tags) && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.tags.map((t, idx) => (
                        <span key={idx} className="text-xs px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-slate-200">{t}</span>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <Link href={route('news.show', item.id)} className="w-[131px] h-[45px] rounded-[15px] cursor-pointer 
                                                               transition duration-300 ease-in-out 
                                                               bg-gradient-to-br from-[#2e8eff] to-[#2e8eff]/0 
                                                               bg-[#2e8eff]/20 flex items-center justify-center 
                                                               hover:bg-[#2e8eff]/70 hover:shadow-[0_0_10px_rgba(46,142,255,0.5)] 
                                                               focus:outline-none focus:bg-[#2e8eff]/70 focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]">Read More</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination removed as requested */}
      </div>
    </PublicLayout>
  );
}
