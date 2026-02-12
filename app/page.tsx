'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, Music } from 'lucide-react';

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
  characterPosition: string; // 'bottom-right' | 'bottom-left' | 'center' | 'floating'
  text: string;
  duration: number;
  buttons?: Button[];
}

export default function Home() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [displayedText, setDisplayedText] = useState('');
  const [temporaryText, setTemporaryText] = useState<string | null>(null); // Buton cevabı için geçici metin
  const [hasStarted, setHasStarted] = useState(false); // Başlangıç ekranı kontrolü
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Slaytları Yükle
  useEffect(() => {
    fetch('/api/slides')
      .then((res) => res.json())
      .then((data) => {
        setSlides(Array.isArray(data) ? data : []);
        setLoading(false);
        if (data.length > 0) setIsPlaying(true);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Slayt Değişince Reset
  useEffect(() => {
    setTemporaryText(null);
  }, [currentSlideIndex]);

  // Slayt Zamanlayıcı
  useEffect(() => {
    if (!hasStarted || !isPlaying || slides.length === 0) return;

    const currentSlide = slides[currentSlideIndex];
    if (!currentSlide) return;

    // Eğer geçici metin (cevap) okunuyorsa veya butonlar varsa otomatik geçme
    if (temporaryText) return;
    if (currentSlide.buttons && currentSlide.buttons.length > 0) return;

    const timer = setTimeout(() => {
      nextSlide();
    }, currentSlide.duration || 5000);

    return () => clearTimeout(timer);
  }, [hasStarted, isPlaying, currentSlideIndex, slides, temporaryText]);

  // Yazı Efekti (Typewriter)
  useEffect(() => {
    if (slides.length === 0) return;
    const currentSlide = slides[currentSlideIndex];

    setDisplayedText('');

    // Öncelik: Geçici metin (cevap) varsa onu yaz, yoksa slayt metnini yaz
    const textToType = temporaryText || currentSlide?.text;

    if (!textToType) return;

    const text = textToType;
    let currentIndex = 0;

    const typingInterval = setInterval(() => {
      if (currentIndex < text.length) {
        currentIndex++;
        setDisplayedText(text.slice(0, currentIndex));
      } else {
        clearInterval(typingInterval);
      }
    }, 50);

    return () => clearInterval(typingInterval);
  }, [currentSlideIndex, slides, temporaryText]);

  const nextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const jumpToSlide = (slideId: string) => {
    const index = slides.findIndex(s => s.id === slideId);
    if (index !== -1) {
      setCurrentSlideIndex(index);
    } else {
      nextSlide();
    }
  };

  const executeAction = (btn: Button) => {
    if (btn.action === 'jump' && btn.targetSlideId) {
      jumpToSlide(btn.targetSlideId);
    } else {
      nextSlide();
    }
  };

  const handleButtonClick = (btn: Button) => {
    if (btn.response) {
      // Önce cevabı göster
      setTemporaryText(btn.response);

      // Cevap okununca (uzunluğuna göre süre ver) sonra aksiyonu yap
      const readTime = Math.max(2000, btn.response.length * 80);
      setTimeout(() => {
        executeAction(btn);
      }, readTime);
    } else {
      // Cevap yoksa direkt geç
      executeAction(btn);
    }
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  const handleStart = () => {
    setHasStarted(true);
    setIsPlaying(true);
  };

  useEffect(() => {
    const playAudio = async () => {
      if (hasStarted && audioRef.current) {
        try {
          audioRef.current.volume = 0.5;
          await audioRef.current.play();
        } catch (e) {
          console.log("Otomatik oynatma hatası:", e);
        }
      }
    };
    playAudio();
  }, [hasStarted]);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  };

  // Karakter Konumlandırma
  const getCharacterVariants = (position: string): Variants => {
    const base = { opacity: 0, scale: 0.8 };
    const visible = { opacity: 1, scale: 1, transition: { duration: 0.8, ease: "easeOut" } as any };

    switch (position) {
      case 'bottom-left':
        return {
          initial: { ...base, x: -100, y: 100 },
          animate: { ...visible, x: 0, y: 0 },
          exit: { opacity: 0, x: -50, transition: { duration: 0.5 } }
        };
      case 'center':
        return {
          initial: { ...base, scale: 0.5 },
          animate: { ...visible },
          exit: { opacity: 0, scale: 0.5 }
        };
      case 'floating':
        return {
          initial: { opacity: 0, y: 50 },
          animate: {
            opacity: 1,
            y: [0, -20, 0], // Yüzme efekti
            transition: {
              opacity: { duration: 0.8 },
              y: {
                repeat: Infinity,
                duration: 3,
                ease: "easeInOut"
              }
            }
          },
          exit: { opacity: 0 }
        };
      case 'bottom-right':
      default:
        return {
          initial: { ...base, x: 100, y: 100 },
          animate: { ...visible, x: 0, y: 0 },
          exit: { opacity: 0, x: 50 }
        };
    }
  };

  const getPositionClasses = (position: string) => {
    switch (position) {
      case 'bottom-left': return 'bottom-0 left-0 max-w-[85vw] max-h-[60vh] md:max-w-[40vw] md:max-h-[80vh]';
      case 'center': return 'bottom-0 left-1/2 -translate-x-1/2 max-w-[90vw] max-h-[70vh] md:max-w-[50vw] md:max-h-[90vh]';
      case 'floating': return 'bottom-20 right-4 max-w-[60vw] max-h-[50vh] md:bottom-10 md:right-10 md:max-w-[35vw] md:max-h-[70vh]';
      case 'bottom-right': default: return 'bottom-0 right-0 max-w-[85vw] max-h-[60vh] md:max-w-[40vw] md:max-h-[80vh]';
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-pink-50 text-pink-600">Hazırlanıyor...</div>;
  if (slides.length === 0) return <div className="h-screen flex items-center justify-center flex-col bg-pink-50"><p className="text-xl text-gray-600 mb-4">Henüz hiç anı eklenmemiş...</p><a href="/admin" className="text-pink-600 underline">Yönetici Paneline Git</a></div>;

  // Başlangıç Ekranı
  if (!hasStarted) {
    return (
      <div className="relative w-full h-screen bg-black flex flex-col items-center justify-center overflow-hidden">
        {/* Sisli/Karanlık Arkaplan Efekti */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518066000714-58c45f1a2c0a?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 blur-sm animate-pulse"></div>
        <div className="absolute inset-0 bg-black/60"></div>

        <div className="z-10 text-center space-y-8 animate-in fade-in zoom-in duration-1000">
          <h1 className="text-4xl md:text-6xl font-serif text-pink-100 tracking-widest drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]">
            BİZİM HİKAYEMİZ
          </h1>
          <p className="text-gray-300 text-lg md:text-xl font-light italic">
            Hazırsan başlayalım...
          </p>
          <button
            onClick={handleStart}
            className="group relative px-8 py-4 bg-transparent border border-pink-500/50 text-pink-100 rounded-full overflow-hidden transition-all hover:border-pink-500 hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]"
          >
            <span className="relative z-10 flex items-center gap-3 text-xl font-light tracking-wider">
              <Play size={24} className="fill-current" /> BAŞLAT
            </span>
            <div className="absolute inset-0 bg-pink-900/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
          </button>
        </div>
      </div>
    );
  }

  // Başlangıç Ekranı
  if (!hasStarted) {
    return (
      <div className="relative w-full h-screen bg-black flex flex-col items-center justify-center overflow-hidden">
        {/* Sisli/Karanlık Arkaplan Efekti */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518066000714-58c45f1a2c0a?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 blur-sm animate-pulse"></div>
        <div className="absolute inset-0 bg-black/60"></div>

        <div className="z-10 text-center space-y-8 animate-in fade-in zoom-in duration-1000">
          <h1 className="text-4xl md:text-6xl font-serif text-pink-100 tracking-widest drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]">
            BİZİM HİKAYEMİZ
          </h1>
          <p className="text-gray-300 text-lg md:text-xl font-light italic">
            Hazırsan başlayalım...
          </p>
          <button
            onClick={handleStart}
            className="group relative px-8 py-4 bg-transparent border border-pink-500/50 text-pink-100 rounded-full overflow-hidden transition-all hover:border-pink-500 hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]"
          >
            <span className="relative z-10 flex items-center gap-3 text-xl font-light tracking-wider">
              <Play size={24} className="fill-current" /> BAŞLAT
            </span>
            <div className="absolute inset-0 bg-pink-900/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
          </button>
        </div>
      </div>
    );
  }

  const currentSlide = slides[currentSlideIndex];
  const shouldShowTextBox = currentSlide.text || temporaryText || (currentSlide.buttons && currentSlide.buttons.length > 0);

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black">
      {/* Arkaplan Müziği */}
      <audio ref={audioRef} src="/music.mp3" loop hidden />

      {/* Arkaplan */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${currentSlide.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 z-0"
        >
          {currentSlide.backgroundUrl ? (
            currentSlide.backgroundUrl.match(/\.(mp4|webm|ogg|mov)$/i) ? (
              <video
                src={currentSlide.backgroundUrl}
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <div
                className="w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url(${currentSlide.backgroundUrl})` }}
              />
            )
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-200 to-purple-300" />
          )}
          {/* Hafif Karartma Katmanı */}
          <div className="absolute inset-0 bg-black/20" />
        </motion.div>
      </AnimatePresence>

      {/* Karakter */}
      <AnimatePresence mode="wait">
        {currentSlide.characterUrl && (
          <motion.img
            key={`char-${currentSlide.id}`}
            src={currentSlide.characterUrl}
            alt="Character"
            className={`absolute z-10 object-contain drop-shadow-2xl ${getPositionClasses(currentSlide.characterPosition)}`}
            variants={getCharacterVariants(currentSlide.characterPosition)}
            initial="initial"
            animate="animate"
            exit="exit"
          />
        )}
      </AnimatePresence>

      {/* Konuşma Balonu / Alt Yazı Alanı */}
      <div className="absolute bottom-6 left-4 right-4 md:bottom-10 md:left-10 md:right-10 z-20 flex flex-col items-center pointer-events-none">
        {shouldShowTextBox && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 backdrop-blur-sm p-4 md:p-6 rounded-xl md:rounded-2xl shadow-xl max-w-4xl w-full border-2 border-pink-100 mb-4 pointer-events-auto min-h-[100px] flex flex-col justify-center"
          >
            {(currentSlide.text || temporaryText) && (
              <p className="text-lg md:text-3xl font-handwriting text-gray-800 leading-relaxed font-medium">
                {displayedText}
              </p>
            )}

            {/* Butonlar (Sadece geçici metin yoksa göster) */}
            {!temporaryText && currentSlide.buttons && currentSlide.buttons.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
                {currentSlide.buttons.map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => handleButtonClick(btn)}
                    className={`px-6 py-3 rounded-full font-bold transition-all transform hover:scale-105 active:scale-95 shadow-md text-sm md:text-lg ${btn.variant === 'secondary'
                      ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      : btn.variant === 'outline'
                        ? 'border-2 border-pink-500 text-pink-600 hover:bg-pink-50'
                        : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg'
                      }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Kontroller (Mobilde hep görünür, masaüstünde hover) */}
      <div className="absolute top-0 left-0 w-full h-20 opacity-100 md:opacity-0 md:hover:opacity-100 transition-opacity z-50 p-4 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
        <div className="text-white text-sm font-light">
          {currentSlideIndex + 1} / {slides.length}
        </div>
        <div className="flex gap-4">
          <button onClick={toggleMusic} className="text-white hover:text-pink-300 transition-colors" title="Müziği Aç/Kapa"><Music /></button>
          <button onClick={prevSlide} className="text-white hover:text-pink-300 transition-colors"><SkipBack /></button>
          <button onClick={togglePlay} className="text-white hover:text-pink-300 transition-colors">
            {isPlaying ? <Pause /> : <Play />}
          </button>
          <button onClick={nextSlide} className="text-white hover:text-pink-300 transition-colors"><SkipForward /></button>
        </div>
      </div>
    </main>
  );
}
