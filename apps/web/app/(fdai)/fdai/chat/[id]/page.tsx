import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { Chat } from '@/app/(fdai)/fdai/components/chat';
import { DEFAULT_MODEL_NAME, models } from '@/app/(fdai)/fdai/lib/ai/models';
import { getChatById, getMessagesByChatId } from '@/app/(fdai)/fdai/lib/db/queries';
import { convertToUIMessages } from '@/app/(fdai)/fdai/lib/utils';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

  const session = await getServerSession(authOptions)

  if (chat.visibility === 'private') {
    if (!session || !session.user) {
      return notFound();
    }

    if (session.user.id !== chat.userId) {
      return notFound();
    }
  }

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('model-id')?.value;
  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

  return (
    <Chat
      id={chat.id}
      initialMessages={convertToUIMessages(messagesFromDb)}
      selectedModelId={selectedModelId}
      selectedVisibilityType={chat.visibility}
      isReadonly={session?.user?.id !== chat.userId}
    />
  );
}
