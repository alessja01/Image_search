import { useState } from "react"
import axios, { AxiosError } from "axios"
import { RegisterForm } from "@/components/ui/register-form"
import toast from "react-hot-toast"
import background from "@/assets/background.png"
import logo from '@/assets/logo-federico-ii-blu.png'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftIcon } from "lucide-react"
import{AlertDialog,AlertDialogTrigger,AlertDialogTitle,AlertDialogContent,AlertDialogHeader,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel,AlertDialogAction} from "@/components/ui/alert-dialog"




export default function RegisterPage() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)


  const navigate = useNavigate()

  const handleRegister = async () => {
    if (!username || !email || !password || !selectedDate) {
      toast.error("Compila tutti i campi!")
      return
    }
  
    //  Check età minima: almeno 10 anni
    const today = new Date()
    const minValidDate = new Date()
    minValidDate.setFullYear(today.getFullYear() - 10)
  
    if (selectedDate > minValidDate) {
      toast.error("Devi avere almeno 10 anni per registrarti.")
      return
    }
  
    try {
      const response = await axios.post("http://localhost:5000/api/register", {
        username,
        email,
        password,
        date_of_birth: selectedDate.toISOString(),
      })
  
      toast.success("Registrazione completata!")
      console.log(response.data)
    } catch (error) {
      const err = error as AxiosError<{ message: string }>
      toast.error(err.response?.data?.message || "Errore nella registrazione")
    }
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center relative flex flex-col items-center justify-center px-6 py-10"
      style={{
        backgroundImage: `url(${background})`,
      }}
    >
      {/* LOGO + UNIVERSITÀ + FRECCIA */}
      <div className="absolute top-6 left-6 flex flex-col items-start gap-3">
        {/* Logo e nome */}
        <div className="flex items-center gap-2">
          <img src={logo} alt="logo" className="h-10 w-auto object-contain rounded-full" />
          <span className="text-sm text-muted-foreground">Università Federico II</span>
        </div>

        {/* AlertDialog per la freccia */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <div
              className="w-10 h-[21px] mt-4 rotate-[179.44deg] bg-[url(https://c.animaapp.com/m9l4o7enk6qOnr/img/frame-7.png)] bg-cover bg-center cursor-pointer"
            >
              <ArrowLeftIcon className="opacity-0" />
            </div>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Annullare la registrazione?</AlertDialogTitle>
              <AlertDialogDescription>
                Tutti i dati inseriti andranno persi. Sei sicuro di voler tornare alla home?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction onClick={() => navigate("/")}>
                Torna alla home
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* TITOLO + FORM */}
      <div className="flex flex-col items-center text-center gap-10 z-10 mt-16">
        <div>
          <h1 className="text-[64px] md:text-[96px] font-normal leading-none [font-family:'Jomhuria',Helvetica] text-black">
            Database Vettoriale
          </h1>
          <h2 className="text-3xl md:text-5xl mt-[-10px] [font-family:'Jomhuria',Helvetica] text-black">
            orchidee e le sue specie
          </h2>
        </div>

        <div className="bg-white bg-opacity-80 p-8 rounded-xl shadow-md w-full max-w-sm">
          <RegisterForm
            username={username}
            setUsername={setUsername}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            handleRegister={handleRegister}
          />
        </div>
      </div>
    </div>
  )
}
