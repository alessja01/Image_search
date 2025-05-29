import React, { useState } from "react";
import { DateRangePicker } from "./components/ui/daterangepicker";
import { DateRange } from "react-day-picker";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import background_home from "@/assets/background_home.png";
import { useNavigate } from "react-router-dom";
import { 
  AlertDialog, 
  AlertDialogTrigger, 
  AlertDialogTitle, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogCancel, 
  AlertDialogAction 
} from "@/components/ui/alert-dialog";
import { UploadChart } from "./components/ui/uploadchart"; 

export default function DashboarderPage() {
  const[dateRange, setDateRange]= useState<DateRange| undefined>({
    from:new Date("2025-05-11"),
    to: new Date(),
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false); // Stato per aprire il dialog
  const navigate = useNavigate();

  const handleLogOut = () => {
    // Funzione per eseguire il logout
    setIsDialogOpen(false); // Chiudi il dialog
    navigate("/"); // Esegui il reindirizzamento alla home o alla pagina di login
  };

  const navItems = [
    { text: "Carica Immagine", hasIcon: false, path: "/upload" },
    { text: "Visualizza DataBase", hasIcon: false, path: "/gallery" },
    { text: "Ricerca", hasIcon: false, path: "/search" },
    { text: "Log out", hasIcon: false, path: "#" }, // Il link "Log out" senza una destinazione diretta
  ];

  return (
    <main
      className="w-full h-screen bg-cover bg-center flex"
      style={{
        backgroundImage: `url(${background_home})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      {/* Sidebar */}
      <aside className="w-64 bg-white/60 backdrop-blur-sm shadow-lg p-4 flex flex-col items-start">
        {/* Sezione logo e nome Università Federico II */}
        <div className="flex items-center mb-6">
          <img
            src="https://c.animaapp.com/m9mxsnmi2Oh80t/img/frame-5.png"
            alt="Logo"
            className="w-8 h-8 mr-2"
          />
          <span className="text-l font-semibold text-black">Università Federico II</span>
        </div>

        <NavigationMenu>
          <NavigationMenuList className="flex flex-col items-start space-y-4">
            {navItems.map((item, index) => (
              <React.Fragment key={index}>
                <NavigationMenuItem>
                  {item.path && item.path !== "#" ? ( // Se item.path esiste e non è "#", usa Link
                    <NavigationMenuLink asChild>
                      <Link
                        to={item.path}
                        className="text-black text-sm font-semibold flex items-center"
                      >
                        {item.hasIcon && (
                          <img
                            src="https://c.animaapp.com/m9mxsnmi2Oh80t/img/frame-5.png"
                            alt="icon"
                            className="w-5 h-5 mr-2"
                          />
                        )}
                        {item.text}
                      </Link>
                    </NavigationMenuLink>
                  ) : ( // Se item.path è "#", usa un button per il Log out
                    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <AlertDialogTrigger asChild>
                        <button className="text-black text-sm font-semibold flex items-center">
                          {item.text}
                        </button>
                      </AlertDialogTrigger>

                      {/* Dialog per la conferma del logout */}
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Conferma Logout</AlertDialogTitle>
                          <AlertDialogDescription>
                            Sei sicuro di voler disconnetterti?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annulla</AlertDialogCancel>
                          <AlertDialogAction onClick={handleLogOut}>Conferma</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </NavigationMenuItem>

                {index < navItems.length - 1 && (
                  <Separator orientation="horizontal" className="w-full" />
                )}
              </React.Fragment>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </aside>

      {/* Contenuto principale */}
      <section className="flex flex-1 flex-col items-center justify-start text-center px-4 pt-20">
      <div className="mb-10">
        <h1 className="text-[80px] text-black font-jomhuria leading-none">Database Vettoriale</h1>
        <p className="text-4xl text-black mt-4 font-jomhuria">orchidee e le sue specie</p>
      </div>

      <DateRangePicker onDateChange={setDateRange} />

      {dateRange?.from && dateRange?.to && (
        <UploadChart startDate={dateRange.from} endDate={dateRange.to} />
      )}
    </section>

    </main>
  );
}
