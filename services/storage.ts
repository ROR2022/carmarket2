import { createClient } from '@/utils/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export interface StorageFile {
  url: string;
  path: string;
  name: string;
}

export const StorageService = {
  /**
   * Sube una imagen al bucket de imágenes de vehículos
   * @param file Archivo a subir
   * @param userId ID del usuario
   * @param listingId ID del anuncio (opcional)
   * @returns Información del archivo subido
   */
  async uploadVehicleImage(file: File, userId: string, listingId?: string): Promise<StorageFile> {
    const supabase = createClient();
    
    // Generar un ID único para el archivo
    const fileId = uuidv4();
    const fileExt = file.name.split('.').pop();
    let filePath = `${userId}/${fileId}.${fileExt}`;
    
    // Si se proporciona un ID de anuncio, incluirlo en la ruta
    if (listingId) {
      filePath = `${userId}/${listingId}/${fileId}.${fileExt}`;
    }
    
    // Subir el archivo
    const { data, error } = await supabase.storage
      .from('vehicle-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (error) {
      console.error('Error uploading image:', error);
      throw new Error('Error al subir la imagen: ' + error.message);
    }
    
    // Generar URL pública
    const { data: publicURL } = supabase.storage
      .from('vehicle-images')
      .getPublicUrl(data.path);
    
    return {
      url: publicURL.publicUrl,
      path: data.path,
      name: file.name
    };
  },
  
  /**
   * Sube un documento al bucket de documentos de vehículos
   * @param file Archivo a subir
   * @param userId ID del usuario
   * @param listingId ID del anuncio
   * @returns Información del archivo subido
   */
  async uploadVehicleDocument(file: File, userId: string, listingId: string): Promise<StorageFile> {
    const supabase = createClient();
    
    // Generar un ID único para el archivo
    const fileId = uuidv4();
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${listingId}/${fileId}.${fileExt}`;
    
    // Subir el archivo
    const { data, error } = await supabase.storage
      .from('vehicle-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (error) {
      console.error('Error uploading document:', error);
      throw new Error('Error al subir el documento: ' + error.message);
    }
    
    // Generar URL firmada (privada)
    const { data: signedURL } = await supabase.storage
      .from('vehicle-documents')
      .createSignedUrl(data.path, 60 * 60); // URL válida por 1 hora
    
    if (!signedURL) {
      throw new Error('Error al generar URL firmada para el documento');
    }
    
    return {
      url: signedURL.signedUrl,
      path: data.path,
      name: file.name
    };
  },
  
  /**
   * Sube múltiples imágenes para un anuncio
   * @param files Lista de archivos a subir
   * @param userId ID del usuario
   * @param listingId ID del anuncio
   * @returns Lista de información de archivos subidos
   */
  async uploadListingImages(files: File[], userId: string, listingId: string): Promise<StorageFile[]> {
    const results: StorageFile[] = [];
    
    // Subir cada archivo secuencialmente
    for (const file of files) {
      const result = await this.uploadVehicleImage(file, userId, listingId);
      results.push(result);
    }
    
    return results;
  },
  
  /**
   * Sube múltiples documentos para un anuncio
   * @param files Lista de archivos a subir
   * @param userId ID del usuario
   * @param listingId ID del anuncio
   * @returns Lista de información de archivos subidos
   */
  async uploadListingDocuments(files: File[], userId: string, listingId: string): Promise<StorageFile[]> {
    const results: StorageFile[] = [];
    
    // Subir cada archivo secuencialmente
    for (const file of files) {
      const result = await this.uploadVehicleDocument(file, userId, listingId);
      results.push(result);
    }
    
    return results;
  },
  
  /**
   * Guarda las imágenes cargadas en la base de datos
   * @param listingId ID del anuncio
   * @param files Lista de información de archivos
   * @returns void
   */
  async saveListingImages(listingId: string, files: StorageFile[]): Promise<void> {
    const supabase = createClient();
    
    // Preparar los datos para insertar
    const imageData = files.map((file, index) => ({
      listing_id: listingId,
      url: file.url,
      storage_path: file.path,
      display_order: index,
      is_primary: index === 0 // La primera imagen es la principal
    }));
    
    // Insertar en la base de datos
    const { error } = await supabase
      .from('listing_images')
      .insert(imageData);
    
    if (error) {
      console.error('Error saving listing images:', error);
      throw new Error('Error al guardar las imágenes del anuncio: ' + error.message);
    }
  },
  
  /**
   * Guarda los documentos cargados en la base de datos
   * @param listingId ID del anuncio
   * @param files Lista de información de archivos
   * @param documentTypes Tipos de documentos (opcional)
   * @returns void
   */
  async saveListingDocuments(
    listingId: string, 
    files: StorageFile[], 
    documentTypes: string[] = []
  ): Promise<void> {
    const supabase = createClient();
    
    // Preparar los datos para insertar
    const documentData = files.map((file, index) => ({
      listing_id: listingId,
      url: file.url,
      storage_path: file.path,
      file_name: file.name,
      document_type: documentTypes[index] || 'other'
    }));
    
    // Insertar en la base de datos
    const { error } = await supabase
      .from('listing_documents')
      .insert(documentData);
    
    if (error) {
      console.error('Error saving listing documents:', error);
      throw new Error('Error al guardar los documentos del anuncio: ' + error.message);
    }
  },
  
  /**
   * Elimina un archivo del almacenamiento
   * @param path Ruta del archivo
   * @param bucket Nombre del bucket
   * @returns void
   */
  async deleteFile(path: string, bucket: 'vehicle-images' | 'vehicle-documents'): Promise<void> {
    const supabase = createClient();
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) {
      console.error(`Error deleting file from ${bucket}:`, error);
      throw new Error(`Error al eliminar el archivo: ${error.message}`);
    }
  },
  
  /**
   * Elimina una imagen de un anuncio
   * @param imageId ID de la imagen
   * @param userId ID del usuario
   * @returns void
   */
  async deleteListingImage(imageId: string, userId: string): Promise<void> {
    const supabase = createClient();
    
    // Obtener la ruta de almacenamiento y verificar propiedad
    const { data: image, error: fetchError } = await supabase
      .from('listing_images')
      .select('storage_path, listing_id')
      .eq('id', imageId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching image:', fetchError);
      throw new Error('Error al obtener la imagen: ' + fetchError.message);
    }
    
    // Verificar propiedad
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('seller_id')
      .eq('id', image.listing_id)
      .single();
    
    if (listingError) {
      console.error('Error fetching listing:', listingError);
      throw new Error('Error al verificar la propiedad: ' + listingError.message);
    }
    
    if (listing.seller_id !== userId) {
      throw new Error('No tienes permiso para eliminar esta imagen');
    }
    
    // Eliminar la imagen de la base de datos
    const { error: deleteError } = await supabase
      .from('listing_images')
      .delete()
      .eq('id', imageId);
    
    if (deleteError) {
      console.error('Error deleting image from database:', deleteError);
      throw new Error('Error al eliminar la imagen de la base de datos: ' + deleteError.message);
    }
    
    // Eliminar el archivo del almacenamiento
    await this.deleteFile(image.storage_path, 'vehicle-images');
  }
}; 