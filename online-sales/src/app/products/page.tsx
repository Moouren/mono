'use client'
import dynamic from 'next/dynamic'
 
const DynamicProduct = dynamic(
  () => import('../../components/products'),
  { ssr: false }
)
 
export default DynamicProduct;