import { useEffect, useState } from "react";
import {motion, AnimatePresence} from "framer-motion";
import logo from '@/assets/logo-federico-ii-blu.png';
import home1 from '@/assets/home/home1.jpeg';
import home2 from '@/assets/home/home2.jpg';
import home3 from '@/assets/home/home3.jpg';
import home4 from '@/assets/home/home4.jpg'


const images=[
  home1,home2,home3,home4
];

function Home() {
const [currentPage, setCurrentPage] = useState(0);

useEffect(()=>{
  const interval=setInterval(() =>{
    setCurrentPage((prev)=>(prev + 1)% images.length);
  },6000);
  return ()=> clearInterval(interval);
},[]);

return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Background animato */}
      <AnimatePresence>
        <motion.div
          key={currentPage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(0deg, rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${images[currentPage]})`,
          }}
        />
      </AnimatePresence>

      {/* Contenuto visibile sopra */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-4">
        {/* Logo + nome università */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <img src={logo} alt="logo" className="h-10 w-auto object-contain" />
          <span className="text-white text-sm">Università Federico II</span>
        </div>

        {/* Titolo */}
        <h1 className="text-5xl md:text-9xl font-bold mb-4">Database Vettoriale</h1>
        <h2 className="text-2xl md:text-4xl mb-8">Orchidee e le sue specie</h2>

        {/* Pulsanti Login / Register */}
        <div className="space-x-4">
          <a href="/login" className="border border-white px-6 py-2 rounded hover:bg-black hover:text-white transition duration-300">
            Login
          </a>
          <a href="/register" className="border border-white px-6 py-2 rounded hover:bg-white hover:text-black transition duration-300">
            Register
          </a>
        </div>
      </div>
    </div>
  );
}

export default Home;
