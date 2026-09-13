import { useState } from 'react';
import { AVATAR_CATEGORIES, ALL_AVATARS } from '../../constants/avatars';

export default function AvatarPickerModal({ currentAvatarUrl, isOpen, onClose, onSave }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatarUrl || ALL_AVATARS[0]?.url || '');
  const [customUrl, setCustomUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeMode, setActiveMode] = useState('gallery'); // 'gallery' | 'custom'

  if (!isOpen) return null;

  const handleSelectAvatar = (url) => {
    setSelectedAvatar(url);
    setCustomUrl('');
  };

  const handleCustomUrlChange = (e) => {
    const val = e.target.value;
    setCustomUrl(val);
    if (val.trim()) {
      setSelectedAvatar(val.trim());
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size < 2MB
    if (file.size > 2 * 1024 * 1024) {
      alert('Please select an image smaller than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setSelectedAvatar(dataUrl);
      setCustomUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = async () => {
    if (!selectedAvatar) return;
    setIsSaving(true);
    try {
      await onSave(selectedAvatar);
      onClose();
    } catch (err) {
      console.error('Failed to save avatar:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredAvatars =
    activeCategory === 'all'
      ? ALL_AVATARS
      : AVATAR_CATEGORIES.find((c) => c.id === activeCategory)?.avatars || [];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-modal max-w-[640px] w-full p-6 rounded-3xl border border-primary/30 shadow-2xl space-y-5 text-left max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-[26px]">account_circle</span>
            <div>
              <h3 className="font-extrabold text-base text-on-surface">Choose Profile Picture &amp; Avatar</h3>
              <p className="text-xs text-on-surface-variant">
                Select a BAUST institutional avatar or provide your custom photo.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Selected Preview Bar */}
        <div className="p-4 rounded-2xl bg-surface-container-low border border-primary/20 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-16 h-16 rounded-2xl ring-4 ring-primary/40 bg-surface-container overflow-hidden flex items-center justify-center shadow-md flex-shrink-0">
              {selectedAvatar ? (
                <img src={selectedAvatar} alt="Selected Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-[36px] text-primary">person</span>
              )}
            </div>
            <div>
              <span className="text-xs font-bold text-on-surface block">Live Avatar Preview</span>
              <span className="text-[11px] text-on-surface-variant">
                This avatar will appear on your donor card, community posts, and helpline.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveMode(activeMode === 'gallery' ? 'custom' : 'gallery')}
              className="btn-outline py-1.5 px-3 text-xs font-semibold flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">
                {activeMode === 'gallery' ? 'add_photo_alternate' : 'grid_view'}
              </span>
              <span>{activeMode === 'gallery' ? 'Add Media / URL' : 'Avatar Gallery'}</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {activeMode === 'custom' ? (
            /* Custom URL & Media Upload Mode */
            <div className="space-y-4 p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Upload Photo from Device
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-on-surface-variant file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                />
                <span className="text-[10px] text-on-surface-variant mt-1 block">
                  PNG, JPG, WebP supported up to 2MB.
                </span>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-outline-variant/30" />
                <span className="flex-shrink mx-3 text-[10px] text-on-surface-variant font-bold uppercase">OR</span>
                <div className="flex-grow border-t border-outline-variant/30" />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Image Web URL (Google Drive, Cloudinary, Imgur, etc.)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={customUrl}
                    onChange={handleCustomUrlChange}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {customUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomUrl('');
                        setSelectedAvatar(currentAvatarUrl || ALL_AVATARS[0]?.url || '');
                      }}
                      className="px-3 py-1.5 text-xs text-on-surface-variant hover:text-on-surface"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Curated Gallery Mode */
            <div className="space-y-3">
              {/* Category Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveCategory('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                    activeCategory === 'all'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  All ({ALL_AVATARS.length})
                </button>
                {AVATAR_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                      activeCategory === cat.id
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {cat.name} ({cat.avatars.length})
                  </button>
                ))}
              </div>

              {/* Avatars Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredAvatars.map((item) => {
                  const isSelected = selectedAvatar === item.url;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectAvatar(item.url)}
                      className={`p-3 rounded-2xl border transition-all text-center flex flex-col items-center gap-2 group ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/40 bg-primary/5 shadow-md'
                          : 'border-outline-variant/30 hover:border-primary/40 bg-surface-container-lowest hover:bg-surface-container-low'
                      }`}
                    >
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-surface-container flex items-center justify-center relative shadow-sm group-hover:scale-105 transition-transform">
                        <img src={item.url} alt={item.label} className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                              <span className="material-symbols-outlined text-[16px]">check</span>
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-on-surface line-clamp-1 block">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-outline-variant/40 text-xs font-semibold text-on-surface hover:bg-surface-container-low"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSaving || !selectedAvatar}
            className="btn-primary py-2 px-6 text-xs font-bold flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving Avatar...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">check</span>
                <span>Set as Profile Picture</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
