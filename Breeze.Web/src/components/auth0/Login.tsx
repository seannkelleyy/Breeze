import { useAuth0 } from '@auth0/auth0-react'

const LoginButton = () => {
	const { loginWithRedirect } = useAuth0()

	return (
		<div>
			<button
				className='login-button'
				onClick={() => loginWithRedirect()}
			>
				Log In/ Sign-Up
			</button>
		</div>
	)
}

export default LoginButton
