"use client";

import { useEffect } from "react";
import { markConversationReadAction } from "../actions";

/** Marks the conversation read once it has been shown, not while the page is only being rendered. */
export default function MarkRead({ conversationKey, address }: { conversationKey: string; address: string }) {
  useEffect(() => {
    void markConversationReadAction(conversationKey, address);
  }, [conversationKey, address]);
  return null;
}
