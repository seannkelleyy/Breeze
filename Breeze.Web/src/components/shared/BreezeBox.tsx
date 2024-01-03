import { ReactNode } from 'react'
import './shared.css'

export const BreezeBox = (children: ReactNode[] | ReactNode) => {
	return <section className='breeze-box'>{children} </section>
}
