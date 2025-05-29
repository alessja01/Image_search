
import { useState } from "react" ; {/* serve per creare e aggiornare variabili di statp */}
import { useNavigate } from "react-router-dom"; {/* permette di navigare tra le pagine */}
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUser } from "@/UserContext";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const [email, setEmail] = useState("") //variabili di stato che memorizza mail 
  const [password, setPassword] = useState("") //variabili di stato che memorizza password 
  const [error, setError] = useState("") //variabili di stato che mostra i messaggi di errore se qualcosa va storto
  const [loading, setLoading]=useState(false)
  const navigate = useNavigate()
  const {setUser,setToken}=useUser();

  const handleLogin = async (e: React.FormEvent) => { //funzione che gestisce l'invio del form
    e.preventDefault() // impedisce che il comportamento predefinito del form che ricaricarebbe la pagina
    setError("") //pulisce eventuali errori priam di inviare una nuova richiesta
    setLoading(true);

    // Validazione lato client
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError("Invalid email address");
      return;
    }
    if (!password) {
      setError("Password is required");
      setLoading(false);
      return;
    }

    try { //invio una richiesta POST a Flask con email password in formato json
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json() //converte la risposta in oggetto 

      console.log("Login response: ", data)

      if (response.ok) { // se il login ha successo salva token e i dati utente
        localStorage.setItem("jwtToken", data.access_token)
        localStorage.setItem("refreshToken", data.refresh_token)
        localStorage.setItem("user",JSON.stringify(data.user));

        //imposta i dati nel contesto
        setUser(data.user); //imposta l'utente
        setToken(data.access_token); //imposta i token
        navigate("/dashboard")
      } else { // se fallisce mostra errore sullo schermo 
        setError(data.message || "Login failed")
      }
    } catch (err) { //in caso di errore rete mostra messaggio
      console.error("Login error:",err)
      setError("Server error")
    }finally{
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleLogin}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      {/* titolo + descrizione */}
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Login to your account</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Enter your email below to login to your account
        </p>
      </div>

      {/* container campi del form */}
      <div className="grid gap-6">
        {/* email */}
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* password */}
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
          </div>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* pulsante login */}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Loggin in ...': 'Login'}
        </Button>

        {/* errore */}
        {error && <p className="text-red-500 text-center">{error}</p>}
      </div>

      {/* registrazione */}
      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <a href="/register" className="underline underline-offset-4">
          Sign up
        </a>
      </div>
    </form>
  )
}
