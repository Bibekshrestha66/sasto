// Social sharing utilities for marketplace listings

export interface ShareOptions {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
}

export function shareOnFacebook(options: ShareOptions): void {
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(options.url)}`;
  window.open(facebookUrl, "_blank", "width=600,height=400");
}

export function shareOnTwitter(options: ShareOptions): void {
  const text = `${options.title} - ${options.description}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(options.url)}`;
  window.open(twitterUrl, "_blank", "width=600,height=400");
}

export function shareOnWhatsApp(options: ShareOptions): void {
  const text = `${options.title}\n${options.description}\n${options.url}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(whatsappUrl, "_blank");
}

export function shareOnLinkedIn(options: ShareOptions): void {
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(options.url)}`;
  window.open(linkedinUrl, "_blank", "width=600,height=400");
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function shareViaEmail(options: ShareOptions): void {
  const subject = encodeURIComponent(options.title);
  const body = encodeURIComponent(`${options.description}\n\n${options.url}`);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

export const SHARE_PLATFORMS = [
  { name: "Facebook", icon: "facebook", action: shareOnFacebook },
  { name: "Twitter", icon: "twitter", action: shareOnTwitter },
  { name: "WhatsApp", icon: "whatsapp", action: shareOnWhatsApp },
  { name: "LinkedIn", icon: "linkedin", action: shareOnLinkedIn },
  { name: "Email", icon: "mail", action: shareViaEmail },
] as const;
