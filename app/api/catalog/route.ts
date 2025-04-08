import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { CatalogService } from "@/services/catalog";

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        //return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        console.warn("Unauthorized access attempt to catalog API");
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
        const tempFilters:any = {};
        const { filters } = sentParams;
        if (filters.brand && filters.brand.length > 0 && filters.brand[0] !== '') {
            tempFilters.brand = filters.brand;
        }
        if (filters.category && filters.category.length > 0 && filters.category[0] !== '') {
            tempFilters.category = filters.category;
        }
        if (filters.minPrice && filters.minPrice > 0) {
            tempFilters.minPrice = filters.minPrice;
        }
        if (filters.maxPrice && filters.maxPrice > 0) {
            tempFilters.maxPrice = filters.maxPrice;
        }
        if (filters.searchTerm && filters.searchTerm !== '') {
            tempFilters.searchTerm = filters.searchTerm;
        }

        const result = await CatalogService.searchListings(tempFilters, sentParams.page, sentParams.pageSize, sentParams.sort);
        return NextResponse.json(result);
    }
    

    return NextResponse.json({ error: "Invalid method" }, { status: 400 });
    
    
}