"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  if (!content) return null;

  return (
    <div className={`prose-sm max-w-none text-foreground leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-base sm:text-lg font-black text-foreground mt-4 mb-2 first:mt-0 tracking-tight" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-sm sm:text-base font-bold text-foreground mt-3.5 mb-1.5 first:mt-0 tracking-tight" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-xs sm:text-sm font-bold text-foreground mt-3 mb-1 first:mt-0" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="my-1.5 leading-relaxed text-xs sm:text-[13px] text-foreground/90" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-foreground" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-foreground/95" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-5 my-2 space-y-1.5 text-xs sm:text-[13px]" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-5 my-2 space-y-1.5 text-xs sm:text-[13px]" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-relaxed pl-0.5 marker:text-rose-500" {...props} />
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-3.5 border-t border-border/80" {...props} />
          ),
          code: ({ node, inline, ...props }: any) => {
            if (inline) {
              return (
                <code
                  className="px-1.5 py-0.5 mx-0.5 rounded-md bg-secondary/80 text-foreground font-mono text-[11px] border border-border/60"
                  {...props}
                />
              );
            }
            return (
              <code
                className="block p-3 rounded-xl bg-secondary/80 text-foreground font-mono text-[11px] overflow-x-auto border border-border/60 my-2"
                {...props}
              />
            );
          },
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-2 border-rose-500 pl-3 my-2.5 italic text-muted-foreground bg-rose-500/5 py-1 rounded-r-lg"
              {...props}
            />
          ),
          a: ({ node, ...props }) => (
            <a
              target="_blank"
              rel="noopener noreferrer"
              className="text-rose-500 hover:text-rose-600 underline font-medium transition"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
