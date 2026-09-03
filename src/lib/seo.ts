import { useEffect } from "react";
import { config } from "./config";

const SITE_URL = "https://movix.fr";

function upsertMeta(name: string, content: string): () => void {
  let tag = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  const created = !tag;
  if (!tag) {
    tag = document.createElement("meta");
    tag.name = name;
    document.head.appendChild(tag);
  }
  const previous = tag.content;
  tag.content = content;
  return () => {
    const current = document.querySelector<HTMLMetaElement>(
      `meta[name="${name}"]`
    );
    if (!current) return;
    if (created) current.remove();
    else current.content = previous;
  };
}

export function setMetaDescription(content: string): () => void {
  return upsertMeta("description", content);
}

export function setRobotsNoindex(): () => void {
  return upsertMeta("robots", "noindex, nofollow");
}

export function setCanonical(path: string): () => void {
  if (config.appEnv !== "prod") return () => {};
  let tag = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  const created = !tag;
  if (!tag) {
    tag = document.createElement("link");
    tag.rel = "canonical";
    document.head.appendChild(tag);
  }
  const previous = tag.href;
  tag.href = `${SITE_URL}${path}`;
  return () => {
    const current = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]'
    );
    if (!current) return;
    if (created) current.remove();
    else current.href = previous;
  };
}

export function setJsonLd(id: string, data: unknown): () => void {
  const scriptId = `ld-${id}`;
  document.getElementById(scriptId)?.remove();
  const tag = document.createElement("script");
  tag.type = "application/ld+json";
  tag.id = scriptId;
  tag.text = JSON.stringify(data);
  document.head.appendChild(tag);
  return () => {
    document.getElementById(scriptId)?.remove();
  };
}

interface PageSeo {
  title: string;
  description: string;
  path: string;
}

export function usePageSeo({ title, description, path }: PageSeo) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    const restoreDescription = setMetaDescription(description);
    const restoreCanonical = setCanonical(path);
    return () => {
      document.title = previousTitle;
      restoreDescription();
      restoreCanonical();
    };
  }, [title, description, path]);
}
