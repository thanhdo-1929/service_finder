import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiResetPass } from '../../apis'
import Swal from 'sweetalert2'
import path from '../../ultils/path'

const ResetPass = () => {
    const { token } = useParams()
    const navigate = useNavigate()
    const [password, setPassword] = useState('')
    const handleSubmit = async () => {
        const response = await apiResetPass({ token, password })
        if (response.err === 0) {
            setPassword('')
            Swal.fire('One more step', response.mes, 'success').then(() => {
                navigate(`/${path.LOGIN}`)
            })
        } else {
            Swal.fire('Oops', response.mes, 'error').then(() => {
                navigate(`/${path.LOGIN}`)
            })
        }
    }
    return (
        <div className='h-[500px] w-full flex justify-center gap-4'>
            <div className='p-8 border w-full rounded-md bg-white flex justify-center items-center flex-col'>
                <img src='https://icon-library.com/images/reset-password-icon/reset-password-icon-29.jpg' alt="" className='w-[300px] object-contain' />
                <div className='flex flex-col gap-3'>
                    <label htmlFor="password" className='font-medium'>Nhập mật khẩu mới:</label>
                    <input
                        type="password"
                        className='py-2 px-4 rounded-md border bg-gray-100'
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                </div>
                <button
                    type='button'
                    className='py-2 px-4 rounded-md text-white bg-main font-semibold bg-blue-500 mt-4'
                    onClick={handleSubmit}
                >
                    Xác nhận
                </button>
            </div>
        </div>
    )
}

export default ResetPass