import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import api from '../api';

const ArticleDetail = () => {
    const { id } = useParams();
    const [article, setArticle] = useState(null);
    const [viewMode, setViewMode] = useState('updated');

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const { data } = await api.get(`/${id}`);
                setArticle(data);
                if (!data.isUpdated) setViewMode('original');
            } catch (error) {
                console.error(error);
            }
        };
        fetchArticle();
    }, [id]);

    if (!article) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-pulse text-indigo-600 font-semibold">Loading Article...</div></div>;

    // Content Cleaning Layer (Frontend-side normalization)
    // Content Cleaning Layer (Frontend-side normalization)
    const cleanOriginalContent = (html, title) => {
        if (!html) return "";

        let clean = html;

        // 0. Remove Title from the start (Crucial step)
        if (title) {
            // Escape title for regex
            const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Remove title if it appears at start, optionally preceded by <p> or <div> and whitespace
            clean = clean.replace(new RegExp(`(<[^>]+>\\s*)?${escapedTitle}\\s*`, 'i'), '$1');
        }

        // 1. Remove Author/Date/Metadata "Leakage" 
        // Generalized Pattern: (Words) (Month DD, YYYY) (Junk)
        // Matches "Simran Jain April 8, 2025 ai chatbot 80 80"
        // Matches "pankaj April 10, 2025 Uncategorized 110"

        // Strategy: Find a Date, then look backward for Author, and forward for Junk
        const cleanupRegex = /([A-Za-z\s]+)?([A-Za-z]+\s+\d{1,2},\s+\d{4})(\s+[A-Za-z0-9\s]*\d+)?/g;

        // We only want to run this on the *start* of text to avoid false positives in the middle of sentences
        // But since we have HTML tags, it's tricky.
        // Let's replace specifically lines that look like "Metadata Only" lines or start of the content.

        clean = clean.replace(cleanupRegex, (match, author, date, junk) => {
            // Heuristic: If "author" part is too long (> 5 words), it's probably part of a sentence -> Don't delete.
            if (author && author.trim().split(/\s+/).length > 5) return match;
            return "";
        });

        // Specific cleanups for known artifacts if regex missed
        clean = clean.replace(/Uncategorized\s+\d+/gi, "");
        clean = clean.replace(/ai chatbot\s+\d+\s+\d+/gi, "");

        // Remove "More from Uncategorized" junk at bottom
        clean = clean.replace(/More from Uncategorized[\s\S]*$/i, "");
        clean = clean.replace(/See more recommendations[\s\S]*$/i, "");

        // Remove duplicate titles at the end (common in scraped footers)
        if (title) {
            const repeatedTitleRegex = new RegExp(`${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
            // Only remove if it's towards the end of the content (last 20%)
            const cutoff = Math.floor(clean.length * 0.8);
            const endPart = clean.substring(cutoff).replace(repeatedTitleRegex, "");
            clean = clean.substring(0, cutoff) + endPart;
        }

        // 2. Wall of Text Fix (Readability Heuristic)
        const pCount = (clean.match(/<p/g) || []).length;
        const brCount = (clean.match(/<br/g) || []).length;

        if (pCount < 3 && brCount < 5) {
            const sentences = clean.split(/([.?!]\s+)/);
            let chunks = [];
            let currentChunk = "";
            let sentenceCount = 0;

            for (let i = 0; i < sentences.length; i++) {
                currentChunk += sentences[i];
                if (sentences[i].match(/[.?!]\s+/)) {
                    sentenceCount++;
                    if (sentenceCount >= 4) {
                        chunks.push(`<p>${currentChunk.trim()}</p>`);
                        currentChunk = "";
                        sentenceCount = 0;
                    }
                }
            }
            if (currentChunk) chunks.push(`<p>${currentChunk.trim()}</p>`);
            clean = chunks.join("\n");
        }

        return clean;
    };

    const contentToDisplay = viewMode === 'updated' && article.isUpdated
        ? article.updatedContent
        : cleanOriginalContent(article.content, article.title);

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10 transition-transform duration-300">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/" className="text-gray-500 hover:text-indigo-600 font-medium flex items-center gap-2 transition-colors group">
                        <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Back to Feed
                    </Link>
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('original')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'original' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Original
                        </button>
                        <button
                            onClick={() => setViewMode('updated')}
                            disabled={!article.isUpdated}
                            title={article.isUpdated ? "Content rewritten using LLM with original source preserved." : "Enhancement pending..."}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1 ${viewMode === 'updated' ? 'bg-white shadow text-indigo-600' : article.isUpdated ? 'text-gray-500 hover:text-gray-700' : 'text-gray-300 cursor-not-allowed'}`}
                        >
                            {article.isUpdated && <span className="text-lg leading-none">✨</span>} AI Enhanced
                        </button>
                    </div>
                </div>
            </div>

            <div className="h-32 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-25 relative mb-[-3rem]"></div>

            <main className="container mx-auto px-4 py-10 max-w-4xl relative z-10">
                <header className="mb-8 text-center bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h1 className="text-3xl md:text-5xl font-extrabold mb-6 text-gray-900 leading-tight tracking-tight">{article.title}</h1>
                    <div className="flex flex-wrap items-center justify-center gap-6 text-gray-500 text-sm">
                        <div className="flex flex-col items-center sm:flex-row sm:gap-4">
                            <time className="bg-gray-50 border border-gray-200 px-3 py-1 rounded-full shadow-sm text-xs font-medium">
                                Original: {article.publishedDate ? new Date(article.publishedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown'}
                            </time>
                            {article.enhancedAt && (
                                <time className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-full shadow-sm text-xs font-medium">
                                    AI Enhanced: {new Date(article.enhancedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </time>
                            )}
                        </div>
                        <div className="w-px h-4 bg-gray-200 hidden sm:block"></div>
                        <a href={article.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-medium transition-colors border-b border-transparent hover:border-indigo-600">
                            View Original Source <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                    </div>
                </header>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 relative overflow-hidden">
                    {/* Content Divider / Lead-in */}
                    <div className="w-full flex justify-center mb-8 opacity-40">
                        <div className="w-16 h-1 bg-gray-200 rounded-full"></div>
                    </div>

                    {viewMode === 'original' && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8 rounded-r-md">
                            <div className="flex flex-col gap-2">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-yellow-700">
                                            This is the original scraped content and may contain formatting noise.
                                        </p>
                                    </div>
                                </div>
                                <div className="ml-8">
                                    <button
                                        onClick={() => setViewMode('updated')}
                                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                                    >
                                        Switch to AI-enhanced version
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <article className={`prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 ${viewMode === 'original' ? 'prose-p:text-gray-500 prose-p:leading-relaxed max-w-prose mx-auto' : 'prose-indigo prose-p:text-gray-600 prose-p:leading-relaxed prose-a:text-indigo-600 hover:prose-a:text-indigo-500'}`}>
                        {viewMode === 'updated' ? (
                            <ReactMarkdown className="markdown-content">
                                {contentToDisplay}
                            </ReactMarkdown>
                        ) : (
                            <div className="markdown-content original-content-container font-serif opacity-90" dangerouslySetInnerHTML={{ __html: contentToDisplay }} />
                        )}
                    </article>

                    {article.references && article.references.length > 0 && viewMode === 'updated' && (
                        <div className="mt-16 pt-8 border-t border-gray-100">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">AI Source References</h3>
                            <div className="grid gap-3">
                                {article.references.map((ref, i) => (
                                    <a key={i} href={ref.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-indigo-50 transition-colors group border border-transparent hover:border-indigo-100">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm flex-shrink-0">{i + 1}</div>
                                            <span className="font-medium text-gray-700 truncate group-hover:text-indigo-700">{ref.title || ref.url}</span>
                                        </div>
                                        <svg className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ArticleDetail;
