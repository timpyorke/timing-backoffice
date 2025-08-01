import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing. Make sure to set them in your .env file.")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Simple public upload function
export const uploadImage = async (file: File) => {
  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `public/${fileName}`;

  // Upload to public bucket
  const { error } = await supabase.storage
    .from('public-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('public-images')
    .getPublicUrl(filePath);

  return publicUrl;
};
