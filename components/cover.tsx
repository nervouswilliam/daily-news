"use client";

import Image from "next/image";
import { useState } from "react";
import { Illustration, type IllustrationName } from "@/components/illustrations";
import { storyArt } from "@/lib/theme";
import { cn } from "@/lib/utils";

type Props = {
  imageUrl: string | null;
  sectionKey: string;
  sectionName?: string;
  tag: string;
  headline: string;
  index?: number;
  illo?: IllustrationName;
  className?: string;
  priority?: boolean;
  sizes?: string;
  children?: React.ReactNode;
};

/** Story visual: the article image if it loads, otherwise an illustrated gradient cover. */
export function Cover({ imageUrl, sectionKey, sectionName, tag, headline, index, illo, className, priority, sizes, children }: Props) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !failed;
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <IllustratedCover sectionKey={sectionKey} sectionName={sectionName} tag={tag} headline={headline} index={index} illo={illo} />
      {showImage && (
        <Image
          src={imageUrl!}
          alt=""
          fill
          unoptimized
          priority={priority}
          sizes={sizes ?? "(max-width: 768px) 100vw, 640px"}
          className="object-cover"
          onError={() => setFailed(true)}
          referrerPolicy="no-referrer"
        />
      )}
      {children}
    </div>
  );
}

export function IllustratedCover({
  sectionKey,
  sectionName,
  tag,
  headline,
  index,
  illo: illoOverride,
}: {
  sectionKey: string;
  sectionName?: string;
  tag: string;
  headline: string;
  index?: number;
  illo?: IllustrationName;
}) {
  const { theme, illo, variant, angle } = storyArt({ key: sectionKey, name: sectionName, tag, headline, index, illo: illoOverride });
  const [a, b] = variant % 2 === 0 ? [theme.from, theme.to] : [theme.to, theme.from];
  const layouts = [
    "right-[-6%] bottom-[-14%] w-[62%] rotate-[-8deg]",
    "left-1/2 top-1/2 w-[46%] -translate-x-1/2 -translate-y-1/2",
    "left-[-4%] bottom-[-16%] w-[58%] rotate-[10deg]",
    "right-[4%] top-[8%] w-[44%] rotate-[6deg]",
  ];
  return (
    <div className="absolute inset-0" style={{ background: `linear-gradient(${angle}deg, ${a}, ${b})` }} aria-hidden="true">
      <div className="dot-grid absolute inset-0 opacity-60" />
      <div
        className="absolute size-[70%] rounded-full opacity-30 blur-2xl"
        style={{ background: b, left: variant > 1 ? "50%" : "-15%", top: variant % 2 ? "-30%" : "40%" }}
      />
      <Illustration name={illo} className={cn("absolute text-white drop-shadow-[0_10px_30px_rgba(0,0,0,.25)]", layouts[variant])} />
    </div>
  );
}
