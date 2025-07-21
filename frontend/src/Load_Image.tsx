import { useState, ChangeEvent, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUser } from "./UserContext";
import { 
  AlertDialog, AlertDialogContent, AlertDialogHeader, 
  AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, 
  AlertDialogCancel, AlertDialogAction 
} from "@/components/ui/alert-dialog";
import backgrounf_upimage from "@/assets/backgrounf_upimage.png";

const UploadImageForm = () => {
  const { user, token } = useUser();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [uploadDate, setUploadDate] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateMessage, setDuplicateMessage] = useState("");
  const [backendMessage, setBackendMessage] = useState<string>("");
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type.startsWith("image/")) {
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
        setFileName(selectedFile.name);
        setUploadDate(new Date().toLocaleDateString());
        setErrorMessage(null);
      } else {
        setErrorMessage("Il file selezionato non è un'immagine.");
      }
    }
  };

  const refreshToken = async (): Promise<string | null> => {
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!file || !user) {
      alert("SELEZIONA UN IMMAGINE");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("image", file);
    if (category.trim() !== "") {
      formData.append("category_name", category);
    }

    const tokenToUse = token || localStorage.getItem("jwtToken");

    const uploadImage = async (accessToken: string) => {
      return fetch("http://localhost:5000/api/upload-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
    };

    try {
      let response = await uploadImage(tokenToUse || "");
      let data = await response.json();

      if (response.status === 401 && data.message?.toLowerCase().includes("scaduto")) {
        const newToken = await refreshToken();
        if (newToken) {
          response = await uploadImage(newToken);
          data = await response.json();
        } else {
          setIsLoading(false);
          setTokenExpired(true);
          return;
        }
      }

      setIsLoading(false);

      if (!response.ok) {
        if (data.message?.includes("Vuoi crearla?")) {
          setBackendMessage(data.message);
          setShowDialog(true);
          setPendingFormData(formData);
        } else if (data.message?.toLowerCase().includes("hai già caricato") || data.message?.toLowerCase().includes("presente")) {
          setErrorMessage("Hai caricato già questa immagine.");
          setDuplicateMessage("Hai già caricato un'immagine .");
          setShowDuplicateDialog(true);
        } else {
          setErrorMessage(data.message || "Errore generico dal server.");
        }
        return;
      }

      if (data.message === "Immagine caricata con successo") {
        
        alert(`✅ Immagine caricata con successo!`);
      } else {
        setErrorMessage(data.message || "Errore durante il caricamento.");
      }
    } catch (err) {
      setIsLoading(false);
      console.error("Errore:", err);
      setErrorMessage("Errore durante la richiesta al server.");
    }
  };

  const handleConfirmCategoryCreation = () => {
    if (!pendingFormData) return;

    pendingFormData.append("crea_categoria", "true");
    const tokenToUse = token || localStorage.getItem("jwtToken");

    fetch("http://localhost:5000/api/upload-image", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenToUse}` },
      body: pendingFormData,
    })
      .then(async (res) => {
        const data = await res.json();
        setShowDialog(false);
        setPendingFormData(null);

        if (!res.ok) {
          setErrorMessage(data.message || "Errore durante la creazione della categoria.");
        } else {
          alert("Immagine caricata con successo con nuova categoria!");
        }
      })
      .catch((err) => {
        setShowDialog(false);
        console.error(err);
        setErrorMessage("Errore durante la richiesta al server.");
      });
  };

  return (
    <main
      className="w-full h-screen bg-cover bg-center flex relative"
      style={{
        backgroundImage: `url(${backgrounf_upimage})`,
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
            <a href="/search" className="text-black text-sm font-semibold">Ricerca</a>
            <a href="/dashboard" className="text-black text-sm font-semibold">Dashboard</a>
          </nav>
        </div>
      </div>

      {/* Contenuto centrale */}
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-black">Carica un'immagine</h1>

        <Card className="bg-gray-100 rounded-lg shadow-lg">
          <CardContent className="p-10">
            <form onSubmit={handleSubmit} className="space-y-7">
              <Input type="file" accept="image/*" onChange={handleFileChange} />

              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Anteprima"
                  className="w-70 h-70 object-cover rounded border mx-auto mt-4"
                />
              )}

              <div>
                <p><strong>Nome file:</strong> {fileName}</p>
                <p><strong>Data inserimento:</strong> {uploadDate}</p>
                <p><strong>Utente:</strong> {user ? user.username : "Non disponibile"}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Categoria:</label>
                <Input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Inserisci la categoria"
                />
              </div>

              {errorMessage && <p className="text-red-600 text-sm">{errorMessage}</p>}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Caricamento..." : "Carica nel database"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Dialog duplicato */}
        <AlertDialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Errore: Immagine duplicata</AlertDialogTitle>
              <AlertDialogDescription>{duplicateMessage}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDuplicateDialog(false)}>Chiudi</AlertDialogCancel>
                <a href="/gallery" className="text-blue-600 underline text-sm">Visualizza database</a>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog nuova categoria */}
        <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Creare nuova categoria?</AlertDialogTitle>
              <AlertDialogDescription>{backendMessage}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDialog(false)}>No</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmCategoryCreation}>Sì, crea</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog token scaduto */}
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
            <AlertDialogCancel onClick={() => setTokenExpired(false)}>Chiudi</AlertDialogCancel>
            <AlertDialogAction onClick={() => window.location.href = "/login"}>
              Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      </div>
    </main>
  );
};

export default UploadImageForm;
