import React, { useEffect, useState } from 'react';
import { getSavedIdeas, SavedIdeaItem, deleteSavedIdea } from '../services/dbService';
import { Icons } from '../constants';
import { AppIdea, BuildPlan } from '../types';
import IdeaCard from './IdeaCard';
import Modal from './Modal';

interface SavedViewProps {
    onViewPlan: (idea: AppIdea, plan?: BuildPlan, savedId?: string, topic?: string) => void;
}

const SavedView: React.FC<SavedViewProps> = ({ onViewPlan }) => {
    const [savedIdeas, setSavedIdeas] = useState<SavedIdeaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [ideaToDelete, setIdeaToDelete] = useState<{ id: string, title: string } | null>(null);

    useEffect(() => {
        const fetchSaved = async () => {
            try {
                const data = await getSavedIdeas();
                setSavedIdeas(data);
            } catch (err) {
                console.error("Failed to fetch saved ideas", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSaved();
    }, []);

    const promptDelete = (id: string, title: string) => {
        setIdeaToDelete({ id, title });
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!ideaToDelete) return;

        try {
            await deleteSavedIdea(ideaToDelete.id);
            setSavedIdeas(prev => prev.filter(item => item.id !== ideaToDelete.id));
            setDeleteModalOpen(false);
            setIdeaToDelete(null);
        } catch (err) {
            console.error("Failed to delete idea", err);
            alert("Failed to delete idea");
        }
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
            <h2 className="text-3xl font-bold text-primary mb-2">Saved Ideas</h2>
            <p className="text-gray-500 mb-8">Your collection of potential micro-SaaS products.</p>

            {savedIdeas.length === 0 ? (
                <div className="text-center py-20 bg-surface rounded-[2.5rem] border border-gray-100">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                    </div>
                    <p className="text-gray-500 font-medium">No saved ideas yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {savedIdeas.map((item, index) => (
                        <div key={item.id} className="h-full">
                            <IdeaCard
                                index={index}
                                idea={item.full_idea_json}
                                topic={item.topic}
                                onBuildPlan={() => onViewPlan(item.full_idea_json, item.build_plan, item.id, item.topic)}
                                initialSavedState={true}
                                onDelete={() => promptDelete(item.id, item.title)}
                            />
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Delete Idea?"
            >
                <p className="text-gray-600 mb-8">
                    Are you sure you want to delete <span className="font-bold text-primary">"{ideaToDelete?.title}"</span>? This action cannot be undone.
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={() => setDeleteModalOpen(false)}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-bold transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirmDelete}
                        className="flex-1 py-3 bg-red-500 text-white hover:bg-red-600 rounded-xl font-bold transition-all shadow-lg shadow-red-500/20"
                    >
                        Delete
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default SavedView;
