import { youtubeId } from "@/lib/utils";
export default function VideoPlayer({ url, title }: { url: string; title: string }) {
  const yt = youtubeId(url);
  if (yt)
    return (
      <iframe
        className="aspect-video w-full rounded-xl bg-black"
        src={`https://www.youtube-nocookie.com/embed/${yt}`}
        title={title}
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  return <video className="aspect-video w-full rounded-xl bg-black" src={url} controls preload="metadata" />;
}
