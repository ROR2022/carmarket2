import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { NotificationService } from "@/services/notification";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await NotificationService.getAllNotifications(user.id, 10);

  return NextResponse.json(notifications);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { methodSelected, sentParams } = await request.json();

  if (methodSelected === 'getNotifications') {
    const notifications = await NotificationService.getAllNotifications(user.id, 10);
    return NextResponse.json(notifications);
  }

  if (methodSelected === 'markAsRead') {
    const { notificationId } = sentParams;
    await NotificationService.markAsRead(notificationId);
    return NextResponse.json({ message: "Notification marked as read" });
  }

  if (methodSelected === 'markAllAsRead') {
    await NotificationService.markAllAsRead(user.id);
    return NextResponse.json({ message: "All notifications marked as read" });
  }
  
  
  return NextResponse.json({ error: "Invalid method" }, { status: 400 });
}
