'use client'
import dynamic from 'next/dynamic'
 
const DynamicLogin = dynamic(
  () => import('../../components/login'),
  { ssr: false }
)
 
export default DynamicLogin;