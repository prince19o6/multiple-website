import React from "react";
import { handleImageError, getActualImageUrl } from "@/lib/imageUtils";

interface TourCardProps {
  name: string;
  description: string;
  price: number;
  rating: number;
  image: string;
  duration: string;
  difficulty: string;
  onBook: () => void;
}

export default function TourCard({
  name,
  description,
  price,
  rating,
  image,
  duration,
  difficulty,
  onBook,
}: TourCardProps) {
  const actualImg = getActualImageUrl(image, { title: name, module: "tours" });

  return (
    <div className="bg-surface text-foreground rounded-2xl shadow-soft-sm hover:shadow-soft-md border border-border overflow-hidden transition-all duration-300 flex flex-col justify-between group">
      <div>
        {/* Image Container */}
        <div className="relative h-48 bg-surface-2 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={actualImg}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={handleImageError}
          />
          <div className="absolute top-3 right-3 bg-primary text-primary-contrast px-2.5 py-1 rounded-full text-xs font-bold shadow-soft-sm flex items-center gap-1">
            <span>★</span>
            <span>{rating}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-base font-bold mb-1.5 text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {name}
          </h3>

          {/* Quick Info */}
          <div className="flex gap-3 mb-2.5 text-xs text-foreground-muted">
            <span className="flex items-center gap-1">📅 {duration}</span>
            <span className="flex items-center gap-1">💪 {difficulty}</span>
          </div>

          <p className="text-foreground-muted text-xs mb-4 line-clamp-2 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pb-5 pt-0 flex justify-between items-center border-t border-border mt-2 pt-3">
        <div>
          <span className="text-[10px] text-foreground-subtle block uppercase tracking-wider">From</span>
          <span className="text-xl font-black text-primary">${price}</span>
        </div>
        <button
          onClick={onBook}
          className="bg-primary hover:bg-primary-dark text-primary-contrast px-4 py-2 rounded-xl text-xs font-bold shadow-soft-sm hover:shadow-soft-md transition-all cursor-pointer"
        >
          Book Now
        </button>
      </div>
    </div>
  );
}