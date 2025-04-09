import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { ValuationService } from "@/services/valuations";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.warn("Unauthorized access attempt to valuation API");
            //return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { methodSelected, sentParams } = await request.json();

        if (methodSelected === 'getValuation') {
            const { valuationInput } = sentParams;
            const valuationResult = await ValuationService.getValuation(valuationInput);
            return NextResponse.json(valuationResult);
        }

        return NextResponse.json({ error: "Invalid method" }, { status: 400 });
    } catch (error) {
        console.error("Error in valuation API:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}