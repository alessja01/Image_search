import React, { useState } from "react";
import background_searchimage from "@/assets/background_searchimage.png";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";




export default function Search() {
  const [image, setImage] = useState<File | null>(null);
  const [filename, setFilename] = useState("");
  const [predictedCategory, setPredictedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: number; nome: string }[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [similarImages, setSimilarImages] = useState<any[]>([]);
  const [embedding, setEmbedding] = useState<number[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any | null>(null);
  const [successMessage, setSuccessMessage]= useState<string| null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setImage(file);
      setFilename(file.name);
      setError(null);
    } else {
      setError("Il file selezionato non è un'immagine.");
    }
  };

  const refreshToken = async (): Promise<string | null> => {
    const refresh = localStorage.getItem("refreshToken");
    if (!refresh) return null;
    try {
      const res = await fetch("http://localhost:5000/api/refresh", {
        method: "POST",
        headers: { Authorization: `Bearer ${refresh}` }
      });
      const data = await res.json();
      if (res.ok && data.access_token) {
        localStorage.setItem("jwtToken", data.access_token);
        return data.access_token;
      }
    } catch (err) {
      console.error("Errore nel refresh del token:", err);
    }
    return null;
  };

  const uploadSearchImage = async (token: string) => {
    const formData = new FormData();
    if (image) formData.append("image", image);
    const res = await fetch("http://localhost:5000/api/search-image", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    return res;
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!image) {
      setError("Per favore, carica un'immagine.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      let token = localStorage.getItem("jwtToken") || "";
      let res = await uploadSearchImage(token);
      let data = await res.json();
      if (res.status === 401 && data.message?.toLowerCase().includes("scaduto")) {
        const newToken = await refreshToken();
        if (newToken) {
          token = newToken;
          res = await uploadSearchImage(newToken);
          data = await res.json();
        } else {
          setTokenExpired(true);
          setIsLoading(false);
          return;
        }
      }
      if (!res.ok) {
        setError(data.message || "Errore nella ricerca dell'immagine.");
        setIsLoading(false);
        return;
      }
      setPredictedCategory(data.predicted_category);
      setCategories(Array.isArray(data.all_categories) ? data.all_categories : []);
      setSimilarImages(
        (data.result || []).sort((a: any, b: any) => b.similarity - a.similarity)
      );
      setEmbedding(data.embedding);
    } catch (err) {
      console.error("Errore nella ricerca:", err);
      setError("Errore di rete o di server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!embedding || !selectedCategoryId || !filename || !image) {
      setError("Seleziona una categoria valida.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("jwtToken") || "";
      const imageBase64= await fileToBase64(image);

      const res = await fetch("http://localhost:5000/api/confirm-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ embedding, category_id: selectedCategoryId, filename , image: imageBase64})
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 && data.message?.toLowerCase().includes("scaduto")) {
          const newToken = await refreshToken();
          if (newToken) return handleConfirm();
        }
        setError(data.message || "Errore nella conferma.");
        return;
      }
      setSuccessMessage("Categoria confermata con successo!");
    } catch (err) {
      console.error("Errore nella conferma:", err);
      setError("Errore di rete durante la conferma.");
    } finally {
      setIsLoading(false);
    }
  };


const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        const base64 = result.split(",")[1]; // rimuove header base64
        resolve(base64);
      } else {
        reject(new Error("Errore nella conversione del file in base64."));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};


  return (
    <main
      className="w-full h-screen bg-cover bg-center flex relative"
      style={{
        backgroundImage: `url(${background_searchimage})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >

      {/* Area di attivazione della sidebar */}
      <div
        onMouseEnter={() => setShowSidebar(true)}
        className="fixed top-0 left-0 h-full w-4 z-50"
      ></div>

      {/* Sidebar */}
      <div
        onMouseLeave={() => setShowSidebar(false)}
        className={`fixed top-0 left-0 h-full bg-white/60 backdrop-blur-sm shadow-lg transition-transform duration-300 z-40 ${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        } w-64`}
      >
        <div className="p-4 h-full flex flex-col">
          {/* logo in alto */}
          <div className="flex items-center mb-6">
            <img
              src="https://c.animaapp.com/m9mxsnmi2Oh80t/img/frame-5.png"
              alt="Logo"
              className="w-8 h-8 mr-2"
            />
            <span className="text-l font-semibold text-black">Federico II</span>
          </div>

            {/* voci centrale verticalmente */}
          <nav className="flex-1 flex flex-col justify-center items-center space-y-4">
            <a href="/gallery" className="text-black text-sm font-semibold">Visualizza Database</a>
            <a href="/upload" className="text-black text-sm font-semibold">Carica Immagine</a>
            <a href="/dashboard" className="text-black text-sm font-semibold">Dashboard</a>
          </nav>
        </div>
      </div>  

      {/* Upload */}
      <div className="p-8 max-w-5xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-6 text-center text-black">
          Carica un'immagine per cercare
        </h1>


        <Card className="bg-gray-100 rounded-lg shadow-lg">
          <CardContent className="p-10">
            <form onSubmit={handleSearch} className="space-y-7">
              <Input type="file" accept="image/*" onChange={handleImageChange} />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Progress /> : "Cerca immagine"}
              </Button>

              {error &&(
                <p className="text-red-600 text-sm">{error}</p>
              )}
            </form>
          </CardContent>
        </Card>

        {predictedCategory && (
          <div className="mt-6 space-y-3 text-black">
            <p className="text-lg font-semibold">
              Categoria predetta:{" "}
              <span className="text-blue-600">{predictedCategory}</span>
            </p>
            {similarImages.length > 0 && categories.length > 0 && (
              <p>
                Ho trovato <strong>{similarImages.length}</strong> immagini simili in{" "}
                <strong>{categories.length}</strong> categorie totali.
              </p>
            )}
            <Select onValueChange={(value) => setSelectedCategoryId(Number(value))}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Seleziona una categoria corretta (opzionale)" />
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(categories) && categories.length > 0 ? (
                categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.nome}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="-1" disabled>
                  Nessuna categoria disponibile
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {/* MOSTRA IL BOTTONE SOLO SE LA CATEGORIA SCELTA E' DIVERSA DA QUELLA PREDETTA */}
          {selectedCategoryId && 
            categories.find((cat) => cat.id === selectedCategoryId)?.nome !== predictedCategory &&(
              <Button onClick={handleConfirm} disabled={isLoading}>Conferma Categoria</Button>
            )}
          </div>
        )}

        {similarImages.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4 text-black">
              Risultati simili trovati ({similarImages.length}):
            </h3>

            <Table className="bg-white rounded shadow">
              <TableHeader>
                <TableRow>
                  <TableHead>Nome immagine</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Similarità</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {similarImages.map((img) => (
                  <TableRow key={img.id}>
                    <TableCell>{img.filename}</TableCell>
                    <TableCell>{img.category}</TableCell>
                    <TableCell className="text-right">{img.similarity}</TableCell>
                    <TableCell>
                      <Button variant="secondary" onClick={() => setSelectedImage(img)}>
                        Confronta
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {selectedImage && (
          <div className="mt-8 bg-white p-4 rounded shadow flex gap-6">
            <div>
              <h4 className="font-semibold mb-2">Immagine caricata</h4>
              <img
                src={image ? URL.createObjectURL(image) : ""}
                alt="Immagine caricata"
                className="rounded w-64"
              />
            </div>
            <div>
              <h4 className="font-semibold mb-2">Immagine selezionata</h4>
              <img
                src={selectedImage.image_url}
                alt={selectedImage.filename}
                className="rounded w-64"
              />
            </div>
          </div>
        )}

        {successMessage && <p className="text-green-600 text-sm mt-4">{successMessage}</p>}
      </div>

      <AlertDialog open={tokenExpired} onOpenChange={setTokenExpired}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sessione scaduta</AlertDialogTitle>
            <AlertDialogDescription>
              La tua sessione è scaduta, effettua di nuovo il login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTokenExpired(false)}>Chiudi</AlertDialogCancel>
            <AlertDialogAction onClick={() => window.location.href = "/login"}>
              Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
