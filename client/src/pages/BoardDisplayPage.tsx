import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

const BoardDisplayPage = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeSlide, setActiveSlide] = useState(0);

  // Poll for data every 5 minutes (300000ms)
  const { data: announcements = [] } = useQuery({
    queryKey: ['board-announcements'],
    queryFn: async () => {
      const res = await api.get('/announcements');
      return res.data;
    },
    refetchInterval: 300000,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['board-events'],
    queryFn: async () => {
      const res = await api.get('/events');
      return res.data.filter((e: any) => new Date(e.date) >= new Date()); // Upcoming events
    },
    refetchInterval: 300000,
  });

  // Combine slides
  const slides = [
    { type: 'welcome', title: 'Welcome to CSE Department' },
    ...(announcements.slice(0, 5).map((a: any) => ({ type: 'announcement', data: a }))),
    ...(events.slice(0, 5).map((e: any) => ({ type: 'event', data: e }))),
  ];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update clock every minute
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const slideTimer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 12000); // Rotate every 12 seconds
    return () => clearInterval(slideTimer);
  }, [slides.length]);

  const renderSlideContent = (slide: any) => {
    if (!slide) return null;

    switch (slide.type) {
      case 'welcome':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-12">
            <img src="/icon.png" alt="CSE HUB" className="w-64 h-64 object-contain rounded-3xl shadow-2xl" />
            <div>
              <h1 className="text-7xl font-extrabold text-brand-900 tracking-tight mb-4">CSE HUB</h1>
              <p className="text-4xl text-gray-500 font-medium">Department of Computer Science & Engineering</p>
            </div>
          </div>
        );
      case 'announcement':
        return (
          <div className="flex flex-col h-full justify-center max-w-6xl mx-auto space-y-10">
            <div className="flex items-center gap-6 text-brand-600">
              <Bell size={64} />
              <h2 className="text-5xl font-bold tracking-tight uppercase">Announcement</h2>
            </div>
            <div className="bg-white rounded-[2rem] shadow-xl p-12 border-l-[16px] border-brand-500">
              <h3 className="text-6xl font-bold text-gray-900 mb-8 leading-tight">{slide.data.title}</h3>
              <p className="text-4xl text-gray-600 leading-relaxed whitespace-pre-wrap line-clamp-6">
                {slide.data.content}
              </p>
              <div className="mt-12 flex items-center gap-4 text-3xl text-gray-400 font-medium">
                <Clock size={36} />
                <span>{format(new Date(slide.data.createdAt), 'MMMM do, yyyy - h:mm a')}</span>
              </div>
            </div>
          </div>
        );
      case 'event':
        return (
          <div className="flex flex-col h-full justify-center max-w-6xl mx-auto space-y-10">
            <div className="flex items-center gap-6 text-purple-600">
              <Calendar size={64} />
              <h2 className="text-5xl font-bold tracking-tight uppercase">Upcoming Event</h2>
            </div>
            <div className="bg-white rounded-[2rem] shadow-xl p-12 border-l-[16px] border-purple-500 flex gap-12 items-start">
              <div className="flex-1 space-y-8">
                <h3 className="text-6xl font-bold text-gray-900 leading-tight">{slide.data.title}</h3>
                <p className="text-4xl text-gray-600 leading-relaxed whitespace-pre-wrap line-clamp-4">
                  {slide.data.description}
                </p>
                <div className="pt-8 space-y-4">
                  <div className="flex items-center gap-4 text-3xl font-bold text-brand-700">
                    <Calendar size={36} />
                    <span>{format(new Date(slide.data.date), 'EEEE, MMMM do yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-4 text-3xl text-gray-500">
                    <Clock size={36} />
                    <span>{slide.data.time} | {slide.data.venue}</span>
                  </div>
                </div>
              </div>
              {slide.data.image_url && (
                <div className="w-1/3 shrink-0">
                  <img src={slide.data.image_url} alt="Event" className="rounded-2xl object-cover w-full h-[400px] shadow-lg" />
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-screen h-screen bg-gray-50 overflow-hidden flex flex-col cursor-none select-none">
      {/* Header */}
      <header className="h-28 bg-white shadow-md flex items-center justify-between px-12 z-10 shrink-0">
        <div className="flex items-center gap-6">
          <img src="/icon.png" alt="CSE HUB" className="w-16 h-16 object-contain rounded-xl" />
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">CSE HUB</h1>
            <p className="text-2xl text-brand-600 font-bold uppercase tracking-widest">Notice Board</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-5xl font-extrabold text-gray-900 tracking-tight">{format(currentTime, 'h:mm a')}</div>
          <div className="text-2xl text-gray-500 font-medium mt-1">{format(currentTime, 'EEEE, MMMM do, yyyy')}</div>
        </div>
      </header>

      {/* Main Content Carousel */}
      <main className="flex-1 relative overflow-hidden bg-gray-50 p-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-12"
          >
            {renderSlideContent(slides[activeSlide])}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Progress Bar */}
      <div className="h-2 bg-gray-200 shrink-0">
        <motion.div
          key={activeSlide}
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 12, ease: 'linear' }}
          className="h-full bg-brand-500"
        />
      </div>
    </div>
  );
};

export default BoardDisplayPage;
