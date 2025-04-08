import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { CatalogService } from "@/services/catalog";

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { methodSelected, sentParams } = await request.json();

    if (methodSelected === 'getListingById') {
        const listing = await CatalogService.getListingById(sentParams.listingId);
        return NextResponse.json(listing);
    }

    if (methodSelected === 'getAvailableBrands') {
        const brands = await CatalogService.getAvailableBrands();
        return NextResponse.json(brands);
    }

    if (methodSelected === 'searchListings') {
        const result = await CatalogService.searchListings(sentParams.filters, sentParams.page, sentParams.pageSize, sentParams.sort);
        return NextResponse.json(result);
    }
    

    return NextResponse.json({ error: "Invalid method" }, { status: 400 });
    
    
}