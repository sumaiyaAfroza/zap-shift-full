import React from 'react';
import useUserRole from "../../hooks/useUserRole.jsx";
import Forbidden from "../../Forbidden.jsx";
import AdminDashboard from "./AdminDashboard.jsx";
import RiderDashboard from "./RiderDashboard.jsx";
import UserDashboard from "./UserDashboard.jsx";

const DashboardHome = () => {
    const {role , roleLoading} = useUserRole()
    if(roleLoading){
        return <p>loading...........</p>
    }
    if(role === 'user'){
         return <UserDashboard></UserDashboard>
    }
    else if(role === 'admin'){
         return <AdminDashboard></AdminDashboard>
    }
    else if(role === 'rider'){
         return  <RiderDashboard></RiderDashboard>
    }
    else {
         return <Forbidden></Forbidden>
    }


    return (
        <div>
            <h1>dashboard</h1>
        </div>
    );
};

export default DashboardHome;