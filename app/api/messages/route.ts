import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { MessageService } from "@/services/message";

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { methodSelected, sentParams } = await request.json();

    if (methodSelected === 'sendContactMessage') {
        const message = await MessageService
        .sendContactMessage(
            sentParams.listingId, 
            sentParams.sellerId, 
            sentParams.message, 
            user.id
        );
        return NextResponse.json(message);
    }

    if (methodSelected === 'replyToMessage') {
        const message = await MessageService.replyToMessage(
            sentParams.originalMessageId, 
            sentParams.replyData, 
            user.id);
        return NextResponse.json(message);
    }

    if (methodSelected === 'getUnreadMessageCount') {
        const count = await MessageService.getUnreadMessageCount(sentParams.userId);
        return NextResponse.json({ count });
    }

    if (methodSelected === 'getReceivedMessages') {
        const messages = await MessageService.getReceivedMessages(sentParams.userId);
        return NextResponse.json(messages);
    }

    if (methodSelected === 'getSentMessages') {
        const messages = await MessageService.getSentMessages(sentParams.userId);
        return NextResponse.json(messages);
    }

    if (methodSelected === 'getArchivedMessages') {
        const messages = await MessageService.getArchivedMessages(sentParams.userId);
        return NextResponse.json(messages);
    }
    
    if (methodSelected === 'getConversations') {
        const conversations = await MessageService.getConversations(sentParams.userId);
        return NextResponse.json(conversations);
    }

    if (methodSelected === 'archiveMessage') {
        const message = await MessageService.archiveMessage(sentParams.messageId);
        return NextResponse.json(message);
    }

    if (methodSelected === 'unarchiveMessage') {
        const message = await MessageService.unarchiveMessage(sentParams.messageId);
        return NextResponse.json(message);
    }
    
    if (methodSelected === 'deleteMessage') {
        const message = await MessageService.deleteMessage(sentParams.messageId, sentParams.deleteRelated);
        return NextResponse.json(message);
    }
    
    if (methodSelected === 'markAsRead') {
        const message = await MessageService.markAsRead(sentParams.messageId);
        return NextResponse.json(message);
    }

    if (methodSelected === 'markAsUnread') {
        const message = await MessageService.markAsUnread(sentParams.messageId);
        return NextResponse.json(message);
    }

    if (methodSelected === 'getMessageById') {
        const message = await MessageService.getMessageById(sentParams.messageId);
        return NextResponse.json(message);
    }

    if (methodSelected === 'getMessageThread') {
        const thread = await MessageService.getMessageThread(sentParams.messageId, user.id);
        return NextResponse.json(thread);
    }

    
    return NextResponse.json({ error: "Invalid method" }, { status: 400 });
}