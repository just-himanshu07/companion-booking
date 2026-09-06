'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';

interface StartChatButtonProps {
  companionUserId?: string;
  companionProfileId?: string;
  companionName?: string;
  className?: string;
}

export default function StartChatButton({
  companionUserId,
  companionProfileId,
  companionName = 'Companion',
  className = 'w-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2',
}: StartChatButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStartChat = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);

    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companionUserId,
          companionProfileId,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        router.push('/login');
        return;
      }

      if (!res.ok) {
        alert(data.error || 'Failed to start conversation');
        return;
      }

      router.push(`/messages?conversationId=${data.conversationId}`);
    } catch (err) {
      alert('Error connecting to chat service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleStartChat} disabled={loading} className={className}>
      <MessageSquare className="w-4 h-4" />
      {loading ? 'Opening Chat...' : `Message ${companionName}`}
    </button>
  );
}

