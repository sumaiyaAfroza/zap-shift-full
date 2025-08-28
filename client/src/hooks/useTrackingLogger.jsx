import React from 'react';
import useAxiosSecure from './useAxiosSecure';

const UseTrackingLogger = () => {
    const axiosSecure = useAxiosSecure()

    const logTracking = async ({tracking_id, status, details, update_by}) => {

        try {
            const payload = {tracking_id, status, details, update_by}
            await axiosSecure.post('/tracking', payload)
            
        } catch (error) {
            console.error('Failed to log tracking' , error); 
        }
    }
     return {logTracking}
};

export default UseTrackingLogger;
