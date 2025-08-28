import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js'
import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import useAxiosSecure from '../hooks/useAxiosSecure'
import { useQuery } from '@tanstack/react-query'
import useAuth from '../hooks/useAuth';
import Swal from 'sweetalert2'
import UseTrackingLogger from '../hooks/useTrackingLogger'

const PaymentForm = () => {
    const {user} = useAuth()
    const [error, setError] = useState('')
    const stripe = useStripe()
    const elements = useElements()
    const {parcelId} = useParams()
    const axiosSecure = useAxiosSecure()
    const navigate = useNavigate()
    const {logTracking} = UseTrackingLogger()

    const {isPending, data: parcelInfo={}} = useQuery({
        queryKey: ['parcels', parcelId],
        queryFn: async () =>{
            const res = await axiosSecure.get(`/parcels/${parcelId}`)
            return res.data
        }
     })
    
     if(isPending){
        return 'loading........'
     }
    console.log(parcelInfo)

    const amount = parcelInfo.cost 
    const amountInCents = amount * 100

    const handlePayment = async (e) => {
        e.preventDefault()
        if(!stripe || !elements){
            return
        }

        const card = elements.getElement(CardElement)
        if(!card){
            return
        }

        // step- 1: validate the card
        const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card
        })

        if (error) {
            setError(error)
        }
        else {
            setError('');
            console.log('payment method', paymentMethod);

            // step-2: create payment intent
            const res = await axiosSecure.post('/create-payment-intent', 
                { amountInCents,parcelId })
            const {clientSecret} = res.data
            console.log(clientSecret)

            // step-3: confirm payment
            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement),
                    billing_details: {
                        name: user.displayName,
                        email: user.email
                    },
                }
            })
            console.log(result)

            if (result.error) {
                setError(result.error.message);
            } else {
                setError('');
                if (result.paymentIntent.status === 'succeeded') {
                    console.log('Payment succeeded!');
                    const transactionId = result.paymentIntent.id;

                    // step-4 mark parcel paid also create payment history
                    const paymentData = {
                        parcelId,
                        email: user.email,
                        amount,
                        transactionId: transactionId,
                        paymentMethod: result.paymentIntent.payment_method_types
                    }
                    const paymentRes = await axiosSecure.post('/payments', paymentData);
                    console.log(paymentData)
                    // =====================================================
                    if (paymentRes.data.insertedId) {

                        // ✅ Show SweetAlert with transaction ID
                        await Swal.fire({
                            icon: 'success',
                            title: 'Payment Successful!',
                            html: `<strong>Transaction ID:</strong> <code>${transactionId}</code>`,
                            confirmButtonText: 'Go to My Parcels',
                        });
                          await logTracking ({
                                tracking_id: parcelInfo.tracking_id,
                                 status: 'payment done',
                                  details: `paid by ${user.displayName}`,
                                 update_by: user.email
                            })


                          // ✅ Redirect to /myParcels
                        navigate('/dashboard/myParcels');

                    }


                }
            }
        }
    }

    return ( 
        <form onSubmit={handlePayment} className="space-y-4 bg-white p-6 rounded-xl mt-20 shadow-md w-full max-w-md mx-auto">
            <CardElement className="p-2 border rounded">
            </CardElement>
            <button
                type='submit'
                className="btn btn-primary text-black w-full"
            >
                pay $ {amount}
            </button>
            {
                error && <p className='text-red-500'>{error}</p>
            }
        </form>
    )
}

export default PaymentForm