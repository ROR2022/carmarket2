import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { AdminService } from "@/services/admin";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      //return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      console.warn("Unauthorized access attempt to admin API");
    }

    const { methodSelected, sentParams } = await request.json();

    if (methodSelected === "getListingsForReview") {
      const { filters } = sentParams;
      const listings = await AdminService.getListingsForReview(filters);
      return NextResponse.json({ listings });
    }

    if (methodSelected === "approveListing") {
      const { listingId, notes } = sentParams;
      await AdminService.approveListing(listingId, notes);
      return NextResponse.json({ message: "Listing approved" });
    }

    if (methodSelected === "rejectListing") {
      const { listingId, notes } = sentParams;
      await AdminService.rejectListing(listingId, notes);
      return NextResponse.json({ message: "Listing rejected" });
    }

    if (methodSelected === "requestChanges") {
      const { listingId, notes } = sentParams;
      await AdminService.requestChanges(listingId, notes);
      return NextResponse.json({ message: "Changes requested" });
    }

    if (methodSelected === "getAdminStats") {
      const stats = await AdminService.getAdminStats();
      return NextResponse.json({ stats });
    }

    return NextResponse.json({ error: "Invalid method" }, { status: 400 });
  } catch (error) {
    console.error("Error in POST request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
