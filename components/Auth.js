const Auth = ({ supabase }) => {
  const signInWithGithub = () => {
    supabase.auth.signIn({
      provider: 'github'
    })
  }
  return (
    <div>
      <button onClick={signInWithGithub}>Log in with GitH ub</button>
    </div>
  )
}

export default Auth
