import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getChatsByUserId } from '@/app/(fdai)/fdai/lib/db/queries';

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return Response.json('Unauthorized!', { status: 401 });
  }

  // biome-ignore lint: Forbidden non-null assertion.
  const chats = await getChatsByUserId({ id: session.user.id! });
  return Response.json(chats);
}
