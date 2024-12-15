import { cookies } from 'next/headers';

import { Chat } from '@/app/(fdai)/fdai/components/chat';
import { DEFAULT_MODEL_NAME, models } from '@/app/(fdai)/fdai/lib/ai/models';
import { generateUUID } from '@/app/(fdai)/fdai/lib/utils';

export default async function Page() {
  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('model-id')?.value;

  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

  return (
    <Chat
      key={id}
      id={id}
      initialMessages={[]}
      selectedModelId={selectedModelId}
      selectedVisibilityType="private"
      isReadonly={false}
    />
  );
}
