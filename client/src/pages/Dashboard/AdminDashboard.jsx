import React from 'react';
import {FaBoxOpen, FaCheckCircle, FaMotorcycle, FaShippingFast} from "react-icons/fa";

    const COLORS = {
        not_collected: '#F87171',      // red-400
        in_transit: '#FBBF24',         // yellow-400
        rider_assigned: '#60A5FA',     // blue-400
        delivered: '#34D399',          // green-400
    };

    const statusIcons = {
        rider_assigned: <FaMotorcycle className="text-4xl text-info" />,
        delivered: <FaCheckCircle className="text-4xl text-success" />,
        in_transit: <FaShippingFast className="text-4xl text-warning" />,
        not_collected: <FaBoxOpen className="text-4xl text-error" />,
    };

    const statusLabels = {
        rider_assigned: "Assigned to Rider",
        delivered: "Delivered",
        in_transit: "In Transit",
        not_collected: "Not Collected",
    };


const AdminDashboard = () => {

    return (
        <div>
            <h1>admin</h1>
        </div>
    );
};

export default AdminDashboard;