import { createBrowserRouter } from "react-router";
import RootLayout from "../layouts/RootLayout";
import Home from "../pages/Home/Home/Home";
import AuthLayout from "../layouts/AuthLayout";
import Login from "../pages/Authentication/Login/Login";
import Register from "../pages/Authentication/Register/Register";
import Coverage from '../pages/Coverage.jsx';
import PrivateRoute from '../routes/PrivateRoute.jsx';
import SendParcel from '../pages/SendParcel.jsx';
import DashLayout from "../layouts/DashLayout.jsx";
import MyParcels from "../pages/MyParcels.jsx";


export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      {
        index: true,
        Component: Home
      },
      {
        path: 'coverage',
        Component: Coverage,
        loader: () => fetch('./serviceCenter.json')
      },
      {
        path: 'sendParcel',
        element: <PrivateRoute><SendParcel></SendParcel></PrivateRoute>,
        loader: () => fetch('./serviceCenter.json')
      }
    ]
  },
  {
    path: '/',
    Component: AuthLayout,
    children: [
      {
        path: 'login',
        Component: Login
      },
      {
        path: 'register',
        Component: Register
      }
    ]
  },
  {
   path:'/dashboard',
   element: <PrivateRoute> <DashLayout></DashLayout></PrivateRoute>,
   children:[
    {
      path:'myParcels',
      Component: MyParcels
    }
   ]
  }
]);