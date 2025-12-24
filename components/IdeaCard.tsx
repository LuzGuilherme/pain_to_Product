import React, { useState } from 'react';
import { AppIdea } from '../types';
import { Icons } from '../constants';
import { saveIdea, deleteSavedIdeaByTitle } from '../services/dbService';
import { useAuth } from '../contexts/AuthContext';

interface IdeaCardProps {
  idea: AppIdea;
  index: number;
  topic: string;
  onBuildPlan: (idea: AppIdea) => void;
  initialSavedState?: boolean;
  onDelete?: () => void; // New optional prop
}

const IdeaCard: React.FC<IdeaCardProps> = ({ idea, index, topic, onBuildPlan, initialSavedState, onDelete }) => {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(initialSavedState || false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return; // Or show auth modal

    setIsSaving(true);
    try {
      if (isSaved) {
        await deleteSavedIdeaByTitle(idea.title);
        setIsSaved(false);
      } else {
        await saveIdea(idea, topic);
        setIsSaved(true);
      }
    } catch (err: any) {
      console.error("Failed to update idea", err);
      alert(`Failed to update idea: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
  }

  const delayClass = index === 0 ? 'delay-[0ms]' : index === 1 ? 'delay-[150ms]' : 'delay-[300ms]';

  // Complexity Badge Logic
  const complexityColor =
    idea.techComplexity === 'Low' ? 'bg-emerald-100 text-emerald-700' :
      idea.techComplexity === 'Medium' ? 'bg-amber-100 text-amber-700' :
        'bg-rose-100 text-rose-700';

  return (
    <div className={`group flex flex-col h-full bg-surface rounded-[2rem] p-8 transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-transparent hover:border-gray-100 animate-fade-in-up ${delayClass}`}>

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 rounded-2xl bg-canvas flex items-center justify-center text-primary group-hover:scale-110 transition-all duration-300 overflow-hidden">
          <div className="p-1"><Icons.Logo /></div>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            onDelete ? (
              <button
                onClick={handleDelete}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-canvas text-gray-400 hover:text-red-500 hover:bg-red-50"
                title="Delete Idea"
              >
                <Icons.Trash />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={isSaved || isSaving}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isSaved ? 'bg-accent text-primary' : 'bg-canvas text-gray-400 hover:text-accent hover:bg-white'}`}
                title={isSaved ? "Saved!" : "Save Idea"}
              >
                {isSaving ? <Icons.Loader /> : isSaved ? <Icons.CheckCircle /> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>}
              </button>
            )
          )}
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${complexityColor}`}>
            {idea.techComplexity} Dev
          </span>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-2xl font-bold text-primary mb-3 leading-tight group-hover:text-gray-900">{idea.title}</h3>
        <p className="text-gray-500 font-medium leading-relaxed">{idea.oneLiner}</p>
      </div>

      {/* Info Blocks */}
      <div className="space-y-4 flex-grow">

        {/* Target Audience */}
        <div className="bg-canvas/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2 text-gray-400 text-[10px] uppercase font-bold tracking-wider">
            Target Audience
          </div>
          <p className="text-primary text-sm font-semibold">{idea.targetAudience}</p>
        </div>

        {/* Features List */}
        <div>
          <div className="flex items-center gap-2 mb-3 text-gray-400 text-[10px] uppercase font-bold tracking-wider">
            Core MVP Features
          </div>
          <ul className="space-y-2">
            {idea.coreFeatures.map((feature, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0"></span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Monetization</span>
          <span className="text-sm font-bold text-primary">{idea.monetization}</span>
        </div>
        <button
          onClick={() => onBuildPlan(idea)}
          className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-primary hover:bg-primary hover:text-white hover:border-transparent transition-all cursor-pointer"
          title="Generate Build Plan"
        >
          <Icons.ArrowRight />
        </button>
      </div>
    </div>
  );
};

export default IdeaCard;