"use client"

import React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import s from "./styles.module.css"

type TabsProps = React.ComponentProps<typeof TabsPrimitive.Root>

export function Tabs(props: TabsProps) {
  return <TabsPrimitive.Root {...props} />
}

type TabsListProps = React.ComponentProps<typeof TabsPrimitive.List>

export function TabsList({ className, ...props }: TabsListProps) {
  return (
    <TabsPrimitive.List className={`${s.list} ${className || ""}`} {...props} />
  )
}

type TabsTriggerProps = React.ComponentProps<typeof TabsPrimitive.Trigger>

export function TabsTrigger({ className, ...props }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={`${s.trigger} ${className || ""}`}
      {...props}
    />
  )
}

type TabsContentProps = React.ComponentProps<typeof TabsPrimitive.Content>

export function TabsContent({ className, ...props }: TabsContentProps) {
  return (
    <TabsPrimitive.Content
      className={`${s.content} ${className || ""}`}
      {...props}
    />
  )
}
