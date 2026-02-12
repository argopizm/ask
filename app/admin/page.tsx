'use client';

import { useState, useEffect } from 'react';
import { Trash2, Plus, Save, Upload, Copy } from 'lucide-react';

interface Button {
    id: string;
    label: string;
    action: 'next' | 'jump';
    targetSlideId?: string;
    variant?: 'primary' | 'secondary' | 'outline';
    response?: string;
}

interface Slide {
    id: string;
    backgroundUrl: string;
    characterUrl: string;
    characterPosition: string;
    text: string;
    duration: number;
    buttons?: Button[];
}

export default function AdminPage() {
    const [slides, setSlides] = useState<Slide[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSlides();
    }, []);

    const fetchSlides = async () => {
        try {
            const res = await fetch('/api/slides');
            const data = await res.json();
            setSlides(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch slides', error);
        } finally {
            setLoading(false);
        }
    };

    const saveSlides = async (newSlides: Slide[]) => {
        try {
            await fetch('/api/slides', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSlides),
            });
            setSlides(newSlides);
        } catch (error) {
            console.error('Failed to save slides', error);
        }
    };

    const handleUpload = async (file: File): Promise<string | null> => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            return data.success ? data.url : null;
        } catch (error) {
            console.error('Upload failed', error);
            return null;
        }
    };

    const addSlide = () => {
        const newSlide: Slide = {
            id: crypto.randomUUID(),
            backgroundUrl: '',
            characterUrl: '',
            characterPosition: 'bottom-right',
            text: '',
            duration: 5000,
            buttons: []
        };
        saveSlides([...slides, newSlide]);
    };

    const updateSlide = (id: string, field: keyof Slide, value: any) => {
        const newSlides = slides.map((slide) =>
            slide.id === id ? { ...slide, [field]: value } : slide
        );
        setSlides(newSlides);
    };

    const addButton = (slideId: string) => {
        const newButton: Button = {
            id: crypto.randomUUID(),
            label: 'Devam Et',
            action: 'next',
            variant: 'primary'
        };
        const slide = slides.find(s => s.id === slideId);
        if (slide) {
            const updatedButtons = [...(slide.buttons || []), newButton];
            updateSlide(slideId, 'buttons', updatedButtons);
        }
    };

    const updateButton = (slideId: string, buttonId: string, field: keyof Button, value: any) => {
        const slide = slides.find(s => s.id === slideId);
        if (slide) {
            const updatedButtons = (slide.buttons || []).map(b =>
                b.id === buttonId ? { ...b, [field]: value } : b
            );
            updateSlide(slideId, 'buttons', updatedButtons);
        }
    };

    const removeButton = (slideId: string, buttonId: string) => {
        const slide = slides.find(s => s.id === slideId);
        if (slide) {
            const updatedButtons = (slide.buttons || []).filter(b => b.id !== buttonId);
            updateSlide(slideId, 'buttons', updatedButtons);
        }
    };

    const deleteSlide = (id: string) => {
        if (confirm('Bu slaytı silmek istediğine emin misin?')) {
            const newSlides = slides.filter((s) => s.id !== id);
            saveSlides(newSlides);
        }
    };

    const duplicateSlide = (slide: Slide) => {
        const newSlide: Slide = {
            ...slide,
            id: crypto.randomUUID(),
            buttons: [] // Butonları kopyalamıyoruz, yeni dallanma için temizliyoruz
        };

        // Mevcut slaytın hemen arkasına ekle
        const index = slides.findIndex(s => s.id === slide.id);
        const newSlides = [...slides];
        newSlides.splice(index + 1, 0, newSlide);

        saveSlides(newSlides);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, id: string, field: 'backgroundUrl' | 'characterUrl') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = await handleUpload(file);
            if (url) {
                updateSlide(id, field, url);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
            <header className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8 gap-4">
                <h1 className="text-xl md:text-3xl font-bold text-gray-800 text-center md:text-left">Sevgililer Günü Slayt Yönetimi ❤️</h1>
                <div className="flex w-full md:w-auto space-x-2 md:space-x-4">
                    <button
                        onClick={() => saveSlides(slides)}
                        className="flex-1 md:flex-none justify-center bg-green-600 hover:bg-green-700 text-white px-6 py-3 md:py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm md:text-base"
                    >
                        <Save size={20} /> Kaydet
                    </button>
                    <a href="/" target="_blank" className="flex-1 md:flex-none text-center block py-3 md:py-2 text-blue-600 hover:underline bg-blue-50 md:bg-transparent rounded-lg">Sitesi Görüntüle &rarr;</a>
                </div>
            </header>

            {loading ? (
                <div className="text-center py-20">Yükleniyor...</div>
            ) : (
                <div className="space-y-8 max-w-5xl mx-auto">
                    {slides.map((slide, index) => (
                        <div key={slide.id} className="bg-white rounded-xl shadow-md p-6 border border-gray-100 relative group transition-all hover:shadow-lg">
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
                                <button
                                    onClick={() => duplicateSlide(slide)}
                                    className="text-blue-500 hover:text-blue-700 p-2 bg-blue-50 rounded-full"
                                    title="Slaytı Kopyala (Dallanma İçin)"
                                >
                                    <Copy size={20} />
                                </button>
                                <button
                                    onClick={() => deleteSlide(slide.id)}
                                    className="text-red-500 hover:text-red-700 p-2 bg-red-50 rounded-full"
                                    title="Slaytı Sil"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Sol Taraf: Görseller */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Arkaplan (Fotoğraf veya Video)</label>
                                        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors flex flex-col items-center justify-center">
                                            {slide.backgroundUrl ? (
                                                slide.backgroundUrl.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                                                    <video src={slide.backgroundUrl} className="w-full h-full object-cover" controls />
                                                ) : (
                                                    <img src={slide.backgroundUrl} alt="Arkaplan" className="w-full h-full object-cover" />
                                                )
                                            ) : (
                                                <div className="text-gray-400 text-sm flex flex-col items-center"><Upload size={24} className="mb-2" /> Medya Yükle</div>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*,video/*"
                                                onChange={(e) => handleFileChange(e, slide.id, 'backgroundUrl')}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Kız Karakteri (PNG)</label>
                                        <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 hover:border-pink-400 transition-colors flex flex-col items-center justify-center">
                                            {slide.characterUrl ? (
                                                <img src={slide.characterUrl} alt="Karakter" className="h-full object-contain" />
                                            ) : (
                                                <div className="text-gray-400 text-sm flex flex-col items-center"><Upload size={24} className="mb-2" /> Karakter Yükle (PNG)</div>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/png,image/jpeg"
                                                onChange={(e) => handleFileChange(e, slide.id, 'characterUrl')}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Sağ Taraf: Ayarlar */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Gökçin'in Söyleyeceği Sözler</label>
                                        <textarea
                                            value={slide.text}
                                            onChange={(e) => updateSlide(slide.id, 'text', e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg p-3 min-h-[120px] focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all text-gray-900"
                                            placeholder="Buraya yazacağın her şeyi karakter söyleyecek..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Karakter Pozisyonu</label>
                                            <select
                                                value={slide.characterPosition}
                                                onChange={(e) => updateSlide(slide.id, 'characterPosition', e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-pink-500 outline-none text-gray-900"
                                            >
                                                <option value="bottom-right">Sağ Alt</option>
                                                <option value="bottom-left">Sol Alt</option>
                                                <option value="center">Ortala</option>
                                                <option value="floating">Süzülen (Yüzen)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Süre (Milisaniye)</label>
                                            <input
                                                type="number"
                                                value={slide.duration}
                                                onChange={(e) => updateSlide(slide.id, 'duration', parseInt(e.target.value))}
                                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-pink-500 outline-none text-gray-900"
                                                min="1000"
                                                step="1000"
                                            />
                                        </div>
                                    </div>

                                    {/* Buton Yönetimi */}
                                    <div className="border-t border-gray-200 pt-4 mt-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="block text-sm font-medium text-gray-700">Etkileşim Butonları (Dallar)</label>
                                            <button
                                                onClick={() => addButton(slide.id)}
                                                className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded hover:bg-pink-200 transition-colors flex items-center gap-1"
                                            >
                                                <Plus size={14} /> Buton Ekle
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            {slide.buttons && slide.buttons.length > 0 ? (
                                                slide.buttons.map((btn) => (
                                                    <div key={btn.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm space-y-3">
                                                        <div className="flex gap-2 items-center">
                                                            <input
                                                                type="text"
                                                                value={btn.label}
                                                                onChange={(e) => updateButton(slide.id, btn.id, 'label', e.target.value)}
                                                                placeholder="Buton Yazısı (Örn: Evet)"
                                                                className="flex-1 border border-gray-300 rounded p-1.5 text-gray-900 text-xs font-medium"
                                                            />
                                                            <select
                                                                value={btn.variant || 'primary'}
                                                                onChange={(e) => updateButton(slide.id, btn.id, 'variant', e.target.value)}
                                                                className="border border-gray-300 rounded p-1.5 text-gray-900 text-xs"
                                                            >
                                                                <option value="primary">Renkli (Ana)</option>
                                                                <option value="secondary">Gri (Yan)</option>
                                                                <option value="outline">Şeffaf</option>
                                                            </select>
                                                            <button
                                                                onClick={() => removeButton(slide.id, btn.id)}
                                                                className="text-red-500 hover:text-red-700"
                                                                title="Butonu Sil"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>

                                                        {/* Cevap Alanı (Visual Novel Tarzı) */}
                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-500 mb-1">Butona Basınca Karakter Ne Desin? (Opsiyonel)</label>
                                                            <textarea
                                                                value={btn.response || ''}
                                                                onChange={(e) => updateButton(slide.id, btn.id, 'response', e.target.value)}
                                                                placeholder="Boş bırakırsan direkt diğer sahneye geçer. Yazarsan önce bunu söyler, sonra geçer."
                                                                className="w-full border border-gray-300 rounded p-1.5 text-gray-900 text-xs min-h-[50px]"
                                                            />
                                                        </div>

                                                        <div className="flex gap-2 items-center">
                                                            <span className="text-xs text-gray-500 whitespace-nowrap">Sonra Ne Olsun?</span>
                                                            <select
                                                                value={btn.action}
                                                                onChange={(e) => updateButton(slide.id, btn.id, 'action', e.target.value)}
                                                                className="border border-gray-300 rounded p-1.5 text-gray-900 text-xs flex-1"
                                                            >
                                                                <option value="next">Sonraki Slayta Geç</option>
                                                                <option value="jump">Başka Slayta Git</option>
                                                            </select>

                                                            {btn.action === 'jump' && (
                                                                <select
                                                                    value={btn.targetSlideId || ''}
                                                                    onChange={(e) => updateButton(slide.id, btn.id, 'targetSlideId', e.target.value)}
                                                                    className="flex-1 border border-gray-300 rounded p-1.5 text-gray-900 text-xs truncate max-w-[150px]"
                                                                >
                                                                    <option value="">Slayt Seçin...</option>
                                                                    {slides.map((s, idx) => (
                                                                        <option key={s.id} value={s.id}>
                                                                            {idx + 1}. {s.text ? s.text.substring(0, 15) + '...' : 'Metinsiz'}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-gray-400 italic text-center py-2">Hiç buton yok.</p>
                                            )}
                                        </div>
                                    </div>
                                    {/* Buton Yönetimi Sonu */}

                                    <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700">
                                        <p>💡 <b>İpucu:</b> "Süzülen" modunu seçersen karakter ekranda yavaşça hareket eder. Buton eklerseniz otomatik geçiş durur.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -left-3 top-1/2 -translate-y-1/2 bg-gray-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                                {index + 1}
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={addSlide}
                        className="w-full py-4 border-2 border-dashed border-gray-400 rounded-xl text-gray-500 hover:text-gray-700 hover:border-gray-600 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-lg font-medium"
                    >
                        <Plus size={24} /> Yeni Slayt Ekle
                    </button>
                </div>
            )}
        </div>
    );
}
