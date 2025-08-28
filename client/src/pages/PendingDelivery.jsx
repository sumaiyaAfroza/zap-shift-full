import React from 'react';
import useAxiosSecure from '../hooks/useAxiosSecure';
import useAuth from '../hooks/useAuth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import UseTrackingLogger from "../hooks/useTrackingLogger.jsx";


const PendingDelivery = () => {
    const axiosSecure = useAxiosSecure()
    const {user} = useAuth()
    const queryClient = useQueryClient()
    const {logTracking} = UseTrackingLogger()

    const {
        data: parcels = [],
        isLoading
     } = useQuery({
        queryKey: ['riderParcels', user?.email],
        enabled: !!(user?.email),
        queryFn: async () => {
           
                const result = await axiosSecure.get('/rider/parcels', {
                    params: {
                        email: user.email
                    }
                });
                return result.data;
        },
    })


    const {mutateAsync: updateStatus } = useMutation({
        mutationFn: async ({parcel, status}) => {
            const result = await axiosSecure.patch(`/parcels/${parcel._id}/status`,{
                status
            })
            console.log(result.data);
            return result.data
        },
        onSuccess:()=>{
            queryClient.invalidateQueries(["riderParcels"])
        }
    })

    const handleStatusUpdate = async (parcel,newStatus)=>{
        // console.log(parcel,newStatus);
        Swal.fire({
            title: "Are you sure?",
            text: `Mark parcel as ${newStatus.replace("_", " ")}?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes, update",
        }).then(result => {
            if(result.isConfirmed){
              updateStatus({parcel, status: newStatus}).then( async ()=>{
                 Swal.fire("Updated!", "Parcel status updated.", "success");
                 let trackingDetails = `picked up by ${user.displayName}`

                 if(newStatus === "delivered") {
                     trackingDetails = `Delivered By ${user.displayName}`
                     await logTracking ({
                         tracking_id: parcel.tracking_id,
                         status: newStatus,
                         details: trackingDetails,
                         update_by: user.email
                     })
                 }
              })
            }
        })
    }


    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Pending Deliveries</h2>
            {isLoading ? (
                <p>Loading...</p>
            ) : parcels.length === 0 ? (
                <p className="text-gray-500">No assigned deliveries.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr>
                                <th>Tracking ID</th>
                                <th>Title</th>
                                <th>Type</th>
                                <th>Receiver</th>
                                <th>Receiver Center</th>
                                <th>Cost</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {parcels.map((parcel) => (
                                <tr key={parcel._id}>
                                    <td>{parcel.tracking_id}</td>
                                    <td>{parcel.title}</td>
                                    <td>{parcel.type}</td>
                                    <td>{parcel.receiver_name}</td>
                                    <td>{parcel.receiver_center}</td>
                                    <td>৳{parcel.cost}</td>
                                    <td className="capitalize">{parcel.delivery_status.replace("_", " ")}</td>
                                    <td>
                                        {parcel.delivery_status === "rider_assigned" && (
                                            <button
                                                className="btn btn-sm btn-primary text-black"
                                                onClick={() =>
                                                    handleStatusUpdate(parcel, "in_transit")
                                                }
                                            >
                                                Mark Picked Up
                                            </button>
                                        )}
                                        {parcel.delivery_status === "in_transit" && (
                                            <button
                                                className="btn btn-sm btn-success text-black"
                                                onClick={() =>
                                                    handleStatusUpdate(parcel, "delivered")
                                                }
                                            >
                                                Mark Delivered
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PendingDelivery;