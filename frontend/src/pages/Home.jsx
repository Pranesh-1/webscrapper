import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const Home = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [scrapping, setScrapping] = useState(false);

    useEffect(() => {
        fetchArticles();
        const interval = setInterval(fetchArticles, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchArticles = async () => {
        try {
            const { data } = await api.get('/');
            // Only update if data changed to avoid unnecessary re-renders (simple check)
            setArticles(prev => {
                if (JSON.stringify(prev) !== JSON.stringify(data)) return data;
                return prev;
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleScrape = async () => {
        try {
            setScrapping(true);
            await api.post('/scrape');
            await fetchArticles();
        } catch (error) {
            console.error('Scrape failed', error);
        } finally {
            setScrapping(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-pulse text-indigo-600 font-semibold">Loading Content...</div></div>;

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-indigo-100 selection:text-indigo-700">
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-200">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">B</div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">BeyondChats<span className="text-indigo-600">.</span></h1>
                    </div>
                    <button
                        onClick={handleScrape}
                        disabled={scrapping}
                        className="group relative bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold py-2.5 px-5 rounded-full transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
                    >
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                        <div className="flex items-center gap-2 relative z-10">
                            {scrapping ? (
                                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            )}
                            {scrapping ? 'Syncing...' : 'Sync Content'}
                        </div>
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {articles.map(article => (
                        <Link to={`/article/${article._id}`} key={article._id} className="group block h-full">
                            <div className="h-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group-hover:-translate-y-1">
                                <div className="p-6 flex-grow flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${article.isUpdated ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                            {article.isUpdated ? '✨ AI Rewritten' : 'Original'}
                                        </span>
                                        <span className="text-gray-400 text-xs font-medium">
                                            {article.publishedDate ? new Date(article.publishedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A'}
                                        </span>
                                    </div>

                                    <h2 className="text-xl font-bold mb-3 text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
                                        {article.title}
                                    </h2>

                                    <div className="flex-grow">
                                        <p className="text-gray-500 text-sm leading-relaxed line-clamp-4">
                                            {/* Strip tags and markdown for preview */}
                                            {(() => {
                                                const text = article.updatedContent || article.content || '';
                                                // 1. Strip HTML tags
                                                let cleanText = text.replace(/<[^>]*>?/gm, '');
                                                // 2. Strip Markdown (basic)
                                                cleanText = cleanText
                                                    .replace(/#{1,6}\s?/g, '') // Headers
                                                    .replace(/(\*\*|__)(.*?)\1/g, '$2') // Bold
                                                    .replace(/(\*|_)(.*?)\1/g, '$2') // Italic
                                                    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
                                                    .replace(/`{1,3}[^`]*`{1,3}/g, '') // Code
                                                    .replace(/^\s*-\s+/gm, '') // List items
                                                    .replace(/\n/g, ' '); // Newlines to spaces

                                                return cleanText.substring(0, 180) + (cleanText.length > 180 ? '...' : '');
                                            })()}
                                        </p>
                                    </div>
                                </div>

                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between group-hover:bg-indigo-50/50 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-gray-500 group-hover:text-indigo-600 transition-colors">Read Article</span>
                                    </div>
                                    <span className="text-indigo-400 group-hover:text-indigo-600 transform group-hover:translate-x-1 transition-all">→</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {articles.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No articles yet</h3>
                        <p className="text-gray-500 max-w-sm mt-2">The database is empty. Click "Sync Content" to fetch the latest stories from BeyondChats.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Home;
