"use client"

import React from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"

import Heading from "@components/heading"
import Text from "@components/text"

import s from "./styles.module.css"

/**
 * Headings and paragraphs compose the shared typography components so agent
 * prose matches the rest of the app. Everything else is styled from the wrapper
 * class, which keeps inline and fenced code distinguishable without guessing at
 * the parent element.
 */
const components: Components = {
  h1: ({ children }) => (
    <Heading level="h1" display="h4">
      {children}
    </Heading>
  ),
  h2: ({ children }) => (
    <Heading level="h2" display="h5">
      {children}
    </Heading>
  ),
  h3: ({ children }) => (
    <Heading level="h3" display="h6">
      {children}
    </Heading>
  ),
  h4: ({ children }) => (
    <Heading level="h4" display="h6">
      {children}
    </Heading>
  ),
  h5: ({ children }) => (
    <Heading level="h5" display="h6">
      {children}
    </Heading>
  ),
  h6: ({ children }) => (
    <Heading level="h6" display="h6">
      {children}
    </Heading>
  ),
  p: ({ children }) => <Text size="sm">{children}</Text>,
}

/**
 * Renders agent-authored markdown. Raw HTML is not rendered: `react-markdown`
 * only emits HTML when `rehype-raw` is added, and it is deliberately absent.
 */
export default function Markdown({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  return (
    <div className={className ? `${s.markdown} ${className}` : s.markdown}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
