import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { ListingService } from "@/services/listings";

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { methodSelected, sentParams } = await request.json();
    
    if (methodSelected === 'getListings') {
        const listings = await ListingService.getUserListings(user.id);
        return NextResponse.json(listings);
    }

    if (methodSelected === 'createListing') {
        const listing = await ListingService.createListing(sentParams.formData, user.id);
        return NextResponse.json(listing);
    }

    if (methodSelected === 'deleteListing') {
        await ListingService.deleteListing(sentParams.listingId, user.id);
        return NextResponse.json({ success: true, message: 'Listing deleted successfully' });
    }

    if (methodSelected === 'changeListingStatus') {
        const listing = await ListingService.changeListingStatus(sentParams.listingId, sentParams.newStatus, user.id);
        return NextResponse.json(listing);
    }

    if (methodSelected === 'toggleFeatured') {
        const listing = await ListingService.toggleFeatured(sentParams.listingId, sentParams.newFeaturedStatus, user.id);
        return NextResponse.json(listing);
    }

    if (methodSelected === 'getListingById') {
        const listing = await ListingService.getListingById(sentParams.listingId);
        return NextResponse.json(listing);
    }

    if (methodSelected === 'saveDraft') {
        const listing = await ListingService.saveDraft(sentParams.formData, user.id);
        return NextResponse.json(listing);
    }
    
    
    
    return NextResponse.json({ error: "Invalid method" }, { status: 400 });
}