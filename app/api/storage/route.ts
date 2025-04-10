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
        console.log(`Storage API: Method ${methodSelected} called with params:`, sentParams);

        if (methodSelected === 'saveListingImages'){
            const { editListingId, uploadedImages } = sentParams;
            
            if (!editListingId) {
                console.error("Error: Missing listing ID in saveListingImages request");
                return NextResponse.json(
                    { error: "Missing listing ID" }, 
                    { status: 400 }
                );
            }
            
            console.log(`Storage API: Saving images for listing ID: ${editListingId}`);
            await StorageService.saveListingImages(editListingId, uploadedImages);
            return NextResponse.json({ message: "Images saved successfully" });
        }

        if (methodSelected === 'saveListingDocuments'){
            const { editListingId, uploadedDocuments } = sentParams;
            
            if (!editListingId) {
                console.error("Error: Missing listing ID in saveListingDocuments request");
                return NextResponse.json(
                    { error: "Missing listing ID" }, 
                    { status: 400 }
                );
            }
            
            console.log(`Storage API: Saving documents for listing ID: ${editListingId}`);
            await StorageService.saveListingDocuments(editListingId, uploadedDocuments);
            return NextResponse.json({ message: "Documents saved successfully" });
        }

        return NextResponse.json(
            { error: "Method not supported" }, 
            { status: 400 }
        );
    } catch (error) {
        console.error("Error in storage API:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}