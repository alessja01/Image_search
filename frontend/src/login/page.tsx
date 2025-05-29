import { useNavigate } from 'react-router-dom'
import logo from '@/assets/logo-federico-ii-blu.png'
import { LoginForm } from "@/components/ui/login-forms"
import background from '@/assets/image2.jpg'
import { ArrowLeftIcon } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-emerald-50 relative">
      {/* Colonna sinistra */}
      <div className="relative flex flex-col justify-between p-6 md:p-10 h-full">
        
        {/* Logo e freccia */}
        <div className="z-10">
          <div className="flex items-center gap-2">
            <img
              src={logo}
              alt="logo"
              className="h-10 w-auto rounded-full object-contain"
            />
            <span className="text-balance text-sm text-muted-foreground">
              Università Federico II
            </span>
          </div>

          <div
            className="w-10 h-[21px] mt-4 rotate-[179.44deg] bg-[url(https://c.animaapp.com/m9l4o7enk6qOnr/img/frame-7.png)] bg-cover bg-center cursor-pointer"
            onClick={() => navigate("/")}
          >
            <ArrowLeftIcon className="opacity-0" />
          </div>
        </div>

        {/* Contenuto centrale: Titolo + Login */}
        <div className="flex flex-col justify-center h-full z-10">
          {/* Titolo allineato a sinistra */}
          <div className="text-left mb-10">
            <h1 className="text-[64px] md:text-[96px] font-normal leading-none [font-family:'Jomhuria',Helvetica] text-black">
              Database Vettoriale
            </h1>
            <h2 className="text-3xl md:text-5xl mt-[-10px] [font-family:'Jomhuria',Helvetica] text-black">
              orchidee e le sue specie
            </h2>
          </div>

          {/* Form login allineato a sinistra */}
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>

      {/* Colonna destra */}
      <div className="relative w-full h-full">
        <img
          src={background}
          alt="Image description"
          className="w-full h-full object-cover [mask-image:radial-gradient(ellipse_at_center,white,transparent)]"
        />
      </div>
    </div>
  )
}
