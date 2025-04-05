'use client'
import dynamic from 'next/dynamic'
 
const DynamicDashboard = dynamic(
  () => import('../../components/dashboard'),
  { ssr: false }
)
 
export default DynamicDashboard;