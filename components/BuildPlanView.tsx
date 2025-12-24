import React, { useState } from 'react';
import { BuildPlan, AppIdea } from '../types';
import { Icons } from '../constants';
import ReactMarkdown from 'react-markdown';
import { saveIdea } from '../services/dbService';
import { useAuth } from '../contexts/AuthContext';

interface BuildPlanViewProps {
  plan: BuildPlan;
  idea: AppIdea;
  topic: string;
  onBack: () => void;
}

const BuildPlanView: React.FC<BuildPlanViewProps> = ({ plan, idea, topic, onBack }) => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(plan.vibeCodingPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      await saveIdea(idea, topic, plan);
      setIsSaved(true);
    } catch (err) {
      console.error("Failed to save plan", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-fade-in-up w-full max-w-7xl mx-auto space-y-8 pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-primary hover:bg-gray-50 transition-colors"
          >
            <Icons.ArrowLeft />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-primary">Build Plan</h2>
            <p className="text-gray-500 font-medium">Execution roadmap for <span className="text-primary font-bold">{idea.title}</span></p>
          </div>
        </div>
        <div className="flex gap-2">
          {user && (
            <button
              onClick={handleSave}
              disabled={isSaved || isSaving}
              className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-all shadow-sm ${isSaved ? 'bg-accent text-primary' : 'bg-primary text-white hover:bg-gray-900'}`}
            >
              {isSaving ? <Icons.Loader /> : isSaved ? <Icons.CheckCircle /> : <Icons.Search />}
              {isSaving ? 'Saving...' : isSaved ? 'Plan Saved' : 'Save Plan'}
            </button>
          )}
          <span className="px-4 py-2 bg-accent/20 rounded-full text-xs font-bold text-primary tracking-wider uppercase border border-accent/50 flex items-center">
            Ready to Build
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Prompt & Roadmap */}
        <div className="space-y-8">

          {/* Vibe Coding Prompt Card */}
          <div className="bg-primary rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Icons.Code />
            </div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-primary text-xs">AI</span>
              Vibe Coding Prompt
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Copy this prompt and paste it into Cursor, Windsurf, or any AI coding tool to kickstart your project immediately.
            </p>

            <div className="relative">
              <div className="bg-gray-800/50 rounded-2xl p-4 text-xs font-mono text-gray-300 h-48 overflow-y-auto border border-white/10 custom-scrollbar">
                {plan.vibeCodingPrompt}
              </div>
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-2 bg-white text-primary rounded-lg hover:bg-accent transition-colors shadow-lg"
                title="Copy Prompt"
              >
                {copied ? <Icons.Check /> : <Icons.Copy />}
              </button>
            </div>
          </div>

          {/* Roadmap Card */}
          <div className="bg-surface rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
              <Icons.Sparkles /> MVP Roadmap
            </h3>
            <div className="space-y-8 relative">
              {/* Connector Line */}
              <div className="absolute top-4 bottom-4 left-[15px] w-0.5 bg-gray-100 -z-0"></div>

              {plan.roadmap.map((phase, idx) => (
                <div key={idx} className="relative z-10 flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-white border-4 border-canvas flex-shrink-0 flex items-center justify-center mt-1">
                    <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-accent' : 'bg-gray-300'}`}></div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-primary">{phase.phase}</h4>
                      <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-500 font-bold">{phase.duration}</span>
                    </div>
                    <ul className="space-y-1">
                      {phase.tasks.map((task, tIdx) => (
                        <li key={tIdx} className="text-sm text-gray-500 flex items-start gap-2">
                          <span className="mt-1.5 w-1 h-1 bg-gray-400 rounded-full flex-shrink-0"></span>
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: PRD */}
        <div className="lg:col-span-2">
          <div className="bg-surface rounded-[2.5rem] p-10 shadow-sm border border-gray-100 h-full">
            <div className="flex items-center justify-between mb-8 sticky top-0 bg-surface z-10 pb-4 border-b border-gray-50">
              <h3 className="text-2xl font-bold text-primary">Product Requirements Document</h3>
              <span className="px-3 py-1 bg-canvas rounded-full text-xs font-bold text-gray-400">MARKDOWN</span>
            </div>

            <div className="max-w-none text-gray-600">
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => <h1 className="text-3xl font-extrabold text-primary mb-6 mt-4 leading-tight" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="text-2xl font-bold text-primary mt-10 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2" {...props} />,
                  h3: ({ node, ...props }) => <h3 className="text-xl font-bold text-primary mt-8 mb-3" {...props} />,
                  h4: ({ node, ...props }) => <h4 className="text-lg font-bold text-primary mt-6 mb-2" {...props} />,
                  p: ({ node, ...props }) => <p className="text-gray-600 leading-7 mb-4" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-6 space-y-2 text-gray-600" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-6 space-y-2 text-gray-600" {...props} />,
                  li: ({ node, ...props }) => <li className="pl-1 leading-relaxed" {...props} />,
                  strong: ({ node, ...props }) => <span className="font-bold text-gray-900" {...props} />,
                  blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-accent pl-4 italic text-gray-500 my-4 bg-gray-50 py-2 rounded-r" {...props} />,
                  code: ({ node, ...props }) => <code className="bg-gray-100 text-pink-600 px-1 py-0.5 rounded text-sm font-mono" {...props} />,
                }}
              >
                {plan.prd}
              </ReactMarkdown>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BuildPlanView;