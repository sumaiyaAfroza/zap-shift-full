import React, { useState } from 'react';
import useAxiosSecure from '../hooks/useAxiosSecure';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import { FaMotorcycle } from 'react-icons/fa';
import Swal from 'sweetalert2';
import useTrackingLogger from "../hooks/useTrackingLogger.jsx";
import useAuth from "../hooks/useAuth.jsx";


const AssignRider = () => {
    const axiosSecure = useAxiosSecure()
    const queryClient = useQueryClient()
    const [selectedParcel, setSelectedParcel] = useState(null);
    const [selectedRider, setSelectedRider] = useState(null);
    const [riders, setRiders] = useState([]);
    const [loadingRiders, setLoadingRiders] = useState(false);
    const {logTracking} = useTrackingLogger();
    const {user} = useAuth()

    const {data: parcels=[],isLoading} = useQuery({
        queryKey:['assignableParcels'],
        queryFn: async ()=>{
            const result = await axiosSecure.get('/parcels?payment_status=paid&delivery_status=not_collected')
            return result.data
        }
    })
    // console.log(parcels);
 

    const {mutateAsync: assignRider} = useMutation({
        mutationFn: async ({parcelId,rider})=>{
            setSelectedRider(rider)
            const result = await axiosSecure.patch(`/parcels/${parcelId}/assign`,{
                riderId: rider._id,
                riderName: rider.name,
                riderEmail: rider.email  
            })
            return result.data
        //    console.log(result.data); 
        },
        onSuccess:async ()=>{
            await queryClient.invalidateQueries(['assignableParcels'])
            await Swal.fire("Success", "Rider assigned successfully!", "success");
            await logTracking ({
                tracking_id: selectedParcel.tracking_id,
                status: 'assigned rider',
                details: `assigne to ${selectedRider.name}`,
                update_by: user.email
            });

            document.getElementById("assignModal").close();

        },
        onError: () => {
            Swal.fire("Error", "Failed to assign rider", "error");
        },
    })
    const openAssignModal = async (parcel)=>{
        setSelectedParcel(parcel)
        setLoadingRiders(true)
        setRiders([])

        try {
            const result = await axiosSecure.get('/riders/available',{
                params:{
                    district: parcel.sender_center
                }
            })
            setRiders(result.data)
        } catch (error) {
            console.error("Error fetching riders", error);
            Swal.fire("Error", "Failed to load riders", "error");
        } finally {
            setLoadingRiders(false);
            document.getElementById("assignModal").showModal();
        }
    }



    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Assign Rider to Parcels</h2>
                 {
                    isLoading ?
                     ( <p>Loading parcels...</p>)
                     :
                     parcels.length === 0 ? (
                        <p className="text-gray-500">No parcels available for assignment.</p>
                     )
                     :
                     (
                        <div className="overflow-x-auto">
                        <table className="table table-zebra w-full">
                            <thead>
                            <tr>
                                <th>Tracking ID</th>
                                <th>Title</th>
                                <th>Type</th>
                                <th>Sender Center</th>
                                <th>Receiver Center</th>
                                <th>Cost</th>
                                <th>Created At</th>
                                <th>Action</th>
                            </tr>
                            </thead>
                            <tbody>
                            {parcels.map((parcel) => (
                                <tr key={parcel._id}>
                                    <td>{parcel.tracking_id}</td>
                                    <td>{parcel.title}</td>
                                    <td>{parcel.type}</td>
                                    <td>{parcel.sender_center}</td>
                                    <td>{parcel.receiver_center}</td>
                                    <td>৳{parcel.cost}</td>
                                    <td>{new Date(parcel.creation_date).toLocaleDateString()}</td>
                                    <td>
                                        <button
                                            onClick={() => openAssignModal(parcel)}
                                            className="btn btn-sm btn-primary text-black">
                                            <FaMotorcycle className="inline-block mr-1" />
                                            Assign Rider
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
    
                        </table>
                        {/* 🛵 Assign Rider Modal */}
                        <dialog id="assignModal" className="modal">
                        <div className="modal-box max-w-2xl">
                            <h3 className="text-lg font-bold mb-3">
                                Assign Rider for Parcel:{" "}
                                <span className="text-primary">{selectedParcel?.title}</span>
                            </h3>

                            {loadingRiders ? (
                                <p>Loading riders...</p>
                            ) : riders.length === 0 ? (
                                <p className="text-error">No available riders in this district.</p>
                            ) : (
                                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                                    <table className="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Phone</th>
                                                <th>Bike Info</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {riders.map((rider) => (
                                                <tr key={rider._id}>
                                                    <td>{rider.name}</td>
                                                    <td>{rider.phone}</td>
                                                    <td>
                                                        {rider.bike_brand} - {rider.bike_registration}
                                                    </td>
                                                    <td>
                                                        <button
                                                            onClick={() =>
                                                                assignRider({
                                                                    parcelId: selectedParcel._id,
                                                                    rider,
                                                                })
                                                            }
                                                            className="btn btn-xs btn-success">
                                                            Assign
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <div className="modal-action">
                                <form method="dialog">
                                    <button className="btn">Close</button>
                                </form>
                            </div>
                        </div>
                    </dialog>
                    </div>
                     )
                 }  
        </div>
    );
};

export default AssignRider;