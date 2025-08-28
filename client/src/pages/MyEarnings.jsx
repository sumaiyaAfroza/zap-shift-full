import React from 'react';
import useAuth from '../hooks/useAuth';
import useAxiosSecure from '../hooks/useAxiosSecure';
import { useQuery } from '@tanstack/react-query';
import { isAfter, startOfDay, startOfMonth, startOfWeek, startOfYear } from "date-fns";

const MyEarnings = () => {
    const {user} = useAuth()
    const axiosSecure = useAxiosSecure()
    const email = user?.email

    const {data: parcelData = [] , isLoading} = useQuery({
        queryKey: ['completedDelivery',email],
        enabled: !!email,
        queryFn: async () => {
            const result = await axiosSecure.get('/rider/completed-parcels', {
                params: {email}
            });

            // console.log(result.data);
            return result.data
        }
    })
    // console.log(parcelsData);

    const calculateEarning = ( parcels ) => {
        const cost = Number(parcels.cost)
        return parcels.sender_center = parcels.receiver_center ?
        cost * 0.8 : cost * 0.3
    }

    const now = new Date()
    const todayStart = startOfDay(now)
    const weekStart =  startOfWeek(now , {weekStartsOn:1})
    const monthStart = startOfMonth(now)
    const yearStart = startOfYear(now)

    let total = 0,
        totalCashOut = 0,
        totalPending = 0,
        today = 0,
        week = 0,
        month = 0,
        year = 0

        parcelData.forEach (parcel => {
            const earning = calculateEarning(parcel)
            const deliveredAt = new Date(parcel.delivery_at)
            total += earning
            if( parcel.cashout_status === "cashed_out") totalCashOut += earning 
            else totalPending += earning
            if(isAfter(deliveredAt, todayStart)) today += earning
            if(isAfter(deliveredAt, weekStart)) week += earning
            if(isAfter(deliveredAt, monthStart)) month += earning
            if(isAfter(deliveredAt, yearStart)) year += earning
            
        })





    return (
               <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold">My Earnings</h2>
            {isLoading ? (
                <p>Loading...</p>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-base-200 p-4 rounded-xl shadow">
                            <p className="text-lg font-semibold">Total Earnings</p>
                            <p className="text-2xl font-bold text-green-600">৳{total.toFixed(2)}</p>
                        </div>
                        <div className="bg-base-200 p-4 rounded-xl shadow">
                            <p className="text-lg font-semibold">Cashed Out</p>
                            <p className="text-2xl font-bold text-blue-600">৳{totalCashOut.toFixed(2)}</p>
                        </div>
                        <div className="bg-base-200 p-4 rounded-xl shadow">
                            <p className="text-lg font-semibold">Pending</p>
                            <p className="text-2xl font-bold text-yellow-600">৳{totalPending.toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                        <div className="bg-base-100 p-4 rounded-lg shadow">
                            <p className="text-sm text-gray-500">Today</p>
                            <p className="text-xl font-bold text-green-700">৳{today.toFixed(2)}</p>
                        </div>
                        <div className="bg-base-100 p-4 rounded-lg shadow">
                            <p className="text-sm text-gray-500">This Week</p>
                            <p className="text-xl font-bold text-green-700">৳{week.toFixed(2)}</p>
                        </div>
                        <div className="bg-base-100 p-4 rounded-lg shadow">
                            <p className="text-sm text-gray-500">This Month</p>
                            <p className="text-xl font-bold text-green-700">৳{month.toFixed(2)}</p>
                        </div>
                        <div className="bg-base-100 p-4 rounded-lg shadow">
                            <p className="text-sm text-gray-500">This Year</p>
                            <p className="text-xl font-bold text-green-700">৳{year.toFixed(2)}</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default MyEarnings;