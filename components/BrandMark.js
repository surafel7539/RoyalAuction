import Image from "next/image";

export function BrandMark({ className = "h-10 w-auto" }) {
  return (
    <Image
      src="/logo.png"
      alt="Bid Ethiopia"
      width={320}
      height={96}
      className={`shrink-0 object-contain object-left ${className}`}
      priority
    />
  );
}
