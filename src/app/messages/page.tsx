import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ChatComponent from '@/components/ChatComponent';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MessageSquare, ShieldCheck, Lock, ArrowLeft } from 'lucide-react';

interface MessagesPageProps {
  searchParams: {
    conversationId?: string;
  };
}

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    redirect('/login');
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ customerId: currentUser.id }, { companionUserId: currentUser.id }],
    },
    include: {
      customer: {
        select: {
          id: true,
          email: true,
          customerProfile: { select: { name: true, displayAvatar: true } },
        },
      },
      companionUser: {
        select: {
          id: true,
          email: true,
          companionProfile: { select: { displayName: true, profilePhoto: true } },
        },
      },
      booking: {
        select: {
          id: true,
          bookingNumber: true,
          date: true,
          startTime: true,
          status: true,
          activity: { select: { name: true } },
        },
      },
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { lastMessageAt: 'desc' },
  });

  const activeConversationId = searchParams.conversationId || (conversations[0]?.id ?? '');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header currentUser={currentUser} />

      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8 w-full flex-1">
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl overflow-hidden min-h-[550px] sm:min-h-[600px] flex flex-col md:flex-row">
          
          {/* LEFT: CONVERSATIONS LIST (Hidden on mobile if conversation selected, shown on md+) */}
          <div
            className={`w-full md:w-80 border-r border-slate-200 bg-slate-50/50 flex-col shrink-0 ${
              searchParams.conversationId ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div className="p-4 border-b border-slate-200">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-brand-600" /> In-Platform Messages
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Secure, monitored communications</p>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[600px]">
              {conversations.length > 0 ? (
                conversations.map((conv) => {
                  const otherPartyName =
                    currentUser.id === conv.customerId
                      ? conv.companionUser.companionProfile?.displayName || 'Companion'
                      : conv.customer.customerProfile?.name || 'Client';

                  const isActive = conv.id === activeConversationId;

                  return (
                    <Link
                      key={conv.id}
                      href={`/messages?conversationId=${conv.id}`}
                      scroll={false}
                      className={`block p-4 hover:bg-slate-100 transition-colors ${
                        isActive ? 'bg-white border-l-4 border-brand-600 font-medium' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900 truncate">{otherPartyName}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {conv.booking && (
                        <span className="inline-block text-[10px] font-semibold bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full mb-1">
                          {conv.booking.activity.name} (#{conv.booking.bookingNumber})
                        </span>
                      )}
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {conv.messages[0]?.text || 'Start conversation...'}
                      </p>
                    </Link>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  No active conversations found. Conversations are created automatically upon booking confirmation.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: CHAT THREAD (Shown on mobile if conversation selected, or on md+) */}
          <div
            className={`flex-1 flex-col bg-white ${
              searchParams.conversationId ? 'flex' : 'hidden md:flex'
            }`}
          >
            {/* Mobile Top Navigation Back Bar */}
            {searchParams.conversationId && (
              <div className="md:hidden bg-slate-100 p-2.5 border-b border-slate-200 flex items-center gap-2">
                <Link
                  href="/messages"
                  scroll={false}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4 text-brand-600" /> Back to All Messages
                </Link>
              </div>
            )}

            {activeConversationId ? (
              <ChatComponent conversationId={activeConversationId} currentUserId={currentUser.id} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <Lock className="w-10 h-10 mb-3 text-slate-300" />
                <h3 className="font-bold text-slate-800 text-sm">Select a Conversation</h3>
                <p className="text-xs max-w-xs mt-1">Keep all communication inside the platform for safety and privacy.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

