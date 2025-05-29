
import { useEffect, useState } from "react";
import background_gallery from "@/assets/background_gallery.png";
import { 
  AlertDialog, AlertDialogContent, AlertDialogHeader, 
  AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, 
  AlertDialogCancel 
} from "@/components/ui/alert-dialog";
import { Input } from "./components/ui/input";
import { Calendar } from "./components/ui/calendar";
import { Card, CardContent } from "./components/ui/card";
import { Carousel, CarouselItem, CarouselPrevious,CarouselNext, CarouselContent } from "./components/ui/carousel";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover";
import { Button } from "./components/ui/button";
import { CalendarIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast"

// Tipi
interface ImageData {
  id: number;
  filename: string;
  category: string;
  username: string;
  upload_date: string;
  image_url: string;
}

// Funzione per il refresh del token
export const refreshToken = async (): Promise<string | null> => {
  const refresh = localStorage.getItem("refreshToken");
  if (!refresh) return null;

  try {
    const res = await fetch("http://localhost:5000/api/refresh", {
      method: "POST",
      headers: { Authorization: `Bearer ${refresh}` },
    });

    const data = await res.json();
    if (res.ok && data.access_token) {
      localStorage.setItem("jwtToken", data.access_token);
      return data.access_token;
    }
  } catch (err) {
    console.error("Errore refresh:", err);
  }

  return null;
};

const ImageGallery = () => {
  const navigate=useNavigate()
  const [images, setImages] = useState<ImageData[]>([]);
  const [filteredImages, setFilteredImages] = useState<ImageData[]>([]);

  const [categoryFilter, setCategoryFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);

  const [tokenExpired, setTokenExpired] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");

    fetch("http://localhost:5000/api/images", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async(res) => {
        if (res.status === 401) {
          setTokenExpired(true);
          return [];
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setImages(data);
          setFilteredImages(data);
          toast.success("Immagini caricate con successo!")
        } else {
          console.error("La risposta non è un array:", data);
          setImages([]);
          setFilteredImages([]);
          toast.error("Errore ")
        }
      })
      .catch((err) => {
        console.error("Errore fetch immagini:", err);
        setImages([]);
        setFilteredImages([]);
        toast.error("Errore durante il caricamento delle immagini")
      });
  }, []);

  // Applica i filtri
  useEffect(() => {
    let filtered = [...images];

    if (categoryFilter) {
      filtered = filtered.filter((img) => img.category.toLocaleLowerCase() === categoryFilter.toLocaleLowerCase());
    }

    if (userFilter) {
      filtered = filtered.filter((img) => img.username === userFilter);
    }

    if (dateFilter) {
      const formattedDate = format(dateFilter, "yyyy-MM-dd");
      filtered = filtered.filter((img) => img.upload_date === formattedDate);
    }

    setFilteredImages(filtered);
  }, [categoryFilter, userFilter, dateFilter, images]);

  return (
    <main
      className="w-full h-screen bg-cover bg-center flex relative"
      style={{
        backgroundImage: `url(${background_gallery})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      {/* Area di attivazione sidebar */}
      <div
        onMouseEnter={() => setShowSidebar(true)}
        className="fixed top-0 left-0 h-full w-4 z-50"
      />

      {/* Sidebar */}
      <div
        onMouseLeave={() => setShowSidebar(false)}
        className={`fixed top-0 left-0 h-full bg-white/60 backdrop-blur-sm shadow-lg transition-transform duration-300 z-40 ${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        } w-64`}
      >
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center mb-6">
            <img
              src="https://c.animaapp.com/m9mxsnmi2Oh80t/img/frame-5.png"
              alt="Logo"
              className="w-8 h-8 mr-2"
            />
            <span className="text-l font-semibold text-black">Federico II</span>
          </div>

          <nav className="flex-1 flex flex-col justify-center items-center space-y-4">
            <a href="/upload" className="text-black text-sm font-semibold">Carica Immagine</a>
            <a href="/search" className="text-black text-sm font-semibold">Ricerca</a>
            <a href="/dashboard" className="text-black text-sm font-semibold">Dashboard</a>
          </nav>
        </div>
      </div>

      {/* Contenuto centrale */}
      <div className="p-8 max-w-2xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-6 text-center text-black">Visualizza Database</h1>

        <Card className="bg-gray-100 rounded-lg shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1">Categoria</label>
                <Input
                  type="text"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  placeholder="Filtra per categoria"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <Input
                  type="text"
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  placeholder="Filtra per username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Data di caricamento</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[240px] text-left font-normal">
                      {dateFilter ? format(dateFilter, "PPP") : "Scegli Data"}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFilter}
                      onSelect={(date) => setDateFilter(date ?? undefined)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Carousel delle immagini filtrate */}
        <Carousel className="w-full max-w-4xl mx-auto">
        <CarouselContent className="-ml-1">
            {filteredImages.map((image) => (
            <CarouselItem
                key={image.id}
                className="pl-1 md:basis-1/2 lg:basis-1/3"
            >
                <div className="p-1">
                <Card>
                    <CardContent className="flex aspect-square items-center justify-center p-0 overflow-hidden">
                    <img
                        src={image.image_url}
                        alt={image.filename}
                        className="w-full h-full object-cover"
                    />
                    </CardContent>
                </Card>
                </div>
            </CarouselItem>
            ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
        </Carousel>

      </div>

      {/* Dialog token scaduto */}
      <AlertDialog open={tokenExpired} onOpenChange={setTokenExpired}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sessione scaduta</AlertDialogTitle>
            <AlertDialogDescription>
              La tua sessione è scaduta, effettua di nuovo il login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => navigate("/login")}>
              Chiudi
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

export default ImageGallery;
