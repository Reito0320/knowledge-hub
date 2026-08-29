'use client';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ToastProvider = () => (
  <ToastContainer
    position="bottom-right"
    autoClose={3200}
    newestOnTop
    closeOnClick
    pauseOnFocusLoss
    pauseOnHover
    theme="light"
    toastClassName="!rounded-xl !border !border-[#E4D9CF] !bg-[#FFFCF9] !font-sans !text-sm !text-[#4B4E54] !shadow-[0_16px_40px_rgba(72,48,30,0.14)]"
    progressClassName="!bg-[#B66A36]"
  />
);

export default ToastProvider;
