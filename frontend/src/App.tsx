import { Route } from "react-router-dom";
import Home  from  './Home'
import LoginPage from './login/page';
import RegisterPage from "./login/register";
import './App.css'
import { Routes } from 'react-router-dom';
import DashboarderPage from './dashboardpage'
import UploadImageForm from "./Load_Image";
import ImageGallery from "./ImageGallery";
import { UserProvider } from "./UserContext";
import Search from "./Search";



function App() {
  
  return(
    <UserProvider>
    <div>
      <Routes>
        <Route path="/" element={<Home/>}></Route>
        <Route path="/login" element={<LoginPage/>}></Route>
        <Route path="/register" element={<RegisterPage/>}></Route>
        <Route path="/dashboard" element={<DashboarderPage/>}></Route>
        <Route path="/upload" element={<UploadImageForm />} />
        <Route path="/gallery" element={<ImageGallery/>}></Route>
        <Route path="/search" element={<Search/>}></Route>
      </Routes>
    </div>
    </UserProvider>
  )
}

export default App
