"use client";

import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { ZoomIn } from "lucide-react";
import Image from "next/image";

interface ImageLightboxProps {
  src: string;
  alt: string;
  className?: string;
  thumbnailClassName?: string;
}

export default function ImageLightbox({
  src,
  alt,
  className = "h-16 w-24",
  thumbnailClassName,
}: ImageLightboxProps) {
  const [open, setOpen] = useState(false);

  if (!src) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group relative overflow-hidden rounded-lg border border-slate-200 ${thumbnailClassName || className}`}
        title="คลิกเพื่อขยายภาพ"
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover transition group-hover:scale-105"
          sizes="96px"
          unoptimized
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/30">
          <ZoomIn className="h-5 w-5 text-white opacity-0 transition group-hover:opacity-100" />
        </span>
      </button>
      <Lightbox
        open={open}
        close={() => setOpen(false)}
        slides={[{ src, alt }]}
        controller={{ closeOnBackdropClick: true }}
      />
    </>
  );
}
