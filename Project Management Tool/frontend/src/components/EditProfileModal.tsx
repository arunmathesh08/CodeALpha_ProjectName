import React, { useState } from 'react';
import { X, Check, Sparkles, User as UserIcon, Link as LinkIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  getUserAvatar, 
  isFemaleUser, 
  ALL_AVATAR_PRESETS, 
  MALE_AVATAR_PRESETS, 
  FEMALE_AVATAR_PRESETS,
  AvatarPreset,
  createBoySvg,
  createGirlSvg
} from '../utils/avatar';

interface EditProfileModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ onClose, onSuccess }) => {
  const { user, updateProfile } = useAuth();
  
  const initialIsFemale = isFemaleUser(user);
  const [name, setName] = useState(user?.name || '');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>(
    user?.gender === 'FEMALE' || initialIsFemale ? 'FEMALE' : 'MALE'
  );
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>(
    user?.avatar || getUserAvatar(user, name || 'User')
  );
  const [customUrl, setCustomUrl] = useState<string>('');
  const [showCustomUrlInput, setShowCustomUrlInput] = useState<boolean>(false);
  const [filterPreset, setFilterPreset] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Determine current active preview
  const previewAvatar = selectedAvatarUrl || getUserAvatar({ name, gender });

  const activePresets = filterPreset === 'ALL' 
    ? ALL_AVATAR_PRESETS 
    : filterPreset === 'MALE' 
    ? MALE_AVATAR_PRESETS 
    : FEMALE_AVATAR_PRESETS;

  const handleSelectPreset = (preset: AvatarPreset) => {
    setSelectedAvatarUrl(preset.url);
    setGender(preset.gender);
  };

  const handleGenderChange = (newGender: 'MALE' | 'FEMALE') => {
    setGender(newGender);
    setFilterPreset(newGender);
    // If current avatar is a vector SVG, regenerate for the new gender
    if (!selectedAvatarUrl || selectedAvatarUrl.startsWith('data:image/svg')) {
      setSelectedAvatarUrl(newGender === 'FEMALE' ? createGirlSvg(name || 'Girl') : createBoySvg(name || 'Boy'));
    }
  };

  const handleCustomUrlApply = () => {
    if (customUrl.trim()) {
      setSelectedAvatarUrl(customUrl.trim());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      await updateProfile({
        name: name.trim(),
        gender: gender,
        avatar: previewAvatar
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Profile & Avatar</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form - Scrollable */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Dynamic Avatar Main Preview (matching reference circular style) */}
          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-gradient-to-b from-indigo-50/60 via-purple-50/30 to-slate-50/50 dark:from-slate-800/60 dark:to-slate-800/20 border border-indigo-100/60 dark:border-slate-700/60 text-center">
            <div className="relative group">
              <img
                src={previewAvatar}
                alt="Selected Profile Avatar Preview"
                className="w-24 h-24 rounded-full object-cover ring-4 ring-indigo-300/60 dark:ring-indigo-500/40 shadow-xl transition-all transform group-hover:scale-105 duration-200"
              />
              <span className="absolute bottom-0 right-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white shadow-md">
                {gender === 'FEMALE' ? '👧 Girl' : '👦 Boy'}
              </span>
            </div>
            
            <p className="mt-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
              Choose an avatar preset below or enter an image URL:
            </p>
          </div>

          {/* Avatar Presets Selection Gallery */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Avatar Presets ({activePresets.length})
              </label>

              {/* Preset Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setFilterPreset('ALL')}
                  className={`px-2 py-0.5 rounded-lg transition ${
                    filterPreset === 'ALL'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All (16)
                </button>
                <button
                  type="button"
                  onClick={() => setFilterPreset('MALE')}
                  className={`px-2 py-0.5 rounded-lg transition ${
                    filterPreset === 'MALE'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  👦 Men (8)
                </button>
                <button
                  type="button"
                  onClick={() => setFilterPreset('FEMALE')}
                  className={`px-2 py-0.5 rounded-lg transition ${
                    filterPreset === 'FEMALE'
                      ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  👧 Women (8)
                </button>
              </div>
            </div>

            {/* Horizontal Scrollable Presets Row (matching Reference 2 & 3) */}
            <div className="relative p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3.5 overflow-x-auto py-2 px-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                {/* Default Vector Option */}
                <button
                  type="button"
                  onClick={() => {
                    const svg = gender === 'FEMALE' ? createGirlSvg(name || 'Girl') : createBoySvg(name || 'Boy');
                    setSelectedAvatarUrl(svg);
                  }}
                  title="Dynamic Vector Illustration"
                  className={`relative shrink-0 rounded-full transition-all ${
                    selectedAvatarUrl.startsWith('data:image/svg')
                      ? 'ring-3 ring-indigo-600 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 scale-110 shadow-md z-10'
                      : 'ring-2 ring-slate-200 dark:ring-slate-700 opacity-80 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  <img
                    src={gender === 'FEMALE' ? createGirlSvg(name || 'Girl') : createBoySvg(name || 'Boy')}
                    alt="Vector Illustration"
                    className="w-13 h-13 rounded-full object-cover"
                  />
                  {selectedAvatarUrl.startsWith('data:image/svg') && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold shadow">
                      ✓
                    </span>
                  )}
                </button>

                {/* Portrait Presets */}
                {activePresets.map((preset) => {
                  const isSelected = selectedAvatarUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      title={preset.name}
                      className={`relative shrink-0 rounded-full transition-all duration-150 ${
                        isSelected
                          ? 'ring-3 ring-indigo-600 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 scale-110 shadow-md z-10'
                          : 'ring-2 ring-slate-200/90 dark:ring-slate-700 opacity-85 hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-13 h-13 rounded-full object-cover"
                      />
                      {isSelected && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold shadow">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Toggle Custom URL Input */}
              <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={() => setShowCustomUrlInput(!showCustomUrlInput)}
                  className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>{showCustomUrlInput ? 'Hide image URL input' : 'Or paste a custom image URL'}</span>
                </button>
                <span className="text-slate-400">16 Realistic Presets</span>
              </div>

              {showCustomUrlInput && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleCustomUrlApply}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Your Name
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  const newName = e.target.value;
                  setName(newName);
                }}
                placeholder="e.g. Arun, Sarah, Alex..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Gender / Avatar Type Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Select Profile Avatar Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Boy / Male Option */}
              <button
                type="button"
                onClick={() => handleGenderChange('MALE')}
                className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                  gender === 'MALE'
                    ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 ring-2 ring-indigo-500/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="text-2xl">👦</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Boy / Male</span>
                    {gender === 'MALE' && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                  </div>
                  <span className="text-[10px] text-slate-400">Short hair avatar</span>
                </div>
              </button>

              {/* Girl / Female Option */}
              <button
                type="button"
                onClick={() => handleGenderChange('FEMALE')}
                className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                  gender === 'FEMALE'
                    ? 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/50 ring-2 ring-rose-500/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="text-2xl">👧</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Girl / Female</span>
                    {gender === 'FEMALE' && <Check className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
                  </div>
                  <span className="text-[10px] text-slate-400">Long hair avatar</span>
                </div>
              </button>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 transition active:scale-95 disabled:opacity-50"
            >
              {isSaving ? 'Updating...' : 'Save Avatar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
