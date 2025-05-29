// components/UploadChart.tsx
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"; //disegna un grafico a linee
import { Line } from "react-chartjs-2"; // per disegnare il grafico
import { 
  AlertDialog, AlertDialogContent, AlertDialogHeader, 
  AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, 
  AlertDialogCancel 
} from "@/components/ui/alert-dialog";
import { Card, CardHeader, CardContent } from "@/components/ui/card"; // grafico in un contenitore
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; //reindirizzare l'utente al login
import {format,parseISO} from "date-fns"; //manipolano le date

//Registra i moduli Chart.js per abilitare il grafico
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

//il componente riceve in input come intervallo da visualizzare
type UploadChartProps={
  startDate: Date;
  endDate: Date;
}

export function UploadChart({startDate, endDate}: UploadChartProps){
  const navigate = useNavigate(); 
  const[chartData, setChartData]=useState<{[date: string]:number}> ({});
  const[loading, setLoading]= useState(true);
  const[error, setError]=useState< string| null>(null);
  const [tokenExpired, setTokenExpired] = useState(false);

  //recupera il token salvato per autenticarsi nella richiesta
  useEffect(() =>{
    const fetchImages= async() =>{
      try{
        setLoading(true);
        const token=localStorage.getItem("jwtToken");

        const response= await fetch(`http://localhost:5000/api/image-count-by-range?start=${startDate.toISOString().slice(0,10)}&end=${endDate.toISOString().slice(0,10)}`,{
          headers:{
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.status === 401 || response.status === 422) {
          localStorage.removeItem("access_token");
          setError("Sessione scaduta. Effettua di nuovo il login.");
          setLoading(false);
          return;
        }

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Errore: ${response.status} - ${text}`);
        }

        const images= await response.json();
        
        //crea un oggetto con un numero di immagini caricate
        const counts: {[date:string]: number}={};
        images.forEach((img:any)=>{
          const formattedDate= format(parseISO(img.date),"dd/MM");
          counts [formattedDate]=(counts[formattedDate] || 0) + img.value;
        });

        setChartData(counts);
      }catch(err:any){
        console.error(err);
        setError(err.message || "Errore");
      } finally{
        setLoading(false);
      }
    };
    fetchImages();
  },[startDate,endDate]);

  const labels=Object.keys(chartData).sort();
  const values=labels.map((date)=>chartData[date]);
  const maxvalue= Math.max(... values, 0);

  const data={
    labels,
    datasets:[
      {
        label:"caricamenti giornalieri",
        data:values,
        borderColor: "rgb(59,130,246)",
        backgroundColor: "rgba(59,130,246,0.2)",
        tension: 0.7,
      },
    ],
  };

  const options={
    responsive:true,
    plugins:{
      legend:{position: "top" as const},
      title: {display: true, text: "Andamento Caricamenti", font:{size:18}},
    },
    scales:{
      y:{
        min: 0,
        max: maxvalue +1,
        ticks:{
          stepSize:1,
          callback: function(value: any){
            return Number.isInteger(value) ? value:null;
          }
        }
      }
    }
  };

  return(
    <Card className="w-full max-w-3xl mx-auto mt-10 bg-white/70 backdrop-blur-sm">
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-800">Statistiche</h3>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-gray-500">Caricamento...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && labels.length === 0 && <p>Nessun dato disponibile nel range selezionato</p>}
        {!loading && labels.length > 0 && <Line options={options} data={data} />}
      </CardContent>

      {/* AlertDialog per token scaduto */}
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
    </Card>
  )
}