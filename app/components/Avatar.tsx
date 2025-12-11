"use client";
import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase";
import Image from "next/image";
import Cropper from "react-easy-crop"; // La librairie de crop
import { getCroppedImg } from "../lib/canvasUtils"; // Notre utilitaire
import { toast } from "sonner"; // Les notifs jolies

export default function Avatar({ 
  uid, 
  url, 
  size, 
  onUpload 
}: { 
  uid: string, 
  url: string | null, 
  size: number, 
  onUpload: (url: string) => void 
}) {
  const supabase = createClient();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // États pour le crop
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (url) downloadImage(url);
  }, [url]);

  async function downloadImage(path: string) {
    try {
      const { data, error } = await supabase.storage.from("avatars").download(path);
      if (error) throw error;
      setAvatarUrl(URL.createObjectURL(data));
    } catch (error) {
      console.log("Erreur chargement image", error);
    }
  }

  // 1. L'utilisateur sélectionne un fichier -> On ouvre le modal de crop
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl as string);
      setIsModalOpen(true);
      // Reset input value pour pouvoir sélectionner le même fichier si besoin
      e.target.value = "";
    }
  };

  const readFile = (file: File) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(reader.result), false);
      reader.readAsDataURL(file);
    });
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  // 2. L'utilisateur valide le crop -> On upload
  const uploadAvatar = async () => {
    try {
      setUploading(true);
      setIsModalOpen(false); // Fermer le modal

      if (!imageSrc || !croppedAreaPixels) return;

      // On découpe l'image grâce à notre utilitaire
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      
      // On crée un nom de fichier unique
      const fileExt = "jpg";
      const filePath = `${uid}-${Math.random()}.${fileExt}`;

      // Upload vers Supabase
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, croppedImageBlob, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      onUpload(filePath);
      toast.success("Photo de profil mise à jour !");
      
    } catch (error: any) {
      toast.error("Erreur upload: " + error.message);
    } finally {
      setUploading(false);
      setImageSrc(null);
    }
  };

  return (
    <div>
      <div className="relative group w-fit mx-auto"> {/* Ajout de mx-auto pour centrer */}
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="Avatar"
            width={size}
            height={size}
            className="rounded-full object-cover border-4 border-slate-700 shadow-lg"
            style={{ height: size, width: size }}
          />
        ) : (
          <div 
            className="bg-slate-700 rounded-full flex items-center justify-center text-gray-400 font-bold border-4 border-slate-600"
            style={{ height: size, width: size }}
          >
            ?
          </div>
        )}

        {/* --- ZONE DE CLIC CORRIGÉE --- */}
        <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer backdrop-blur-sm z-10">
          <span className="text-xl">📷</span>
          <span className="text-white text-xs font-bold mt-1">
            {uploading ? "..." : "Modifier"}
          </span>
          
          {/* L'input est caché MAIS il est DANS le label, donc le clic marche à 100% */}
          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            disabled={uploading}
            className="hidden" // On utilise la classe Tailwind pour le cacher proprement
          />
        </label>
      </div>

      {/* --- MODAL DE RECADRAGE --- */}
      {isModalOpen && imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 w-full max-w-md p-6 rounded-2xl shadow-2xl border border-white/10">
            <h3 className="text-xl font-bold mb-4 text-white">Ajuster la photo</h3>
            
            {/* Zone de Crop */}
            <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden border border-gray-700 mb-4">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1} // Carré parfait
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            {/* Slider Zoom */}
            <div className="mb-6 px-2">
              <label className="text-xs text-gray-400 mb-1 block">Zoom</label>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Boutons */}
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-gray-300 rounded-lg hover:bg-slate-700 transition font-bold"
              >
                Annuler
              </button>
              <button 
                onClick={uploadAvatar}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-bold shadow-lg"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}