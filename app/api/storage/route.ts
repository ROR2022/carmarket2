import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { StorageService } from "@/services/storage";


export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.warn("Unauthorized access attempt to catalog API");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { methodSelected, sentParams } = await request.json();

    if (methodSelected === 'saveListingImages'){
        const { editListingId, uploadedImages } = sentParams;
        await StorageService.saveListingImages(editListingId, uploadedImages)
        return NextResponse.json({ message: "Images saved successfully" });
    }

    if (methodSelected === 'saveListingDocuments'){
        const { editListingId, uploadedDocuments } = sentParams;
        await StorageService.saveListingDocuments(editListingId, uploadedDocuments)
        return NextResponse.json({ message: "Documents saved successfully" });
    }

    
        
    } catch (error) {
        console.error("Error in storage API:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}