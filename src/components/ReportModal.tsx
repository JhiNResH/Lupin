"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle, MapPin, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createRestaurant, Restaurant } from "@/lib/restaurants";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialName?: string;
  onSuccess?: (restaurant: Restaurant) => void;
}

export function ReportModal({ isOpen, onClose, initialName = "", onSuccess }: ReportModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: initialName,
    location: "",
    reason: "",
  });

  // Reset form when opening or when initialName changes
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ ...prev, name: initialName }));
    }
  }, [isOpen, initialName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createRestaurant({
        name: formData.name,
        location: formData.location || "Taipei",
        analysis_summary: formData.reason,
      });
      
      setSuccess(true);
      
      // Notify parent about the new restaurant immediately
      if (onSuccess && result.success) {
         // Construct a temporary restaurant object to pass back
         // In a real app, createRestaurant might return the full object.
         // Here we approximate it for instant UI feedback.
         const tempRestaurant: Restaurant = {
             id: result.id || `temp-${Date.now()}`,
             restaurant_id: formData.name.toLowerCase().replace(/\s+/g, "-"),
             name: formData.name,
             location: formData.location || "Taipei",
             district: "Taipei", // Default
             node_id: "P-NEW",
             web2_facade: 5.0,
             lupin_veracity: 0,
             bot_probability: 80,
             confidence: 0,
             status: "pending",
             verification_count: 0,
             clue_reward: 100,
             forensic_reveal: [],
             analysis_summary: formData.reason,
             key_findings: [],
             created_at: new Date().toISOString(),
             updated_at: new Date().toISOString(),
         };
         onSuccess(tempRestaurant);
      }

      setTimeout(() => {
        setSuccess(false);
        setFormData({ name: "", location: "", reason: "" });
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Submission failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-[#050A14] border border-(--primary)/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,255,136,0.1)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-(--primary)/20 bg-(--primary)/5">
              <div className="flex items-center gap-2 text-(--debunk-red)">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
                <h2 className="font-black tracking-widest uppercase text-sm">Report Suspect</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            {success ? (
              <div className="p-12 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-(--primary)/20 flex items-center justify-center mb-2">
                  <Send className="w-8 h-8 text-(--primary) animate-ping" />
                </div>
                <h3 className="text-(--primary) font-black text-xl tracking-wider">RECEIVED</h3>
                <p className="text-gray-400 text-xs font-mono">
                  Evidence submitted to Lupin Agent Network.<br/>
                  Awaiting forensic verification.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-(--primary)/70 tracking-wider pl-1">
                    Suspect Name
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. The Gilded Sushi"
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-(--primary) outline-none transition-colors placeholder:text-white/20 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-(--primary)/70 tracking-wider pl-1">
                    Location / Link
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Google Maps Link or District"
                      className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white focus:border-(--primary) outline-none transition-colors placeholder:text-white/20 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-(--primary)/70 tracking-wider pl-1">
                    Crime Report
                  </label>
                  <textarea
                    required
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Why is it suspicious? (e.g. 5.0 stars with 10k reviews)"
                    rows={3}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-(--primary) outline-none transition-colors placeholder:text-white/20 font-mono resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full bg-(--debunk-red) hover:bg-red-600 text-white font-black tracking-[0.2em] uppercase py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                  >
                    {loading ? (
                      <span className="animate-pulse">Transmitting...</span>
                    ) : (
                      <>
                        <span>Submit Evidence</span>
                        <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                  <p className="text-center text-[10px] text-white/30 mt-3 font-mono">
                    All reports are anonymous and encrypted.
                  </p>
                </div>
              </form>
            )}
            
            {/* Decorative Cyber Elements */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-(--primary)/5 blur-2xl -z-10" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-(--debunk-red)/5 blur-3xl -z-10" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
