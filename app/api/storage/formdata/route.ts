import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { StorageService } from "@/services/storage";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn("Unauthorized access attempt to catalog API");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // en este caso se recibe un FormData
    const formData = await request.formData();
    // extraer las images, el userId y el listingId
    const images = formData.getAll("images") as File[];
    const userId = formData.get("userId") as string;
    const listingId = formData.get("listingId") as string;
    const methodSelected = formData.get("methodSelected") as string;
    const documents = formData.getAll("documents") as File[];

    if (methodSelected === "uploadListingImages") {
      // ahora enviar todo al servicio de Storage uploadListingImages
      const uploadedImages = await StorageService.uploadListingImages(
        images,
        userId,
        listingId
      );
      // devolver la respuesta
      return NextResponse.json(uploadedImages);
    }

    if (methodSelected === "uploadListingDocuments"){
        const uploadedDocuments = await StorageService.uploadListingDocuments(
            documents,
            userId,
            listingId
        );
        // devolver la respuesta
        return NextResponse.json(uploadedDocuments);
    }


  } catch (error) {
    console.error("Error creating supabase client:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
