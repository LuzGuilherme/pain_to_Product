import React, { useState, useRef, useEffect } from 'react';
import Layout from './components/Layout';
import Header from './components/Header';
import { Icons } from './constants';
import { AppState, PainPointResult, AppIdea, BuildPlan } from './types';
import { searchPainPoints, generateAppIdeas, generateBuildPlan } from './services/geminiService';
import { saveSearch, updateSearchHistoryIdeas, SavedHistoryItem, updateSavedIdeaPlan } from './services/dbService';
import IdeaCard from './components/IdeaCard';
import BuildPlanView from './components/BuildPlanView';
import HistoryView from './components/HistoryView';
import SavedView from './components/SavedView';
import ReactMarkdown from 'react-markdown';
import { AuthProvider } from './contexts/AuthContext';

const AppContent: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [painPoints, setPainPoints] = useState<PainPointResult | null>(null);
  const [ideas, setIdeas] = useState<AppIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<AppIdea | null>(null);
  const [buildPlan, setBuildPlan] = useState<BuildPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Track the current db session to update it as we go
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);

  const ideasSectionRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to ideas when they are generated
  useEffect(() => {
    if (state === AppState.DISPLAY_IDEAS && ideas.length > 0 && ideasSectionRef.current) {
      ideasSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state, ideas]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setState(AppState.SEARCHING);
    setError(null);
    setPainPoints(null);
    setIdeas([]);
    setBuildPlan(null);
    setCurrentHistoryId(null);

    try {
      const result = await searchPainPoints(topic);
      setPainPoints(result);
      // Save full initial state to History
      const id = await saveSearch(topic, result.summary, result);
      if (id) setCurrentHistoryId(id);

      setState(AppState.REVIEWING_PAINS);

    } catch (err: any) {
      setError(err.message || "Something went wrong during the search.");
      setState(AppState.ERROR);
    }
  };

  const handleGenerateIdeas = async () => {
    if (!painPoints) return;

    setState(AppState.GENERATING_IDEAS);
    setError(null);

    try {
      const generatedIdeas = await generateAppIdeas(topic, painPoints.rawText);
      setIdeas(generatedIdeas);
      setState(AppState.DISPLAY_IDEAS);

      // Robust Saving: Ensure we have a history ID. If not (e.g. initial save failed), save it now.
      let targetHistoryId = currentHistoryId;
      if (!targetHistoryId && painPoints) {
        try {
          targetHistoryId = await saveSearch(topic, painPoints.summary, painPoints);
          if (targetHistoryId) setCurrentHistoryId(targetHistoryId);
        } catch (saveErr) {
          console.error("Failed to recover/save history session:", saveErr);
        }
      }

      // Update the history record with the new ideas
      if (targetHistoryId) {
        await updateSearchHistoryIdeas(targetHistoryId, generatedIdeas);
      }

    } catch (err: any) {
      setError(err.message || "Failed to generate ideas.");
      setState(AppState.ERROR);
    }
  };

  const handleBuildPlan = async (idea: AppIdea) => {
    setSelectedIdea(idea);
    setState(AppState.GENERATING_PLAN);
    setError(null);

    try {
      const plan = await generateBuildPlan(idea);
      setBuildPlan(plan);
      setState(AppState.DISPLAY_PLAN);
    } catch (err: any) {
      setError(err.message || "Failed to generate build plan.");
      setState(AppState.ERROR);
    }
  };

  const handleReset = () => {
    setState(AppState.IDLE);
    setTopic('');
    setPainPoints(null);
    setIdeas([]);
    setBuildPlan(null);
    setSelectedIdea(null);
    setError(null);
    setCurrentHistoryId(null);
  };

  const handleRestoreHistory = (item: SavedHistoryItem) => {
    setTopic(item.topic);
    setPainPoints(item.pain_points);

    if (item.ideas && item.ideas.length > 0) {
      setIdeas(item.ideas);
      setState(AppState.DISPLAY_IDEAS);
    } else {
      setIdeas([]);
      setState(AppState.REVIEWING_PAINS);
    }

    setCurrentHistoryId(item.id);
  };

  const handleBackToIdeas = () => {
    setState(AppState.DISPLAY_IDEAS);
    setBuildPlan(null);
    setSelectedIdea(null);
  };

  // Handle navigation from Header
  const handleNavigate = (view: AppState) => {
    // If we are navigating to Dashboard (IDLE), we might want to preserve state?
    // For now, let's just switch the state directly.
    if (view === AppState.IDLE) {
      // If we were in HISTORY or SAVED, go back to IDLE (or previous search state?)
      // Simplest: Go to IDLE if there's no active search. 
      // If the user was in the middle of research, maybe we should recover that?
      // For this MVC, let's just behave like a "Home" button if completely jumping context,
      // but if we are already in a research flow, the "Dashboard" button is already active.
      if (state === AppState.HISTORY || state === AppState.SAVED) {
        // If we have data, show it. Otherwise go to IDLE search form.
        if (painPoints) {
          if (buildPlan) setState(AppState.DISPLAY_PLAN);
          else if (ideas.length > 0) setState(AppState.DISPLAY_IDEAS);
          else setState(AppState.REVIEWING_PAINS);
        } else {
          setState(AppState.IDLE);
        }
      }
    } else {
      setState(view);
    }
  };


  /* 
   * Enhanced Handler for Saved Ideas
   * If a plan exists, show it.
   * If not, generate it, save it using the ID, then show it.
   */
  const handleViewSavedIdea = async (idea: AppIdea, plan?: BuildPlan, savedId?: string, savedTopic?: string) => {
    setSelectedIdea(idea);

    // Use the topic specific to this saved idea, or fallback to current state topic
    const queryTopic = savedTopic || topic;

    if (plan) {
      setBuildPlan(plan);
      setState(AppState.DISPLAY_PLAN);
    } else {
      // No plan cached? Generate it now.
      setState(AppState.GENERATING_PLAN); // Global loading state
      setError(null); // Clear any previous errors
      try {
        if (!queryTopic) {
          // console.warn("Topic missing, but generateBuildPlan might not need it based on strict updated signature.");
        }
        const newPlan = await generateBuildPlan(idea);

        if (savedId) {
          await updateSavedIdeaPlan(savedId, newPlan);
        }

        setBuildPlan(newPlan);
        setState(AppState.DISPLAY_PLAN);
      } catch (err: any) {
        console.error("Failed to generate plan for saved idea:", err);
        setError(err.message || "Failed to generate build plan for this idea.");
        setState(AppState.ERROR); // Set state to error if generation fails
      }
    }
  };

  return (
    <Layout>
      <Header currentView={state} onNavigate={handleNavigate} onLogoClick={handleReset} />

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col w-full z-0">

        {/* VIEW: HISTORY */}
        {state === AppState.HISTORY && <HistoryView onRestore={handleRestoreHistory} />}

        {/* VIEW: SAVED */}
        {state === AppState.SAVED && <SavedView onViewPlan={handleViewSavedIdea} />}

        {/* State: IDLE or SEARCHING */}
        {(state === AppState.IDLE || state === AppState.SEARCHING || state === AppState.ERROR) && (
          <div className="flex flex-col items-center justify-center flex-grow min-h-[60vh] animate-fade-in">
            <div className="w-full max-w-4xl text-center space-y-12">
              <div className="space-y-6">
                <h2 className="text-6xl md:text-7xl font-bold tracking-tight text-primary leading-[1.1]">
                  Discover the next <br />
                  <span className="relative inline-block">
                    <span className="relative z-10">big thing.</span>
                    <span className="absolute bottom-2 left-0 w-full h-4 bg-accent/60 -z-0 rounded-full"></span>
                  </span>
                </h2>
                <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
                  Analyze real user conversations to find painful problems, then generate viable micro-SaaS solutions instantly.
                </p>
              </div>

              {/* Search Box */}
              <div className="relative max-w-2xl mx-auto w-full group">
                <form onSubmit={handleSearch} className="relative bg-surface rounded-full p-2 flex items-center shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] transition-shadow duration-300 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)]">
                  <div className="pl-6 text-gray-400">
                    {state === AppState.SEARCHING ? <Icons.Loader /> : <Icons.Search />}
                  </div>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="What niche do you want to explore?"
                    className="w-full bg-transparent border-none text-primary placeholder-gray-400 focus:ring-0 px-4 py-4 text-lg font-medium"
                    disabled={state === AppState.SEARCHING}
                  />
                  <button
                    type="submit"
                    disabled={state === AppState.SEARCHING || !topic.trim()}
                    className="bg-primary hover:bg-black text-white px-8 py-4 rounded-full font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    Research
                  </button>
                </form>
              </div>

              {state === AppState.SEARCHING && (
                <div className="flex items-center justify-center gap-3 text-sm font-medium text-gray-500 animate-pulse">
                  <span className="w-2 h-2 bg-accent rounded-full"></span>
                  Scouring the web for complaints...
                </div>
              )}

              {state === AppState.ERROR && (
                <div className="inline-block px-6 py-3 bg-red-50 text-red-600 rounded-full text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Tags */}
              <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                <span className="text-sm font-bold text-gray-400 uppercase tracking-wider mr-2">Popular:</span>
                {['Remote Work', 'AI Tools', 'Fitness', 'E-commerce'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setTopic(tag)}
                    className="px-5 py-2 bg-surface hover:bg-white hover:shadow-md text-gray-600 hover:text-primary rounded-full transition-all text-sm font-medium border border-transparent hover:border-gray-100"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LOADING STATE: GENERATING_PLAN */}
        {state === AppState.GENERATING_PLAN && (
          <div className="flex flex-col items-center justify-center flex-grow min-h-[60vh] animate-fade-in text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-surface shadow-lg flex items-center justify-center text-accent">
              <Icons.Loader />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-primary">Constructing Blueprint</h2>
              <p className="text-gray-500 max-w-md mx-auto">
                Our AI Product Manager is drafting the roadmap, writing the PRD, and preparing the codebase prompt for <span className="text-primary font-bold">{selectedIdea?.title}</span>.
              </p>
            </div>
          </div>
        )}

        {/* VIEW: BUILD PLAN */}
        {state === AppState.DISPLAY_PLAN && buildPlan && selectedIdea && (
          <div className="w-full px-6 py-8">
            <BuildPlanView plan={buildPlan} idea={selectedIdea} topic={topic} onBack={handleBackToIdeas} />
          </div>
        )}

        {/* DASHBOARD VIEW: REVIEWING_PAINS or GENERATING_IDEAS or DISPLAY_IDEAS */}
        {(state === AppState.REVIEWING_PAINS || state === AppState.GENERATING_IDEAS || state === AppState.DISPLAY_IDEAS) && painPoints && (
          <div className="w-full space-y-8 animate-fade-in-up pb-20">

            {/* Dashboard Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="text-4xl font-bold text-primary mb-2">Research Report</h2>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-white rounded-full text-xs font-bold text-gray-500 border border-gray-100 uppercase tracking-wider">Niche</span>
                  <span className="text-xl text-gray-500 font-medium">{topic}</span>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-white hover:bg-gray-50 text-primary rounded-full transition-all font-bold shadow-sm hover:shadow text-sm border border-gray-100 flex items-center gap-2"
              >
                Start New Research
              </button>
            </div>

            {/* Dashboard Grid - Bento Style */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Main Analysis Card (Large) */}
              <div className="lg:col-span-2 bg-surface rounded-[2.5rem] p-10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03)] border border-gray-100/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
                </div>

                <h3 className="text-2xl font-bold text-primary mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-primary text-sm">
                    <Icons.Alert />
                  </span>
                  Identified Pain Points
                </h3>

                <div className="max-w-none text-gray-600 leading-relaxed">
                  <ReactMarkdown components={{
                    // Improved Highlighter for consistent line alignment
                    strong: ({ node, ...props }) => (
                      <span
                        className="font-bold text-primary bg-accent/40 px-1 py-0.5 rounded inline box-decoration-clone leading-normal"
                        {...props}
                      />
                    ),

                    // Better hierarchy and spacing for titles
                    h3: ({ node, ...props }) => (
                      <h3 className="text-xl font-extrabold text-primary mt-12 mb-6 pb-2 border-b border-gray-100 flex items-center gap-3" {...props} />
                    ),

                    // Quotes from users: Styled as distinct cards
                    blockquote: ({ node, ...props }) => (
                      <blockquote className="border-l-4 border-accent pl-6 pr-4 my-6 bg-canvas/40 py-4 rounded-r-2xl italic text-gray-500 text-sm leading-relaxed" {...props} />
                    ),

                    // Paragraph spacing
                    p: ({ node, ...props }) => <p className="mb-5 leading-[1.8]" {...props} />,

                    // List styling
                    ul: ({ node, ...props }) => <ul className="space-y-4 my-6 list-none" {...props} />,
                    li: ({ node, ...props }) => (
                      <li className="flex gap-3 items-start" {...props}>
                        <span className="w-1.5 h-1.5 rounded-full bg-accent mt-[0.6em] flex-shrink-0" />
                        <div className="flex-1">{props.children}</div>
                      </li>
                    )
                  }}>
                    {painPoints.summary}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Sidebar Column */}
              <div className="flex flex-col gap-6">

                {/* Sources Widget (Medium) */}
                <div className="bg-surface rounded-[2.5rem] p-8 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03)] border border-gray-100/50 flex-grow">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Icons.Globe /> Validated Sources
                  </h4>
                  <div className="space-y-3">
                    {painPoints.sources.length > 0 ? (
                      painPoints.sources.map((source, idx) => (
                        <a
                          key={idx}
                          href={source.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-4 rounded-2xl bg-canvas hover:bg-white border border-transparent hover:border-gray-200 transition-all group"
                        >
                          <span className="text-sm text-primary font-semibold truncate pr-4">{source.title}</span>
                          <span className="text-gray-400 group-hover:text-primary transition-colors">
                            <Icons.ArrowRight />
                          </span>
                        </a>
                      ))
                    ) : (
                      <div className="p-4 rounded-2xl bg-canvas text-gray-500 text-sm italic text-center">
                        Synthesized from general knowledge base.
                      </div>
                    )}
                  </div>
                </div>

                {/* Call To Action Widget (Dark) */}
                {state !== AppState.DISPLAY_IDEAS && (
                  <div className="bg-primary rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-gray-800 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity"></div>

                    <div className="relative z-10">
                      <div className="mb-8">
                        <h3 className="text-3xl font-bold mb-2">3 New</h3>
                        <p className="text-gray-400 font-medium">Opportunities detected.</p>
                      </div>

                      <button
                        onClick={handleGenerateIdeas}
                        disabled={state === AppState.GENERATING_IDEAS}
                        className="w-full py-4 bg-accent hover:bg-white text-primary font-bold rounded-2xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-95"
                      >
                        {state === AppState.GENERATING_IDEAS ? (
                          <>
                            <Icons.Loader /> Processing...
                          </>
                        ) : (
                          <>
                            Generate Solutions <Icons.ArrowRight />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* GENERATED IDEAS SECTION */}
            {ideas.length > 0 && (
              <div className="pt-12" ref={ideasSectionRef}>
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 px-2 gap-4">
                  <div className="flex flex-col">
                    <h2 className="text-3xl font-bold text-primary">Generated Solutions</h2>
                    <span className="text-sm font-medium text-gray-500">AI-Powered MVP Concepts</span>
                  </div>

                  {/* Regenerate Button */}
                  <button
                    onClick={handleGenerateIdeas}
                    disabled={state === AppState.GENERATING_IDEAS}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-full text-sm font-bold text-primary hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {state === AppState.GENERATING_IDEAS ? (
                      <>
                        <Icons.Loader />
                        <span>Regenerating...</span>
                      </>
                    ) : (
                      <>
                        <div className="group-hover:rotate-180 transition-transform duration-500">
                          <Icons.Refresh />
                        </div>
                        <span>Regenerate Solutions</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {ideas.map((idea, index) => (
                    <IdeaCard
                      key={index}
                      index={index}
                      idea={idea}
                      topic={topic}
                      onBuildPlan={handleBuildPlan}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;