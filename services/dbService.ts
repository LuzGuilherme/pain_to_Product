
import { supabase } from './supabaseClient';
import { AppIdea, PainPointResult, BuildPlan } from '../types';

export interface SavedHistoryItem {
    id: string;
    topic: string;
    summary: string;
    pain_points: PainPointResult; // Rich data
    ideas?: AppIdea[]; // Rich data
    created_at: string;
}

export interface SavedIdeaItem {
    id: string;
    title: string;
    topic: string;
    one_liner: string;
    full_idea_json: AppIdea;
    build_plan?: BuildPlan;
    created_at: string;
}

// --- SEARCH HISTORY ---

// Modified to return the ID so we can update it later with ideas
export const saveSearch = async (topic: string, summary: string, pain_points: PainPointResult): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('search_history')
        .insert({
            user_id: user.id,
            topic,
            summary,
            pain_points: pain_points // Store full JSON
        })
        .select()
        .single();

    if (error) {
        console.error('Error saving history:', error);
        return null;
    }
    return data.id;
};

export const updateSearchHistoryIdeas = async (historyId: string, ideas: AppIdea[]) => {
    const { error } = await supabase
        .from('search_history')
        .update({ ideas: ideas })
        .eq('id', historyId);

    if (error) console.error('Error updating history with ideas:', error);
};

export const getSearchHistory = async (): Promise<SavedHistoryItem[]> => {
    const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching history:', error);
        return [];
    }
    return data || [];
};


export const deleteSearchHistory = async (id: string) => {
    const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('id', id);

    if (error) console.error('Error deleting history:', error);
};

// --- SAVED IDEAS ---

export const saveIdea = async (idea: AppIdea, topic: string, buildPlan?: BuildPlan) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in to save ideas.');

    // Check if valid topic provided, usually logic should handle it but db requires it.
    if (!topic) throw new Error('Topic is required to save an idea.');

    // 1. Check for existing idea by Title + User
    const { data: existing } = await supabase
        .from('saved_ideas')
        .select('id')
        .eq('user_id', user.id)
        .eq('title', idea.title)
        .limit(1)
        .maybeSingle();

    if (existing) {
        // Idea already exists.
        // If a buildPlan is passed, we should update the existing record with it.
        if (buildPlan) {
            const { error: updateError } = await supabase
                .from('saved_ideas')
                .update({ build_plan: buildPlan })
                .eq('id', existing.id);

            if (updateError) throw updateError;
        }
        // If no buildPlan provided, we just return (it's already saved).
        return;
    }

    // 2. Insert new if not exists
    const { error } = await supabase
        .from('saved_ideas')
        .insert({
            user_id: user.id,
            title: idea.title,
            topic: topic,
            one_liner: idea.oneLiner,
            full_idea_json: idea,
            build_plan: buildPlan
        });

    if (error) throw error;
};

export const getSavedIdeas = async (): Promise<SavedIdeaItem[]> => {
    const { data, error } = await supabase
        .from('saved_ideas')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

export const deleteSavedIdea = async (id: string) => {
    const { error } = await supabase
        .from('saved_ideas')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

export const deleteSavedIdeaByTitle = async (title: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
        .from('saved_ideas')
        .delete()
        .eq('user_id', user.id)
        .eq('title', title); // Delete ALL matches (fixes duplicates too!)

    if (error) throw error;
};

export const updateSavedIdeaPlan = async (id: string, plan: BuildPlan) => {
    const { error } = await supabase
        .from('saved_ideas')
        .update({ build_plan: plan })
        .eq('id', id);

    if (error) throw error;
};

