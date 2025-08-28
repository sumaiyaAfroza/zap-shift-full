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
import Payment from "../pages/Payment.jsx";
import PaymentHistory from "../pages/PaymentHistory.jsx";
import TrackParcel from "../pages/TrackParcel.jsx";
import BeARider from "../pages/BeARider.jsx";
import Forbidden from "../Forbidden.jsx";
import AdminRoute from "../routes/AdminRoute.jsx";
import PendingRiders from "../pages/PendingRiders.jsx";
import ActiveRiders from "../pages/ActiveRiders.jsx";
import MakeAdmin from "../pages/MakeAdmin.jsx";
import AssignRider from "../pages/AssignRider.jsx";
import PendingDelivery from "../pages/PendingDelivery.jsx";
import RiderRoute from "../routes/RiderRoute.jsx";
import CompletedDelivery from "../pages/CompletedDelivery.jsx";
import MyEarnings from "../pages/MyEarnings.jsx";
import DashboardHome from "../pages/Dashboard/DashboardHome.jsx";


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
        path: 'forbidden',
        Component: Forbidden
      },
      {
        path: 'sendParcel',
        element: <PrivateRoute><SendParcel></SendParcel></PrivateRoute>,
        loader: () => fetch('./serviceCenter.json')
      },
      {
        path: '/beARider',
        element: <PrivateRoute> <BeARider></BeARider> </PrivateRoute>,
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
       // rider
       {
           index: true,
           Component: DashboardHome

       },
    {
      path:'myParcels',
      Component: MyParcels
    },
    {
      path:'payment/:parcelId',
      Component: Payment
    },
    {
      path:'paymentHistory',
      Component: PaymentHistory
    },
    {
      path:'trackParcel',
      Component: TrackParcel
    },
    {
      path:'pending-deliveries',
      element: <RiderRoute>  <PendingDelivery></PendingDelivery></RiderRoute>
    },
    {
      path: 'completed-deliveries',
      element: <RiderRoute> <CompletedDelivery></CompletedDelivery> </RiderRoute>
    },
    {
      path: 'my-earnings',
      element: <RiderRoute> <MyEarnings></MyEarnings> </RiderRoute>

    },

    // admin 
      {
        path: 'pending-riders',
        element: <AdminRoute> <PendingRiders></PendingRiders> </AdminRoute>
      },
      {
        path: 'active-riders',
       element: <AdminRoute> <ActiveRiders></ActiveRiders> </AdminRoute>
      },
      {
        path:'makeAdmin',
        element: <AdminRoute> <MakeAdmin></MakeAdmin> </AdminRoute>
      },
      {
        path: 'assign-rider',
        element: <AdminRoute> <AssignRider></AssignRider></AdminRoute>
      }

   ]
  }
]);