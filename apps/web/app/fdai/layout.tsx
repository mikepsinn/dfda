import { cookies } from 'next/headers';

import { AppSidebar } from '@/app/fdai/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/app/fdai/components/ui/sidebar';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';



export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions)
  const [cookieStore] = await Promise.all([cookies()]);
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AppSidebar user={session?.user} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
