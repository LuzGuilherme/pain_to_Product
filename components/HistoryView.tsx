
import React, { useEffect, useState } from 'react';
import { getSearchHistory, deleteSearchHistory, SavedHistoryItem } from '../services/dbService';
import { Icons } from '../constants';

interface HistoryViewProps {
    onRestore: (item: SavedHistoryItem) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ onRestore }) => {
    const [history, setHistory] = useState<SavedHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            const data = await getSearchHistory();
            setHistory(data);
            setLoading(false);
        };
        fetchHistory();
    }, []);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await deleteSearchHistory(id);
        setHistory(prev => prev.filter(item => item.id !== id));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center flex-grow min-h-[60vh]">
                <div className="animate-spin text-primary"><Icons.Loader /></div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto px-6 py-12 animate-fade-in">
            <h2 className="text-3xl font-bold text-primary mb-2">Search History</h2>
            <p className="text-gray-500 mb-8">Your past research sessions.</p>

            {history.length === 0 ? (
                <div className="text-center py-20 bg-surface rounded-[2.5rem] border border-gray-100">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Icons.Search />
                    </div>
                    <p className="text-gray-500 font-medium">No history yet. Start researching!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {history.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => onRestore(item)}
                            className="bg-surface p-6 rounded-3xl border border-gray-100 hover:shadow-lg transition-all group cursor-pointer hover:scale-[1.02] relative"
                        >
                            <button
                                onClick={(e) => handleDelete(e, item.id)}
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-10"
                                title="Delete History"
                            >
                                <Icons.Trash />
                            </button>

                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-accent uppercase tracking-wider">{new Date(item.created_at).toLocaleDateString()}</span>
                            </div>
                            <h3 className="text-xl font-bold text-primary mb-3 line-clamp-1 capitalize">{item.topic}</h3>
                            <p className="text-gray-500 text-sm line-clamp-3 leading-relaxed mb-4">
                                {item.summary ? item.summary.substring(0, 150) + "..." : "No summary available."}
                            </p>

                            {/* Generated Ideas Section (New) */}
                            {item.ideas && item.ideas.length > 0 && (
                                <div className="space-y-2 pt-4 border-t border-gray-100">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <Icons.Bulb className="w-3 h-3" /> Generated Ideas
                                    </h4>
                                    <div className="space-y-1">
                                        {item.ideas.slice(0, 3).map((idea, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm text-primary group-hover:text-accent transition-colors">
                                                <span className="w-1.5 h-1.5 rounded-full bg-accent/50"></span>
                                                <span className="truncate font-medium">{idea.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HistoryView;


